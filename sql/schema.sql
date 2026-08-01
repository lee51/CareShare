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
