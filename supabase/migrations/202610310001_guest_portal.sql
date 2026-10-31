create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Guest'), 60));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.guest_comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(trim(body)) between 2 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prepare_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare last_post timestamptz;
begin
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    select display_name into new.author_name from public.profiles where id = auth.uid();
    select max(created_at) into last_post from public.guest_comments where author_id = auth.uid();
    if last_post is not null and last_post > now() - interval '20 seconds' then
      raise exception 'Please wait 20 seconds before posting again.';
    end if;
  else
    new.author_id := old.author_id;
    new.author_name := old.author_name;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  new.body := trim(new.body);
  return new;
end;
$$;

drop trigger if exists prepare_guest_comment on public.guest_comments;
create trigger prepare_guest_comment before insert or update on public.guest_comments
for each row execute procedure public.prepare_comment();

create table if not exists public.guest_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  last_seen timestamptz not null default now()
);

create or replace function public.heartbeat_presence()
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.guest_presence (user_id, display_name, last_seen)
  select id, display_name, now() from public.profiles where id = auth.uid()
  on conflict (user_id) do update set display_name = excluded.display_name, last_seen = now();
end;
$$;

create or replace function public.leave_presence()
returns void language sql security definer set search_path = public
as $$ delete from public.guest_presence where user_id = auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.guest_comments enable row level security;
alter table public.guest_presence enable row level security;

create policy "profiles readable by signed in users" on public.profiles for select to authenticated using (true);
create policy "users update own display name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin membership self-check only" on public.admin_users for select to authenticated using (user_id = auth.uid());

create policy "comments readable by signed in guests" on public.guest_comments for select to authenticated using (true);
create policy "guests create own comments" on public.guest_comments for insert to authenticated with check (author_id = auth.uid());
create policy "guests edit own comments" on public.guest_comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "owners or admins delete comments" on public.guest_comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "admins view presence" on public.guest_presence for select to authenticated using (public.is_admin());
create policy "users insert own presence" on public.guest_presence for insert to authenticated with check (user_id = auth.uid());
create policy "users update own presence" on public.guest_presence for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users remove own presence" on public.guest_presence for delete to authenticated using (user_id = auth.uid());

grant execute on function public.is_admin() to authenticated;
grant execute on function public.heartbeat_presence() to authenticated;
grant execute on function public.leave_presence() to authenticated;

create index if not exists guest_comments_created_idx on public.guest_comments(created_at desc);
create index if not exists guest_presence_last_seen_idx on public.guest_presence(last_seen desc);
