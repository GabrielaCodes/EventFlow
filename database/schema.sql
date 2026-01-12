-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS for fixed statuses
-- We use DO blocks to prevent errors if types already exist when re-running
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'employee', 'manager', 'sponsor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('consideration', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sponsorship_status AS ENUM ('pending', 'accepted', 'rejected', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VENUES
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    location TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

-- 3. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    theme TEXT,
    event_date DATE NOT NULL,
    status event_status DEFAULT 'consideration',
    venue_id UUID REFERENCES public.venues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STAFF ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, employee_id)
);

-- 5. ATTENDANCE LOGS
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    employee_id UUID REFERENCES public.profiles(id),
    check_in TIMESTAMP DEFAULT NOW(),
    check_out TIMESTAMP
);

-- 6. TERMS & CONDITIONS
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. EVENT MODIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS public.modification_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    requested_by UUID REFERENCES public.profiles(id),
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending', 
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. SPONSORSHIPS
CREATE TABLE IF NOT EXISTS public.sponsorships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    sponsor_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10, 2),
    status sponsorship_status DEFAULT 'pending',
    request_note TEXT,
    payment_reference TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    type_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity_available INT NOT NULL,
    quantity_sold INT DEFAULT 0
);

-- =============================================
-- FIXED TRIGGER LOGIC (Run this part!)
-- =============================================

-- 1. Drop old function to ensure we replace it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the SAFER function that handles missing data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    -- Default to 'User' if name is null
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    -- Default to 'client' if role is null or invalid
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but allow signup to proceed (prevents "Database Error" on frontend)
    RAISE LOG 'Profile creation failed for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- SECURITY POLICIES (RLS) - Vital for Login
-- =============================================

-- Enable Security on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile (Fixes "Error fetching role")
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );

-- =============================================
-- ANALYTICS VIEWS (For Manager Dashboard)
-- =============================================
CREATE OR REPLACE VIEW analytics_monthly_activity AS
    SELECT TO_CHAR(event_date, 'Month') AS month, COUNT(*) as event_count
    FROM public.events
    GROUP BY month
    ORDER BY event_count DESC;

CREATE OR REPLACE VIEW analytics_popular_types AS
    SELECT event_type, COUNT(*) as count
    FROM public.events
    GROUP BY event_type
    ORDER BY count DESC;