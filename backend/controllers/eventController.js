import supabase from '../config/supabaseClient.js';

// --------------------------------------------------------
// 1. CLIENT: Create a New Event 
// --------------------------------------------------------
export const createEvent = async (req, res) => {
    try {
        // ✅ CHANGED: Accept subtype_id instead of event_type
        const { title, description, subtype_id, theme, event_date, venue_id, client_notes } = req.body;
        
        // Validation
        if (!title || !subtype_id || !event_date) {
            return res.status(400).json({ error: "Title, Event Type, and Date are required." });
        }

        const { data, error } = await supabase
            .from('events')
            .insert([{
                client_id: req.user.id,
                title,
                description,
                // We rely on the DB Relation now. 
                // We store subtype_id. The old 'event_type' column can be ignored or filled with a placeholder.
                subtype_id, 
                event_type: 'LEGACY', // Keeping this to satisfy NOT NULL constraint on old column if you didn't remove it
                theme,
                event_date,
                venue_id: venue_id || null,
                client_notes: client_notes || "",
                status: 'consideration'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 2. CLIENT: Get My Events
// --------------------------------------------------------
export const getMyEvents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('client_id', req.user.id);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 3. EMPLOYEE: Get Assigned Events
// --------------------------------------------------------
export const getAssignedEvents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assignments')
            .select(`
                event_id,
                events:event_id (
                    id, title, event_date, status, venue_id
                )
            `)
            .eq('employee_id', req.user.id);

        if (error) throw error;
        
        // Flatten structure
        const events = data.map(item => item.events);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 4. EMPLOYEE: Request Modification (Legacy support)
// --------------------------------------------------------
export const requestModification = async (req, res) => {
    try {
        const { event_id, request_details } = req.body;
        const { data, error } = await supabase
            .from('modification_requests')
            .insert([{
                event_id,
                requested_by: req.user.id,
                request_details
            }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 5. SHARED: Get Pending Modifications (For Frontend Display)
// --------------------------------------------------------
export const getEventModifications = async (req, res) => {
    try {
        const { event_id } = req.params;
        const { data, error } = await supabase
            .from('modification_requests')
            .select(`
                *,
                venues:proposed_venue_id (name),
                profiles:requested_by (full_name)
            `)
            .eq('event_id', event_id)
            .eq('status', 'pending');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 6. CLIENT: Respond to Modification (Accept/Reject)
// --------------------------------------------------------
export const respondToModification = async (req, res) => {
    try {
        const { modification_id, action } = req.body; // 'accept' or 'reject'
        
        // A. Reject Logic
        if (action === 'reject') {
            const { error } = await supabase
                .from('modification_requests')
                .update({ status: 'rejected' })
                .eq('id', modification_id);
            if (error) throw error;
            return res.json({ message: "Request rejected." });
        }

        // B. Accept Logic (Database Atomic Function)
        if (action === 'accept') {
            const { error } = await supabase.rpc('apply_modification', {
                mod_id: modification_id
            });

            if (error) throw error;
            return res.json({ message: "Modification accepted. Event updated." });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};