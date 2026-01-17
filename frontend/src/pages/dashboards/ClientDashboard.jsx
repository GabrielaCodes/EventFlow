import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Move styles outside component to avoid recreation on render
const statusStyles = {
  consideration: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

const ClientDashboard = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState([]);
    
    // Lists
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [venues, setVenues] = useState([]);

    // Form State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        subtype_id: '',
        event_date: '',
        venue_id: '',
        theme: '',
        client_notes: ''
    });

    useEffect(() => {
        if (!loading && user?.id) {
            fetchData();
        }
    }, [loading, user]);

    const fetchData = async () => {
        try {
            // 1. Fetch Categories
            const { data: catData, error: catError } = await supabase.from('event_categories').select('*');
            if (catError) console.error("Error fetching categories:", catError);
            if (catData) setCategories(catData);

            // 2. Fetch Venues
            const { data: venData, error: venError } = await supabase.from('venues').select('id, name, capacity');
            if (venError) console.error("Error fetching venues:", venError);
            if (venData) setVenues(venData);

            // 3. Fetch My Events (With Crash Protection)
            try {
                const response = await api.get('/events/my-events');
                const eventData = response.data; // Axios puts body in .data

                // ✅ CRITICAL FIX: Check if it's actually an array before setting state
                if (Array.isArray(eventData)) {
                    setEvents(eventData);
                } else {
                    console.error("API Error: Expected array, got:", eventData);
                    setEvents([]); // Fallback to empty list so .map doesn't crash
                }
            } catch (apiErr) {
                console.error("API Fetch Error:", apiErr);
                setEvents([]); 
            }

        } catch (err) {
            console.error("Dashboard Load Error:", err);
        }
    };

    // Dynamic Fetch: When Category Changes, fetch Subtypes
    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setFormData({ ...formData, subtype_id: '' }); // Reset subtype

        if (catId) {
            const { data, error } = await supabase
                .from('event_subtypes')
                .select('*')
                .eq('category_id', catId);
            
            if (error) console.error("Subtype fetch error:", error);
            setSubtypes(data || []);
        } else {
            setSubtypes([]);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        if (!formData.subtype_id || !formData.venue_id) {
            alert("Please select both an Event Type and a Venue.");
            return;
        }

        try {
            await api.post('/events', {
                ...formData,
                client_id: user.id
            });
            alert('Event Booked Successfully!');
            fetchData(); // Refresh List
            
            // Reset Form
            setFormData({ title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: '' });
            setSelectedCategory('');
            setSubtypes([]); // Reset dependent dropdown
        } catch (err) {
            console.error("Booking Error:", err);
            alert('Error booking event: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Client Dashboard</h1>
            
            {/* BOOKING FORM */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-blue-600">Book New Event</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        placeholder="Event Title" 
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                    />

                    {/* 1. Primary Category Dropdown */}
                    <select 
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={selectedCategory} 
                        onChange={handleCategoryChange} 
                        required
                    >
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* 2. Dependent Subtype Dropdown */}
                    <select 
                        className="border p-2 rounded disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={formData.subtype_id} 
                        onChange={e => setFormData({...formData, subtype_id: e.target.value})} 
                        disabled={!selectedCategory}
                        required
                    >
                        <option value="">-- Select Subtype --</option>
                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <input 
                        type="date" 
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                        value={formData.event_date} 
                        onChange={e => setFormData({...formData, event_date: e.target.value})} 
                    />

                    <select 
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={formData.venue_id} 
                        onChange={e => setFormData({...formData, venue_id: e.target.value})}
                        required
                    >
                        <option value="">-- Select Venue --</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>)}
                    </select>

                    <textarea 
                        placeholder="Additional Notes (Themes, specific requirements...)" 
                        className="border p-2 rounded md:col-span-2 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.client_notes} 
                        onChange={e => setFormData({...formData, client_notes: e.target.value})} 
                    />

                    <button className="bg-blue-600 hover:bg-blue-700 transition text-white p-2 rounded md:col-span-2 font-semibold">
                        Book Event
                    </button>
                </form>
            </div>

            {/* EVENT LIST */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800">My Events</h3>

                {/* ✅ CRITICAL FIX: Check if 'events' is an array AND has length */}
                {Array.isArray(events) && events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map(ev => (
                            <div key={ev.id} className="border-l-4 border-blue-500 bg-white p-4 rounded shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">{ev.title}</h4>
                                    <div className="text-sm text-gray-600 mt-1">
                                        <p>📅 {new Date(ev.event_date).toLocaleDateString()}</p>
                                        {ev.subtype_id && <p className="text-xs text-gray-500 mt-1">ID: {ev.subtype_id.slice(0,8)}...</p>}
                                    </div>
                                </div>

                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded border ${statusStyles[ev.status] || 'bg-gray-100 text-gray-700'}`}>
                                    {ev.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 italic">
                        {/* If we have an error but no events, this empty state shows safely */}
                        No events booked yet. Start by creating one above!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;