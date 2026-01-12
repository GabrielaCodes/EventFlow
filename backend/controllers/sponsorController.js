import supabase from '../config/supabaseClient.js';

export const getSponsorshipRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sponsorships')
            .select(`
                *,
                events:event_id (title, description, event_date)
            `)
            .eq('sponsor_id', req.user.id)
            .eq('status', 'pending');
            
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const respondToRequest = async (req, res) => {
    try {
        const { sponsorship_id, action } = req.body; // 'accepted' or 'rejected'
        
        const { data, error } = await supabase
            .from('sponsorships')
            .update({ status: action })
            .eq('id', sponsorship_id)
            .eq('sponsor_id', req.user.id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};