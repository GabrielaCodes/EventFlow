import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; // ✅ Import Supabase for referencing venues
import { useAuth } from '../../context/AuthContext';

const ClientDashboard = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState([]);
    const [venues, setVenues] = useState([]); // ✅ Store venues here

    const [formData, setFormData] = useState({
        title: '',
        event_type: '',
        event_date: '',
        venue_id: '', // ✅ New Field
        theme: ''
    });

    useEffect(() => {
        if (!loading && user?.id) {
            fetchData();
        }
    }, [loading, user]);

    const fetchData = async () => {
        try {
            console.log("--- DEBUG START ---");
            
            // 1. Check if Supabase client is initialized
            console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "Exists" : "MISSING!");

            // 2. Try to fetch venues
            const { data: venueData, error: venueError } = await supabase
                .from('venues')
                .select('*');
            
            console.log("Venue Data:", venueData);
            console.log("Venue Error:", venueError);

            if (venueData) setVenues(venueData);

            // 3. Fetch Events
            const { data: eventData } = await api.get('/events/my-events')
            setEvents(eventData || []);
            
            console.log("--- DEBUG END ---");

        } catch (err) {
            console.error('client dashboard CRITICAL ERROR:', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            alert('You must be logged in to book an event.');
            return;
        }

        // ✅ Validation: Ensure venue is picked
        if (!formData.venue_id) {
            alert("Please select a venue for your event.");
            return;
        }

        try {
            const payload = {
                ...formData,
                client_id: user.id,
                status: 'consideration'
            };

            await api.post('/events', payload);

            alert('Event Created Successfully!');
            fetchData(); // Refresh list

            setFormData({
                title: '',
                event_type: '',
                event_date: '',
                venue_id: '', // Reset venue
                theme: ''
            });
        } catch (err) {
            console.error('Creation Error:', err);
            alert('Error creating event. Check console for details.');
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-600">Loading dashboard...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Client Dashboard</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Book New Event</h3>

                <form onSubmit={handleCreate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Event Title"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />

                        <input
                            placeholder="Type (e.g., Wedding, Corporate)"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.event_type}
                            onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                            required
                        />

                        {/* ✅ VENUE SELECTION DROPDOWN */}
                        <select
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.venue_id}
                            onChange={e => setFormData({ ...formData, venue_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select Venue --</option>
                            {venues.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.name} (Capacity: {v.capacity})
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.event_date}
                            onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                            required
                        />

                        <input
                            placeholder="Theme (Optional)"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
                            value={formData.theme}
                            onChange={e => setFormData({ ...formData, theme: e.target.value })}
                        />
                    </div>

                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors w-full md:w-auto">
                        Book Event
                    </button>
                </form>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-gray-700">Your Events</h3>

            {events.length === 0 ? (
                <p className="text-gray-500 italic">No events booked yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(ev => (
                        <div key={ev.id} className="bg-white border-l-4 border-blue-500 p-4 rounded shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-lg text-gray-800">{ev.title}</h3>
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                                <p>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}</p>
                                <p>🏷️ {ev.event_type} {ev.theme && `(${ev.theme})`}</p>
                                {/* Display Venue Name if available via Supabase joins, or simply the ID for now if join not set up */}
                                {ev.venue_id && <p>📍 Venue Assigned</p>} 
                            </div>
                            <div className="mt-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
                                    ev.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    ev.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {ev.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;