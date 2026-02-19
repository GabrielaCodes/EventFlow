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
                // 1. Consideration
                setConsideration(
                    data.filter(e =>
                        e.status === 'consideration' || e.has_pending_request
                    )
                );

                // 2. Completed
                setCompleted(
                    data.filter(e => e.status === 'completed')
                );

                // 3. In Progress
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

    // Reusable table renderer adapted for Dark/Gold Theme
    const EventTable = ({ title, events, accentColor, textColor }) => (
        <div className="dash-table-container mb-8">
            <div className={`p-4 border-b border-[#222] bg-[#111] border-l-4 ${accentColor}`}>
                <h3 className={`font-bold tracking-wide ${textColor}`}>
                    {title} ({events.length})
                </h3>
            </div>

            {events.length === 0 ? (
                <div className="p-6 text-center text-gray-500 italic bg-[#050505]">
                    No events in this category.
                </div>
            ) : (
                <table className="dash-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev.id}>
                                <td className="font-medium text-gray-200">{ev.title}</td>
                                <td>
                                    {new Date(ev.event_date).toLocaleDateString()}
                                </td>
                                <td>{ev.subtype_name}</td>
                                <td>
                                    <Link
                                        to={`/event-modifications/${ev.id}`}
                                        className="dash-btn-outline !py-1 !px-3 !text-xs !border-[#d4af37] !text-[#d4af37] hover:!bg-[#d4af37] hover:!text-black"
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
            <div className="p-8 text-center text-[#d4af37]">
                Loading events...
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <EventTable
                title="⚠️ Consideration"
                events={consideration}
                accentColor="border-yellow-500"
                textColor="text-yellow-500"
            />
            <EventTable
                title="▶️ In Progress / Upcoming"
                events={inProgress}
                accentColor="border-[#d4af37]" // Gold
                textColor="text-[#d4af37]"
            />
            <EventTable
                title="✅ Completed"
                events={completed}
                accentColor="border-green-500"
                textColor="text-green-500"
            />
        </div>
    );
};

export default ManagerEvents;