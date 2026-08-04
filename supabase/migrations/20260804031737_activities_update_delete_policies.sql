-- Update activities policy
drop policy if exists "update activities by caretakers" on activities;
create policy "update activities by caretakers" on activities
  for update using (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );

-- Delete activities policy
drop policy if exists "delete activities by caretakers" on activities;
create policy "delete activities by caretakers" on activities
  for delete using (
    exists (select 1 from p_caretakers pc where pc.p_id = activities.p_id and pc.user_id = auth.uid())
  );
