import { useState, useEffect } from 'react';
import api from '../../services/api';

const MasterRequestApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [view, setView] = useState('pending'); // 'pending' | 'history'
    const [loading, setLoading] = useState(false);
    
    // Processing State
    const [rejectId, setRejectId] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => { loadRequests(); }, [view]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            // ✅ Pass 'view' param to backend
            const { data } = await api.get(`/coordinator/master-requests?view=${view}`);
            setRequests(data || []);
        } catch (err) { 
            console.error(err); 
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id, action) => {
        if (action === 'reject' && !reason) return alert("Please provide a reason.");
        
        try {
            await api.patch('/coordinator/master-requests/process', {
                id, action, rejection_reason: reason
            });
            setRejectId(null);
            setReason('');
            loadRequests(); 
        } catch (err) {
            alert("Action failed");
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow border min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Resource Requests</h2>
                
                {/* TABS */}
                <div className="flex bg-gray-100 rounded p-1">
                    <button 
                        onClick={() => setView('pending')}
                        className={`px-4 py-1.5 text-sm font-bold rounded transition ${view === 'pending' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setView('history')}
                        className={`px-4 py-1.5 text-sm font-bold rounded transition ${view === 'history' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? <div className="text-center p-10 text-gray-500">Loading...</div> : (
                <>
                    {requests.length === 0 ? (
                        <p className="text-gray-400 italic text-center py-10">No {view} requests found.</p>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className={`border p-4 rounded flex flex-col md:flex-row justify-between gap-4 ${view === 'history' ? 'bg-gray-50 opacity-90' : 'bg-white shadow-sm'}`}>
                                    
                                    {/* Request Details */}
                                    <div className="flex-1">
                                        <div className="flex gap-2 items-center mb-1">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs uppercase font-bold">{req.type}</span>
                                            <span className="text-xs text-gray-500">
                                                From: <span className="font-semibold text-gray-700">{req.profiles?.full_name}</span>
                                                <span className="mx-1">•</span> 
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-gray-800">{req.request_data.name}</p>
                                            {/* Status Badge for History View */}
                                            {view === 'history' && (
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${
                                                    req.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>

                                        {req.request_data.location && <p className="text-sm text-gray-600">📍 {req.request_data.location}</p>}
                                        {req.request_data.capacity && <p className="text-sm text-gray-600">👥 Cap: {req.request_data.capacity}</p>}
                                        
                                        {req.request_note && (
                                            <p className="text-sm bg-gray-50 p-2 mt-2 rounded italic border text-gray-600 inline-block">
                                                "{req.request_note}"
                                            </p>
                                        )}

                                        {/* Show Rejection Reason in History */}
                                        {req.status === 'rejected' && req.rejection_reason && (
                                            <p className="text-sm text-red-600 mt-2 font-medium">
                                                🚫 Reason: {req.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions (Only for Pending) */}
                                    {view === 'pending' && (
                                        <div className="flex flex-col gap-2 min-w-[200px] border-l pl-4 border-gray-100">
                                            {rejectId === req.id ? (
                                                <div className="animate-fade-in">
                                                    <textarea 
                                                        className="w-full border p-2 text-sm rounded mb-2 h-20 focus:ring-2 focus:ring-red-500 outline-none" 
                                                        placeholder="Reason for rejection..." 
                                                        value={reason} onChange={e => setReason(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleProcess(req.id, 'reject')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold w-full shadow-sm">Confirm</button>
                                                        <button onClick={() => setRejectId(null)} className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded text-xs w-full">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleProcess(req.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow-sm text-sm transition">
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => setRejectId(req.id)} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded font-bold shadow-sm text-sm transition">
                                                        ✕ Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MasterRequestApprovals;