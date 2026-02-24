# SkillBee App - Setup Checklist

## ✅ Completed Components

### Authentication
- [x] Signup page with client/tasker role selection
- [x] Login page with automatic redirect based on role
- [x] AuthProvider context for global auth state
- [x] Protected routes (RequireAuth component)
- [x] Role-based route protection (RequireRole component)
- [x] Automatic profile loading after authentication
- [x] Automatic wallet initialization on signup

### Client Pages
- [x] Dashboard - Shows task statistics and recent tasks
- [x] Book - Create bookings with tasker search
- [x] Tasks - View and filter client's tasks
- [x] Profile - Update client profile information
- [x] Wallet - View balance, top up, view transactions
- [x] Support - Contact support form

### Tasker Pages
- [x] Tasker Dashboard - View available tasks and manage assigned tasks
- [x] Tasker Profile - Update tasker profile with skills and hourly rate
- [x] Accept/decline tasks functionality
- [x] Update task status (assigned → in_progress → completed)

### Components
- [x] Navbar - Role-based navigation
- [x] RequireAuth - Protected route wrapper
- [x] RequireRole - Role-based route protection

### Utilities
- [x] Supabase client configuration
- [x] Environment variable setup (.env.example)

## 📋 Required Supabase Setup

### 1. Database Tables

Create these tables in your Supabase project:

#### `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'tasker')),
  skills TEXT,
  hourly_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `bookings` table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  service_type TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `wallets` table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `transactions` table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `support_tickets` table (optional)
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Row Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = tasker_id);
CREATE POLICY "Clients can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Taskers can update assigned bookings" ON bookings
  FOR UPDATE USING (auth.uid() = tasker_id);

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. RPC Function

Create the `match_taskers_by_proximity` function:

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
    0.0::NUMERIC as distance,  -- Simplified - implement actual distance calculation
    NULL::NUMERIC as rating      -- Add rating system if needed
  FROM users u
  WHERE u.role = 'tasker'
    AND (service_type IS NULL OR u.skills LIKE '%' || service_type || '%')
  ORDER BY distance ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Database Triggers (Optional but Recommended)

#### Auto-update updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Auto-update wallet balance on transaction (Optional)
```sql
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'top_up' OR NEW.type = 'payment_received' THEN
    UPDATE wallets SET balance = balance + NEW.amount WHERE user_id = NEW.user_id;
  ELSIF NEW.type = 'payment' THEN
    UPDATE wallets SET balance = balance - NEW.amount WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_on_transaction AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

3. **Set up Supabase database**
   - Create all tables as shown above
   - Set up RLS policies
   - Create the RPC function

4. **Run the app**
   ```bash
   npm run dev
   ```

## 📝 Notes

- The app uses real Supabase backend - no mock data
- All authentication is handled through Supabase Auth
- Profile data is stored in the `users` table
- Wallet system is fully integrated with transactions
- Tasker matching uses RPC function (simplified distance calculation - enhance as needed)
- All routes are protected and role-based

## 🔒 Security

- Never commit `.env` file
- Ensure RLS is enabled on all tables
- Validate all inputs on the backend
- Use Supabase RLS policies for data access control

