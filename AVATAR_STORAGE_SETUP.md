# Avatar Storage Setup Guide

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Yes** (check this box - required for public image URLs)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

Run the SQL in `setup-avatars-storage.sql` in your Supabase SQL Editor, OR manually create these policies:

### Policy 1: Allow users to upload their own avatars
- **Policy name**: "Users can upload own avatar"
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'avatars'`
- **WITH CHECK expression**: `bucket_id = 'avatars'`

### Policy 2: Allow public read access
- **Policy name**: "Anyone can view avatars"
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'avatars'`

### Policy 3: Allow users to update their own avatars
- **Policy name**: "Users can update own avatar"
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'avatars'`
- **WITH CHECK expression**: `bucket_id = 'avatars'`

### Policy 4: Allow users to delete their own avatars
- **Policy name**: "Users can delete own avatar"
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'avatars'`

## Step 3: Verify Setup

After creating the bucket and policies:
1. Try uploading a profile picture in the Tasker Profile page
2. Check the browser console for any errors
3. The image should appear immediately after upload

## Troubleshooting

If upload fails:
- **Error: "Bucket not found"** → Make sure the bucket is named exactly `avatars`
- **Error: "new row violates row-level security policy"** → Run the storage policies SQL
- **Error: "Permission denied"** → Check that the bucket is set to **Public**
- **Image doesn't display** → Check that the `avatar_url` field is being saved in the `users` table









