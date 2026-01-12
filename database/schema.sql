-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS for fixed statuses
CREATE TYPE user_role AS ENUM ('client', 'employee', 'manager', 'sponsor');
CREATE TYPE event_status AS ENUM ('consideration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE sponsorship_status AS ENUM ('pending', 'accepted', 'rejected', 'paid');

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VENUES
CREATE TABLE public.venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    location TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

-- 3. EVENTS
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- e.g., Wedding, Corporate, Concert
    theme TEXT,               -- e.g., Vintage, Tech, Formal
    event_date DATE NOT NULL,
    status event_status DEFAULT 'consideration',
    venue_id UUID REFERENCES public.venues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STAFF ASSIGNMENTS (Employees assigned to events)
CREATE TABLE public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, employee_id)
);

-- 5. ATTENDANCE LOGS (Employee attendance)
CREATE TABLE public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    employee_id UUID REFERENCES public.profiles(id),
    check_in TIMESTAMP DEFAULT NOW(),
    check_out TIMESTAMP
);

-- 6. TERMS & CONDITIONS (Issued by Managers)
CREATE TABLE public.terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id), -- Manager ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. EVENT MODIFICATION REQUESTS (From Employees)
CREATE TABLE public.modification_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    requested_by UUID REFERENCES public.profiles(id),
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. SPONSORSHIPS
CREATE TABLE public.sponsorships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    sponsor_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10, 2),
    status sponsorship_status DEFAULT 'pending',
    request_note TEXT, -- Note from Manager
    payment_reference TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. TICKETS
CREATE TABLE public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id),
    type_name TEXT NOT NULL, -- e.g., VIP, General
    price DECIMAL(10, 2) NOT NULL,
    quantity_available INT NOT NULL,
    quantity_sold INT DEFAULT 0
);

-- TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ANALYTICS VIEWS (For Managers)
CREATE VIEW analytics_monthly_activity AS
    SELECT TO_CHAR(event_date, 'Month') AS month, COUNT(*) as event_count
    FROM public.events
    GROUP BY month
    ORDER BY event_count DESC;

CREATE VIEW analytics_popular_types AS
    SELECT event_type, COUNT(*) as count
    FROM public.events
    GROUP BY event_type
    ORDER BY count DESC;