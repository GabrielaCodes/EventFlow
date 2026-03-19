import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/api';

// Accept the filterStatus prop passed from ManagerDashboard
const ManagerEvents = ({ filterStatus }) => {
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
                    data.filter(e => e.status === 'consideration' || e.has_pending_request)
                );

                // 2. In Progress
                setInProgress(
                    data.filter(e => e.status === 'in_progress' && !e.has_pending_request)
                );

                // 3. Completed
                setCompleted(
                    data.filter(e => e.status === 'completed')
                );
            }
        } catch (err) {
            console.error("Error loading events:", err);
        } finally {
            setLoading(false);
        }
    };

    // Reusable, minimalist table renderer
    const EventTable = ({ events }) => {
        if (events.length === 0) {
            return (
                <div className="p-6 text-center text-[#B0B0B0] text-sm italic">
                    No events in this category.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="dash-table w-full">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev.id}>
                                <td className="font-medium text-[#E5E5E5] pl-4">{ev.title}</td>
                                <td className="text-[#B0B0B0] text-sm">
                                    {new Date(ev.event_date).toLocaleDateString()}
                                </td>
                                <td className="text-[#B0B0B0] text-sm">{ev.subtype_name}</td>
                                <td className="text-right pr-4">
                                    <Link
                                        to={`/event-modifications/${ev.id}`}
                                        className="text-[#C5A46D] hover:text-[#E5E5E5] text-xs font-medium uppercase tracking-wider transition-colors"
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-xs uppercase tracking-widest text-[#B0B0B0]">
                Loading events...
            </div>
        );
    }

    // CONDITIONAL RENDERING: Only return the table requested by the Dashboard
    if (filterStatus === 'consideration') {
        return <EventTable events={consideration} />;
    }
    
    if (filterStatus === 'in_progress') {
        return <EventTable events={inProgress} />;
    }
    
    if (filterStatus === 'completed') {
        return <EventTable events={completed} />;
    }

    // Fallback if no prop is provided (renders everything, useful for testing standalone)
    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">Consideration</h4>
                <EventTable events={consideration} />
            </div>
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">In Progress</h4>
                <EventTable events={inProgress} />
            </div>
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">Completed</h4>
                <EventTable events={completed} />
            </div>
        </div>
    );
};

export default ManagerEvents;