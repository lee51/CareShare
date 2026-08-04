-- sql/policies.sql
-- Enable RLS and basic policies tying access to p_caretakers

alter table profiles enable row level security;
alter table p_caretakers enable row level security;
alter table activities enable row level security;
alter table messages enable row level security;

-- Allow caretakers to SELECT only profiles they belong to
drop policy if exists "select profiles for caretakers" on profiles;
create policy "select profiles for caretakers" on profiles
  for select using (
    created_by = auth.uid() or
    exists (
      select 1 from p_caretakers pc where pc.p_id = profiles.id and pc.user_id = auth.uid()
    )
  );

drop policy if exists "insert profiles for authenticated" on profiles;
create policy "insert profiles for authenticated" on profiles
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "update profiles for caretakers" on profiles;
create policy "update profiles for caretakers" on profiles
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from p_caretakers pc where pc.p_id = profiles.id and pc.user_id = auth.uid()
    )
  );

-- Allow caretakers to read/write activities for profiles they belong to
drop policy if exists "select activities for caretakers" on activities;
create policy "select activities for caretakers" on activities
  for select using (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );

drop policy if exists "insert activities by caretakers" on activities;
create policy "insert activities by caretakers" on activities
  for insert with check (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );

drop policy if exists "update activities by caretakers" on activities;
create policy "update activities by caretakers" on activities
  for update using (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );

drop policy if exists "delete activities by caretakers" on activities;
create policy "delete activities by caretakers" on activities
  for delete using (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );

-- Chat messages
drop policy if exists "select messages for caretakers" on messages;
create policy "select messages for caretakers" on messages
  for select using (
    exists (select 1 from p_caretakers pc where pc.p_id = messages.p_id and pc.user_id = auth.uid())
  );

drop policy if exists "insert messages by caretakers" on messages;
create policy "insert messages by caretakers" on messages
  for insert with check (
    exists (select 1 from p_caretakers pc where pc.p_id = messages.p_id and pc.user_id = auth.uid())
  );

-- Missing RLS Policies for p_caretakers
drop policy if exists "select p_caretakers for self" on p_caretakers;
create policy "select p_caretakers for self" on p_caretakers
  for select using (user_id = auth.uid());

drop policy if exists "insert p_caretakers for self" on p_caretakers;
create policy "insert p_caretakers for self" on p_caretakers
  for insert with check (user_id = auth.uid());

drop policy if exists "update p_caretakers for self" on p_caretakers;
create policy "update p_caretakers for self" on p_caretakers
  for update using (user_id = auth.uid());

-- Explicit Grants for authenticated role
grant all on table public.profiles to authenticated, anon;
grant all on table public.p_caretakers to authenticated, anon;
grant all on table public.activity_types to authenticated, anon;
grant all on table public.activities to authenticated, anon;
grant all on table public.messages to authenticated, anon;

-- Ensure activity_types are readable if RLS is ever enabled
drop policy if exists "allow public read on activity_types" on activity_types;
create policy "allow public read on activity_types" on activity_types for select using (true);
