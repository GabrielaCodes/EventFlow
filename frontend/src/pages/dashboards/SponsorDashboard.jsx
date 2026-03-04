import { useEffect, useState } from 'react';
import api from '../../services/api';

const SponsorDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Negotiation State
    const [negotiatingId, setNegotiatingId] = useState(null);
    const [negForm, setNegForm] = useState({ amount: '', note: '' });

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/sponsors/requests');
            setRequests(data || []);
        } catch (err) {
            console.error("Failed to load", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (action !== 'negotiating' && !window.confirm(`Confirm ${action}?`)) return;

        try {
            const payload = { sponsorship_id: id, action };
            
            if (action === 'negotiating') {
                payload.amount = negForm.amount;
                payload.sponsor_note = negForm.note;
            }

            await api.patch('/sponsors/respond', payload);
            alert("Updated!");
            setNegotiatingId(null);
            fetchRequests(); 
        } catch (err) {
            alert('Error processing request');
        }
    };

    const startNegotiation = (req) => {
        setNegotiatingId(req.id);
        setNegForm({ amount: req.amount, note: '' });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'accepted': return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50';
            case 'rejected': return 'bg-red-900/30 text-red-400 border-red-500/50';
            case 'negotiating': return 'bg-amber-900/30 text-amber-400 border-amber-500/50';
            default: return 'bg-slate-800 text-slate-300 border-slate-600';
        }
    };

    if (loading) return <div className="p-10 text-center text-amber-500 bg-slate-950 min-h-screen">Loading Excellence...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-slate-950 min-h-screen text-slate-200">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200">
                Sponsorship Portal
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {requests.map((req) => (
                    <div key={req.id} className={`bg-slate-900 rounded-2xl shadow-2xl border transition-all duration-300 ${req.status === 'pending' ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/20' : 'border-slate-800'}`}>
                        
                        {/* Header */}
                        <div className="bg-slate-800/50 p-5 flex justify-between items-start border-b border-slate-700">
                            <div>
                                <h3 className="text-amber-50 font-bold truncate w-40" title={req.events?.title}>{req.events?.title}</h3>
                                <p className="text-amber-500/70 text-xs font-medium uppercase tracking-wider">{new Date(req.events?.event_date).toDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md border tracking-tighter ${getStatusColor(req.status)}`}>
                                {req.status}
                            </span>
                        </div>

                        <div className="p-6">
                            {negotiatingId === req.id ? (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                                    <p className="font-bold text-xs text-amber-500 uppercase">Counter Offer</p>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                        value={negForm.amount}
                                        onChange={e => setNegForm({...negForm, amount: e.target.value})}
                                    />
                                    <textarea 
                                        placeholder="Note / Condition" 
                                        className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-slate-300 h-24 focus:border-amber-500 outline-none resize-none"
                                        value={negForm.note}
                                        onChange={e => setNegForm({...negForm, note: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction(req.id, 'negotiating')} className="bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg w-full hover:bg-amber-500 transition-colors">Submit</button>
                                        <button onClick={() => setNegotiatingId(null)} className="text-slate-400 px-4 py-2 hover:text-white transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Investment Value</p>
                                        <p className="text-4xl font-light text-amber-400 mt-1">
                                            <span className="text-xl mr-1 font-bold opacity-50">$</span>
                                            {req.amount?.toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3 mb-8 text-sm">
                                        {req.request_note && (
                                            <div className="bg-slate-800/80 p-4 rounded-xl border-l-4 border-amber-600">
                                                <span className="font-black text-[10px] text-amber-500 block mb-1 uppercase tracking-tighter">Event Memo</span>
                                                <span className="italic text-slate-300 font-serif">"{req.request_note}"</span>
                                            </div>
                                        )}
                                        {req.sponsor_note && (
                                            <div className="bg-amber-900/10 p-4 rounded-xl border border-amber-900/30 text-right">
                                                <span className="font-black text-[10px] text-amber-400 block mb-1 uppercase">Your Terms</span>
                                                <span className="text-slate-400">"{req.sponsor_note}"</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        {req.status !== 'accepted' && (
                                            <button 
                                                onClick={() => handleAction(req.id, 'accepted')} 
                                                className="flex-1 bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 py-2.5 rounded-lg font-bold shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => startNegotiation(req)} 
                                            className="flex-1 bg-slate-800 border border-slate-700 text-amber-50 hover:bg-slate-700 py-2.5 rounded-lg font-bold transition-all"
                                        >
                                            {req.status === 'rejected' ? 'Review' : 'Counter'}
                                        </button>

                                        {req.status !== 'rejected' && (
                                            <button 
                                                onClick={() => handleAction(req.id, 'rejected')} 
                                                className="px-3 bg-transparent text-red-400 border border-red-900/50 hover:bg-red-900/20 py-2.5 rounded-lg font-medium transition-all"
                                            >
                                                Decline
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SponsorDashboard;