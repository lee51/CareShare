-- Rename the main table
ALTER TABLE pets RENAME TO profiles;

-- Rename caretakers table
ALTER TABLE pet_caretakers RENAME TO p_caretakers;

-- Rename foreign key columns
ALTER TABLE p_caretakers RENAME COLUMN pet_id TO p_id;
ALTER TABLE activities RENAME COLUMN pet_id TO p_id;
ALTER TABLE messages RENAME COLUMN pet_id TO p_id;

-- Recreate triggers
DROP TRIGGER IF EXISTS pets_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS on_pet_created ON public.profiles;
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.p_caretakers (p_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_profile();

DROP FUNCTION IF EXISTS public.handle_new_pet() CASCADE;

-- Update RLS policies
ALTER POLICY "select pets for caretakers" ON profiles RENAME TO "select profiles for caretakers";
ALTER POLICY "insert pets for authenticated" ON profiles RENAME TO "insert profiles for authenticated";
ALTER POLICY "update pets for caretakers" ON profiles RENAME TO "update profiles for caretakers";

ALTER POLICY "select pet_caretakers for self" ON p_caretakers RENAME TO "select p_caretakers for self";
ALTER POLICY "insert pet_caretakers for self" ON p_caretakers RENAME TO "insert p_caretakers for self";
ALTER POLICY "update pet_caretakers for self" ON p_caretakers RENAME TO "update p_caretakers for self";
