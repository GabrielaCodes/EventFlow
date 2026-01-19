import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EventModifications = () => {
    const { id } = useParams();
    const { role } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [requests, setRequests] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        date: '',
        venue_id: '',
        notes: ''
    });

    useEffect(() => {
        fetchAllData();
    }, [id]);

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
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const hasPendingRequest = requests.some(r => r.status === 'pending');

    const handleBack = () => {
        if (role === 'manager') navigate('/manager-dashboard');
        else if (role === 'client') navigate('/client-dashboard');
        else navigate('/');
    };

    // -----------------------------
    // MANAGER: Approve Event As-Is
    // -----------------------------
    const handleApproveEvent = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/admin/approve-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ event_id: id })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Event approved and moved to In Progress.");
                navigate('/manager-dashboard');
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    // -----------------------------
    // ✅ NEW: MANAGER: Mark Completed
    // -----------------------------
    const handleCompleteEvent = async () => {
        if (!window.confirm("Are you sure you want to mark this event as Completed?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            // Using PATCH /event-status as defined in your adminRoutes
            const res = await fetch('http://127.0.0.1:5000/api/admin/event-status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    event_id: id,
                    status: 'completed'
                })
            });

            if (res.ok) {
                alert("Event marked as Completed!");
                navigate('/manager-dashboard');
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Network Error");
        }
    };

    // -----------------------------
    // MANAGER: Propose Modification
    // -----------------------------
    const handleSubmitProposal = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/admin/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    event_id: id,
                    proposed_date: form.date,
                    proposed_venue_id: form.venue_id,
                    request_details: form.notes
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Modification proposal sent.");
                setForm({ date: '', venue_id: '', notes: '' });
                fetchAllData();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    // -----------------------------
    // CLIENT: Respond
    // -----------------------------
    const handleResponse = async (reqId, action) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch('http://127.0.0.1:5000/api/events/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ modification_id: reqId, action })
            });

            if (res.ok) {
                alert(action === 'accept' ? "Changes applied." : "Request rejected.");
                fetchAllData();
            } else {
                const data = await res.json();
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Network error.");
        }
    };

    if (loading || !event) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button onClick={handleBack} className="mb-6 text-gray-500 hover:text-blue-600 font-medium">← Back</button>

            <h1 className="text-2xl font-bold mb-2">Manage Event: {event.title}</h1>
            <div className="text-gray-600 mb-8 border-b pb-4">
                Current: <strong>{new Date(event.event_date).toDateString()}</strong> at <strong>{event.venues?.name || 'Unassigned'}</strong>
                <span className={`ml-4 px-2 py-1 text-xs font-bold uppercase rounded bg-gray-200 text-gray-700`}>{event.status.replace('_', ' ')}</span>
            </div>

            {/* MODIFICATION HISTORY */}
            {requests.length > 0 && (
                <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-bold">Modification History</h3>
                    {requests.map(req => (
                        <div key={req.id} className={`p-4 rounded border-l-4 ${req.status === 'pending' ? 'bg-yellow-50 border-yellow-400' : req.status === 'accepted' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-400'}`}>
                            <p className="font-semibold">Venue: {req.venues?.name}</p>
                            <p className="text-sm">Date: {new Date(req.proposed_date).toDateString()}</p>
                            <p className="text-xs italic">"{req.request_details}"</p>
                            
                            {req.status === 'pending' && role === 'client' && (
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => handleResponse(req.id, 'accept')} className="bg-green-600 text-white px-4 py-1 rounded">Accept</button>
                                    <button onClick={() => handleResponse(req.id, 'reject')} className="bg-red-600 text-white px-4 py-1 rounded">Reject</button>
                                </div>
                            )}
                            {req.status !== 'pending' && <span className="inline-block mt-2 text-xs font-bold uppercase">{req.status}</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* MANAGER ACTIONS */}
            {role === 'manager' && !hasPendingRequest && (
                <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                    
                    {/* OPTION A: Approve (Consideration -> In Progress) */}
                    {event.status === 'consideration' && (
                        <div className="mb-8 border-b pb-6">
                            <h3 className="text-lg font-bold text-green-700 mb-2">Option A: Approve Event</h3>
                            <p className="text-sm text-gray-600 mb-4">Accept current details to start the event.</p>
                            <button onClick={handleApproveEvent} className="bg-green-600 text-white px-6 py-2 rounded font-semibold">Accept & Start Event</button>
                        </div>
                    )}

                    {/* ✅ OPTION B: Mark as Completed (In Progress -> Completed) */}
                    {event.status === 'in_progress' && (
                        <div className="mb-8 border-b border-gray-300 pb-6">
                            <h3 className="text-lg font-bold mb-2 text-blue-800">Event Actions</h3>
                            <button onClick={handleCompleteEvent} className="bg-blue-800 text-white px-6 py-2 rounded font-semibold hover:bg-blue-900 transition flex items-center gap-2">
                                🏁 Mark Event as Completed
                            </button>
                        </div>
                    )}

                    {/* OPTION C: Modify */}
                    <h3 className="text-lg font-bold mb-4">
                        {event.status === 'consideration' ? 'Option B: Propose Modification' : 'Propose Modification'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="date" className="p-2 border rounded" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        <select className="p-2 border rounded" value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })}>
                            <option value="">Select Venue</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <input className="p-2 border rounded md:col-span-2" placeholder="Reason for change" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <button onClick={handleSubmitProposal} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded font-semibold">Send Proposal</button>
                </div>
            )}

            {role === 'manager' && hasPendingRequest && (
                <p className="mt-6 text-center italic text-gray-400">Waiting for client response to the pending modification.</p>
            )}
        </div>
    );
};

export default EventModifications;