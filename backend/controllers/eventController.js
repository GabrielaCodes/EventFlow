import supabase from '../config/supabaseClient.js';

// Create Event (Client)
export const createEvent = async (req, res) => {
  try {
    const { title, description, event_type, theme, event_date } = req.body;
    const { data, error } = await supabase
      .from('events')
      .insert([{
        client_id: req.user.id,
        title,
        description,
        event_type,
        theme,
        event_date
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get My Events (Client)
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

// Get Assigned Events (Employee)
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

// Submit Modification Request (Employee)
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