import supabase from '../config/supabaseClient.js';
import { sendEmployeeApprovalEmail } from '../services/emailService.js';

// --------------------------------------------------------
// 6. MANAGER: Get ALL Assigned Employees (Pending, Verified, Rejected)
// --------------------------------------------------------
export const getManagedEmployees = async (req, res) => {
    try {
        const managerId = req.user.id;

        // Fetch ALL profiles assigned to this manager
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at, verification_status')
            .eq('assigned_manager_id', managerId)
            .eq('role', 'employee')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
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
// 7. MANAGER: Approve Event (Accept As-Is)
// --------------------------------------------------------
export const approveEvent = async (req, res) => {
    try {
        const { event_id } = req.body;

        if (!event_id) {
            return res.status(400).json({ error: "Event ID is required." });
        }

        // 1. Ensure event exists and is in consideration
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, status')
            .eq('id', event_id)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ error: "Event not found." });
        }

        if (event.status !== 'consideration') {
            return res.status(400).json({
                error: "Only events in consideration can be approved."
            });
        }

        // 2. Block approval if a modification is pending
        const { data: pendingReqs, error: pendingError } = await supabase
            .from('modification_requests')
            .select('id')
            .eq('event_id', event_id)
            .eq('status', 'pending');

        if (pendingError) throw pendingError;

        if (pendingReqs.length > 0) {
            return res.status(400).json({
                error: "Cannot approve event while a modification request is pending."
            });
        }

        // 3. Approve event
        const { data, error } = await supabase
            .from('events')
            .update({ status: 'in_progress' })
            .eq('id', event_id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: "Event approved and moved to In Progress",
            event: data
        });

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

// --------------------------------------------------------
// 6. MANAGER: Get Pending Employee Verifications
// --------------------------------------------------------
export const getPendingEmployees = async (req, res) => {
    try {
        const managerId = req.user.id;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at')
            .eq('assigned_manager_id', managerId)
            .eq('verification_status', 'pending');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 7. MANAGER: Verify/Reject Employee
// --------------------------------------------------------
export const verifyEmployee = async (req, res) => {
    try {
        const { employee_id, action } = req.body; 
        const managerId = req.user.id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const newStatus = action === 'approve' ? 'verified' : 'rejected';

        // Update status in DB
        const { data, error } = await supabase
            .from('profiles')
            .update({ verification_status: newStatus })
            .eq('id', employee_id)
            .eq('assigned_manager_id', managerId)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Employee not found or not assigned to you." });

        // ✅ SEND EMAIL IF APPROVED
        if (action === 'approve') {
            // We don't await this because we don't want to slow down the HTTP response
            // The email will send in the background
            sendEmployeeApprovalEmail(data.email, data.full_name);
        }

        res.json({ 
            message: `Employee has been ${newStatus}`, 
            employee: data 
        });

    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ error: err.message });
    }
};