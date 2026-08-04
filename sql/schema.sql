-- sql/schema.sql
create extension if not exists pgcrypto;

-- profiles: the dependents
create table if not exists profiles (
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

-- p_caretakers: link profiles to auth.users
create table if not exists p_caretakers (
  id uuid primary key default gen_random_uuid(),
  p_id uuid references profiles(id) on delete cascade,
  user_id uuid not null,
  role text default 'caretaker',
  created_at timestamptz default now(),
  unique(p_id, user_id)
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

-- activities: activity log entries for profiles
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  p_id uuid references profiles(id) on delete cascade,
  user_id uuid not null,
  activity_type_id uuid references activity_types(id),
  note text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- messages: simple chat messages for a profile
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  p_id uuid references profiles(id) on delete cascade,
  user_id uuid not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Trigger to update updated_at on profiles
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row
  execute procedure update_updated_at_column();

-- Trigger to automatically assign the creator as the owner in p_caretakers
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  if auth.uid() is not null then
    insert into public.p_caretakers (p_id, user_id, role)
    values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute procedure public.handle_new_profile();

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

-- p_invites: generated links to join care team
create table if not exists p_invites (
  id uuid primary key default gen_random_uuid(),
  p_id uuid references profiles(id) on delete cascade not null,
  created_by uuid not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz default now() + interval '24 hours' not null
);
