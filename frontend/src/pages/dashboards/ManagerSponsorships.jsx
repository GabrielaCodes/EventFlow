import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManagerSponsorships = ({ activeEvents }) => {
    const [sponsors, setSponsors] = useState([]);
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Request Form State
    const [formData, setFormData] = useState({ event_id: '', sponsor_id: '', amount: '', request_note: '' });

    // Negotiation State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', note: '' });

    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        try {
            const [sponsorRes, historyRes] = await Promise.all([
                api.get('/sponsors/list'),
                api.get('/sponsors/sent-requests')
            ]);
            setSponsors(sponsorRes.data || []);
            setHistory(historyRes.data || []);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 1. SEND NEW REQUEST
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/sponsors/request', formData);
            alert("Request Sent!");
            setFormData({ event_id: '', sponsor_id: '', amount: '', request_note: '' }); // Clear form
            loadInitialData();
        } catch (err) { 
            alert(err.response?.data?.error || "Error sending request"); 
        } finally { 
            setSubmitting(false); 
        }
    };

    // 2. ACCEPT OFFER
    const handleAcceptOffer = async (req) => {
        if(!window.confirm("Accept this sponsorship offer?")) return;
        try {
            await api.post('/sponsors/request', {
                sponsorship_id: req.id,
                amount: req.amount,
                request_note: req.request_note, 
                status: 'accepted'
            });
            alert("Offer Accepted!");
            loadInitialData();
        } catch (err) { alert("Error accepting offer"); }
    };

    // 3. COUNTER OFFER
    const handleCounterUpdate = async (id) => {
        try {
            await api.post('/sponsors/request', {
                sponsorship_id: id,
                amount: editForm.amount,
                request_note: editForm.note,
                status: 'pending' // Send back to sponsor
            });
            alert("Counter-offer sent!");
            setEditingId(null);
            loadInitialData();
        } catch (err) { alert("Error sending counter"); }
    };

    if (loading) return <div className="p-4 text-center">Loading Data...</div>;

    return (
        <div className="space-y-8">
            {/* --- CREATE REQUEST FORM --- */}
            <div className="bg-white p-6 rounded shadow h-fit border border-purple-100">
                <h2 className="text-xl font-bold text-purple-700 mb-4">💰 Request Sponsorship</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Event Select */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event</label>
                        <select name="event_id" value={formData.event_id} onChange={handleChange} className="w-full p-2 border rounded" required>
                            <option value="">-- Select Active Event --</option>
                            {(activeEvents || []).map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title} ({ev.subtype_name})</option>
                            ))}
                        </select>
                    </div>

                    {/* Sponsor Select */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sponsor</label>
                        <select name="sponsor_id" value={formData.sponsor_id} onChange={handleChange} className="w-full p-2 border rounded" required>
                            <option value="">-- Select Sponsor --</option>
                            {sponsors.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.company_name ? `${sp.company_name} (${sp.full_name})` : sp.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Note */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount ($)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="5000" className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Note</label>
                            <input name="request_note" value={formData.request_note} onChange={handleChange} placeholder="Brief pitch..." className="w-full p-2 border rounded" />
                        </div>
                    </div>

                    <button disabled={submitting} type="submit" className="bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 transition py-2">
                        {submitting ? "Sending..." : "Send Request"}
                    </button>
                </form>
            </div>

            {/* --- HISTORY & NEGOTIATIONS --- */}
            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">History</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {history.length === 0 && <p className="text-gray-400 italic">No requests found.</p>}
                    
                    {history.map(req => (
                        <div key={req.id} className={`p-4 border rounded ${req.status === 'negotiating' ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <span className="font-bold text-gray-800 block">{req.events?.title}</span>
                                    <span className="text-xs text-gray-500">{req.profiles?.company_name || req.profiles?.full_name}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                                    req.status === 'negotiating' ? 'bg-orange-500 text-white' : 
                                    req.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                    req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                }`}>{req.status}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold">${req.amount}</span>
                                {req.status === 'negotiating' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcceptOffer(req)} className="text-green-600 text-sm font-bold underline">Accept</button>
                                        <button onClick={() => { setEditingId(req.id); setEditForm({ amount: req.amount, note: '' }); }} className="text-blue-600 text-sm font-bold underline">Counter</button>
                                    </div>
                                )}
                            </div>

                            {/* Counter Form */}
                            {editingId === req.id && (
                                <div className="mt-3 p-3 bg-white border rounded shadow-inner animate-fade-in">
                                    <p className="text-xs font-bold text-gray-500 mb-2">Counter Proposal:</p>
                                    <input type="number" className="w-full border p-1 rounded mb-2" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                                    <input placeholder="Note..." className="w-full border p-1 rounded mb-2" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCounterUpdate(req.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Send</button>
                                        <button onClick={() => setEditingId(null)} className="text-gray-500 text-xs">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManagerSponsorships;