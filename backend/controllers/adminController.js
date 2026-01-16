import supabase from '../config/supabaseClient.js';

// --------------------------------------------------------
// 1. MANAGER: Get Dashboard Analytics
// --------------------------------------------------------
export const getAnalytics = async (req, res) => {
    try {
        const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact' });
        
        // Fetch raw data for calculation (Basic aggregation)
        const { data: events } = await supabase.from('events').select('event_type');
        
        // Calculate Busiest Type
        const typeCounts = {};
        if (events) {
            events.forEach(e => typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1);
        }
        const topType = Object.keys(typeCounts).length ? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b) : 'N/A';

        res.json({
            totalEvents: totalEvents || 0,
            mostBookedType: topType,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 2. MANAGER: Assign Staff to Event
// --------------------------------------------------------
export const assignStaff = async (req, res) => {
    try {
        const { event_id, employee_id, role_description } = req.body;
        
        // Validation
        if (!event_id || !employee_id) {
            return res.status(400).json({ error: "Event and Employee IDs are required." });
        }

        const { data, error } = await supabase
            .from('assignments')
            .insert([{ 
                event_id, 
                employee_id,
                role_description: role_description || "General Staff"
            }])
            .select();
            
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 3. MANAGER: Update Event Status (e.g. Cancelled/Completed)
// --------------------------------------------------------
export const updateEventStatus = async (req, res) => {
    try {
        const { event_id, status } = req.body;
        
        const { data, error } = await supabase
            .from('events')
            .update({ status })
            .eq('id', event_id)
            .select();
            
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 4. MANAGER: View Attendance Logs
// --------------------------------------------------------
export const getAttendanceLogs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                profiles:employee_id (full_name),
                events:event_id (title)
            `);
        
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 5. MANAGER: Propose Modification (The New Feature)
// --------------------------------------------------------
export const createModificationRequest = async (req, res) => {
    try {
        const { event_id, proposed_venue_id, proposed_date, request_details } = req.body;
        const manager_id = req.user.id; 

        // A. Check Availability (Database Logic)
        const { data: isAvailable, error: checkError } = await supabase.rpc('check_venue_availability', {
            check_venue_id: proposed_venue_id,
            check_date: proposed_date
        });

        if (checkError) throw checkError;
        
        // If false, it means the venue is booked OR has a pending request
        if (!isAvailable) {
            return res.status(409).json({ error: "Venue is unavailable on this date (Booked or Pending Proposal)." });
        }

        // B. Insert the Proposal
        const { data, error } = await supabase
            .from('modification_requests')
            .insert([{
                event_id,
                requested_by: manager_id,
                proposed_venue_id,
                proposed_date,
                request_details: request_details || "Manager requested venue/date change",
                status: 'pending'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};