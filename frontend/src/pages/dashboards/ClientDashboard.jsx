import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
        subtype_id: '', // ✅ Changed from event_type
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
            const { data: catData } = await supabase.from('event_categories').select('*');
            if (catData) setCategories(catData);

            // 2. Fetch Venues
            const { data: venData } = await supabase.from('venues').select('id, name, capacity');
            if (venData) setVenues(venData);

            // 3. Fetch My Events (with joins to show names)
            // Note: You might need to adjust your RLS or Select query to include foreign key data
            const { data: eventData } = await api.get('/events/my-events');
            setEvents(eventData || []);
        } catch (err) {
            console.error(err);
        }
    };

    // ✅ Dynamic Fetch: When Category Changes, fetch Subtypes
    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setFormData({ ...formData, subtype_id: '' }); // Reset subtype

        if (catId) {
            const { data } = await supabase
                .from('event_subtypes')
                .select('*')
                .eq('category_id', catId);
            setSubtypes(data || []);
        } else {
            setSubtypes([]);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', {
                ...formData,
                client_id: user.id
            });
            alert('Event Booked!');
            fetchData();
            // Reset Form
            setFormData({ title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: '' });
            setSelectedCategory('');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
const statusStyles = {
  consideration: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>
            
            <div className="bg-white p-6 rounded shadow mb-8">
                <h3 className="text-xl font-bold mb-4">Book New Event</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Title" className="border p-2 rounded" required
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />

                    {/* ✅ 1. Primary Category Dropdown */}
                    <select className="border p-2 rounded" value={selectedCategory} onChange={handleCategoryChange} required>
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {/* ✅ 2. Dependent Subtype Dropdown */}
                    <select 
                        className="border p-2 rounded disabled:bg-gray-100" 
                        value={formData.subtype_id} 
                        onChange={e => setFormData({...formData, subtype_id: e.target.value})} 
                        disabled={!selectedCategory}
                        required
                    >
                        <option value="">-- Select Subtype --</option>
                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <input type="date" className="border p-2 rounded" required
                        value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />

                    <select className="border p-2 rounded" 
                        value={formData.venue_id} onChange={e => setFormData({...formData, venue_id: e.target.value})}>
                        <option value="">-- Select Venue --</option>
                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>

                    <textarea placeholder="Additional Notes" className="border p-2 rounded md:col-span-2"
                        value={formData.client_notes} onChange={e => setFormData({...formData, client_notes: e.target.value})} />

                    <button className="bg-blue-600 text-white p-2 rounded col-span-2">Book Event</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded shadow">
  <h3 className="text-xl font-bold mb-4">My Events</h3>

  {events.length === 0 ? (
    <p className="text-gray-500">No events booked yet.</p>
  ) : (
    <div className="space-y-4">
      {events.map(ev => (
        <div
          key={ev.id}
          className="border p-4 rounded flex items-start justify-between"
        >
          <div>
            <h4 className="font-semibold text-lg">{ev.title}</h4>
            <p className="text-sm text-gray-600">
              Date: {new Date(ev.event_date).toLocaleDateString()}
            </p>
          </div>

          {/* ✅ Status Badge */}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded border
              ${statusStyles[ev.status] || 'bg-gray-100 text-gray-700'}
            `}
          >
            {ev.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  )}
</div>


        </div>
        
    );
};

export default ClientDashboard;