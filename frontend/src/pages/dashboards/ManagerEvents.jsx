import Loader from '../../components/common/Loader';

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

    // NEW: State to toggle the hidden events archive
    const [showHidden, setShowHidden] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('events')
                .select('*, event_subtypes(name), modification_requests(status)')
                .order('event_date', { ascending: true });

            if (error) throw error;

            if (data) {
                const formattedData = data.map(ev => ({
                    ...ev,
                    subtype_name: ev.event_subtypes?.name,
                    has_pending_request: ev.modification_requests?.some(req => req.status === 'pending')
                }));

                // 1. Consideration (We just load them all, filtering happens in the render)
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

    // Toggle Hidden Status in Database
    const toggleHideEvent = async (eventId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_hidden: !currentStatus })
                .eq('id', eventId);
                
            if (error) throw error;
            
            // Re-fetch to apply the UI updates instantly
            fetchEvents();
        } catch (err) {
            console.error("Error toggling hidden status", err);
            alert("Failed to update event visibility.");
        }
    };

    // Reusable, minimalist table renderer
    const EventTable = ({ events, isConsideration }) => {
        if (events.length === 0) {
            return (
                <div className="p-6 text-center text-[#B0B0B0] text-sm italic border border-[#2A2A2A] rounded bg-[#121212]">
                    No events to display here.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto border border-[#2A2A2A] rounded bg-[#121212]">
                <table className="dash-table w-full">
                    <thead>
                        <tr className="bg-[#181818]">
                            <th>Event</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => {
                            const isAssignedToMe = ev.assigned_manager_id === user?.id;

                            return (
                                <tr key={ev.id} className={ev.is_hidden ? "opacity-60 bg-[#161616]" : "transition-colors"}>
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
                                        
                                        {ev.is_hidden && (
                                            <span className="px-2 py-0.5 border border-red-900/50 text-red-400 bg-red-900/10 rounded-[3px] text-[9px] uppercase tracking-wider whitespace-nowrap">
                                                Hidden
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-[#B0B0B0] text-sm">
                                        {new Date(ev.event_date).toLocaleDateString()}
                                    </td>
                                    <td className="text-[#B0B0B0] text-sm">{ev.subtype_name}</td>
                                    <td className="text-right pr-4">
                                        <div className="flex justify-end items-center gap-4">
                                            
                                            {/* Hide/Unhide Button - Only visible for assigned consideration events */}
                                            {isConsideration && isAssignedToMe && (
                                                <button 
                                                    onClick={() => toggleHideEvent(ev.id, ev.is_hidden)}
                                                    className="text-[10px] text-[#888] hover:text-[#E5E5E5] uppercase tracking-widest font-bold transition-colors"
                                                >
                                                    {ev.is_hidden ? 'Unhide' : 'Hide'}
                                                </button>
                                            )}

                                            <Link
                                                to={`/event-modifications/${ev.id}`}
                                                className="text-[#C5A46D] hover:text-[#E5E5E5] text-xs font-medium uppercase tracking-wider transition-colors"
                                            >
                                                {isAssignedToMe ? 'Manage' : 'View'}
                                            </Link>
                                        </div>
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
        <div className="flex justify-center items-center py-10">
            <Loader />
        </div>
    );
}

    // --- LOGIC TO SPLIT CONSIDERATION EVENTS ---
    const visibleConsideration = consideration.filter(e => !e.is_hidden);
    const hiddenConsideration = consideration.filter(e => e.is_hidden);

    // Component block specifically for the Consideration section to handle the toggle
    const ConsiderationSection = () => (
        <div className="space-y-4">
            {/* The Master Toggle Button */}
            {hiddenConsideration.length > 0 && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowHidden(!showHidden)}
                        className="text-[10px] uppercase tracking-wider font-bold text-[#C5A46D] hover:text-black hover:bg-[#C5A46D] flex items-center gap-2 transition-all bg-[#1a1a1a] px-3 py-1.5 rounded border border-[#C5A46D]/30 shadow-md"
                    >
                        {showHidden ? 'Hide Archive' : `Show Hidden (${hiddenConsideration.length})`}
                    </button>
                </div>
            )}
            
            {/* Main Visible Table */}
            <EventTable events={visibleConsideration} isConsideration={true} />

            {/* Hidden Events Archive Table */}
            {showHidden && hiddenConsideration.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#333] animate-fade-in">
                    <h5 className="text-[#888] text-[10px] uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                        <span className="h-[1px] w-8 bg-[#333] inline-block"></span>
                        Hidden Event Archive
                        <span className="h-[1px] flex-1 bg-[#333] inline-block"></span>
                    </h5>
                    <EventTable events={hiddenConsideration} isConsideration={true} />
                </div>
            )}
        </div>
    );

    // Render based on the filter passed from the Dashboard
    if (filterStatus === 'consideration') return <ConsiderationSection />;
    if (filterStatus === 'in_progress') return <EventTable events={inProgress} isConsideration={false} />;
    if (filterStatus === 'completed') return <EventTable events={completed} isConsideration={false} />;

    // Fallback if no specific filter is provided (renders all blocks)
    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">Consideration</h4>
                <ConsiderationSection />
            </div>
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">In Progress</h4>
                <EventTable events={inProgress} isConsideration={false} />
            </div>
            <div>
                <h4 className="text-[#C5A46D] text-xs uppercase tracking-wider mb-2 pl-2">Completed</h4>
                <EventTable events={completed} isConsideration={false} />
            </div>
        </div>
    );
};

export default ManagerEvents;