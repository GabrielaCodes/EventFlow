import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketManager from '../../components/manager/TicketManager';
import EventMessaging from '../../components/common/EventMessaging';
import '../../styles/DashboardStyles.css';

// Reusable Collapsible for this page
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[#2A2A2A] rounded-sm mb-6 bg-[#0B0B0B] overflow-hidden">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer bg-[#121212] hover:bg-[#181818] transition-colors border-b border-[#2A2A2A]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-sm font-medium text-[#C5A46D] uppercase tracking-wider mb-0">{title}</h3>
                <div className="text-[#C5A46D] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const EventModifications = () => {
    const { id } = useParams();
    const { role, user } = useAuth(); 
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [requests, setRequests] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ date: '', venue_id: '', notes: '' });

    useEffect(() => { fetchAllData(); }, [id]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ev, reqs, vens] = await Promise.all([
                supabase.from('events').select('*, venues(name)').eq('id', id).single(),
                supabase.from('modification_requests').select('*, venues:proposed_venue_id(name)').eq('event_id', id).order('created_at', { ascending: false }),
                supabase.from('venues').select('id, name')
            ]);
            if (ev.data) setEvent(ev.data);
            if (reqs.data) setRequests(reqs.data);
            if (vens.data) setVenues(vens.data);
        } catch (err) { console.error("Fetch error:", err); } 
        finally { setLoading(false); }
    };

    const hasPendingRequest = requests.some(r => r.status === 'pending');
    const isAssignedManager = role === 'manager' && user?.id === event?.assigned_manager_id;

    const handleBack = () => {
        if (role === 'manager') navigate('/manager-dashboard');
        else if (role === 'client') navigate('/client-dashboard');
        else navigate('/');
    };

    const handleApproveEvent = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/admin/approve-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ event_id: id })
            });
            const data = await res.json();
            if (res.ok) { alert("Event approved and moved to In Progress."); navigate('/manager-dashboard'); } 
            else { alert("Error: " + data.error); }
        } catch (err) { alert("Network error."); }
    };

    const handleCompleteEvent = async () => {
        if (!window.confirm("Are you sure you want to mark this event as Completed?")) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/admin/event-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ event_id: id, status: 'completed' })
            });

            if (res.ok) { alert("Event marked as Completed!"); navigate('/manager-dashboard'); } 
            else { const data = await res.json(); alert("Error: " + data.error); }
        } catch (err) { alert("Network Error"); }
    };

    const handleSubmitProposal = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/admin/modify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ event_id: id, proposed_date: form.date, proposed_venue_id: form.venue_id, request_details: form.notes })
            });

            const data = await res.json();
            if (res.ok) { alert("Modification proposal sent."); setForm({ date: '', venue_id: '', notes: '' }); fetchAllData(); } 
            else { alert("Error: " + data.error); }
        } catch (err) { alert("Network error."); }
    };

    const handleResponse = async (reqId, action) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/events/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ modification_id: reqId, action })
            });

            if (res.ok) { alert(action === 'accept' ? "Changes applied." : "Request rejected."); fetchAllData(); } 
            else { const data = await res.json(); alert("Error: " + data.error); }
        } catch (err) { alert("Network error."); }
    };

    if (loading || !event) return <div className="flex justify-center items-center h-screen text-sm uppercase tracking-widest text-[#B0B0B0]">Loading Details...</div>;

    return (
        <div className="dash-wrapper p-6">
            <div className="max-w-6xl mx-auto">
                <button onClick={handleBack} className="mb-6 text-[#C5A46D] hover:text-[#E5E5E5] transition font-medium text-sm uppercase tracking-wider">
                    ← Back to Dashboard
                </button>

                <h1 className="dash-title">Manage Event: <span>{event.title}</span></h1>
                
                <div className="text-[#B0B0B0] mb-8 border-b border-[#2A2A2A] pb-4">
                    Current: <strong className="text-[#E5E5E5]">{new Date(event.event_date).toDateString()}</strong> at <strong className="text-[#E5E5E5]">{event.venues?.name || 'Unassigned'}</strong>
                    <span className="ml-4 px-2 py-1 text-[10px] font-bold uppercase rounded border border-[#C5A46D] text-[#C5A46D] tracking-wider">
                        {event.status.replace('_', ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Operations & Modifications */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        <CollapsibleSection title="Event Logistics & Modifications" defaultOpen={true}>
                            {/* MODIFICATION HISTORY */}
                            {requests.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    {requests.map(req => (
                                        <div key={req.id} className={`p-4 rounded-sm border-l-2 bg-[#121212] ${
                                            req.status === 'pending' ? 'border-yellow-500' : 
                                            req.status === 'accepted' ? 'border-green-500' : 'border-red-500'
                                        }`}>
                                            <p className="font-medium text-[#B0B0B0] text-sm">Venue: <span className="text-[#E5E5E5]">{req.venues?.name}</span></p>
                                            <p className="text-sm text-[#B0B0B0]">Date: {new Date(req.proposed_date).toDateString()}</p>
                                            <p className="text-sm italic text-[#B0B0B0] mt-1">"{req.request_details}"</p>
                                            
                                            {req.status === 'pending' && role === 'client' && (
                                                <div className="mt-4 flex gap-3">
                                                    <button onClick={() => handleResponse(req.id, 'accept')} className="dash-btn !py-1.5 !px-4 !text-xs">Accept</button>
                                                    <button onClick={() => handleResponse(req.id, 'reject')} className="dash-btn-outline !py-1.5 !px-4 !text-xs !border-red-500 !text-red-500">Reject</button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && (
                                                <span className={`inline-block mt-3 text-[10px] tracking-wider font-bold uppercase ${req.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ASSIGNED MANAGER ACTIONS */}
                            {isAssignedManager && !hasPendingRequest && (
                                <div className="bg-[#121212] p-6 rounded-sm border border-[#2A2A2A]">
                                    
                                    {event.status === 'consideration' && (
                                        <div className="mb-8 border-b border-[#2A2A2A] pb-6">
                                            <h3 className="text-sm font-medium text-[#E5E5E5] uppercase tracking-wider mb-2">Option A: Approve Event</h3>
                                            <p className="text-xs text-[#B0B0B0] mb-4">Accept current details to start the event.</p>
                                            <button onClick={handleApproveEvent} className="dash-btn">Accept & Start Event</button>
                                        </div>
                                    )}

                                    {event.status === 'in_progress' && (
                                        <div className="mb-8 border-b border-[#2A2A2A] pb-6">
                                            <h3 className="text-sm font-medium text-[#C5A46D] uppercase tracking-wider mb-4">Event Actions</h3>
                                            <button onClick={handleCompleteEvent} className="dash-btn-outline !border-[#555] !text-[#E5E5E5]">
                                                Mark Event as Completed
                                            </button>
                                        </div>
                                    )}

                                    <h3 className="text-sm font-medium text-[#C5A46D] uppercase tracking-wider mb-4">
                                        {event.status === 'consideration' ? 'Option B: Propose Modification' : 'Propose Modification'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="date" className="dash-input m-0" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                        <select className="dash-input m-0" value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })}>
                                            <option value="">Select Venue</option>
                                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                        <input className="dash-input m-0 md:col-span-2" placeholder="Reason for change" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                                    </div>
                                    <button onClick={handleSubmitProposal} className="dash-btn mt-6">Send Proposal</button>
                                </div>
                            )}

                            {isAssignedManager && hasPendingRequest && (
                                <p className="mt-6 text-center text-xs tracking-widest uppercase text-[#C5A46D] opacity-80">
                                    Waiting for client response...
                                </p>
                            )}
                        </CollapsibleSection>

                        {/* NEW TICKET MANAGER SECTION */}
                        {isAssignedManager && (
                            <CollapsibleSection title="Ticket Allocations & Finance" defaultOpen={false}>
                                <TicketManager eventId={event.id} />
                            </CollapsibleSection>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Messaging */}
                    <div className="xl:col-span-1">
                        <EventMessaging eventId={event.id} currentUserId={user?.id} />
                    </div>
                </div>

                {role === 'manager' && !isAssignedManager && (
                    <div className="border border-[#333] text-center p-6 bg-[#121212] rounded-sm mt-8">
                        <p className="text-[#B0B0B0] text-sm uppercase tracking-widest">
                            Read-Only Mode: Assigned to another manager.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventModifications;