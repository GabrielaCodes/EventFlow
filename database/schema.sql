-- =============================================
-- 1. EXTENSIONS & CONFIG
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 2. ENUMS (Idempotent)
-- =============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'manager', 'sponsor', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('consideration', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sponsorship_status AS ENUM ('pending', 'accepted', 'rejected', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- 3. TABLES
-- =============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VENUES
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    location TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    theme TEXT,
    event_date DATE NOT NULL,
    status event_status DEFAULT 'consideration',
    venue_id UUID REFERENCES public.venues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STAFF ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.profiles(id),
    role_description TEXT DEFAULT 'General Staff',
    status assignment_status DEFAULT 'pending',
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (event_id, employee_id)
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    employee_id UUID REFERENCES public.profiles(id),
    check_in TIMESTAMP DEFAULT NOW(),
    check_out TIMESTAMP
);

-- SPONSORSHIPS
CREATE TABLE IF NOT EXISTS public.sponsorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    sponsor_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10,2),
    status sponsorship_status DEFAULT 'pending',
    request_note TEXT,
    payment_reference TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OTHER TABLES
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    requested_by UUID REFERENCES public.profiles(id),
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    type_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity_available INT NOT NULL,
    quantity_sold INT DEFAULT 0
);

-- =============================================
-- 4. HELPER FUNCTIONS (The Key Fixes)
-- =============================================

-- A. USER CREATION TRIGGER (Secure)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- Fail safe
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure the trigger function ownership and path
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B. MANAGER CHECK (The "Dropdown Fix")
-- This function allows policies to check role without triggering infinite recursion.
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- C. ASSIGNMENT SECURITY (Stateless Column Protection)
-- Removes dependency on auth.uid(), makes logic robust.
CREATE OR REPLACE FUNCTION public.check_assignment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict Immutability: Prevent ANYONE (Manager or Employee) from changing core fields on update.
  -- To "re-assign", delete the row and create a new one.
  IF NEW.event_id IS DISTINCT FROM OLD.event_id THEN 
    RAISE EXCEPTION 'Event ID cannot be modified.'; 
  END IF;

  IF NEW.assigned_at IS DISTINCT FROM OLD.assigned_at THEN 
    RAISE EXCEPTION 'Assignment Date cannot be modified.'; 
  END IF;

  IF NEW.role_description IS DISTINCT FROM OLD.role_description THEN 
    RAISE EXCEPTION 'Role Description cannot be modified.'; 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_assignment_update_trigger ON public.assignments;
CREATE TRIGGER check_assignment_update_trigger
BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE PROCEDURE public.check_assignment_update();

-- =============================================
-- 5. ROW LEVEL SECURITY (Corrected Logic)
-- =============================================

-- Enable RLS Globally
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- --- PROFILES ---
-- Everyone (Authenticated) can read names/roles (for search/collaboration)
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
-- Users update only themselves
CREATE POLICY "Update Own Profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- --- EVENTS ---
-- Everyone can read (to see dashboard info)
CREATE POLICY "Read Events" ON public.events FOR SELECT TO authenticated USING (true);

-- Managers: Full Access (Uses helper function to fix recursion)
CREATE POLICY "Manager Full Event Access" ON public.events FOR ALL TO authenticated 
USING ( public.is_manager() );

-- Clients: Manage OWN events only
CREATE POLICY "Client Manage Own Events" ON public.events FOR ALL TO authenticated 
USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- --- VENUES ---
CREATE POLICY "Read Venues" ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager Manage Venues" ON public.venues FOR ALL TO authenticated 
USING ( public.is_manager() );

-- --- ASSIGNMENTS ---
-- Managers: Full Access
CREATE POLICY "Manager Manage Assignments" ON public.assignments FOR ALL TO authenticated 
USING ( public.is_manager() );

-- Employees: View their own
CREATE POLICY "Employee View Assignments" ON public.assignments FOR SELECT TO authenticated 
USING (employee_id = auth.uid());

-- Employees: Update their own (Restricted by Trigger)
CREATE POLICY "Employee Update Assignments" ON public.assignments FOR UPDATE TO authenticated 
USING (employee_id = auth.uid());

-- --- ATTENDANCE ---
CREATE POLICY "Manager View Attendance" ON public.attendance FOR SELECT TO authenticated 
USING ( public.is_manager() );
CREATE POLICY "Employee View Own Attendance" ON public.attendance FOR SELECT TO authenticated 
USING (employee_id = auth.uid());
CREATE POLICY "Employee Clock In" ON public.attendance FOR INSERT TO authenticated 
WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employee Clock Out" ON public.attendance FOR UPDATE TO authenticated 
USING (employee_id = auth.uid());

-- --- SPONSORSHIPS ---
CREATE POLICY "Manager Manage Sponsorships" ON public.sponsorships FOR ALL TO authenticated 
USING ( public.is_manager() );
CREATE POLICY "Sponsor Manage Own" ON public.sponsorships FOR ALL TO authenticated 
USING (sponsor_id = auth.uid()) WITH CHECK (sponsor_id = auth.uid());

-- =============================================
-- 6. GRANTS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;