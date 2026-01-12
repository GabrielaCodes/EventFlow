import { useEffect, useState } from 'react';
import api from '../../services/api';

const ClientDashboard = () => {
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({ title: '', event_type: '', event_date: '', theme: '' });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get('/events/my-events');
            setEvents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', formData);
            fetchEvents();
            alert('Event Created!');
        } catch (err) {
            alert('Error creating event');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
            
            <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Book New Event</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Event Title" className="border p-2 rounded" onChange={e => setFormData({...formData, title: e.target.value})} />
                    <input placeholder="Type (e.g., Wedding)" className="border p-2 rounded" onChange={e => setFormData({...formData, event_type: e.target.value})} />
                    <input placeholder="Theme" className="border p-2 rounded" onChange={e => setFormData({...formData, theme: e.target.value})} />
                    <input type="date" className="border p-2 rounded" onChange={e => setFormData({...formData, event_date: e.target.value})} />
                </div>
                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Book Event</button>
            </form>

            <h3 className="text-lg font-semibold mb-3">Your Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white border p-4 rounded shadow-sm">
                        <h3 className="font-bold text-lg">{ev.title}</h3>
                        <p className="text-gray-600">Type: {ev.event_type}</p>
                        <p className="text-gray-600">Date: {ev.event_date}</p>
                        <div className="mt-2">
                            Status: <span className={`px-2 py-1 rounded text-sm ${ev.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{ev.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientDashboard;