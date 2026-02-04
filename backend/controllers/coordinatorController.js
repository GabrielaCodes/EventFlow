import supabase from '../config/supabaseClient.js';

/* =======================
   1. USER MANAGEMENT
   ======================= */
// ✅ UPDATED: Fetch Managers/Sponsors with optional status filter
export const getPendingUsers = async (req, res) => {
    try {
        const { status } = req.query; // Get status from URL (pending, verified, rejected)

        let query = supabase
            .from('profiles')
            .select('*')
            .in('role', ['manager', 'sponsor']) // Only fetch approvable roles
            .order('created_at', { ascending: false });

        // If a specific status is requested, filter by it. Otherwise return all.
        if (status && status !== 'all') {
            query = query.eq('verification_status', status);
        }

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
   3. SUBTYPES (This is what you were missing)
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