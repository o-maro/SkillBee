-- Diagnostic SQL to check if tasker onboarding tables exist and are configured correctly

-- 1. Check if users table exists and has verification_status column
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'role', 'verification_status', 'email')
ORDER BY column_name;

-- 2. Check if tasker_verifications table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasker_verifications' 
  AND table_schema = 'public'
ORDER BY column_name;

-- 3. Check RLS policies on tasker_verifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasker_verifications';

-- 4. Check if storage bucket exists (this will show if bucket is accessible)
-- Note: This requires storage admin access
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'tasker-documents';

-- 5. Check current user's profile (replace with your user ID)
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users
SELECT 
  id,
  email,
  role,
  verification_status,
  created_at
FROM public.users
WHERE id = auth.uid()
LIMIT 1;

-- 6. Check if user has any verification records
SELECT 
  user_id,
  status,
  service_category,
  created_at
FROM public.tasker_verifications
WHERE user_id = auth.uid()
LIMIT 1;
