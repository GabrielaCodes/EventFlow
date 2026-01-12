import supabase from '../config/supabaseClient.js';
import { BUSIEST_MONTH_QUERY, MOST_BOOKED_TYPE_QUERY, MOST_SELECTED_THEME_QUERY } from '../utils/analyticsQueries.js';

// Get Dashboard Analytics (Manager)
export const getAnalytics = async (req, res) => {
    try {
        // Simple JS aggregation for academic demo. 
        // In production, use supabase.rpc() or complex joins.
        
        const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact' });
        
        // Fetch raw data for calculation
        const { data: events } = await supabase.from('events').select('event_date, event_type, theme');
        
        // Calculate Busiest Type
        const typeCounts = {};
        events.forEach(e => typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1);
        const topType = Object.keys(typeCounts).length ? Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b) : 'N/A';

        res.json({
            totalEvents,
            mostBookedType: topType,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assign Staff (Manager)
export const assignStaff = async (req, res) => {
    try {
        const { event_id, employee_id } = req.body;
        const { data, error } = await supabase
            .from('assignments')
            .insert([{ event_id, employee_id }])
            .select();
            
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Event Status (Manager)
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

// View Attendance Logs (Manager)
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