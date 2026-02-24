-- Sync auth.users to public.users via trigger
-- Run this in Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  -- Create a matching profile row for every new auth user.
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_auth_user_created();

