import supabase from '../config/supabaseClient.js';

/* ============================================================
   1. MANAGER: List Available Sponsors
   (Global list is fine, as sponsors work across categories)
============================================================ */
export const getSponsorsList = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, company_name')
            .eq('role', 'sponsor')
            .eq('verification_status', 'verified'); // ✅ Added strict check

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("❌ List Sponsors Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/* ============================================================
   2. MANAGER: Send OR Counter Sponsorship Request
============================================================ */
export const sendSponsorshipRequest = async (req, res) => {
    try {
        const { event_id, sponsor_id, amount, request_note, sponsorship_id, status } = req.body;
        const userId = req.user.id; // Manager's ID

        // 1. Force Amount to Number
        const safeAmount = parseFloat(amount);
        if (isNaN(safeAmount)) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        // CASE A: UPDATE (Manager Counter-Offer / Accept)
        if (sponsorship_id) {
            // Note: RLS policies usually handle ownership checks here, 
            // but we update logic to ensure 'pending' status on counters
            const updatePayload = {
                amount: safeAmount,
                request_note, 
                status: status || 'pending', 
                updated_at: new Date()
            };

            const { data, error } = await supabase
                .from('sponsorships')
                .update(updatePayload)
                .eq('id', sponsorship_id)
                .select();
            
            if (error) throw error;
            return res.status(200).json(data[0]);
        } 
        
        // CASE B: CREATE NEW REQUEST
        else {
            if (!event_id || !sponsor_id) {
                return res.status(400).json({ error: "Event and Sponsor are required." });
            }

            // 🛑 SECURITY CHECK: Does Manager own this Event's Category?
            // 1. Get Event's Category
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('subtype_id, event_subtypes!inner(category_id)')
                .eq('id', event_id)
                .single();

            if (eventError || !eventData) return res.status(404).json({ error: "Event not found" });

            const categoryId = eventData.event_subtypes.category_id;

            // 2. Check Assignment
            const { data: hasAccess, error: accessError } = await supabase
                .from('manager_category_assignments')
                .select('id')
                .eq('manager_id', userId)
                .eq('category_id', categoryId)
                .maybeSingle();

            if (!hasAccess) {
                return res.status(403).json({ error: "⛔ You are not assigned to this event's category." });
            }

            // ✅ Proceed with Insert
            const { data, error } = await supabase
                .from('sponsorships')
                .insert([{
                    event_id,
                    sponsor_id,
                    amount: safeAmount,
                    request_note: request_note || '',
                    status: 'pending'
                }])
                .select();

            if (error) {
                if (error.code === '23505') return res.status(409).json({ error: "Request already exists." });
                throw error;
            }
            res.status(201).json(data[0]);
        }
    } catch (err) {
        console.error("🔥 Error in sendSponsorshipRequest:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/* ============================================================
   3. SPONSOR: View Incoming Requests
============================================================ */
export const getSponsorRequests = async (req, res) => {
    try {
        const sponsorId = req.user.id;

        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, sponsor_note, created_at,
                events (
                    id, title, event_date, description, venues (name, location)
                )
            `)
            .eq('sponsor_id', sponsorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ============================================================
   4. SPONSOR: Respond (Accept / Reject / Negotiate)
============================================================ */
export const respondToSponsorship = async (req, res) => {
    try {
        const { sponsorship_id, action, amount, sponsor_note } = req.body;
        const sponsorId = req.user.id;

        const updateData = { status: action, updated_at: new Date() };

        if (action === 'negotiating') {
            if (amount !== undefined) updateData.amount = amount;
            updateData.sponsor_note = sponsor_note || '';
        }

        const { data, error } = await supabase
            .from('sponsorships')
            .update(updateData)
            .eq('id', sponsorship_id)
            .eq('sponsor_id', sponsorId)
            .select();

        if (error) throw error;
        res.json({ message: `Request ${action}`, data: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ============================================================
   5. MANAGER: View Sent Requests (History)
   ✅ FIXED: Only shows requests for Manager's Assigned Category
============================================================ */
export const getManagerRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Manager's Assigned Categories
        const { data: assignments, error: assignError } = await supabase
            .from('manager_category_assignments')
            .select('category_id')
            .eq('manager_id', userId);

        if (assignError) throw assignError;
        
        // Extract IDs (e.g. ['uuid-1', 'uuid-2'])
        const categoryIds = assignments.map(a => a.category_id);

        if (categoryIds.length === 0) {
            return res.json([]); // No category assigned, sees nothing
        }

        // 2. Fetch Sponsorships filtered by Event -> Subtype -> Category
        // using !inner to enforce the filter on the joined table
        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, sponsor_note, created_at,
                events!inner (
                    title, 
                    event_date,
                    event_subtypes!inner ( category_id ) 
                ),
                profiles!sponsorships_sponsor_id_fkey (
                    full_name, 
                    company_name, 
                    email
                )
            `)
            .in('events.event_subtypes.category_id', categoryIds) // 👈 THE FILTER
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching manager history:", err.message);
        res.status(500).json({ error: err.message });
    }
};