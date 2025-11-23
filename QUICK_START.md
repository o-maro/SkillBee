# Quick Start Guide

## 🚀 Getting the App Running

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The app will still run without these (with warnings), but you won't be able to use authentication or database features.

### Step 3: Start the Development Server
```bash
npm run dev
```

### Step 4: Open in Browser
The app should open at `http://localhost:5173` (or the port shown in terminal)

## 📱 What You Should See

When you first load the app:

1. **If not logged in:** You'll see the **Login page** with:
   - Email and password fields
   - "Log In" button
   - Link to "Sign up" page

2. **If logged in:** You'll be redirected to:
   - `/dashboard` (for clients)
   - `/tasker-dashboard` (for taskers)

## 🔍 Troubleshooting Blank Page

If you see a blank page, check:

1. **Browser Console** (F12):
   - Look for any red error messages
   - Common issues:
     - Missing environment variables (warning only, won't break)
     - Import errors
     - Network errors

2. **Terminal Output**:
   - Check for compilation errors
   - Make sure the dev server started successfully

3. **Common Fixes**:
   - Clear browser cache
   - Restart the dev server (`Ctrl+C` then `npm run dev`)
   - Check that all files are saved

## 🎨 Pages Available

- `/login` - Login page
- `/signup` - Sign up page (choose client or tasker)
- `/dashboard` - Client dashboard (requires login + client role)
- `/tasker-dashboard` - Tasker dashboard (requires login + tasker role)
- `/book` - Create a booking (client only)
- `/tasks` - View your tasks (client only)
- `/profile` - Update profile (client only)
- `/tasker-profile` - Update tasker profile (tasker only)
- `/wallet` - Wallet management (all users)
- `/support` - Support page (all users)

## ✅ Expected Behavior

1. **First Visit**: Redirects to `/login`
2. **After Login**: Redirects based on role (client → `/dashboard`, tasker → `/tasker-dashboard`)
3. **Navigation**: Navbar appears on all authenticated pages
4. **Protected Routes**: Unauthorized access redirects to login

## 🐛 Still Seeing Blank Page?

1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed requests
4. Share the error messages for help

The app should display the Login page by default when not authenticated!

