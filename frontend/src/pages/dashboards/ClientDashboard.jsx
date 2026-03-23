import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import api, { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
    consideration: 'bg-yellow-900 text-yellow-200 border-yellow-700',
    in_progress: 'bg-blue-900 text-blue-200 border-blue-700',
    completed: 'bg-green-900 text-green-200 border-green-700',
    cancelled: 'bg-red-900 text-red-200 border-red-700'
};

const ClientDashboard = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState([]);
    
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [venues, setVenues] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: ''
    });

    useEffect(() => {
        if (!loading && user?.id) fetchData();
    }, [loading, user]);

    const fetchData = async () => {
        try {
            const { data: catData } = await supabase.from('event_categories').select('*');
            if (catData) setCategories(catData);

            const { data: venData } = await supabase.from('venues').select('id, name, capacity');
            if (venData) setVenues(venData);

            try {
                const response = await api.get('/events/my-events');
                if (Array.isArray(response.data)) setEvents(response.data);
                else setEvents([]); 
            } catch (apiErr) { setEvents([]); }
        } catch (err) { console.error("Dashboard Load Error:", err); }
    };

    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setFormData({ ...formData, subtype_id: '' }); 
        if (catId) {
            const { data } = await supabase.from('event_subtypes').select('*').eq('category_id', catId);
            setSubtypes(data || []);
        } else { setSubtypes([]); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.subtype_id || !formData.venue_id) {
            alert("Please select both an Event Type and a Venue.");
            return;
        }
        try {
            await api.post('/events', { ...formData, client_id: user.id });
            alert('Event Booked Successfully!');
            fetchData(); 
            setFormData({ title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: '' });
            setSelectedCategory('');
            setSubtypes([]); 
        } catch (err) { alert('Error booking event.'); }
    };

    if (loading) return <div className="p-10 text-center text-[var(--text-secondary)]">Loading Dashboard...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-[var(--gold-main)]">Client Dashboard</h1>
            
            {/* BOOKING FORM */}
            <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow-md mb-8 border border-[#333]">
                <h3 className="text-xl font-bold mb-4 text-[var(--gold-main)]">Book New Event</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <input placeholder="Event Title" required value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} className="w-full" />
                    
                    <select value={selectedCategory} onChange={handleCategoryChange} required className="w-full">
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    
                    <select value={formData.subtype_id} onChange={e => setFormData({...formData, subtype_id: e.target.value})} disabled={!selectedCategory} required className="w-full">
                        <option value="">-- Select Subtype --</option>
                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    
                    <input type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} className="w-full" />
                    
                    {/* --- VENUE SELECTION WITH GALLERY LINK --- */}
                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <span className="text-xs text-[var(--text-secondary)]">Venue</span>
                            <Link 
                                to="/gallery" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--gold-main)] hover:text-white underline decoration-[var(--gold-main)] underline-offset-2 transition-colors font-medium"
                            >
                                📸 Click to discover our venues
                            </Link>
                        </div>
                        <select value={formData.venue_id} onChange={e => setFormData({...formData, venue_id: e.target.value})} required className="w-full m-0">
                            <option value="">-- Select Venue --</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>)}
                        </select>
                    </div>
                    
                    <textarea placeholder="Notes..." className="md:col-span-2 h-24 mt-2" value={formData.client_notes} onChange={e => setFormData({...formData, client_notes: e.target.value})} />
                    
                    <button className="md:col-span-2">Book Event</button>
                </form>
            </div>

            {/* EVENT LIST */}
            <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow-md border border-[#333]">
                <h3 className="text-xl font-bold mb-4 text-[var(--gold-main)]">My Events</h3>
                {Array.isArray(events) && events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map(ev => (
                            <div key={ev.id} className="border-l-4 border-[var(--gold-main)] bg-[#111] p-4 rounded shadow-sm hover:bg-[#1a1a1a] transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-lg text-[var(--text-primary)]">{ev.title}</h4>
                                    <div className="text-sm text-[var(--text-secondary)] mt-1 space-y-1">
                                        <p>📅 {new Date(ev.event_date).toLocaleDateString()}</p>
                                        {ev.event_subtypes && (
                                            <p className="font-medium text-[var(--gold-main)]">
                                                Event Type: {ev.event_subtypes.name}
                                            </p>
                                        )}
                                        {ev.venues && (
                                            <p className="text-[var(--text-secondary)]">
                                                📍 {ev.venues.name}, {ev.venues.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded border ${statusStyles[ev.status] || 'bg-[#222] text-[var(--text-secondary)]'}`}>
                                        {ev.status.replace('_', ' ')}
                                    </span>
                                    <Link to={`/event-modifications/${ev.id}`} className="bg-[var(--gold-main)] text-[var(--bg-color)] px-4 py-2 rounded text-sm hover:bg-[var(--gold-hover)] font-bold transition">
                                        View / Manage
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-[var(--text-secondary)] italic">No events booked yet.</div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;