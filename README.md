# SkillBee App

A complete React application for connecting clients with taskers, built with Vite, React Router, and Supabase.

## Features

- **User Authentication**: Sign up as client or tasker, login with email/password
- **Client Dashboard**: View task statistics and recent bookings
- **Task Booking**: Create bookings with service type, budget, location, and find nearby taskers
- **Tasker Dashboard**: View available tasks, accept/decline tasks, manage task status
- **Wallet System**: View balance, top up wallet, view transaction history
- **Profile Management**: Update profile information for both clients and taskers
- **Support**: Contact support team

## Tech Stack

- **React 18** (Functional components only)
- **React Router v6** for navigation
- **Supabase** for backend (authentication, database, real-time)
- **Vite** for build tooling
- **CSS Modules** for styling

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase project with the following tables:
  - `users` - User profiles with role (client/tasker)
  - `bookings` - Task bookings
  - `wallets` - User wallet balances
  - `transactions` - Wallet transactions
  - `support_tickets` (optional) - Support tickets

## Supabase Database Schema

### Required Tables

#### users
```sql
- id (uuid, primary key, references auth.users)
- email (text)
- full_name (text)
- phone (text, nullable)
- role (text: 'client' or 'tasker')
- skills (text, nullable)
- hourly_rate (numeric, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### bookings
```sql
- id (uuid, primary key)
- client_id (uuid, references users.id)
- tasker_id (uuid, nullable, references users.id)
- service_type (text)
- budget (numeric)
- location (text)
- notes (text, nullable)
- status (text: 'pending', 'assigned', 'in_progress', 'completed')
- created_at (timestamp)
- updated_at (timestamp)
```

#### wallets
```sql
- id (uuid, primary key)
- user_id (uuid, references users.id)
- balance (numeric, default 0)
- created_at (timestamp)
- updated_at (timestamp)
```

#### transactions
```sql
- id (uuid, primary key)
- user_id (uuid, references users.id)
- amount (numeric)
- type (text: 'top_up', 'payment', 'payment_received', etc.)
- description (text, nullable)
- created_at (timestamp)
```

### Required RPC Function

#### match_taskers_by_proximity
This function should match taskers by proximity to a client's location. Example implementation:

```sql
CREATE OR REPLACE FUNCTION match_taskers_by_proximity(
  client_location TEXT,
  service_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  distance NUMERIC,
  rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    -- Calculate distance (simplified - you may want to use actual geolocation)
    0.0 as distance,
    NULL::NUMERIC as rating
  FROM users u
  WHERE u.role = 'tasker'
    AND (service_type IS NULL OR u.skills LIKE '%' || service_type || '%')
  ORDER BY distance ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

## Setup Instructions

1. **Clone or navigate to the project directory**
   ```bash
   cd "SkillBee App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up Supabase database**
   - Create the required tables (see schema above)
   - Set up Row Level Security (RLS) policies
   - Create the RPC function for tasker matching
   - Set up database triggers for wallet updates (optional but recommended)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Navigation bar component
│   ├── Navbar.module.css
│   └── RequireAuth.jsx     # Protected route wrapper
├── context/
│   └── AuthProvider.jsx    # Authentication context
├── pages/
│   ├── Signup.jsx          # Sign up page
│   ├── Login.jsx           # Login page
│   ├── Dashboard.jsx       # Client dashboard
│   ├── TaskerDashboard.jsx # Tasker dashboard
│   ├── Book.jsx            # Create booking page
│   ├── Tasks.jsx           # Client's tasks list
│   ├── Profile.jsx         # Client profile
│   ├── TaskerProfile.jsx   # Tasker profile
│   ├── Wallet.jsx          # Wallet page
│   └── Support.jsx         # Support page
├── utils/
│   └── supabaseClient.js   # Supabase client configuration
├── App.jsx                 # Main app component with routing
├── App.css                 # Global styles
├── main.jsx                # Entry point
└── index.css               # Base styles
```

## Key Features Implementation

### Authentication
- Users sign up with email, password, and role (client/tasker)
- Profile is automatically created in `users` table
- Wallet is automatically initialized
- Login redirects based on role

### Booking System
- Clients create bookings with service details
- System searches for nearby taskers using RPC function
- Taskers can accept/decline tasks
- Task status can be updated (pending → assigned → in_progress → completed)

### Wallet System
- Each user has a wallet with balance
- Users can top up their wallet
- Transactions are recorded
- Balance updates automatically (should be handled by database triggers)

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Notes

- Never commit `.env` file to version control
- Ensure Row Level Security (RLS) is enabled on all Supabase tables
- Validate user permissions on the backend
- Use Supabase RLS policies to restrict data access

## Development

The app uses:
- **Vite** for fast development with HMR
- **React Router** for client-side routing
- **Supabase JS Client** for backend integration
- **CSS Modules** for scoped styling

## License

This project is private and proprietary.
