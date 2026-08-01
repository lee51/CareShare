-- sql/schema.sql
create extension if not exists pgcrypto;

-- pets: the dependents
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  birthday date,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- pet_caretakers: link pets to auth.users
create table if not exists pet_caretakers (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  user_id uuid not null,
  role text default 'caretaker',
  created_at timestamptz default now(),
  unique(pet_id, user_id)
);

-- activity_types: configurable actions
create table if not exists activity_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  color text,
  default_for_kind text[] default '{}',
  created_at timestamptz default now()
);

-- activities: activity log entries for pets
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  user_id uuid not null,
  activity_type_id uuid references activity_types(id),
  note text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- messages: simple chat messages for a pet
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  user_id uuid not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Trigger to update updated_at on pets
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists pets_updated_at on pets;
create trigger pets_updated_at
  before update on pets
  for each row
  execute procedure update_updated_at_column();

-- Trigger to automatically assign the creator as the owner in pet_caretakers
create or replace function public.handle_new_pet()
returns trigger as $$
begin
  if auth.uid() is not null then
    insert into public.pet_caretakers (pet_id, user_id, role)
    values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_pet_created on public.pets;
create trigger on_pet_created
  after insert on public.pets
  for each row
  execute procedure public.handle_new_pet();

-- Seed sensible default activity types
insert into activity_types (id, name, icon, color, default_for_kind)
select * from (
  values
    (gen_random_uuid(), 'food', 'utensils', '#F59E0B', ARRAY['dog','cat']),
    (gen_random_uuid(), 'pee', 'droplet', '#34D399', ARRAY['dog','cat']),
    (gen_random_uuid(), 'poop', 'ban', '#EF4444', ARRAY['dog','cat']),
    (gen_random_uuid(), 'nap', 'bed', '#60A5FA', ARRAY['dog','cat']),
    (gen_random_uuid(), 'walk', 'walk', '#F97316', ARRAY['dog']),
    (gen_random_uuid(), 'play', 'gamepad', '#A78BFA', ARRAY['dog','cat']),
    (gen_random_uuid(), 'train', 'school', '#10B981', ARRAY['dog','cat']),
    (gen_random_uuid(), 'vet', 'stethoscope', '#6366F1', ARRAY['dog','cat']),
    (gen_random_uuid(), 'medicine', 'pills', '#EC4899', ARRAY['dog','cat'])
) as t(id,name,icon,color,default_for_kind)
on conflict do nothing;
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
