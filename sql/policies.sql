-- sql/policies.sql
-- Enable RLS and basic policies tying access to pet_caretakers

alter table pets enable row level security;
alter table pet_caretakers enable row level security;
alter table activities enable row level security;
alter table messages enable row level security;

-- Allow caretakers to SELECT only pets they belong to
drop policy if exists "select pets for caretakers" on pets;
create policy "select pets for caretakers" on pets
  for select using (
    created_by = auth.uid() or
    exists (
      select 1 from pet_caretakers pc where pc.pet_id = pets.id and pc.user_id = auth.uid()
    )
  );

drop policy if exists "insert pets for authenticated" on pets;
create policy "insert pets for authenticated" on pets
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "update pets for caretakers" on pets;
create policy "update pets for caretakers" on pets
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from pet_caretakers pc where pc.pet_id = pets.id and pc.user_id = auth.uid()
    )
  );

-- Allow caretakers to read/write activities for pets they belong to
drop policy if exists "select activities for caretakers" on activities;
create policy "select activities for caretakers" on activities
  for select using (
    exists (select 1 from pet_caretakers pc where pc.pet_id = activities.pet_id and pc.user_id = auth.uid())
  );

drop policy if exists "insert activities by caretakers" on activities;
create policy "insert activities by caretakers" on activities
  for insert with check (
    exists (select 1 from pet_caretakers pc where pc.pet_id = activities.pet_id and pc.user_id = auth.uid())
  );

-- Chat messages
drop policy if exists "select messages for caretakers" on messages;
create policy "select messages for caretakers" on messages
  for select using (
    exists (select 1 from pet_caretakers pc where pc.pet_id = messages.pet_id and pc.user_id = auth.uid())
  );

drop policy if exists "insert messages by caretakers" on messages;
create policy "insert messages by caretakers" on messages
  for insert with check (
    exists (select 1 from pet_caretakers pc where pc.pet_id = messages.pet_id and pc.user_id = auth.uid())
  );

-- Missing RLS Policies for pet_caretakers
drop policy if exists "select pet_caretakers for self" on pet_caretakers;
create policy "select pet_caretakers for self" on pet_caretakers
  for select using (user_id = auth.uid());

drop policy if exists "insert pet_caretakers for self" on pet_caretakers;
create policy "insert pet_caretakers for self" on pet_caretakers
  for insert with check (user_id = auth.uid());

drop policy if exists "update pet_caretakers for self" on pet_caretakers;
create policy "update pet_caretakers for self" on pet_caretakers
  for update using (user_id = auth.uid());

-- Explicit Grants for authenticated role
grant all on table public.pets to authenticated, anon;
grant all on table public.pet_caretakers to authenticated, anon;
grant all on table public.activity_types to authenticated, anon;
grant all on table public.activities to authenticated, anon;
grant all on table public.messages to authenticated, anon;

-- Ensure activity_types are readable if RLS is ever enabled
drop policy if exists "allow public read on activity_types" on activity_types;
create policy "allow public read on activity_types" on activity_types for select using (true);
