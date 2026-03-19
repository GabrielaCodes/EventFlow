import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Accept the filterStatus prop passed from ManagerDashboard
const ManagerEvents = ({ filterStatus }) => {
    const { user } = useAuth(); 
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

            // FIX: Query the events table directly to ensure we get the assigned_manager_id
            // We join event_subtypes for the name, and modification_requests to check for pending status
            const { data, error } = await supabase
                .from('events')
                .select('*, event_subtypes(name), modification_requests(status)')
                .order('event_date', { ascending: true });

            if (error) throw error;

            if (data) {
                // Map the nested relational data to flat properties
                const formattedData = data.map(ev => ({
                    ...ev,
                    subtype_name: ev.event_subtypes?.name,
                    has_pending_request: ev.modification_requests?.some(req => req.status === 'pending')
                }));

                // 1. Consideration
                setConsideration(
                    formattedData.filter(e => e.status === 'consideration' || e.has_pending_request)
                );

                // 2. In Progress
                setInProgress(
                    formattedData.filter(e => e.status === 'in_progress' && !e.has_pending_request)
                );

                // 3. Completed
                setCompleted(
                    formattedData.filter(e => e.status === 'completed')
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
                        {events.map(ev => {
                            // Safely determine ownership since we now explicitly fetched assigned_manager_id
                            const isAssignedToMe = ev.assigned_manager_id === user?.id;

                            return (
                                <tr key={ev.id}>
                                    <td className="font-medium text-[#E5E5E5] pl-4 flex items-center gap-3">
                                        {ev.title}
                                        {isAssignedToMe ? (
                                            <span className="px-2 py-0.5 border border-[#C5A46D] text-[#C5A46D] bg-[#C5A46D]/10 rounded-[3px] text-[9px] uppercase tracking-wider whitespace-nowrap">
                                                My Event
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 border border-[#444] text-[#888] bg-[#222] rounded-[3px] text-[9px] uppercase tracking-wider whitespace-nowrap">
                                                Read-Only
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-[#B0B0B0] text-sm">
                                        {new Date(ev.event_date).toLocaleDateString()}
                                    </td>
                                    <td className="text-[#B0B0B0] text-sm">{ev.subtype_name}</td>
                                    <td className="text-right pr-4">
                                        <Link
                                            to={`/event-modifications/${ev.id}`}
                                            className="text-[#C5A46D] hover:text-[#E5E5E5] text-xs font-medium uppercase tracking-wider transition-colors"
                                        >
                                            {isAssignedToMe ? 'Manage' : 'View'}
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
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

    if (filterStatus === 'consideration') return <EventTable events={consideration} />;
    if (filterStatus === 'in_progress') return <EventTable events={inProgress} />;
    if (filterStatus === 'completed') return <EventTable events={completed} />;

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