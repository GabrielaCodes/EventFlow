import supabase from '../config/supabaseClient.js';
import { sendEmployeeApprovalEmail } from '../services/emailService.js';

// --------------------------------------------------------
// ANALYTICS: Get System Overview
// --------------------------------------------------------
export const getAnalytics = async (req, res) => {
    try {
        // 1. Use your existing SQL View for the overview stats!
        const { data: overview, error: overviewError } = await supabase
            .from('analytics_overview')
            .select('*')
            .single();
            
        if (overviewError) throw overviewError;

        // 2. Use your existing SQL View for category performance to get the top category
        const { data: performance, error: perfError } = await supabase
            .from('analytics_category_performance')
            .select('*')
            .limit(1);

        if (perfError) throw perfError;

        const topType = performance && performance.length > 0 ? performance[0].category_name : 'N/A';

        // 3. Send it back to the React frontend
        res.json({
            totalEvents: overview.total_events || 0,
            pendingApprovals: overview.pending_approvals || 0,
            activeVenues: overview.active_venues || 0,
            totalSponsorship: overview.total_sponsorship_amount || 0,
            mostBookedType: topType
        });
        
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 2. MANAGER: Assign Staff to Event (SECURED)
// --------------------------------------------------------
export const assignStaff = async (req, res) => {
    try {
        const { event_id, employee_id, role_description } = req.body;
        const managerId = req.user.id;
        
        // Validation
        if (!event_id || !employee_id) {
            return res.status(400).json({ error: "Event and Employee IDs are required." });
        }

        // ✅ SECURITY CHECK: Ensure manager actually owns the event
        const { data: eventCheck, error: eventError } = await supabase
            .from('events')
            .select('assigned_manager_id')
            .eq('id', event_id)
            .single();

        if (eventError || !eventCheck) {
            return res.status(404).json({ error: "Event not found." });
        }

        if (eventCheck.assigned_manager_id !== managerId) {
            return res.status(403).json({ 
                error: "Access Denied: You can only assign staff to events explicitly assigned to your workload." 
            });
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
// 5. MANAGER: Propose Modification 
// --------------------------------------------------------
export const createModificationRequest = async (req, res) => {
    try {
        const { event_id, proposed_venue_id, proposed_date, request_details } = req.body;
        const manager_id = req.user.id; 

        // A. Check Availability
        const { data: isAvailable, error: checkError } = await supabase.rpc('check_venue_availability', {
            check_venue_id: proposed_venue_id,
            check_date: proposed_date
        });

        if (checkError) throw checkError;
        
        if (!isAvailable) {
            return res.status(409).json({ error: "Venue is unavailable on this date." });
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
// 6. MANAGER: Get ALL Assigned Employees (BULLETPROOF SHARED POOL)
// --------------------------------------------------------
export const getManagedEmployees = async (req, res) => {
    try {
        const managerId = req.user.id;

        // 1. Get the manager's department category
        const { data: managerProfile, error: mgrError } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', managerId)
            .single();

        if (mgrError || !managerProfile?.category_id) {
            return res.json([]); // Manager has no category
        }

        // 2. Fetch ALL employees sharing that EXACT category
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at, verification_status')
            .eq('role', 'employee')
            .eq('category_id', managerProfile.category_id) // ✅ Direct Match
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --------------------------------------------------------
// 7. MANAGER: Verify/Reject Employee (BULLETPROOF)
// --------------------------------------------------------
export const verifyEmployee = async (req, res) => {
    try {
        const { employee_id, action } = req.body; 
        const managerId = req.user.id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const newStatus = action === 'approve' ? 'verified' : 'rejected';

        // 1. Get Manager's Category
        const { data: managerProfile } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', managerId)
            .single();

        // 2. Get Employee's Category
        const { data: empCheck } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', employee_id)
            .single();

        // 3. Ensure they are in the same department
        if (!empCheck || empCheck.category_id !== managerProfile.category_id) {
            return res.status(403).json({ error: "Access Denied: This employee does not belong to your department." });
        }

        // 4. Update status
        const { data, error } = await supabase
            .from('profiles')
            .update({ verification_status: newStatus })
            .eq('id', employee_id)
            .select()
            .single();

        if (error) throw error;

        // SEND EMAIL IF APPROVED
        if (action === 'approve') {
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
// --------------------------------------------------------
// 8. MANAGER: Approve Event (Accept As-Is)
// --------------------------------------------------------
export const approveEvent = async (req, res) => {
    try {
        const { event_id } = req.body;

        if (!event_id) {
            return res.status(400).json({ error: "Event ID is required." });
        }

        // Ensure event exists and is in consideration
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

        // Block approval if a modification is pending
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

        // Approve event
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
// 9. MANAGER: Get Pending Employee Verifications
// --------------------------------------------------------
export const getPendingEmployees = async (req, res) => {
    try {
        const managerId = req.user.id;

        const { data: managerProfile } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', managerId)
            .single();

        if (!managerProfile?.category_id) return res.json([]);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at')
            .eq('role', 'employee')
            .eq('verification_status', 'pending')
            .eq('category_id', managerProfile.category_id); // ✅ Direct Match

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};