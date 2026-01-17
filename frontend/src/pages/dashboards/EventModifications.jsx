import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EventModifications = () => {
    const { id } = useParams(); // Event ID
    const { role, user } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [requests, setRequests] = useState([]);
    const [venues, setVenues] = useState([]);
    
    // Manager Form State
    const [form, setForm] = useState({ date: '', venue_id: '', notes: '' });

    useEffect(() => { fetchAllData(); }, [id]);

    const fetchAllData = async () => {
        // Parallel fetch: Event details, Pending Requests, Available Venues
        const [ev, reqs, vens] = await Promise.all([
            supabase.from('events').select('*, venues(name)').eq('id', id).single(),
            supabase.from('modification_requests').select('*, venues:proposed_venue_id(name)').eq('event_id', id).eq('status', 'pending'),
            supabase.from('venues').select('id, name')
        ]);

        if (ev.data) setEvent(ev.data);
        if (reqs.data) setRequests(reqs.data);
        if (vens.data) setVenues(vens.data);
    };

    // Helper to go back to correct dashboard
    const handleBack = () => {
        if (role === 'manager') navigate('/manager-dashboard');
        else if (role === 'client') navigate('/client-dashboard');
        else navigate('/'); // Fallback
    };

    // Manager: Send Proposal
    const handleSubmitProposal = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                alert("Error: You are not logged in.");
                return;
            }

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
                alert("Proposal Sent Successfully!");
                setForm({ date: '', venue_id: '', notes: '' });
                fetchAllData();
            } else {
                alert("Server Error: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Network Error: Could not reach backend.");
        }
    };

    // Client: Respond (Accept/Reject)
    const handleResponse = async (reqId, action) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('http://127.0.0.1:5000/api/events/respond', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ modification_id: reqId, action })
            });

            const data = await res.json();

            if (res.ok) {
                alert(action === 'accept' ? "Changes applied!" : "Request rejected.");
                fetchAllData();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        }
    };

    if (!event) return <div className="p-10">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* ✅ NEW: Back Button */}
            <button 
                onClick={handleBack}
                className="mb-6 text-gray-500 hover:text-blue-600 flex items-center gap-2 font-medium transition"
            >
                ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold mb-2">Manage Event: {event.title}</h1>
            <div className="text-gray-600 mb-8 border-b pb-4">
                Current: <strong>{new Date(event.event_date).toDateString()}</strong> at <strong>{event.venues?.name || 'Unassigned'}</strong>
            </div>

            {/* SECTION 1: Pending Modification Requests */}
            {requests.length > 0 ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-8 animate-fade-in">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ Pending Modification Request</h3>
                    {requests.map(req => (
                        <div key={req.id} className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded shadow-sm gap-4">
                            <div>
                                <p className="font-semibold text-gray-800">Change to: {req.venues?.name}</p>
                                <p className="text-sm text-gray-600">New Date: {new Date(req.proposed_date).toDateString()}</p>
                                <p className="text-xs text-gray-500 italic mt-1">Note: "{req.request_details}"</p>
                            </div>
                            
                            {role === 'client' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleResponse(req.id, 'accept')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition">Accept</button>
                                    <button onClick={() => handleResponse(req.id, 'reject')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition">Reject</button>
                                </div>
                            )}
                            {role === 'manager' && <span className="text-sm text-gray-400 italic">Waiting for client response...</span>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded mb-8 text-blue-800">
                    <p className="italic">No pending modifications active.</p>
                </div>
            )}

            {/* SECTION 2: Manager Proposal Form */}
            {role === 'manager' && requests.length === 0 && (
                <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Propose a Change</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">New Date</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded mt-1"
                                onChange={e => setForm({...form, date: e.target.value})}
                                value={form.date}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">New Venue</label>
                            <select 
                                className="w-full p-2 border rounded mt-1"
                                onChange={e => setForm({...form, venue_id: e.target.value})}
                                value={form.venue_id}
                            >
                                <option value="">Select Venue...</option>
                                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Reason for Change</label>
                            <input 
                                placeholder="e.g. Venue double booked, client requested change..." 
                                className="w-full p-2 border rounded mt-1"
                                onChange={e => setForm({...form, notes: e.target.value})}
                                value={form.notes}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSubmitProposal}
                        className="mt-6 w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">
                        Send Proposal
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventModifications;