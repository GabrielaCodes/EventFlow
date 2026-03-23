import supabase from '../config/supabaseClient.js';

// --- EMPLOYEE: Submit Leave Request ---
export const requestLeave = async (req, res) => {
    try {
        const { start_date, end_date, reason } = req.body;
        const employeeId = req.user.id;

        const { data: emp, error: empErr } = await supabase
            .from('profiles')
            .select('category_id')
            .eq('id', employeeId)
            .single();

        if (empErr || !emp.category_id) return res.status(400).json({ error: "Employee category missing." });

        const { data: managers, error: mgrErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'manager')
            .eq('category_id', emp.category_id)
            .order('created_at', { ascending: true }) 
            .limit(1);

        if (mgrErr || managers.length === 0) {
            return res.status(400).json({ error: "No manager found in your department to approve this." });
        }

        const { data, error } = await supabase
            .from('leave_requests')
            .insert([{
                employee_id: employeeId,
                manager_id: managers[0].id,
                start_date,
                end_date,
                reason
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- MANAGER: Get Assigned Leave Requests ---
export const getLeaveRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leave_requests')
            .select(`*, profiles!employee_id(full_name, email)`)
            .eq('manager_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- MANAGER: Approve/Reject Leave (Updated with Denial Reason) ---
export const respondToLeave = async (req, res) => {
    try {
        const { request_id, status, denial_reason } = req.body; // Status: 'approved' or 'rejected'
        
        const updateData = { status };
        if (status === 'rejected' && denial_reason) {
            updateData.denial_reason = denial_reason;
        }

        const { data, error } = await supabase
            .from('leave_requests')
            .update(updateData)
            .eq('id', request_id)
            .eq('manager_id', req.user.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};