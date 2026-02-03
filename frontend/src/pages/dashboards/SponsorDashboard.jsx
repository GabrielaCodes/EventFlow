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
            case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'negotiating': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Sponsorship Portal</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((req) => (
                    <div key={req.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${req.status === 'pending' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                        
                        {/* Header */}
                        <div className="bg-gray-900 p-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-white font-bold truncate w-48" title={req.events?.title}>{req.events?.title}</h3>
                                <p className="text-gray-400 text-xs">{new Date(req.events?.event_date).toDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${getStatusColor(req.status)}`}>
                                {req.status}
                            </span>
                        </div>

                        <div className="p-6">
                            {/* Negotiation Input View */}
                            {negotiatingId === req.id ? (
                                <div className="space-y-3 animate-fade-in">
                                    <p className="font-bold text-sm text-gray-700">Your Counter Offer:</p>
                                    <input 
                                        type="number" 
                                        placeholder="Amount" 
                                        className="w-full border p-2 rounded"
                                        value={negForm.amount}
                                        onChange={e => setNegForm({...negForm, amount: e.target.value})}
                                    />
                                    <textarea 
                                        placeholder="Note / Condition" 
                                        className="w-full border p-2 rounded h-20"
                                        value={negForm.note}
                                        onChange={e => setNegForm({...negForm, note: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction(req.id, 'negotiating')} className="bg-indigo-600 text-white px-4 py-2 rounded w-full hover:bg-indigo-700">Send Offer</button>
                                        <button onClick={() => setNegotiatingId(null)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                // Standard View
                                <>
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 font-bold uppercase">Requested Amount</p>
                                        <p className="text-3xl font-extrabold text-gray-800">${req.amount?.toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="space-y-2 mb-6 text-sm">
                                        {req.request_note && (
                                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                                <span className="font-bold text-blue-800 block mb-1">Manager Says:</span>
                                                "{req.request_note}"
                                            </div>
                                        )}
                                        {req.sponsor_note && (
                                            <div className="bg-orange-50 p-3 rounded border border-orange-100 text-right">
                                                <span className="font-bold text-orange-800 block mb-1">You Said:</span>
                                                "{req.sponsor_note}"
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions: Always allow negotiation unless paid/finalized logic exists */}
                                    <div className="flex gap-2">
                                        {req.status !== 'accepted' && (
                                            <button 
                                                onClick={() => handleAction(req.id, 'accepted')} 
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium shadow-sm transition"
                                            >
                                                Accept
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => startNegotiation(req)} 
                                            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded font-medium transition"
                                        >
                                            {req.status === 'rejected' ? 'Re-Open' : 'Counter'}
                                        </button>

                                        {req.status !== 'rejected' && (
                                            <button 
                                                onClick={() => handleAction(req.id, 'rejected')} 
                                                className="flex-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 py-2 rounded font-medium transition"
                                            >
                                                Reject
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