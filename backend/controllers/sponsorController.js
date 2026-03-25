import supabase from '../config/supabaseClient.js';

/* ============================================================
   1. MANAGER: List Available Sponsors
============================================================ */
export const getSponsorsList = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, company_name')
            .eq('role', 'sponsor')
            .eq('verification_status', 'verified'); 

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
        const userId = req.user.id; 

        const safeAmount = parseFloat(amount);
        if (isNaN(safeAmount)) return res.status(400).json({ error: "Invalid amount" });

        // --- HARD SECURITY ENFORCEMENT ---
        let targetEventId = event_id;
        if (sponsorship_id && !targetEventId) {
            const { data: existingSponsor } = await supabase.from('sponsorships').select('event_id').eq('id', sponsorship_id).single();
            targetEventId = existingSponsor?.event_id;
        }

        if (!targetEventId) return res.status(400).json({ error: "Event ID is required." });

        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('assigned_manager_id, finance_status')
            .eq('id', targetEventId)
            .single();

        if (eventError || !eventData) return res.status(404).json({ error: "Event not found." });

        // RULE 1: Manager MUST be assigned to this specific event
        if (eventData.assigned_manager_id !== userId) {
            return res.status(403).json({ error: "⛔ Unauthorized: You can only manage sponsorships for events assigned to you." });
        }

        
        // CASE A: UPDATE (Counter offer)
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

            // 👇 THE FIX: If the plan was rejected, countering a sponsor makes it a Draft again
            if (eventData.finance_status === 'rejected') {
                await supabase.from('events').update({ finance_status: 'draft' }).eq('id', targetEventId);
            }

            return res.status(200).json(data[0]);
        } 
        
        // CASE B: CREATE NEW DRAFT REQUEST
        else {
            if (!event_id || !sponsor_id) return res.status(400).json({ error: "Event and Sponsor are required." });

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
                if (error.code === '23505') return res.status(409).json({ error: "This sponsor is already on the plan for this event." });
                throw error;
            }

            // 👇 THE FIX: Adding a brand new sponsor alters the budget, so reset the event to Draft
            if (eventData.finance_status === 'rejected' || eventData.finance_status === 'approved') {
                await supabase.from('events').update({ finance_status: 'draft' }).eq('id', targetEventId);
            }

            res.status(201).json(data[0]);
        }
    } catch (err) {
        console.error("Error in sendSponsorshipRequest:", err.message);
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
                events!inner (
                    id, title, event_date, description, finance_status, 
                    venues (name, location),
                    client:profiles!events_client_id_fkey (full_name, company_name)
                )
            `)
            .eq('sponsor_id', sponsorId)
            .eq('events.finance_status', 'approved') 
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
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                id, amount, status, request_note, sponsor_note, created_at,
                events!inner (
                    title, event_date, finance_status, 
                    client:profiles!events_client_id_fkey (full_name, email)
                ),
                profiles!sponsorships_sponsor_id_fkey (
                    full_name, company_name, email
                )
            `)
            .eq('events.assigned_manager_id', userId) 
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("❌ Error fetching manager history:", err.message);
        res.status(500).json({ error: err.message });
    }
};