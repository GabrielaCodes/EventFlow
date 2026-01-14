import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard = () => {
    const { user, loading } = useAuth(); // ✅ include loading
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        event_type: '',
        event_date: '',
        theme: ''
    });

    useEffect(() => {
        // ✅ wait until auth is fully resolved
        if (!loading && user?.id) {
            fetchEvents();
        }
    }, [loading, user]);

    const fetchEvents = async () => {
        if (!user?.id) return; // ✅ defensive guard

        try {
            const { data } = await api.get(`/events?client_id=${user.id}`);
            setEvents(data || []);
        } catch (err) {
            console.error('Fetch Events Error:', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            alert('You must be logged in to book an event.');
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
            fetchEvents();

            setFormData({
                title: '',
                event_type: '',
                event_date: '',
                theme: ''
            });
        } catch (err) {
            console.error('Creation Error:', err);
            alert('Error creating event. Check console for details.');
        }
    };

    // ✅ block rendering until auth state is known
    if (loading) {
        return (
            <div className="p-6 text-center text-gray-600">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Client Dashboard
            </h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">
                    Book New Event
                </h3>

                <form onSubmit={handleCreate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Event Title"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.title}
                            onChange={e =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />

                        <input
                            placeholder="Type (e.g., Wedding, Corporate)"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.event_type}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    event_type: e.target.value
                                })
                            }
                            required
                        />

                        <input
                            placeholder="Theme (Optional)"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.theme}
                            onChange={e =>
                                setFormData({ ...formData, theme: e.target.value })
                            }
                        />

                        <input
                            type="date"
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.event_date}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    event_date: e.target.value
                                })
                            }
                            required
                        />
                    </div>

                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors">
                        Book Event
                    </button>
                </form>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Your Events
            </h3>

            {events.length === 0 ? (
                <p className="text-gray-500 italic">No events booked yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(ev => (
                        <div
                            key={ev.id}
                            className="bg-white border-l-4 border-blue-500 p-4 rounded shadow-sm hover:shadow-md transition-shadow"
                        >
                            <h3 className="font-bold text-lg text-gray-800">
                                {ev.title}
                            </h3>

                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                                <p>
                                    📅{' '}
                                    {ev.event_date
                                        ? new Date(ev.event_date).toLocaleDateString()
                                        : '—'}
                                </p>
                                <p>
                                    🏷️ {ev.event_type}{' '}
                                    {ev.theme && `(${ev.theme})`}
                                </p>
                            </div>

                            <div className="mt-3">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
                                        ev.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : ev.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
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
