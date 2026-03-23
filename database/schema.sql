-- =================================================
-- 1. EXTENSIONS
-- =================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================
-- 2. ENUMS
-- =================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'manager', 'employee', 'sponsor', 'chief_coordinator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('consideration', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sponsorship_status AS ENUM ('pending', 'accepted', 'rejected', 'paid', 'negotiating');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE sponsorship_status ADD VALUE IF NOT EXISTS 'negotiating';

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_type AS ENUM ('venue', 'category', 'subtype');
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
  assigned_manager_id UUID REFERENCES public.profiles(id), -- Legacy/Optional for Employees now
  category_id UUID, 
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
  is_hidden BOOLEAN DEFAULT false, -- For soft-deletion if needed
  venue_id UUID REFERENCES public.venues(id),
  subtype_id UUID REFERENCES public.event_subtypes(id),
  client_notes TEXT,
  assigned_manager_id UUID REFERENCES public.profiles(id), -- Tracks which manager load-balances this event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Index for load-balancing queries
CREATE INDEX IF NOT EXISTS idx_events_assigned_manager_status
ON public.events (assigned_manager_id, status);

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
  shift_start TIMESTAMP,
  shift_end TIMESTAMP,
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

-- 3.9 TICKETS 
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id),
  type_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INT NOT NULL,
  quantity_sold INT DEFAULT 0,
  sponsor_allocation_amount DECIMAL(10,2) DEFAULT 0.00 -- Added for Sponsor Feature
);


-- 3.10 MASTER DATA REQUESTS (For Managers)
CREATE TABLE IF NOT EXISTS public.master_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by UUID REFERENCES public.profiles(id),
  type request_type NOT NULL,
  request_data JSONB NOT NULL, 
  request_note TEXT,
  rejection_reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 EVENT MESSAGES (NEW)
CREATE TABLE IF NOT EXISTS public.event_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--3.12 LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id), -- The oldest manager assigned to approve
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;


-- =================================================
-- 4. FUNCTIONS & TRIGGERS
-- =================================================

-- 4.1 ROLE CHECKS
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_chief_coordinator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'chief_coordinator' AND verification_status = 'verified');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.2 SECURITY "BLACK BOX" HELPER FUNCTIONS (Prevents infinite RLS recursion)
CREATE OR REPLACE FUNCTION public.can_manager_view_event_data(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.event_subtypes es ON e.subtype_id = es.id
        JOIN public.manager_category_assignments mca ON es.category_id = mca.category_id
        WHERE e.id = p_event_id AND mca.manager_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manager_edit_event_data(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = p_event_id AND assigned_manager_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if current user is a sponsor for the event
CREATE OR REPLACE FUNCTION public.is_sponsor_for_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.sponsorships
        WHERE event_id = p_event_id AND sponsor_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.3 LOAD BALANCING LOGIC 
CREATE OR REPLACE FUNCTION public.get_best_manager_for_category(p_category_id UUID)
RETURNS UUID AS $$
DECLARE
    v_manager_id UUID;
BEGIN
    SELECT mca.manager_id INTO v_manager_id
    FROM public.manager_category_assignments mca
    JOIN public.profiles p ON p.id = mca.manager_id
    -- CHANGE: We now ONLY count 'in_progress' events to match the frontend logic
    LEFT JOIN public.events e ON e.assigned_manager_id = mca.manager_id 
        AND e.status = 'in_progress' 
    WHERE mca.category_id = p_category_id
      AND p.verification_status = 'verified' 
    GROUP BY mca.manager_id, p.created_at  -- Added p.created_at to the group for the tie-breaker
    -- CHANGE: Order by count first, then by the manager's creation date (oldest first)
    ORDER BY COUNT(e.id) ASC, p.created_at ASC
    LIMIT 1;

    RETURN v_manager_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.4 USER SIGNUP HANDLER 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_role_str TEXT;
  v_role_enum public.user_role;
  v_category_id UUID;
  v_initial_status public.verification_status;
  v_company_name TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  v_role_str  := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_company_name := NEW.raw_user_meta_data->>'company_name';

  BEGIN v_category_id := (NEW.raw_user_meta_data->>'category_id')::UUID; EXCEPTION WHEN OTHERS THEN v_category_id := NULL; END;
  BEGIN v_role_enum := v_role_str::public.user_role; EXCEPTION WHEN OTHERS THEN v_role_enum := 'client'; END;

  IF v_role_enum IN ('manager', 'employee', 'sponsor') THEN v_initial_status := 'pending';
  ELSIF v_role_enum = 'chief_coordinator' THEN v_initial_status := 'pending';
  ELSE v_initial_status := 'verified'; END IF;

  INSERT INTO public.profiles (id, email, full_name, company_name, role, verification_status, category_id)
  VALUES (NEW.id, NEW.email, v_full_name, v_company_name, v_role_enum, v_initial_status, v_category_id)
  ON CONFLICT (id) DO NOTHING;

  IF v_role_enum = 'manager' AND v_category_id IS NOT NULL THEN
    INSERT INTO public.manager_category_assignments (manager_id, category_id) VALUES (NEW.id, v_category_id)
    ON CONFLICT (manager_id, category_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE LOG 'Error in handle_new_user(): %', SQLERRM; RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4.5 UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_events_modtime ON public.events;
CREATE TRIGGER update_events_modtime BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================
-- 5. ANALYTICS & CONTROL PANEL VIEWS
-- =================================================

CREATE OR REPLACE VIEW public.analytics_overview AS
SELECT
  (SELECT COUNT(*) FROM public.events) AS total_events,
  (SELECT COUNT(*) FROM public.events WHERE status = 'consideration') AS pending_approvals,
  (SELECT COUNT(*) FROM public.venues WHERE is_available = TRUE) AS active_venues,
  (SELECT COALESCE(SUM(amount), 0) FROM public.sponsorships WHERE status = 'accepted') AS total_sponsorship_amount;

CREATE OR REPLACE VIEW public.analytics_category_performance AS
SELECT c.name AS category_name, COUNT(e.id) AS event_count
FROM public.event_categories c
LEFT JOIN public.event_subtypes s ON c.id = s.category_id
LEFT JOIN public.events e ON s.id = e.subtype_id
GROUP BY c.name ORDER BY event_count DESC;

CREATE OR REPLACE VIEW public.analytics_monthly_trends AS
SELECT TO_CHAR(created_at, 'YYYY-MM') AS month_year, COUNT(id) AS events_created
FROM public.events WHERE created_at >= NOW() - INTERVAL '12 months' GROUP BY 1 ORDER BY 1 ASC;

CREATE OR REPLACE VIEW public.analytics_status_distribution AS
SELECT status, COUNT(id) AS count FROM public.events GROUP BY status;

CREATE OR REPLACE VIEW public.view_coordinator_pending_actions AS
SELECT 
    id, 
    full_name, 
    role, 
    company_name, 
    created_at, 
    EXTRACT(DAY FROM (NOW() - created_at))::INT AS days_waiting
FROM public.profiles
WHERE verification_status = 'pending'::verification_status 
  AND role IN ('manager'::user_role, 'sponsor'::user_role)
ORDER BY created_at ASC;

CREATE OR REPLACE VIEW public.view_coordinator_urgent_events AS
SELECT 
  id, title, event_date, status, venue_id, client_id,
  ROUND(EXTRACT(EPOCH FROM (event_date::timestamp - NOW())) / 86400) AS days_until_event
FROM public.events
WHERE 
  event_date >= CURRENT_DATE 
  AND event_date <= (CURRENT_DATE + INTERVAL '7 days')
  AND (status = 'consideration' OR venue_id IS NULL)
ORDER BY event_date ASC;

CREATE OR REPLACE VIEW public.view_coordinator_recent_alerts AS
SELECT 
    id, 
    title, 
    updated_at, 
    status
FROM public.events
WHERE status = 'cancelled'::event_status
  AND updated_at >= NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- =================================================
-- 6. RLS ENABLE & POLICIES
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
ALTER TABLE public.master_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- --- PROFILES ---
CREATE POLICY "Public profiles access" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Coordinator manage all" ON public.profiles FOR ALL TO authenticated USING (is_chief_coordinator());

-- --- MANAGER ASSIGNMENTS ---
CREATE POLICY "Public read manager assignments" ON public.manager_category_assignments FOR SELECT TO authenticated USING (true);

-- --- EVENTS (Client Lockout, Sponsor Access, + Manager Scope) ---
CREATE POLICY "Clients view own events" ON public.events FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Sponsors view sponsored events" ON public.events FOR SELECT TO authenticated USING (public.is_sponsor_for_event(id));
CREATE POLICY "Clients create events" ON public.events FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients update own events" ON public.events FOR UPDATE TO authenticated USING (client_id = auth.uid() AND status = 'consideration' AND assigned_manager_id IS NULL);
CREATE POLICY "Managers view category events" ON public.events FOR SELECT TO authenticated USING (public.can_manager_view_event_data(id));
CREATE POLICY "Managers update assigned events" ON public.events FOR UPDATE TO authenticated USING (assigned_manager_id = auth.uid());
CREATE POLICY "Coordinator view all events" ON public.events FOR SELECT TO authenticated USING (is_chief_coordinator());

-- --- MASTER DATA ---
CREATE POLICY "Public read categories" ON public.event_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read subtypes" ON public.event_subtypes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read venues" ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coord manage categories" ON public.event_categories FOR ALL TO authenticated USING (is_chief_coordinator());
CREATE POLICY "Coord manage subtypes" ON public.event_subtypes FOR ALL TO authenticated USING (is_chief_coordinator());
CREATE POLICY "Coord manage venues" ON public.venues FOR ALL TO authenticated USING (is_chief_coordinator());

-- --- MODIFICATION REQUESTS---
CREATE POLICY "Managers view category modifications" ON public.modification_requests FOR SELECT TO authenticated USING (public.can_manager_view_event_data(event_id));
CREATE POLICY "Assigned managers create modifications" ON public.modification_requests FOR INSERT TO authenticated WITH CHECK (public.can_manager_edit_event_data(event_id));

-- --- SPONSORSHIPS---
CREATE POLICY "Sponsors view own requests" ON public.sponsorships FOR SELECT TO authenticated USING (sponsor_id = auth.uid());
CREATE POLICY "Sponsors update own requests" ON public.sponsorships FOR UPDATE TO authenticated USING (sponsor_id = auth.uid());
CREATE POLICY "Managers view category sponsorships" ON public.sponsorships FOR SELECT TO authenticated USING (public.can_manager_view_event_data(event_id));
CREATE POLICY "Managers create sponsorships" ON public.sponsorships FOR INSERT TO authenticated WITH CHECK (public.can_manager_edit_event_data(event_id));
CREATE POLICY "Managers update sponsorships" ON public.sponsorships FOR UPDATE TO authenticated USING (public.can_manager_edit_event_data(event_id));

-- --- ASSIGNMENTS & ATTENDANCE---
CREATE POLICY "Managers view category assignments" ON public.assignments FOR SELECT TO authenticated USING (public.can_manager_view_event_data(event_id));
CREATE POLICY "Managers create assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (public.can_manager_edit_event_data(event_id));
CREATE POLICY "Managers view category attendance" ON public.attendance FOR SELECT TO authenticated USING (public.can_manager_view_event_data(event_id));

-- --- TICKETS ---
----RLS POLICIES----
-- 1. FLIP THE MASTER SWITCH TO ENABLE RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Clear out any old policies just in case
DROP POLICY IF EXISTS "Coordinator view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Managers view tickets for category events" ON public.tickets;
DROP POLICY IF EXISTS "Sponsors view tickets for sponsored events" ON public.tickets;
DROP POLICY IF EXISTS "Clients view tickets for own events" ON public.tickets;

-- 3. CHIEF COORDINATOR: Can view ALL tickets in the system
CREATE POLICY "Coordinator view all tickets" 
ON public.tickets FOR SELECT TO authenticated 
USING (public.is_chief_coordinator());

-- 4. MANAGER: Can view tickets for events in their assigned category
CREATE POLICY "Managers view tickets for category events" 
ON public.tickets FOR SELECT TO authenticated 
USING (public.can_manager_view_event_data(event_id));

-- 5. SPONSOR: Can view tickets ONLY for the specific events they are sponsoring
CREATE POLICY "Sponsors view tickets for sponsored events" 
ON public.tickets FOR SELECT TO authenticated 
USING (public.is_sponsor_for_event(event_id));

-- 6. CLIENT: Can view tickets ONLY for the events they booked themselves
CREATE POLICY "Clients view tickets for own events" 
ON public.tickets FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = event_id AND client_id = auth.uid()
    )
);

-- --- EVENT MESSAGES (NEW COLLABORATION RULES) ---
CREATE POLICY "Event stakeholders can view messages" ON public.event_messages FOR SELECT TO authenticated USING (  public.is_sponsor_for_event(event_id) OR public.can_manager_view_event_data(event_id) OR public.is_chief_coordinator());
CREATE POLICY "Authorized users can send messages" ON public.event_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND (public.is_sponsor_for_event(event_id) OR public.can_manager_edit_event_data(event_id)));

-- --- MASTER DATA REQUESTS ---
CREATE POLICY "Managers create requests" ON public.master_data_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Managers view own requests" ON public.master_data_requests FOR SELECT TO authenticated USING (auth.uid() = requested_by);
CREATE POLICY "Coordinator manage requests" ON public.master_data_requests FOR ALL TO authenticated USING (is_chief_coordinator());

--LEAVE REQUESTS--
CREATE POLICY "Employees can view own leaves" ON public.leave_requests FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can create leaves" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Managers can view assigned leaves" ON public.leave_requests FOR SELECT TO authenticated USING (manager_id = auth.uid());
CREATE POLICY "Managers can update assigned leaves" ON public.leave_requests FOR UPDATE TO authenticated USING (manager_id = auth.uid());
-- =================================================
-- 7. GRANTS
-- =================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT SELECT ON public.analytics_overview TO authenticated;
GRANT SELECT ON public.analytics_category_performance TO authenticated;
GRANT SELECT ON public.analytics_monthly_trends TO authenticated;
GRANT SELECT ON public.analytics_status_distribution TO authenticated;
GRANT SELECT ON public.view_coordinator_pending_actions TO authenticated;
GRANT SELECT ON public.view_coordinator_urgent_events TO authenticated;
GRANT SELECT ON public.view_coordinator_recent_alerts TO authenticated;