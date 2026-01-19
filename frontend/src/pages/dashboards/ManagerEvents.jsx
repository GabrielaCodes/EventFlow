import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/api';

const ManagerEvents = () => {
    const [consideration, setConsideration] = useState([]);
    const [inProgress, setInProgress] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('manager_event_overview')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;

            if (data) {
                // ✅ FINAL, CORRECT BUCKETING LOGIC

                // 1. Consideration:
                //    - New client proposal
                //    - OR active negotiation
                setConsideration(
                    data.filter(e =>
                        e.status === 'consideration' || e.has_pending_request
                    )
                );

                // 2. Completed (terminal state)
                setCompleted(
                    data.filter(e => e.status === 'completed')
                );

                // 3. In Progress:
                //    - Approved
                //    - No pending negotiation
                setInProgress(
                    data.filter(e =>
                        e.status === 'in_progress' && !e.has_pending_request
                    )
                );
            }
        } catch (err) {
            console.error("Error loading events:", err);
        } finally {
            setLoading(false);
        }
    };

    // Reusable table renderer
    const EventTable = ({ title, events, colorClass }) => (
        <div className="bg-white rounded shadow overflow-hidden mb-8 border border-gray-200">
            <div className={`p-4 border-b ${colorClass}`}>
                <h3 className="font-bold text-gray-800">
                    {title} ({events.length})
                </h3>
            </div>

            {events.length === 0 ? (
                <div className="p-6 text-center text-gray-400 italic">
                    No events in this category.
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="p-3">Event</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev.id} className="border-t hover:bg-gray-50">
                                <td className="p-3 font-medium">{ev.title}</td>
                                <td className="p-3">
                                    {new Date(ev.event_date).toLocaleDateString()}
                                </td>
                                <td className="p-3">{ev.subtype_name}</td>
                                <td className="p-3">
                                    <Link
                                        to={`/event-modifications/${ev.id}`}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition"
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading events...
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <EventTable
                title="⚠️ Consideration"
                events={consideration}
                colorClass="bg-yellow-100"
            />
            <EventTable
                title="▶️ In Progress / Upcoming"
                events={inProgress}
                colorClass="bg-blue-100"
            />
            <EventTable
                title="✅ Completed"
                events={completed}
                colorClass="bg-green-100"
            />
        </div>
    );
};

export default ManagerEvents;
