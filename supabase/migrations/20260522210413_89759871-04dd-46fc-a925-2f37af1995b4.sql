
-- Wire the existing handle_new_user() function to auth.users inserts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing auth users who are missing one
INSERT INTO public.profiles (user_id, email, display_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;
