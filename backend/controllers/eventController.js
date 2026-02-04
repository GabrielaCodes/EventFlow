import supabase from '../config/supabaseClient.js';
import { sendEventConfirmation } from '../services/emailService.js'; 

// --------------------------------------------------------
// 1. CLIENT: Create a New Event 
// --------------------------------------------------------
export const createEvent = async (req, res) => {
    try {
        const { title, description, subtype_id, theme, event_date, venue_id, client_notes } = req.body;
        
        if (!title || !subtype_id || !event_date) {
            return res.status(400).json({ error: "Title, Event Type, and Date are required." });
        }

        const { data, error } = await supabase
            .from('events')
            .insert([{
                client_id: req.user.id,
                title,
                description,
                subtype_id, 
                event_type: 'LEGACY',
                theme,
                event_date,
                venue_id: venue_id || null,
                client_notes: client_notes || "",
                status: 'consideration'
            }])
            .select();

        if (error) throw error;

        // Send Email in Background
        if (req.user && req.user.email) {
            console.log("Attempting to send email to:", req.user.email);
            sendEventConfirmation(req.user.email, {
                title,
                event_date
            });
        }

        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Create Event Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 2. EMPLOYEE: Get Assigned Events
// --------------------------------------------------------
export const getAssignedEvents = async (req, res) => {
    try {
        res.status(200).json({ message: "Get assigned events working" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --------------------------------------------------------
// 3. CLIENT: Get My Events (✅ FIXED REAL LOGIC)
// --------------------------------------------------------
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        // ✅ Query updated to join tables (fetch Names instead of just IDs)
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                event_subtypes ( name ),
                venues ( name, location )
            `)
            .eq('client_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data); 

    } catch (error) {
        console.error("Get My Events Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// --------------------------------------------------------
// 4. SHARED: Get Event Modifications
// --------------------------------------------------------
export const getEventModifications = async (req, res) => {
    try {
        res.status(200).json({ message: "Get event modifications working" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --------------------------------------------------------
// 5. EMPLOYEE: Request Modification
// --------------------------------------------------------
export const requestModification = async (req, res) => {
    try {
        res.status(200).json({ message: "Request modification working" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --------------------------------------------------------
// 6. CLIENT: Respond to Modification
// --------------------------------------------------------
// --------------------------------------------------------
// 6. CLIENT: Respond to Modification (Accepted/Rejected)
// --------------------------------------------------------
export const respondToModification = async (req, res) => {
    try {
        const { modification_id, action } = req.body; // action = 'accept' or 'reject'
        const clientId = req.user.id;

        // 1. Verify Ownership (Security)
        const { data: request, error: fetchError } = await supabase
            .from('modification_requests')
            .select('*, events!inner(client_id)')
            .eq('id', modification_id)
            .single();

        if (fetchError || !request) return res.status(404).json({ error: "Request not found" });
        if (request.events.client_id !== clientId) return res.status(403).json({ error: "Unauthorized" });

        // 2. Handle Rejection
        if (action === 'reject') {
            const { error } = await supabase
                .from('modification_requests')
                .update({ status: 'rejected' })
                .eq('id', modification_id);

            if (error) throw error;
            return res.status(200).json({ message: "Request rejected" });
        }

        // 3. Handle Acceptance (Call the SQL Function)
        if (action === 'accept') {
            // This calls the "apply_modification" function you created in SQL
            // It atomically updates the event AND the request status
            const { error: rpcError } = await supabase.rpc('apply_modification', {
                mod_id: modification_id
            });

            if (rpcError) throw rpcError;
            return res.status(200).json({ message: "Modification accepted and applied!" });
        }

        return res.status(400).json({ error: "Invalid action" });

    } catch (err) {
        console.error("Response Error:", err);
        res.status(500).json({ error: err.message });
    }
};