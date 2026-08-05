-- create messages_with_senders view joining public.messages with auth.users to resolve sender_name on read
create or replace view public.messages_with_senders
with (security_invoker = true) as
select
  m.id,
  m.p_id,
  m.user_id,
  m.content,
  m.metadata,
  m.created_at,
  coalesce(u.raw_user_meta_data->>'name', u.email, 'Caretaker') as sender_name
from public.messages m
left join auth.users u on m.user_id = u.id;

grant select on public.messages_with_senders to authenticated, anon;
