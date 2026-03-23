import supabase from '../config/supabaseClient.js';
import { sendEmployeeApprovalEmail } from '../services/emailService.js';

// --------------------------------------------------------
// ANALYTICS: Get System Overview
// --------------------------------------------------------
export const getAnalytics = async (req, res) => {
    try {
        // 1. Use existing SQL View for the overview stats
        const { data: overview, error: overviewError } = await supabase
            .from('analytics_overview')
            .select('*')
            .single();
            
        if (overviewError) throw overviewError;

        // 2. Use existing SQL View for category performance to get the top category
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
// 2. MANAGER: Assign Staff to Event
// --------------------------------------------------------

export const assignStaff = async (req, res) => {
    try {
        const { event_id, employee_id, role_description, shift_start, shift_end } = req.body;
        const managerId = req.user.id;
        
        if (!event_id || !employee_id) return res.status(400).json({ error: "Event and Employee IDs are required." });

        // 1. Verify Event Ownership
        const { data: eventCheck, error: eventError } = await supabase
            .from('events')
            .select('assigned_manager_id, event_date')
            .eq('id', event_id)
            .single();

        if (eventError || !eventCheck) return res.status(404).json({ error: "Event not found." });
        if (eventCheck.assigned_manager_id !== managerId) return res.status(403).json({ error: "Access Denied." });

        // 2. RE-ASSIGNMENT LOGIC: Check existing assignment status
        const { data: existingAssignment } = await supabase
            .from('assignments')
            .select('status')
            .eq('event_id', event_id)
            .eq('employee_id', employee_id)
            .maybeSingle();

        if (existingAssignment && existingAssignment.status !== 'rejected') {
            return res.status(400).json({ 
                error: `This employee is already assigned with status: ${existingAssignment.status}. They can only be re-assigned if they rejected the previous assignment.` 
            });
        }

        // 3. LEAVE CHECK
        const workDateStart = shift_start ? shift_start.split('T')[0] : eventCheck.event_date.split('T')[0];
        const workDateEnd = shift_end ? shift_end.split('T')[0] : workDateStart;

        const { data: approvedLeaves } = await supabase
            .from('leave_requests')
            .select('start_date, end_date')
            .eq('employee_id', employee_id)
            .eq('status', 'approved');

        if (approvedLeaves && approvedLeaves.length > 0) {
            const isOverlapping = approvedLeaves.some(leave => {
                const leaveStart = leave.start_date.split('T')[0];
                const leaveEnd = leave.end_date.split('T')[0];
                return workDateStart <= leaveEnd && workDateEnd >= leaveStart;
            });

            if (isOverlapping) {
                return res.status(400).json({ error: "❌ ASSIGNMENT BLOCKED: Employee is on approved leave." });
            }
        }

        // 4. PERFORM UPSERT (Update existing if rejected, otherwise Insert)
        const { data, error } = await supabase
            .from('assignments')
            .upsert({ 
                event_id, 
                employee_id,
                role_description: role_description || "General Staff",
                status: 'pending', // Reset status to pending for new/re-assignment
                shift_start: shift_start || null,
                shift_end: shift_end || null,
                assigned_at: new Date().toISOString() // Track time of assignment
            }, { onConflict: 'event_id, employee_id' })
            .select();
            
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Assignment Error:", err);
        res.status(500).json({ error: err.message });
    }
};
// --------------------------------------------------------
// 3. MANAGER: Update Event Status
// --------------------------------------------------------
export const updateEventStatus = async (req, res) => {
    try {
        const { event_id, status } = req.body;
        const managerId = req.user.id;
        
        // ✅ SECURITY CHECK: Verify Ownership
        const { data: eventCheck, error: checkError } = await supabase
            .from('events')
            .select('assigned_manager_id')
            .eq('id', event_id)
            .single();
            
        if (checkError || !eventCheck) return res.status(404).json({ error: "Event not found." });
        
        if (eventCheck.assigned_manager_id !== managerId) {
            return res.status(403).json({ error: "Access Denied: You are not the assigned manager for this event." });
        }

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
        const managerId = req.user.id; 

        // ✅ SECURITY CHECK: Verify Ownership
        const { data: eventCheck, error: checkError } = await supabase
            .from('events')
            .select('assigned_manager_id')
            .eq('id', event_id)
            .single();
            
        if (checkError || !eventCheck) return res.status(404).json({ error: "Event not found." });
        
        if (eventCheck.assigned_manager_id !== managerId) {
            return res.status(403).json({ error: "Access Denied: You can only modify events assigned specifically to you." });
        }

        // A. Check Availability
        const { data: isAvailable, error: venueCheckError } = await supabase.rpc('check_venue_availability', {
            check_venue_id: proposed_venue_id,
            check_date: proposed_date
        });

        if (venueCheckError) throw venueCheckError;
        
        if (!isAvailable) {
            return res.status(409).json({ error: "Venue is unavailable on this date." });
        }

        // B. Insert the Proposal
        const { data, error } = await supabase
            .from('modification_requests')
            .insert([{
                event_id,
                requested_by: managerId,
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
// 6. MANAGER: Get ALL Assigned Employees
// --------------------------------------------------------
export const getManagedEmployees = async (req, res) => {
    try {
        const managerId = req.user.id;

        const { data: managerProfile, error: mgrError } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', managerId)
            .single();

        if (mgrError || !managerProfile?.category_id) return res.json([]); 

        // FIX: The "leave_requests:" at the very beginning forces Supabase 
        // to use the correct name so your frontend React code can read it.
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id, full_name, email, created_at, verification_status,
                leave_requests:leave_requests!leave_requests_employee_id_fkey (id, start_date, end_date, status)
            `)
            .eq('role', 'employee')
            .eq('category_id', managerProfile.category_id) 
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Team Fetch Error:", err);
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
        const managerId = req.user.id;

        if (!event_id) {
            return res.status(400).json({ error: "Event ID is required." });
        }

        // Ensure event exists, get status and assigned manager
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, status, assigned_manager_id')
            .eq('id', event_id)
            .single();

        if (eventError || !event) {
            return res.status(404).json({ error: "Event not found." });
        }

        // ✅ SECURITY CHECK: Verify Ownership
        if (event.assigned_manager_id !== managerId) {
            return res.status(403).json({ error: "Access Denied: You are not the assigned manager for this event." });
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
            .eq('category_id', managerProfile.category_id); // Direct Match

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};