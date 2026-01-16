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

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    location TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

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

CREATE TABLE IF NOT EXISTS public.modification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    requested_by UUID REFERENCES public.profiles(id),
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),

    -- 🔽 Integrated from query1
    proposed_venue_id UUID REFERENCES public.venues(id),
    proposed_date DATE,
    proposed_time TIME,
    rejection_reason TEXT
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
-- 4. CONSTRAINTS (Integrated)
-- =============================================

DO $$ BEGIN
    ALTER TABLE public.modification_requests
    ADD CONSTRAINT check_modification_status
    CHECK (status IN ('pending', 'accepted', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_assignment_update()
RETURNS TRIGGER AS $$
BEGIN
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
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE PROCEDURE public.check_assignment_update();

-- =============================================
-- 6. AVAILABILITY & MODIFICATION FUNCTIONS (Integrated)
-- =============================================

CREATE OR REPLACE FUNCTION public.check_venue_availability(
    check_venue_id UUID,
    check_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    is_booked BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.events
        WHERE venue_id = check_venue_id
          AND event_date = check_date
          AND status NOT IN ('cancelled', 'completed')

        UNION ALL

        SELECT 1 FROM public.modification_requests
        WHERE proposed_venue_id = check_venue_id
          AND proposed_date = check_date
          AND status = 'pending'
    )
    INTO is_booked;

    RETURN NOT is_booked;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.apply_modification(UUID);

CREATE OR REPLACE FUNCTION public.apply_modification(mod_id UUID)
RETURNS VOID AS $$
DECLARE
    v_mod_record RECORD;
    v_event_record RECORD;
BEGIN
    SELECT * INTO v_mod_record
    FROM public.modification_requests
    WHERE id = mod_id
    FOR UPDATE;

    IF v_mod_record IS NULL THEN
        RAISE EXCEPTION 'Modification request not found.';
    END IF;

    IF v_mod_record.status <> 'pending' THEN
        RAISE EXCEPTION 'Modification is no longer pending.';
    END IF;

    SELECT * INTO v_event_record
    FROM public.events
    WHERE id = v_mod_record.event_id;

    IF v_event_record.client_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this event.';
    END IF;

    UPDATE public.events
    SET
        venue_id = v_mod_record.proposed_venue_id,
        event_date = v_mod_record.proposed_date,
        status = 'in_progress'
    WHERE id = v_mod_record.event_id;

    UPDATE public.modification_requests
    SET status = 'accepted'
    WHERE id = mod_id;

    UPDATE public.modification_requests
    SET
        status = 'rejected',
        rejection_reason = 'Another modification was accepted'
    WHERE event_id = v_mod_record.event_id
      AND id <> mod_id
      AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. ROW LEVEL SECURITY (FINAL – NO CONFLICTS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- =================================================
-- PROFILES
-- =================================================
CREATE POLICY "Public Read Profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Update Own Profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =================================================
-- EVENTS (STRICT, CATEGORY-AWARE)
-- =================================================

-- CLIENT: full control of own events
CREATE POLICY "Client Own Events"
ON public.events
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- MANAGER: full control ONLY within assigned categories
CREATE POLICY "Manager Category Events"
ON public.events
FOR ALL
TO authenticated
USING (
  public.is_manager()
  AND EXISTS (
    SELECT 1
    FROM public.event_subtypes es
    JOIN public.manager_category_assignments mca
      ON mca.category_id = es.category_id
    WHERE es.id = events.subtype_id
      AND mca.manager_id = auth.uid()
  )
)
WITH CHECK (
  public.is_manager()
  AND EXISTS (
    SELECT 1
    FROM public.event_subtypes es
    JOIN public.manager_category_assignments mca
      ON mca.category_id = es.category_id
    WHERE es.id = subtype_id
      AND mca.manager_id = auth.uid()
  )
);

-- EMPLOYEE: read-only assigned events
CREATE POLICY "Employee Assigned Events"
ON public.events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.event_id = events.id
      AND a.employee_id = auth.uid()
  )
);

-- =================================================
-- VENUES
-- =================================================
CREATE POLICY "Read Venues"
ON public.venues
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Manager Manage Venues"
ON public.venues
FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- =================================================
-- ASSIGNMENTS
-- =================================================
CREATE POLICY "Manager Manage Assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

CREATE POLICY "Employee View Assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Employee Update Assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (employee_id = auth.uid());

-- =================================================
-- ATTENDANCE
-- =================================================
CREATE POLICY "Manager View Attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (public.is_manager());

CREATE POLICY "Employee View Own Attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

CREATE POLICY "Employee Clock In"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employee Clock Out"
ON public.attendance
FOR UPDATE
TO authenticated
USING (employee_id = auth.uid());

-- =================================================
-- MODIFICATION REQUESTS (CATEGORY-SAFE)
-- =================================================

-- MANAGER: view requests for own category
CREATE POLICY "Manager View Modification Requests"
ON public.modification_requests
FOR SELECT
TO authenticated
USING (
  public.is_manager()
  AND EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.event_subtypes es ON es.id = e.subtype_id
    JOIN public.manager_category_assignments mca
      ON mca.category_id = es.category_id
    WHERE e.id = modification_requests.event_id
      AND mca.manager_id = auth.uid()
  )
);

-- MANAGER: create requests for own category
CREATE POLICY "Manager Create Modification Requests"
ON public.modification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_manager()
  AND EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.event_subtypes es ON es.id = e.subtype_id
    JOIN public.manager_category_assignments mca
      ON mca.category_id = es.category_id
    WHERE e.id = modification_requests.event_id
      AND mca.manager_id = auth.uid()
  )
);

-- CLIENT: view & respond to requests for own events
CREATE POLICY "Client Manage Own Modification Requests"
ON public.modification_requests
FOR SELECT, UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = modification_requests.event_id
      AND e.client_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = modification_requests.event_id
      AND e.client_id = auth.uid()
  )
);

-- =================================================
-- SPONSORSHIPS
-- =================================================
CREATE POLICY "Manager Manage Sponsorships"
ON public.sponsorships
FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

CREATE POLICY "Sponsor Manage Own Sponsorships"
ON public.sponsorships
FOR ALL
TO authenticated
USING (sponsor_id = auth.uid())
WITH CHECK (sponsor_id = auth.uid());

-- =================================================
-- GRANTS
-- =================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON public.assignments TO authenticated;
GRANT SELECT ON public.venues TO authenticated;
