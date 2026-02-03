-- =================================================
-- 1. EXTENSIONS
-- =================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================
-- 2. ENUMS
-- =================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'manager', 'employee', 'sponsor');
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

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =================================================
-- 2.1 ENUM UPDATES (SAFE TO RUN MULTIPLE TIMES)
-- =================================================
-- Add 'negotiating' to sponsorship_status
ALTER TYPE sponsorship_status
ADD VALUE IF NOT EXISTS 'negotiating';

-- =================================================
-- 3. CORE TABLES
-- =================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  verification_status verification_status DEFAULT 'verified',
  assigned_manager_id UUID REFERENCES public.profiles(id),
  category_id UUID REFERENCES public.event_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INT NOT NULL,
  location TEXT,
  is_available BOOLEAN DEFAULT TRUE
);

-- =================================================
-- 4. CATEGORIES & SUBTYPES
-- =================================================

CREATE TABLE IF NOT EXISTS public.event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_subtypes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.event_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- =================================================
-- 5. EVENTS
-- =================================================

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

-- =================================================
-- 6. MANAGER ↔ CATEGORY ASSIGNMENTS
-- =================================================

CREATE TABLE IF NOT EXISTS public.manager_category_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.event_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (manager_id, category_id)
);

-- =================================================
-- 7. SUPPORTING TABLES
-- =================================================

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

CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
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

-- =================================================
-- 7.5 INDEXES & CONSTRAINTS
-- =================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_mod_per_event
ON public.modification_requests (event_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_profiles_manager_status
ON public.profiles(assigned_manager_id)
WHERE verification_status = 'pending';

-- =================================================
-- 8. FUNCTIONS
-- =================================================
-- (unchanged – omitted here for brevity in explanation, but kept intact)

-- =================================================
-- 9. TRIGGERS
-- =================================================
-- (unchanged)

-- =================================================
-- 10. ROW LEVEL SECURITY
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
-- 11. POLICIES
-- =================================================

CREATE POLICY "Sponsors view own requests"
ON public.sponsorships FOR SELECT
TO authenticated
USING (sponsor_id = auth.uid());

CREATE POLICY "Sponsors update own requests"
ON public.sponsorships FOR UPDATE
TO authenticated
USING (sponsor_id = auth.uid())
WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "Managers view category sponsorships"
ON public.sponsorships FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id
      AND mca.manager_id = auth.uid()
  )
);

CREATE POLICY "Managers create sponsorships"
ON public.sponsorships FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id
      AND mca.manager_id = auth.uid()
  )
);

-- ✅ NEW: Managers can UPDATE sponsorships (accept / counter)
CREATE POLICY "Managers update category sponsorships"
ON public.sponsorships FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.event_subtypes es ON e.subtype_id = es.id
    JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
    WHERE e.id = sponsorships.event_id
      AND mca.manager_id = auth.uid()
  )
);

-- =================================================
-- 13. GRANTS
-- =================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON public.sponsorships TO service_role;
