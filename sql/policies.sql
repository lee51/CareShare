-- sql/policies.sql
-- Enable RLS and basic policies tying access to pet_caretakers

alter table pets enable row level security;
alter table pet_caretakers enable row level security;
alter table activities enable row level security;
alter table messages enable row level security;

-- Allow caretakers to SELECT only pets they belong to
create policy "select pets for caretakers" on pets
  for select using (
    exists (
      select 1 from pet_caretakers pc where pc.pet_id = pets.id and pc.user_id = auth.uid()
    )
  );

create policy "insert pets for authenticated" on pets
  for insert with check (auth.role() = 'authenticated');

-- Allow caretakers to read/write activities for pets they belong to
create policy "select activities for caretakers" on activities
  for select using (
    exists (select 1 from pet_caretakers pc where pc.pet_id = activities.pet_id and pc.user_id = auth.uid())
  );

create policy "insert activities by caretakers" on activities
  for insert with check (
    exists (select 1 from pet_caretakers pc where pc.pet_id = activities.pet_id and pc.user_id = auth.uid())
  );

-- Chat messages
create policy "select messages for caretakers" on messages
  for select using (
    exists (select 1 from pet_caretakers pc where pc.pet_id = messages.pet_id and pc.user_id = auth.uid())
  );

create policy "insert messages by caretakers" on messages
  for insert with check (
    exists (select 1 from pet_caretakers pc where pc.pet_id = messages.pet_id and pc.user_id = auth.uid())
  );
