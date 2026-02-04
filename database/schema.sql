-- =================================================
-- 1. EXTENSIONS
-- =================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================
-- 2. ENUMS
-- =================================================
-- We use DO blocks to safely create enums only if they don't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'manager', 'employee', 'sponsor', 'chief_coordinator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- If 'chief_coordinator' was missing from an old install, add it now:
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'chief_coordinator';

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('consideration', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sponsorship_status AS ENUM ('pending', 'accepted', 'rejected', 'paid', 'negotiating');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure 'negotiating' exists if table was already made
ALTER TYPE sponsorship_status ADD VALUE IF NOT EXISTS 'negotiating';

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =================================================
-- 3. TABLES
-- =================================================

-- 3.1 PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  verification_status verification_status DEFAULT 'verified',
  assigned_manager_id UUID REFERENCES public.profiles(id),
  category_id UUID, -- References event_categories(id) created later
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 VENUES
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INT NOT NULL,
  location TEXT,
  is_available BOOLEAN DEFAULT TRUE
);

-- 3.3 CATEGORIES & SUBTYPES
CREATE TABLE IF NOT EXISTS public.event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add Foreign Key to profiles now that categories exist
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_category_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.event_categories(id);

CREATE TABLE IF NOT EXISTS public.event_subtypes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.event_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- 3.4 EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  event_date DATE NOT NULL,
  status event_status DEFAULT 'consideration',
  venue_id UUID REFERENCES public.venues(id),
  subtype_id UUID REFERENCES public.event_subtypes(id),
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 ASSIGNMENTS (Manager <-> Category)
CREATE TABLE IF NOT EXISTS public.manager_category_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.event_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (manager_id, category_id)
);

-- 3.6 STAFF ASSIGNMENTS & ATTENDANCE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  role_description TEXT DEFAULT 'General Staff',
  status assignment_status DEFAULT 'pending',
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (event_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  employee_id UUID REFERENCES public.profiles(id),
  check_in TIMESTAMP DEFAULT NOW(),
  check_out TIMESTAMP
);

-- 3.7 SPONSORSHIPS
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  sponsor_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2),
  status sponsorship_status DEFAULT 'pending',
  request_note TEXT,
  sponsor_note TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, sponsor_id)
);

-- 3.8 MODIFICATIONS
CREATE TABLE IF NOT EXISTS public.modification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  requested_by UUID REFERENCES public.profiles(id),
  request_details TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  proposed_venue_id UUID REFERENCES public.venues(id),
  proposed_date DATE,
  proposed_time TIME,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_mod_per_event
ON public.modification_requests (event_id)
WHERE status = 'pending';

-- 3.9 TICKETS & TERMS
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  type_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INT NOT NULL,
  quantity_sold INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =================================================
-- 4. FUNCTIONS
-- =================================================

