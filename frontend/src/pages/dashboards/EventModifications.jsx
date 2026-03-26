import Loader from '../../components/common/Loader';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketManager from '../../components/manager/TicketManager';
import EventMessaging from '../../components/common/EventMessaging';
import EventSponsorshipManager from './EventSponsorshipManager';
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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

    const [event,    setEvent]    = useState(null);
    const [requests, setRequests] = useState([]);
    const [venues,   setVenues]   = useState([]);
    const [hasSponsorships, setHasSponsorships] = useState(false);

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ date: '', venue_id: '', notes: '' });

    useEffect(() => { fetchAllData(); }, [id]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ev, reqs, vens, spons] = await Promise.all([
                supabase
                    .from('events')
                    .select('*, venues(name), manager:profiles!events_assigned_manager_id_fkey(full_name, email), client:profiles!events_client_id_fkey(full_name, email)')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('modification_requests')
                    .select('*, venues:proposed_venue_id(name)')
                    .eq('event_id', id)
                    .order('created_at', { ascending: false }),
                supabase.from('venues').select('id, name'),
                supabase.from('sponsorships').select('id').eq('event_id', id),
            ]);

            if (ev.data)    setEvent(ev.data);
            if (reqs.data)  setRequests(reqs.data);
            if (vens.data)  setVenues(vens.data);
            if (spons.data) setHasSponsorships(spons.data.length > 0);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
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
                body: JSON.stringify({ event_id: id }),
            });
            const data = await res.json();
            if (res.ok) { alert('Event approved and moved to In Progress.'); navigate('/manager-dashboard'); }
            else { alert('Error: ' + data.error); }
        } catch { alert('Network error.'); }
    };

    const handleCompleteEvent = async () => {
        if (!window.confirm('Are you sure you want to mark this event as Completed?')) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;
            const res = await fetch('http://127.0.0.1:5000/api/admin/event-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ event_id: id, status: 'completed' }),
            });
            if (res.ok) { alert('Event marked as Completed!'); navigate('/manager-dashboard'); }
            else { const data = await res.json(); alert('Error: ' + data.error); }
        } catch { alert('Network Error'); }
    };

    const handleSubmitProposal = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;
            const res = await fetch('http://127.0.0.1:5000/api/admin/modify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ event_id: id, proposed_date: form.date, proposed_venue_id: form.venue_id, request_details: form.notes }),
            });
            const data = await res.json();
            if (res.ok) { alert('Modification proposal sent.'); setForm({ date: '', venue_id: '', notes: '' }); fetchAllData(); }
            else { alert('Error: ' + data.error); }
        } catch { alert('Network error.'); }
    };

    const handleResponse = async (reqId, action) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;
            const res = await fetch('http://127.0.0.1:5000/api/events/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ modification_id: reqId, action }),
            });
            if (res.ok) { alert(action === 'accept' ? 'Changes applied.' : 'Request rejected.'); fetchAllData(); }
            else { const data = await res.json(); alert('Error: ' + data.error); }
        } catch { alert('Network error.'); }
    };

    if (loading || !event) return (
    <div className="flex justify-center items-center h-screen">
        <Loader />
    </div>
    );

    return (
        <div className="dash-wrapper p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={handleBack} className="mb-6 text-[#C5A46D] hover:text-[#E5E5E5] transition font-medium text-sm uppercase tracking-wider">
                    ← Back to Dashboard
                </button>

                <h1 className="dash-title">Manage Event: <span>{event.title}</span></h1>

                <div className="text-[#B0B0B0] mb-4 border-b border-[#2A2A2A] pb-4 flex items-center flex-wrap gap-2">
                    Current:&nbsp;
                    <strong className="text-[#E5E5E5]">{new Date(event.event_date).toDateString()}</strong>
                    &nbsp;at&nbsp;
                    <strong className="text-[#E5E5E5]">{event.venues?.name || 'Unassigned'}</strong>
                    <span className="ml-2 px-2 py-1 text-[10px] font-bold uppercase rounded border border-[#C5A46D] text-[#C5A46D] tracking-wider">
                        {event.status.replace('_', ' ')}
                    </span>
                </div>

                {event.client_notes && (
                    <div className="mb-8 p-4 bg-[#121212] border-l-2 border-[#C5A46D] rounded-r-sm">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B0B0B0] mb-1">
                            Client Notes / Instructions
                        </h4>
                        <p className="text-sm text-[#E5E5E5] whitespace-pre-wrap">{event.client_notes}</p>
                    </div>
                )}

                <div className="space-y-6">

                    {/* 1. EVENT LOGISTICS & MODIFICATIONS */}
                    <CollapsibleSection title="Event Logistics & Modifications" defaultOpen={true}>
                        {requests.length > 0 && (
                            <div className="space-y-4 mb-8">
                                {requests.map(req => (
                                    <div key={req.id} className={`p-4 rounded-sm border-l-2 bg-[#121212] ${
                                        req.status === 'pending'  ? 'border-yellow-500' :
                                        req.status === 'accepted' ? 'border-green-500'  : 'border-red-500'
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

                    {/* 2. SPONSORSHIP MANAGEMENT — always visible to assigned manager */}
                    {isAssignedManager && (
                        <CollapsibleSection title="Sponsorship Management" defaultOpen={hasSponsorships}>
                            <EventSponsorshipManager
                                eventId={event.id}
                                managerId={user?.id}
                            />
                        </CollapsibleSection>
                    )}

                    {/* 3. TICKET ALLOCATIONS & FINANCE — only once sponsorships exist */}
                    {isAssignedManager && hasSponsorships && (
                        <CollapsibleSection title="Ticket Allocations & Finance" defaultOpen={false}>
                            <TicketManager eventId={event.id} />
                        </CollapsibleSection>
                    )}

                    {/* 4. SPONSOR DISCUSSION & NOTES — only once sponsorships exist */}
{isAssignedManager && hasSponsorships && (
    <CollapsibleSection title="Sponsor Discussion & Notes" defaultOpen={true}>
        <EventMessaging eventId={event.id} currentUserId={user?.id} />
    </CollapsibleSection>
)}

                </div>

                {role === 'manager' && !isAssignedManager && (
                    <div className="border border-[#333] text-center p-6 bg-[#121212] rounded-sm mt-8">
                        <p className="text-[#B0B0B0] text-sm uppercase tracking-widest">
                            Read-Only Mode: Assigned to another manager.
                        </p>
                    </div>
                )}

                {/* Client Contact Manager Card */}
                {role === 'client' && event?.manager && (
                    <div className="mt-8 p-6 bg-[#121212] border border-[#2A2A2A] rounded-sm text-center">
                        <h4 className="text-[#C5A46D] font-medium uppercase tracking-wider text-sm mb-3">
                            Need help? We will be happy to talk to you.
                        </h4>
                        <p className="text-[#B0B0B0] text-sm mb-5">
                            Your assigned manager, <strong className="text-[#E5E5E5]">{event.manager.full_name}</strong>, is here to assist with any questions or modifications.
                        </p>
                        <a
                            href={`mailto:${event.manager.email}?subject=Question regarding event: ${event.title}`}
                            className="dash-btn inline-block !px-6"
                        >
                            ✉️ Email {event.manager.full_name.split(' ')[0]}
                        </a>
                    </div>
                )}

                {/* Manager Contact Client Card */}
                {role === 'manager' && isAssignedManager && event?.client && (
                    <div className="mt-8 p-6 bg-[#121212] border border-[#2A2A2A] rounded-sm text-center">
                        <h4 className="text-[#C5A46D] font-medium uppercase tracking-wider text-sm mb-3">
                            Talk to Client
                        </h4>
                        <p className="text-[#B0B0B0] text-sm mb-5">
                            You can reach out to the client, <strong className="text-[#E5E5E5]">{event.client.full_name}</strong>, directly for any updates.
                        </p>
                        <a
                            href={`mailto:${event.client.email}?subject=Update regarding event: ${event.title}`}
                            className="dash-btn inline-block !px-6"
                        >
                            ✉️ Email {event.client.full_name.split(' ')[0]}
                        </a>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EventModifications;