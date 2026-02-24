# Tasker Verification System - Setup Guide

This guide will help you set up the complete tasker verification system with admin review flow.

## 📋 Overview

The system includes:
- **Tasker Onboarding**: Collects verification information and documents
- **Admin Dashboard**: Review and approve/reject tasker applications
- **Verification Status**: Prevents unverified taskers from accessing tasker features
- **Storage**: Secure document storage for ID documents and photos

## 🗄️ Database Setup

### Step 1: Run SQL Migrations

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run the following files in order:

   **a) `create-tasker-verification-system.sql`**
   - Creates `tasker_verifications` table
   - Updates `role_enum` to include 'admin'
   - Adds `verification_status` to users table
   - Sets up RLS policies
   - Creates approval/rejection functions

   **b) `create-storage-buckets.sql`**
   - Sets up storage policies (buckets must be created first - see below)

### Step 2: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click **Create Bucket**
3. Configure:
   - **Name**: `tasker-documents`
   - **Public**: `false` (private)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*, application/pdf`
4. Click **Create Bucket**

### Step 3: Apply Storage Policies

After creating the bucket, run `create-storage-buckets.sql` in the SQL Editor to set up RLS policies for storage.

## 👤 Creating an Admin User

To create your first admin user:

1. **Option A: Via Supabase Dashboard**
   ```sql
   -- First, sign up a user normally through the app
   -- Then update their role to admin:
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@yourdomain.com';
   ```

2. **Option B: Direct SQL Insert** (if you have auth.users record)
   ```sql
   -- Update existing user to admin
   UPDATE users 
   SET role = 'admin' 
   WHERE id = 'user-uuid-here';
   ```

## 🔄 User Flow

### Tasker Signup Flow

1. User signs up and selects "I want to do tasks"
2. After signup, redirected to `/tasker-onboarding`
3. Tasker fills out verification form:
   - Service category
   - National ID number
   - Upload ID document
   - Upload passport photo
   - Optional: bio, hourly rate, operating radius
4. Form submission creates `tasker_verifications` record with status `pending`
5. User's `verification_status` set to `pending`
6. Tasker cannot access tasker features until approved

### Admin Review Flow

1. Admin logs in at `/admin/login`
2. Admin views dashboard at `/admin/dashboard`
3. Sees list of pending applications
4. Clicks on application to review
5. Views:
   - User information
   - Service details
   - ID document (preview)
   - Passport photo (preview)
6. Actions:
   - **Approve**: Updates status to `approved`, allows tasker access
   - **Reject**: Updates status to `rejected`, provides reason, tasker can resubmit

### Tasker Access Control

- **Pending/Rejected taskers**: Redirected to `/tasker-onboarding`
- **Approved taskers**: Full access to tasker features
- **Protected routes**:
  - `/tasker-dashboard`
  - `/tasker-home`
  - `/task-requests`
  - `/tasker-map`
  - `/tasker-profile`
  - `/tasker-wallet`

## 🔐 Security Features

### Row Level Security (RLS)

- **Taskers**: Can only view/update their own verification record
- **Admins**: Can view all verification records and approve/reject
- **Clients**: No access to verification records

### Storage Security

- Documents stored in private bucket
- Taskers can only upload/view their own documents
- Admins can view all documents for review
- Signed URLs expire after 1 hour

## 🧪 Testing the System

### Test Tasker Signup

1. Sign up as a tasker
2. Should redirect to `/tasker-onboarding`
3. Fill out form and submit
4. Try accessing `/tasker-dashboard` - should redirect back to onboarding
5. Check Supabase: `tasker_verifications` table should have new record

### Test Admin Review

1. Create admin user (see above)
2. Log in at `/admin/login`
3. View dashboard - should see pending applications
4. Click on application to review
5. View documents
6. Approve or reject
7. Check that tasker can now access dashboard (if approved)

### Test Verification Status

1. As unverified tasker, try accessing:
   - `/tasker-dashboard` → Should redirect to onboarding
   - `/task-requests` → Should redirect to onboarding
2. After admin approval, same routes should work

## 📁 File Structure

```
src/
├── pages/
│   ├── TaskerOnboarding.jsx      # Tasker verification form
│   ├── AdminLogin.jsx            # Admin login page
│   ├── AdminDashboard.jsx        # Admin dashboard
│   └── TaskerReview.jsx          # Admin review page
├── components/
│   ├── RequireRole.jsx           # Updated with verification check
│   └── RequireVerification.jsx   # New verification guard
├── utils/
│   └── storageApi.js             # File upload utilities
└── App.jsx                        # Updated routes

SQL Files:
├── create-tasker-verification-system.sql
└── create-storage-buckets.sql
```

## 🐛 Troubleshooting

### Issue: Taskers can't upload files

**Solution**: 
- Check that `tasker-documents` bucket exists
- Verify storage policies are applied
- Check file size (must be < 10MB)
- Check file type (images or PDF only)

### Issue: Admin can't see applications

**Solution**:
- Verify user role is set to 'admin' in `users` table
- Check RLS policies on `tasker_verifications` table
- Ensure admin is logged in

### Issue: Tasker still can't access dashboard after approval

**Solution**:
- Check `users.verification_status` is set to 'approved'
- Check `tasker_verifications.status` is set to 'approved'
- Clear browser cache and reload
- Check browser console for errors

### Issue: Documents not displaying

**Solution**:
- Verify signed URL generation is working
- Check file paths in `tasker_verifications` table
- Ensure storage bucket is accessible
- Check browser console for CORS errors

## 📝 Notes

- **Email Notifications**: Currently not implemented. Consider adding email notifications when:
  - Tasker submits verification
  - Admin approves/rejects
  - Tasker application is rejected

- **File Cleanup**: Consider implementing cleanup for rejected applications to free storage space

- **Admin Creation**: Consider creating an admin signup flow or admin invitation system

- **Verification Expiry**: Consider adding verification expiry/renewal if needed

## ✅ Checklist

- [ ] Run `create-tasker-verification-system.sql`
- [ ] Create `tasker-documents` storage bucket
- [ ] Run `create-storage-buckets.sql`
- [ ] Create at least one admin user
- [ ] Test tasker signup flow
- [ ] Test admin login and dashboard
- [ ] Test approval/rejection flow
- [ ] Verify tasker access control works
- [ ] Test file uploads
- [ ] Test document viewing

## 🚀 Next Steps

1. Set up email notifications
2. Add admin user management
3. Add verification analytics/reporting
4. Implement document verification checks
5. Add bulk approval/rejection features
6. Add verification history/audit log





