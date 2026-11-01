-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default.
-- Restrict these guest-facing RPCs to the roles explicitly used by Supabase.

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
