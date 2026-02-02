import supabase from '../config/supabaseClient.js';

// ------------------------------------------------------------------
// 1. MANAGER: List Available Sponsors
// ------------------------------------------------------------------
export const getSponsorsList = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, company_name')
            .eq('role', 'sponsor');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ------------------------------------------------------------------
// 2. MANAGER: Send Sponsorship Request
// ------------------------------------------------------------------
export const sendSponsorshipRequest = async (req, res) => {
    try {
        const { event_id, sponsor_id, amount, request_note } = req.body;

        // Constraint check is handled by DB (Unique Index), but good to catch error
        const { data, error } = await supabase
            .from('sponsorships')
            .insert([{
                event_id,
                sponsor_id,
                amount: amount || 0,
                request_note: request_note || '',
                status: 'pending'
            }])
            .select();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(409).json({ error: "Request already sent to this sponsor for this event." });
            }
            throw error;
        }
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ------------------------------------------------------------------
// 3. SPONSOR: View Incoming Requests
// ------------------------------------------------------------------
export const getSponsorRequests = async (req, res) => {
    try {
        const sponsorId = req.user.id;

        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, created_at,
                events (
                    id, title, event_date, description,
                    venues (name, location)
                )
            `)
            .eq('sponsor_id', sponsorId)
            .eq('status', 'pending') // Only show pending by default? Or remove to show all.
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ------------------------------------------------------------------
// 4. SPONSOR: Respond (Accept/Reject)
// ------------------------------------------------------------------
export const respondToSponsorship = async (req, res) => {
    try {
        const { sponsorship_id, action } = req.body; // 'accepted' or 'rejected'
        const sponsorId = req.user.id;

        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const { data, error } = await supabase
            .from('sponsorships')
            .update({ status: action, updated_at: new Date() })
            .eq('id', sponsorship_id)
            .eq('sponsor_id', sponsorId) // Security: ensure ownership
            .select();

        if (error) throw error;
        res.json({ message: `Request ${action}`, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ------------------------------------------------------------------
// 5. MANAGER: View Sent Requests (History)
// ------------------------------------------------------------------
export const getManagerRequests = async (req, res) => {
    try {
        // Fetch sponsorships. 
        // RLS Policy "Managers view category sponsorships" automatically restricts 
        // this to events managed by the current user.
        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, created_at,
                events (title, event_date),
                profiles:sponsor_id (full_name, company_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};