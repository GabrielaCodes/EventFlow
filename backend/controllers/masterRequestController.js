//for manager to send venue,category,sub category request to Chief Coordinator
import supabase from '../config/supabaseClient.js';

// 1. MANAGER: Create Request
export const createRequest = async (req, res) => {
    try {
        const { type, request_data, request_note } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('master_data_requests')
            .insert([{
                requested_by: userId,
                type,
                request_data,
                request_note
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. MANAGER: View My Requests
export const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('master_data_requests')
            .select('*')
            .eq('requested_by', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Fetch Requests (Supports 'pending' or 'history')
export const getCoordinatorRequests = async (req, res) => {
    try {
        const { view } = req.query; // 'pending' or 'history'

        let query = supabase
            .from('master_data_requests')
            .select(`
                *,
                profiles:requested_by ( full_name, role )
            `)
            .order('created_at', { ascending: view === 'pending' }); // Oldest first for pending, Newest for history

        if (view === 'history') {
            // Fetch Approved OR Rejected
            query = query.in('status', ['approved', 'rejected']);
        } else {
            // Default: Fetch Pending
            query = query.eq('status', 'pending');
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. COORDINATOR: Process (Approve/Reject)
export const processRequest = async (req, res) => {
    try {
        const { id, action, rejection_reason } = req.body; 
        
        // Fetch request first
        const { data: request, error: fetchError } = await supabase
            .from('master_data_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !request) return res.status(404).json({ error: "Request not found" });

        // IF APPROVED: Insert into the REAL table
        if (action === 'approve') {
            const payload = request.request_data;
            let insertTable = '';

            if (request.type === 'venue') insertTable = 'venues';
            else if (request.type === 'category') insertTable = 'event_categories';
            else if (request.type === 'subtype') insertTable = 'event_subtypes';

            const { error: insertError } = await supabase
                .from(insertTable)
                .insert([payload]);

            if (insertError) throw insertError;
        }

        // Update Request Status
        const { data: updated, error: updateError } = await supabase
            .from('master_data_requests')
            .update({ 
                status: action === 'approve' ? 'approved' : 'rejected',
                rejection_reason: action === 'reject' ? rejection_reason : null,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;
        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};