create extension if not exists pgcrypto;

create table if not exists public.visitor_presence (
  visitor_id uuid primary key,
  last_seen timestamptz not null default now()
);

create table if not exists public.public_feedback (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  guest_name text not null default 'Guest' check (char_length(guest_name) between 1 and 50),
  body text not null check (char_length(body) between 2 and 500),
  created_at timestamptz not null default now()
);

alter table public.visitor_presence enable row level security;
alter table public.public_feedback enable row level security;

revoke all on public.visitor_presence from anon, authenticated;
revoke all on public.public_feedback from anon, authenticated;

create or replace function public.heartbeat_visitor(visitor uuid)
returns void language sql security definer set search_path = public
as $$
  insert into public.visitor_presence(visitor_id, last_seen) values (visitor, now())
  on conflict (visitor_id) do update set last_seen = now();
$$;

create or replace function public.leave_visitor(visitor uuid)
returns void language sql security definer set search_path = public
as $$ delete from public.visitor_presence where visitor_id = visitor $$;

create or replace function public.online_visitor_count()
returns integer language sql security definer stable set search_path = public
as $$ select count(*)::integer from public.visitor_presence where last_seen > now() - interval '90 seconds' $$;

create or replace function public.list_public_feedback()
returns table(id uuid, guest_name text, body text, created_at timestamptz)
language sql security definer stable set search_path = public
as $$
  select f.id, f.guest_name, f.body, f.created_at
  from public.public_feedback f order by f.created_at desc limit 100;
$$;

create or replace function public.submit_public_feedback(visitor uuid, submitted_name text, submitted_body text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  clean_name text := coalesce(nullif(trim(submitted_name), ''), 'Guest');
  clean_body text := trim(submitted_body);
  previous_post timestamptz;
  new_id uuid;
begin
  if char_length(clean_name) > 50 then raise exception 'Name must be 50 characters or fewer.'; end if;
  if char_length(clean_body) < 2 or char_length(clean_body) > 500 then raise exception 'Feedback must be between 2 and 500 characters.'; end if;
  select max(created_at) into previous_post from public.public_feedback where visitor_id = visitor;
  if previous_post is not null and previous_post > now() - interval '30 seconds' then
    raise exception 'Please wait 30 seconds before submitting again.';
  end if;
  insert into public.public_feedback(visitor_id, guest_name, body)
  values(visitor, clean_name, clean_body) returning id into new_id;
  return new_id;
end;
$$;

-- Functions are executable by PUBLIC by default in PostgreSQL. Limit these
-- guest-facing entry points to the roles used by the application.
revoke execute on function public.heartbeat_visitor(uuid) from public;
revoke execute on function public.leave_visitor(uuid) from public;
revoke execute on function public.online_visitor_count() from public;
revoke execute on function public.list_public_feedback() from public;
revoke execute on function public.submit_public_feedback(uuid, text, text) from public;

grant execute on function public.heartbeat_visitor(uuid) to anon, authenticated;
grant execute on function public.leave_visitor(uuid) to anon, authenticated;
grant execute on function public.online_visitor_count() to anon, authenticated;
grant execute on function public.list_public_feedback() to anon, authenticated;
grant execute on function public.submit_public_feedback(uuid, text, text) to anon, authenticated;

create index if not exists visitor_presence_last_seen_idx on public.visitor_presence(last_seen);
create index if not exists public_feedback_created_idx on public.public_feedback(created_at desc);
create index if not exists public_feedback_visitor_idx on public.public_feedback(visitor_id, created_at desc);
