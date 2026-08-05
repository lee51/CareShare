create table if not exists p_invites (
  id uuid primary key default gen_random_uuid(),
  p_id uuid references profiles(id) on delete cascade not null,
  created_by uuid not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz default now() + interval '24 hours' not null,
  used_by uuid,
  used_at timestamptz
);

alter table p_invites enable row level security;

-- Caretakers can insert invites for their profiles
create policy "insert p_invites for caretakers" on p_invites
  for insert with check (
    exists (select 1 from p_caretakers pc where pc.p_id = p_invites.p_id and pc.user_id = auth.uid())
  );

-- Caretakers can see all invites for their profiles
create policy "select p_invites for caretakers" on p_invites
  for select using (
    exists (select 1 from p_caretakers pc where pc.p_id = p_invites.p_id and pc.user_id = auth.uid())
  );

grant select, insert, update on table public.p_invites to authenticated;

-- Function to safely fetch invite & profile details by ID (without exposing the whole table)
create or replace function get_invite(invite_id uuid)
returns table(
  id uuid, 
  p_id uuid, 
  created_by uuid, 
  created_at timestamptz, 
  expires_at timestamptz, 
  used_by uuid,
  used_at timestamptz,
  profile_name text, 
  profile_kind text
)
language plpgsql
security definer
as $$
begin
  return query 
  select 
    i.id, 
    i.p_id, 
    i.created_by, 
    i.created_at, 
    i.expires_at,
    i.used_by,
    i.used_at,
    pr.name as profile_name,
    pr.kind as profile_kind
  from p_invites i
  join profiles pr on pr.id = i.p_id
  where i.id = invite_id and i.expires_at > now();
end;
$$;

grant execute on function get_invite(uuid) to anon, authenticated;

-- Function to safely accept an invite
create or replace function accept_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  target_p_id uuid;
  is_used uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'User not authenticated';
  end if;

  select p.p_id, p.used_by into target_p_id, is_used
  from p_invites p
  where p.id = invite_id and p.expires_at > now();

  if target_p_id is null then
    raise exception 'Invalid or expired invite';
  end if;

  if is_used is not null then
    raise exception 'This invite has already been used';
  end if;

  -- Mark as used
  update p_invites
  set used_by = current_user_id,
      used_at = now()
  where id = invite_id;

  -- Add caretaker
  insert into p_caretakers (p_id, user_id, role)
  values (target_p_id, current_user_id, 'caretaker')
  on conflict (p_id, user_id) do nothing;

  return target_p_id;
end;
$$;

grant execute on function accept_invite(uuid) to authenticated;

