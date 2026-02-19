import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ✅ IMPORT THE DARK/GOLD DASHBOARD THEME
import '../../styles/DashboardStyles.css';

const EventModifications = () => {
    const { id } = useParams();
    const { role, user } = useAuth(); // ✅ Added 'user' to verify ownership
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
    
    // ✅ Check if the logged-in user is the manager assigned to this specific event
    const isAssignedManager = role === 'manager' && user?.id === event?.assigned_manager_id;

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
    // MANAGER: Mark Completed
    // -----------------------------
    const handleCompleteEvent = async () => {
        if (!window.confirm("Are you sure you want to mark this event as Completed?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

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

    if (loading || !event) return <div className="dash-wrapper flex justify-center items-center text-xl text-[#d4af37]">Loading Details...</div>;

    return (
        <div className="dash-wrapper">
            <div className="max-w-4xl mx-auto">
                <button onClick={handleBack} className="mb-6 text-[#d4af37] hover:text-white transition font-medium">
                    ← Back to Dashboard
                </button>

                <h1 className="dash-title">Manage Event: <span>{event.title}</span></h1>
                
                <div className="text-gray-300 mb-8 border-b border-[#333] pb-4">
                    Current: <strong className="text-white">{new Date(event.event_date).toDateString()}</strong> at <strong className="text-white">{event.venues?.name || 'Unassigned'}</strong>
                    <span className="ml-4 px-2 py-1 text-xs font-bold uppercase rounded bg-[#111] text-[#d4af37] border border-[#333]">
                        {event.status.replace('_', ' ')}
                    </span>
                </div>

                {/* MODIFICATION HISTORY */}
                {requests.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-bold text-[#d4af37]">Modification History</h3>
                        {requests.map(req => (
                            <div key={req.id} className={`p-4 rounded border-l-4 bg-[#0a0a0a] shadow-md ${
                                req.status === 'pending' ? 'border-yellow-500' : 
                                req.status === 'accepted' ? 'border-green-500' : 'border-red-500'
                            }`}>
                                <p className="font-semibold text-gray-200">Venue: <span className="text-white">{req.venues?.name}</span></p>
                                <p className="text-sm text-gray-400">Date: {new Date(req.proposed_date).toDateString()}</p>
                                <p className="text-sm italic text-gray-500 mt-1">"{req.request_details}"</p>
                                
                                {req.status === 'pending' && role === 'client' && (
                                    <div className="mt-4 flex gap-3">
                                        <button onClick={() => handleResponse(req.id, 'accept')} className="bg-green-600/20 text-green-500 border border-green-500 px-4 py-1 rounded hover:bg-green-600 hover:text-white transition">Accept</button>
                                        <button onClick={() => handleResponse(req.id, 'reject')} className="bg-red-600/20 text-red-500 border border-red-500 px-4 py-1 rounded hover:bg-red-600 hover:text-white transition">Reject</button>
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

                {/* ✅ NON-ASSIGNED MANAGERS: READ ONLY NOTICE */}
                {role === 'manager' && !isAssignedManager && (
                    <div className="dash-card border-l-4 border-l-[#333] text-center p-6 bg-[#0a0a0a]">
                        <p className="text-gray-400 italic">
                            👀 You are viewing this event in Read-Only mode because it is assigned to another manager in your department.
                        </p>
                    </div>
                )}

                {/* ✅ ONLY ASSIGNED MANAGER ACTIONS */}
                {isAssignedManager && !hasPendingRequest && (
                    <div className="dash-card">
                        
                        {/* OPTION A: Approve (Consideration -> In Progress) */}
                        {event.status === 'consideration' && (
                            <div className="mb-8 border-b border-[#333] pb-6">
                                <h3 className="text-lg font-bold text-green-500 mb-2">Option A: Approve Event</h3>
                                <p className="text-sm text-gray-400 mb-4">Accept current details to start the event.</p>
                                <button onClick={handleApproveEvent} className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-500 transition shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                                    Accept & Start Event
                                </button>
                            </div>
                        )}

                        {/* OPTION B: Mark as Completed (In Progress -> Completed) */}
                        {event.status === 'in_progress' && (
                            <div className="mb-8 border-b border-[#333] pb-6">
                                <h3 className="text-lg font-bold mb-2 text-[#d4af37]">Event Actions</h3>
                                <button onClick={handleCompleteEvent} className="dash-btn flex items-center gap-2">
                                    🏁 Mark Event as Completed
                                </button>
                            </div>
                        )}

                        {/* OPTION C: Modify */}
                        <h3 className="text-lg font-bold text-[#d4af37] mb-4">
                            {event.status === 'consideration' ? 'Option B: Propose Modification' : 'Propose Modification'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="date" 
                                className="dash-input" 
                                value={form.date} 
                                onChange={e => setForm({ ...form, date: e.target.value })} 
                            />
                            <select 
                                className="dash-input" 
                                value={form.venue_id} 
                                onChange={e => setForm({ ...form, venue_id: e.target.value })}
                            >
                                <option value="" className="text-gray-500">Select Venue</option>
                                {venues.map(v => <option key={v.id} value={v.id} className="bg-black text-[#d4af37]">{v.name}</option>)}
                            </select>
                            <input 
                                className="dash-input md:col-span-2" 
                                placeholder="Reason for change" 
                                value={form.notes} 
                                onChange={e => setForm({ ...form, notes: e.target.value })} 
                            />
                        </div>
                        <button onClick={handleSubmitProposal} className="dash-btn mt-6">
                            Send Proposal
                        </button>
                    </div>
                )}

                {isAssignedManager && hasPendingRequest && (
                    <p className="mt-6 text-center italic text-[#d4af37] opacity-80">
                        ⏳ Waiting for client response to the pending modification.
                    </p>
                )}
            </div>
        </div>
    );
};

export default EventModifications;