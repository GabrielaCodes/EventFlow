import { useState, useEffect } from 'react';
import api from '../../services/api';

const MasterRequestApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [view, setView] = useState('pending');
    const [loading, setLoading] = useState(false);
    
    const [rejectId, setRejectId] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => { loadRequests(); }, [view]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/coordinator/master-requests?view=${view}`);
            setRequests(data || []);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleProcess = async (id, action) => {
        if (action === 'reject' && !reason) return alert("Please provide a reason.");
        try {
            await api.patch('/coordinator/master-requests/process', { id, action, rejection_reason: reason });
            setRejectId(null); setReason(''); loadRequests(); 
        } catch (err) { alert("Action failed"); }
    };

    return (
        <div className="bg-[var(--surface-color)] p-6 rounded shadow border border-[#333] min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--gold-main)]">Resource Requests</h2>
                
                <div className="flex bg-[#111] rounded p-1 border border-[#333]">
                    <button 
                        onClick={() => setView('pending')}
                        className={`px-4 py-1.5 text-sm font-bold rounded transition ${view === 'pending' ? 'bg-[var(--surface-color)] shadow text-[var(--gold-main)]' : 'text-[var(--text-secondary)]'}`}
                        style={{ padding: '0.375rem 1rem', background: view === 'pending' ? 'var(--surface-color)' : 'transparent' }}
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setView('history')}
                        className={`px-4 py-1.5 text-sm font-bold rounded transition ${view === 'history' ? 'bg-[var(--surface-color)] shadow text-[var(--gold-main)]' : 'text-[var(--text-secondary)]'}`}
                        style={{ padding: '0.375rem 1rem', background: view === 'history' ? 'var(--surface-color)' : 'transparent' }}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? <div className="text-center p-10 text-[var(--text-secondary)]">Loading...</div> : (
                <>
                    {requests.length === 0 ? (
                        <p className="text-[var(--text-secondary)] italic text-center py-10">No {view} requests found.</p>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(req => (
                                <div key={req.id} className={`border border-[#333] p-4 rounded flex flex-col md:flex-row justify-between gap-4 ${view === 'history' ? 'bg-[#111] opacity-90' : 'bg-[#1a1a1a] shadow-sm'}`}>
                                    
                                    <div className="flex-1">
                                        <div className="flex gap-2 items-center mb-1">
                                            <span className="bg-[#222] text-[var(--gold-main)] border border-[#333] px-2 py-0.5 rounded text-xs uppercase font-bold">{req.type}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                From: <span className="font-semibold text-[var(--text-primary)]">{req.profiles?.full_name}</span>
                                                <span className="mx-1">•</span> 
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-[var(--text-primary)]">{req.request_data.name}</p>
                                            {view === 'history' && (
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${
                                                    req.status === 'approved' ? 'bg-green-900 text-green-200 border-green-700' : 'bg-red-900 text-red-200 border-red-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>

                                        {req.request_data.location && <p className="text-sm text-[var(--text-secondary)]">📍 {req.request_data.location}</p>}
                                        {req.request_data.capacity && <p className="text-sm text-[var(--text-secondary)]">👥 Cap: {req.request_data.capacity}</p>}
                                        
                                        {req.request_note && (
                                            <p className="text-sm bg-[#111] p-2 mt-2 rounded italic border border-[#333] text-[var(--text-secondary)] inline-block">
                                                "{req.request_note}"
                                            </p>
                                        )}

                                        {req.status === 'rejected' && req.rejection_reason && (
                                            <p className="text-sm text-red-400 mt-2 font-medium">
                                                🚫 Reason: {req.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    {view === 'pending' && (
                                        <div className="flex flex-col gap-2 min-w-[200px] border-l pl-4 border-[#333]">
                                            {rejectId === req.id ? (
                                                <div className="animate-fade-in">
                                                    <textarea 
                                                        className="w-full text-sm mb-2 h-20" 
                                                        placeholder="Reason for rejection..." 
                                                        value={reason} onChange={e => setReason(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleProcess(req.id, 'reject')} className="w-full text-xs" style={{ padding: '0.25rem' }}>Confirm</button>
                                                        <button onClick={() => setRejectId(null)} className="w-full text-xs bg-[#333] text-[var(--text-primary)] hover:bg-[#444]" style={{ padding: '0.25rem' }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleProcess(req.id, 'approve')} className="text-sm" style={{ padding: '0.5rem', backgroundColor: '#16a34a', color: 'white' }}>
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => setRejectId(req.id)} className="text-sm" style={{ padding: '0.5rem', backgroundColor: '#dc2626', color: 'white' }}>
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