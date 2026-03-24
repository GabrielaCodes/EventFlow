import supabase from '../config/supabaseClient.js';

/* =======================
   1. USER MANAGEMENT
   ======================= */
export const getPendingUsers = async (req, res) => {
    try {
        const { status } = req.query; 

        // 1. Apply base selection and filters FIRST
        let query = supabase
            .from('profiles')
            .select('*')
            .in('role', ['manager', 'sponsor']); 

        // 2. Apply dynamic conditional filters NEXT
        if (status && status !== 'all') {
            query = query.eq('verification_status', status);
        }

        // 3. Apply modifiers (order, limit) LAST
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { userId, action } = req.body; 
        const status = action === 'approve' ? 'verified' : 'rejected';
        const { data, error } = await supabase
            .from('profiles')
            .update({ verification_status: status })
            .eq('id', userId)
            .select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = supabase.from('profiles').select('*');
        if (role) query = query.eq('role', role);
        
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/* =======================
   2. CATEGORIES
   ======================= */
export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase.from('event_categories').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const { data, error } = await supabase.from('event_categories').insert([{ name }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('event_categories').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/* =======================
   3. SUBTYPES 
   ======================= */
export const getSubtypes = async (req, res) => {
    try {
        const { data, error } = await supabase.from('event_subtypes').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createSubtype = async (req, res) => {
    try {
        const { name, category_id } = req.body;
        const { data, error } = await supabase.from('event_subtypes').insert([{ name, category_id }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteSubtype = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('event_subtypes').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/* =======================
   4. VENUES
   ======================= */
export const getVenues = async (req, res) => {
    try {
        const { data, error } = await supabase.from('venues').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createVenue = async (req, res) => {
    try {
        const { name, location, capacity } = req.body;
        const { data, error } = await supabase.from('venues').insert([{ name, location, capacity }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('venues').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

//Cheif Coordinator can view all events and manager assigned
/* =======================
   5. MANAGER WORKLOADS & EVENTS
   ======================= */

export const getAllEventsByManager = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select(`
                id,
                title,
                status,
                event_date,
                assigned_manager_id,
                client:profiles!client_id(full_name),
                manager:profiles!assigned_manager_id(id, full_name, created_at),
                venue:venues(name),
                sponsorships(
                    amount,
                    status,
                    sponsor:profiles!sponsor_id(full_name)
                ),
                subtype:event_subtypes(
                    name,
                    category:event_categories(name)
                ),
                assignments(id) /* <-- ADDED THIS LINE TO FIX STAFF COUNT */
            `)
            // THIS IS THE NEW LINE: Only fetch "live" events
            .in('status', ['consideration', 'in_progress']) 
            .order('event_date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("Error fetching manager workloads:", err);
        res.status(500).json({ error: err.message });
    }
};

/* =======================
   6. EVENT STAFF ASSIGNMENTS
   ======================= */
export const getEventStaff = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { data, error } = await supabase
            .from('assignments')
            .select(`
                id,
                role_description, 
                status,
                employee:profiles(id, full_name, email) 
            `)
            .eq('event_id', eventId);

        if (error) throw error;
        
        res.json(data);
    } catch (err) {
        console.error("Error fetching event staff:", err);
        res.status(500).json({ error: err.message });
    }
};