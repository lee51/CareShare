-- Create a new public bucket for gallery photos
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Enable RLS for the gallery bucket
create policy "Gallery images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "Caretakers can upload gallery images"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery' and
    auth.role() = 'authenticated' and
    exists (
      select 1 from pet_caretakers
      where pet_id = (string_to_array(name, '/'))[1]::uuid
      and user_id = auth.uid()
    )
  );

create policy "Caretakers can update gallery images"
  on storage.objects for update
  using (
    bucket_id = 'gallery' and
    auth.role() = 'authenticated' and
    exists (
      select 1 from pet_caretakers
      where pet_id = (string_to_array(name, '/'))[1]::uuid
      and user_id = auth.uid()
    )
  );

create policy "Caretakers can delete gallery images"
  on storage.objects for delete
  using (
    bucket_id = 'gallery' and
    auth.role() = 'authenticated' and
    exists (
      select 1 from pet_caretakers
      where pet_id = (string_to_array(name, '/'))[1]::uuid
      and user_id = auth.uid()
    )
  );
