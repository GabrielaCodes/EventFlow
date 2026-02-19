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

    if (loading) return <div className="p-4 text-center text-[#d4af37]">Loading Data...</div>;

    return (
        <div className="space-y-8">
            {/* --- CREATE REQUEST FORM --- */}
            <div className="dash-card h-fit">
                <h2 className="text-xl font-bold text-[#d4af37] mb-4">💰 Request Sponsorship</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Event Select */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Event</label>
                        <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input" required>
                            <option value="" className="text-gray-500">-- Select Active Event --</option>
                            {(activeEvents || []).map(ev => (
                                <option key={ev.id} value={ev.id} className="bg-black text-[#d4af37]">{ev.title} ({ev.subtype_name})</option>
                            ))}
                        </select>
                    </div>

                    {/* Sponsor Select */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sponsor</label>
                        <select name="sponsor_id" value={formData.sponsor_id} onChange={handleChange} className="dash-input" required>
                            <option value="" className="text-gray-500">-- Select Sponsor --</option>
                            {sponsors.map(sp => (
                                <option key={sp.id} value={sp.id} className="bg-black text-[#d4af37]">
                                    {sp.company_name ? `${sp.company_name} (${sp.full_name})` : sp.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Note */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount ($)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="5000" className="dash-input" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Note</label>
                            <input name="request_note" value={formData.request_note} onChange={handleChange} placeholder="Brief pitch..." className="dash-input" />
                        </div>
                    </div>

                    <button disabled={submitting} type="submit" className="dash-btn mt-2">
                        {submitting ? "Sending..." : "Send Request"}
                    </button>
                </form>
            </div>

            {/* --- HISTORY & NEGOTIATIONS --- */}
            <div className="dash-card">
                <h3 className="text-lg font-bold text-[#d4af37] mb-4">History</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 && <p className="text-gray-500 italic">No requests found.</p>}
                    
                    {history.map(req => (
                        <div key={req.id} className={`p-4 border rounded shadow-sm ${
                            req.status === 'negotiating' ? 'bg-[#1a1300] border-orange-500/50' : 'bg-[#0a0a0a] border-[#333]'
                        }`}>
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <span className="font-bold text-gray-200 block">{req.events?.title}</span>
                                    
                                    <div className="text-xs text-gray-400">
                                        {req.profiles?.company_name ? (
                                            <>
                                                <span className="font-semibold text-gray-300">{req.profiles.company_name}</span>
                                                <span className="text-gray-500 ml-1">({req.profiles.full_name})</span>
                                            </>
                                        ) : (
                                            <span className="font-semibold text-gray-300">{req.profiles?.full_name}</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                                    req.status === 'negotiating' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 
                                    req.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                                    req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                                    'bg-[#222] text-gray-400 border-[#444]'
                                }`}>{req.status}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-[#d4af37]">${req.amount}</span>
                                {req.status === 'negotiating' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcceptOffer(req)} className="text-green-500 hover:text-green-400 text-sm font-bold underline transition">Accept</button>
                                        <button onClick={() => { setEditingId(req.id); setEditForm({ amount: req.amount, note: '' }); }} className="text-[#d4af37] hover:text-white text-sm font-bold underline transition">Counter</button>
                                    </div>
                                )}
                            </div>

                            {/* Counter Form */}
                            {editingId === req.id && (
                                <div className="mt-4 p-4 bg-[#050505] border border-[#333] rounded shadow-inner animate-fade-in">
                                    <p className="text-xs font-bold text-[#d4af37] mb-2 uppercase tracking-wider">Counter Proposal:</p>
                                    <input type="number" className="dash-input mb-3 !p-2" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} placeholder="New Amount" />
                                    <input placeholder="Note..." className="dash-input mb-3 !p-2" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} />
                                    <div className="flex gap-3">
                                        <button onClick={() => handleCounterUpdate(req.id)} className="dash-btn !py-1 !px-4 !text-xs">Send</button>
                                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 text-xs font-semibold transition">Cancel</button>
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