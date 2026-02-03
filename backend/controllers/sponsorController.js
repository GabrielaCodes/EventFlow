import supabase from '../config/supabaseClient.js'; // ⚠️ Ensure file is named exactly 'supabaseClient.js' (lowercase s)

/* ============================================================
   1. MANAGER: List Available Sponsors
============================================================ */
export const getSponsorsList = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, company_name')
            .eq('role', 'sponsor');

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
        console.log("📝 Incoming Request Body:", req.body); // ✅ Debug Log

        const { event_id, sponsor_id, amount, request_note, sponsorship_id, status } = req.body;

        // 1. Force Amount to Number
        const safeAmount = parseFloat(amount);
        if (isNaN(safeAmount)) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        // CASE A: UPDATE (Manager Counter-Offer / Accept)
        if (sponsorship_id) {
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
            // Validation for new requests
            if (!event_id || !sponsor_id) {
                return res.status(400).json({ error: "Event and Sponsor are required." });
            }

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
                console.error("❌ DB Insert Error:", error);
                if (error.code === '23505') return res.status(409).json({ error: "Request already exists." });
                throw error;
            }
            res.status(201).json(data[0]);
        }
    } catch (err) {
        console.error("🔥 System Error in sendSponsorshipRequest:", err);
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
                id,
                amount,
                status,
                request_note,
                sponsor_note,
                created_at,
                events (
                    id, title, event_date, description, venues (name, location)
                )
            `)
            .eq('sponsor_id', sponsorId)
            // ✅ CHANGED: Removed .in(...) filter to show ALL statuses (Accepted, Rejected, Pending)
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
============================================================ */
export const getManagerRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, sponsor_note, created_at,
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