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

        // Query the database for events owned by this user
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('client_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Return the ARRAY of events
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
export const respondToModification = async (req, res) => {
    try {
        res.status(200).json({ message: "Respond to modification working" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};