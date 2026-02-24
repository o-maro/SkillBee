# Email Setup Guide for SkillBee App

## Issue: Authentication emails not being sent after signup

This guide will help you fix the email confirmation issue in Supabase.

## Option 1: Disable Email Confirmation (Recommended for Development)

If you want users to be able to sign in immediately without email confirmation:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, find **"Enable email confirmations"**
4. **Turn it OFF** (disable it)
5. Save the changes

This will allow users to sign in immediately after signup without needing to confirm their email.

## Option 2: Configure Email Settings (For Production)

If you want email confirmation enabled, you need to configure email settings:

### Step 1: Configure SMTP (Recommended for Production)

1. Go to **Supabase Dashboard** → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.)
   - **Host**: Your SMTP server
   - **Port**: Usually 587 or 465
   - **User**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: The email address that will send confirmation emails
   - **Sender name**: Display name for emails

### Step 2: Set Email Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: 
     - `http://localhost:5173/**` (for development)
     - `https://yourdomain.com/**` (for production)

### Step 3: Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the **Confirm signup** template
3. Make sure the confirmation link uses: `{{ .ConfirmationURL }}`

## Option 3: Use Supabase's Built-in Email Service (Limited)

Supabase provides a built-in email service, but it has limitations:
- Only works for development/testing
- Limited number of emails per day
- May go to spam

To use it:
1. Go to **Authentication** → **Settings**
2. Make sure **"Enable email confirmations"** is ON
3. The built-in service should work automatically (but may be unreliable)

## Option 4: Update Code to Handle Email Confirmation

If you want to keep email confirmation enabled, update the signup flow to handle unconfirmed users:

### Update AuthProvider.jsx

Add email redirect URL and handle confirmation:

```javascript
const signUp = async (email, password, role, extraData = {}) => {
  try {
    // Get the current URL for email redirect
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          role: role,
          full_name: extraData.full_name
        }
      }
    });
    
    // ... rest of the code
  }
}
```

### Create Email Confirmation Page

Create a page at `/auth/callback` to handle email confirmation:

```javascript
// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (token && type === 'signup') {
        // Verify the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('Email verification error:', error);
          navigate('/login?error=verification_failed');
        } else {
          navigate('/dashboard');
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return <div>Verifying your email...</div>;
};
```

## Recommended Solution for Development

**Disable email confirmation** (Option 1) for now to get your app working quickly. You can enable it later when you're ready for production and have configured SMTP.

## Troubleshooting

1. **Check spam folder** - Emails might be going to spam
2. **Check Supabase logs** - Go to **Logs** → **Auth** to see if emails are being sent
3. **Verify SMTP settings** - Test your SMTP configuration
4. **Check email templates** - Make sure templates are properly configured
5. **Verify redirect URLs** - Ensure they match your app's URLs

## Quick Fix (Disable Email Confirmation)

The fastest solution is to disable email confirmation:

1. Supabase Dashboard → **Authentication** → **Settings**
2. Turn OFF **"Enable email confirmations"**
3. Save
4. Users can now sign in immediately after signup