-- ✅ 4.1 SECURE ROLE CHECK (PREVENTS 500 ERROR)
CREATE OR REPLACE FUNCTION public.is_chief_coordinator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'chief_coordinator' 
    AND verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 CHECK MANAGER ROLE
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 4.3 USER SIGNUP HANDLER (FIXED INSERT ORDER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_role_str TEXT;
  v_role_enum public.user_role;
  v_category_id UUID;
  v_assigned_manager UUID;
  v_initial_status public.verification_status;
  v_company_name TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  v_role_str := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_company_name := NEW.raw_user_meta_data->>'company_name';

  -- Safely parse category_id
  BEGIN
    v_category_id := (NEW.raw_user_meta_data->>'category_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_category_id := NULL;
  END;

  -- Map Role
  IF v_role_str IN ('manager','employee','sponsor','chief_coordinator') THEN
    v_role_enum := v_role_str::public.user_role;
  ELSE
    v_role_enum := 'client';
  END IF;

  -- Map Status
  IF v_role_enum = 'employee' THEN
    v_initial_status := 'pending';
  ELSIF v_role_enum = 'manager' OR v_role_enum = 'sponsor' THEN
    v_initial_status := 'pending'; -- Require Approval
  ELSIF v_role_enum = 'chief_coordinator' THEN
    v_initial_status := 'verified';
  ELSE
    v_initial_status := 'verified'; -- Clients
  END IF;

  -- Employee: Find Manager
  IF v_role_enum = 'employee' AND v_category_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_category_id::text));
    SELECT mca.manager_id INTO v_assigned_manager
    FROM public.manager_category_assignments mca
    LEFT JOIN public.profiles p ON p.assigned_manager_id = mca.manager_id AND p.verification_status = 'pending'
    WHERE mca.category_id = v_category_id
    GROUP BY mca.manager_id
    ORDER BY COUNT(p.id), mca.manager_id
    LIMIT 1;
  END IF;

  -- 1. Insert Profile FIRST (Prevents FK Error)
  INSERT INTO public.profiles (
    id, email, full_name, company_name, role, 
    verification_status, assigned_manager_id, category_id
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_company_name, v_role_enum, 
    v_initial_status, v_assigned_manager, v_category_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Manager Assignment SECOND
  IF v_role_enum = 'manager' AND v_category_id IS NOT NULL THEN
    INSERT INTO public.manager_category_assignments (manager_id, category_id)
    VALUES (NEW.id, v_category_id)
    ON CONFLICT (manager_id, category_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- 5. TRIGGERS
-- =================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================
-- 6. RLS ENABLE
-- =================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_category_assignments ENABLE ROW LEVEL SECURITY;

-- =================================================
-- 7. POLICIES (CLEAN SLATE)
-- =================================================

-- --- PROFILES ---
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
CREATE POLICY "Public profiles access" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Coordinator manage all" ON public.profiles;
CREATE POLICY "Coordinator manage all" ON public.profiles FOR ALL TO authenticated USING (is_chief_coordinator());

-- --- EVENTS ---
DROP POLICY IF EXISTS "Clients view own events" ON public.events;
CREATE POLICY "Clients view own events" ON public.events FOR SELECT TO authenticated USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients create events" ON public.events;
CREATE POLICY "Clients create events" ON public.events FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients update own events" ON public.events;
CREATE POLICY "Clients update own events" ON public.events FOR UPDATE TO authenticated USING (client_id = auth.uid() AND status = 'consideration');

DROP POLICY IF EXISTS "Managers view category events" ON public.events;
CREATE POLICY "Managers view category events" ON public.events FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.event_subtypes es
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE es.id = events.subtype_id AND mca.manager_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coordinator view all events" ON public.events;
CREATE POLICY "Coordinator view all events" ON public.events FOR SELECT TO authenticated USING (is_chief_coordinator());

-- --- MASTER DATA (Categories/Subtypes/Venues) ---
-- Public Read
CREATE POLICY "Public read categories" ON public.event_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read subtypes" ON public.event_subtypes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read venues" ON public.venues FOR SELECT TO authenticated USING (true);

-- Coordinator Manage (Write)
CREATE POLICY "Coord manage categories" ON public.event_categories FOR ALL TO authenticated USING (is_chief_coordinator());
CREATE POLICY "Coord manage subtypes" ON public.event_subtypes FOR ALL TO authenticated USING (is_chief_coordinator());
CREATE POLICY "Coord manage venues" ON public.venues FOR ALL TO authenticated USING (is_chief_coordinator());

-- --- SPONSORSHIPS ---
DROP POLICY IF EXISTS "Sponsors view own requests" ON public.sponsorships;
CREATE POLICY "Sponsors view own requests" ON public.sponsorships FOR SELECT TO authenticated USING (sponsor_id = auth.uid());

DROP POLICY IF EXISTS "Sponsors update own requests" ON public.sponsorships;
CREATE POLICY "Sponsors update own requests" ON public.sponsorships FOR UPDATE TO authenticated USING (sponsor_id = auth.uid());

DROP POLICY IF EXISTS "Managers view category sponsorships" ON public.sponsorships;
CREATE POLICY "Managers view category sponsorships" ON public.sponsorships FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id AND mca.manager_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers create sponsorships" ON public.sponsorships;
CREATE POLICY "Managers create sponsorships" ON public.sponsorships FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id AND mca.manager_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers update sponsorships" ON public.sponsorships;
CREATE POLICY "Managers update sponsorships" ON public.sponsorships FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id AND mca.manager_id = auth.uid()
  )
);

-- =================================================
-- 8. GRANTS
-- =================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;