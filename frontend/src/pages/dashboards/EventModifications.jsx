import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DashboardStyles.css';

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

    if (loading || !event) return <div className="flex justify-center items-center h-screen text-xl text-[var(--gold-main)]">Loading Details...</div>;

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={handleBack} className="mb-6 text-[var(--gold-main)] hover:text-[var(--gold-hover)] transition font-medium" style={{ background: 'transparent', padding: 0 }}>
                    ← Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">Manage Event: <span className="text-[var(--gold-main)]">{event.title}</span></h1>
                
                <div className="text-[var(--text-secondary)] mb-8 border-b border-[#333] pb-4">
                    Current: <strong className="text-[var(--text-primary)]">{new Date(event.event_date).toDateString()}</strong> at <strong className="text-[var(--text-primary)]">{event.venues?.name || 'Unassigned'}</strong>
                    <span className="ml-4 px-2 py-1 text-xs font-bold uppercase rounded bg-[#111] text-[var(--gold-main)] border border-[#333]">
                        {event.status.replace('_', ' ')}
                    </span>
                </div>

                {/* MODIFICATION HISTORY */}
                {requests.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-bold text-[var(--gold-main)]">Modification History</h3>
                        {requests.map(req => (
                            <div key={req.id} className={`p-4 rounded border-l-4 bg-[var(--surface-color)] shadow-md ${
                                req.status === 'pending' ? 'border-yellow-500' : 
                                req.status === 'accepted' ? 'border-green-500' : 'border-red-500'
                            }`}>
                                <p className="font-semibold text-[var(--text-secondary)]">Venue: <span className="text-[var(--text-primary)]">{req.venues?.name}</span></p>
                                <p className="text-sm text-[var(--text-secondary)]">Date: {new Date(req.proposed_date).toDateString()}</p>
                                <p className="text-sm italic text-[var(--text-secondary)] mt-1 opacity-80">"{req.request_details}"</p>
                                
                                {req.status === 'pending' && role === 'client' && (
                                    <div className="mt-4 flex gap-3">
                                        <button onClick={() => handleResponse(req.id, 'accept')} style={{ padding: '0.25rem 1rem', backgroundColor: '#16a34a', color: 'white' }}>Accept</button>
                                        <button onClick={() => handleResponse(req.id, 'reject')} style={{ padding: '0.25rem 1rem', backgroundColor: '#dc2626', color: 'white' }}>Reject</button>
                                    </div>
                                )}
                                {req.status !== 'pending' && (
                                    <span className={`inline-block mt-3 text-xs font-bold uppercase ${req.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                        {req.status}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* READ ONLY NOTICE */}
                {role === 'manager' && !isAssignedManager && (
                    <div className="border-l-4 border-l-[#333] text-center p-6 bg-[var(--surface-color)] rounded mb-8">
                        <p className="text-[var(--text-secondary)] italic">
                            👀 You are viewing this event in Read-Only mode because it is assigned to another manager in your department.
                        </p>
                    </div>
                )}

                {/* ASSIGNED MANAGER ACTIONS */}
                {isAssignedManager && !hasPendingRequest && (
                    <div className="bg-[var(--surface-color)] p-6 rounded border border-[#333]">
                        
                        {event.status === 'consideration' && (
                            <div className="mb-8 border-b border-[#333] pb-6">
                                <h3 className="text-lg font-bold text-green-500 mb-2">Option A: Approve Event</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">Accept current details to start the event.</p>
                                <button onClick={handleApproveEvent} style={{ backgroundColor: '#16a34a', color: 'white' }}>
                                    Accept & Start Event
                                </button>
                            </div>
                        )}

                        {event.status === 'in_progress' && (
                            <div className="mb-8 border-b border-[#333] pb-6">
                                <h3 className="text-lg font-bold mb-4 text-[var(--gold-main)]">Event Actions</h3>
                                <button onClick={handleCompleteEvent}>
                                    🏁 Mark Event as Completed
                                </button>
                            </div>
                        )}

                        <h3 className="text-lg font-bold text-[var(--gold-main)] mb-4">
                            {event.status === 'consideration' ? 'Option B: Propose Modification' : 'Propose Modification'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            <select value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })}>
                                <option value="" className="text-[var(--text-secondary)]">Select Venue</option>
                                {venues.map(v => <option key={v.id} value={v.id} className="bg-[#111] text-[var(--gold-main)]">{v.name}</option>)}
                            </select>
                            <input className="md:col-span-2" placeholder="Reason for change" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <button onClick={handleSubmitProposal} className="mt-6">
                            Send Proposal
                        </button>
                    </div>
                )}

                {isAssignedManager && hasPendingRequest && (
                    <p className="mt-6 text-center italic text-[var(--gold-main)] opacity-80">
                        ⏳ Waiting for client response to the pending modification.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EventModifications;