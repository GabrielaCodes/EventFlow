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
-- 3. CORE TABLES
-- =================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  verification_status verification_status DEFAULT 'verified',
  assigned_manager_id UUID REFERENCES public.profiles(id),
  category_id UUID,
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

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_category
FOREIGN KEY (category_id) REFERENCES public.event_categories(id);

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
  payment_reference TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
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

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_role_str TEXT;
  v_role_enum public.user_role;
  v_category_id UUID;
  v_assigned_manager UUID;
  v_initial_status public.verification_status;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  v_role_str := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  BEGIN
    v_category_id := (NEW.raw_user_meta_data->>'category_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_category_id := NULL;
  END;

  IF v_role_str IN ('manager','employee','sponsor') THEN
    v_role_enum := v_role_str::public.user_role;
  ELSE
    v_role_enum := 'client';
  END IF;

  IF v_role_enum = 'employee' THEN
    v_initial_status := 'pending';
  ELSE
    v_initial_status := 'verified';
  END IF;

  IF v_role_enum = 'employee' AND v_category_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_category_id::text));

    SELECT mca.manager_id
    INTO v_assigned_manager
    FROM public.manager_category_assignments mca
    LEFT JOIN public.profiles p
      ON p.assigned_manager_id = mca.manager_id
      AND p.verification_status = 'pending'
    WHERE mca.category_id = v_category_id
    GROUP BY mca.manager_id
    ORDER BY COUNT(p.id) ASC, mca.manager_id ASC
    LIMIT 1;
  END IF;

  IF v_role_enum = 'manager' AND v_category_id IS NOT NULL THEN
    INSERT INTO public.manager_category_assignments (manager_id, category_id)
    VALUES (NEW.id, v_category_id)
    ON CONFLICT (manager_id, category_id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, role,
    verification_status, assigned_manager_id, category_id
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_role_enum,
    v_initial_status, v_assigned_manager, v_category_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- 9. TRIGGERS
-- =================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

CREATE POLICY "Profiles read"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Profiles update own"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- =================================================
-- 13. GRANTS
-- =================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
