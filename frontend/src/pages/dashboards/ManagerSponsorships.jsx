import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';

// --- NEW: Reusable Collapsible Section for Approvals ---
const CollapsibleSection = ({ title, count, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[#333] rounded mb-4 bg-[#0a0a0a] overflow-hidden">
            <div 
                className="p-3 flex justify-between items-center cursor-pointer bg-[#111] hover:bg-[#1a1a1a] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-2">
                    {title}
                    <span className="bg-[#222] border border-[#444] text-[#ccc] px-2 py-0.5 rounded text-xs">{count}</span>
                </h3>
                <div className="text-[#d4af37] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 border-t border-[#333]">
                    {children}
                </div>
            </div>
        </div>
    );
};

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

    // Finance Approval State
    const [approvalEvents, setApprovalEvents] = useState([]);
    const [financeMsgs, setFinanceMsgs] = useState({});
    
    // Store the current manager's ID to check ownership
    const [managerId, setManagerId] = useState(null);

    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setManagerId(user?.id);

            const [sponsorRes, historyRes, eventsRes] = await Promise.all([
                api.get('/sponsors/list'),
                api.get('/sponsors/sent-requests'),
                supabase.from('events')
                    .select('id, title, finance_status, finance_client_feedback, sponsorships(id), client:profiles!client_id(full_name, email)')
                    .eq('assigned_manager_id', user?.id)
                    .in('status', ['consideration', 'in_progress'])
            ]);
            
            setSponsors(sponsorRes.data || []);
            setHistory(historyRes.data || []);
            
            const eventsWithSponsors = (eventsRes.data || []).filter(e => e.sponsorships && e.sponsorships.length > 0);
            setApprovalEvents(eventsWithSponsors);

        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 1. SEND NEW REQUEST (Draft Plan)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/sponsors/request', formData);
            alert("Added to Plan! (Sponsor will not be notified until Client approves)");
            setFormData({ event_id: '', sponsor_id: '', amount: '', request_note: '' }); 
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
                status: 'pending' 
            });
            alert("Counter-offer sent!");
            setEditingId(null);
            loadInitialData();
        } catch (err) { alert("Error sending counter"); }
    };

    // 4. SUBMIT FINANCE PLAN TO CLIENT
    const handleFinanceMsgChange = (id, val) => {
        setFinanceMsgs(prev => ({ ...prev, [id]: val }));
    };

    const handleFinanceSubmit = async (eventId) => {
        setSubmitting(true);
        try {
            await api.post(`/events/${eventId}/finance/submit`, { message: financeMsgs[eventId] || '' });
            alert("Sent to client for approval!");
            setFinanceMsgs(prev => ({ ...prev, [eventId]: '' }));
            loadInitialData();
        } catch(err) {
            alert(err.response?.data?.error || "Error sending to client");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Data Grouping for Approvals ---
    const pendingEvents = approvalEvents.filter(ev => !ev.finance_status || ev.finance_status === 'draft' || ev.finance_status === 'pending_client');
    const approvedEvents = approvalEvents.filter(ev => ev.finance_status === 'approved');
    const rejectedEvents = approvalEvents.filter(ev => ev.finance_status === 'rejected');

    const renderApprovalCard = (ev) => (
        <div key={ev.id} className="p-4 border border-[#333] rounded bg-[#111] mb-4 last:mb-0">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-gray-200">{ev.title}</h4>
                    {ev.client && (
                        <p className="text-[11px] text-gray-400 mt-1">
                            👤 <span className="font-medium text-gray-300">{ev.client.full_name}</span> • <a href={`mailto:${ev.client.email}`} className="text-[#d4af37] hover:underline">{ev.client.email}</a>
                        </p>
                    )}
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border mt-1 ${
                    ev.finance_status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                    ev.finance_status === 'pending_client' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 
                    ev.finance_status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                    'bg-[#222] text-gray-400 border-[#444]'
                }`}>
                    {ev.finance_status || 'Draft'}
                </span>
            </div>

            {ev.finance_status === 'approved' && (
                <p className="text-xs text-green-500 font-bold mt-2">✅ Client approved. Sponsors notified.</p>
            )}

            {ev.finance_status === 'pending_client' && (
                <p className="text-xs text-yellow-500 font-bold mt-2">⏳ Waiting for client response...</p>
            )}

            {(!ev.finance_status || ev.finance_status === 'draft' || ev.finance_status === 'rejected') && (
                <div className="mt-3 border-t border-[#333] pt-3">
                    {ev.finance_status === 'rejected' && (
                        <div className="mb-3 p-2 bg-red-900/20 border-l-2 border-red-500 text-red-300 text-xs">
                            <strong className="block text-red-400 mb-1">Client Feedback:</strong>
                            {ev.finance_client_feedback}
                        </div>
                    )}
                    
                    <textarea 
                        className="dash-input w-full h-16 text-sm mb-2" 
                        placeholder="Add a message to the client explaining the sponsorships..."
                        value={financeMsgs[ev.id] || ''} 
                        onChange={e => handleFinanceMsgChange(ev.id, e.target.value)}
                    />
                    <button 
                        disabled={submitting} 
                        onClick={() => handleFinanceSubmit(ev.id)} 
                        className="dash-btn w-full !py-2 !text-sm"
                    >
                        Send Plan to Client
                    </button>
                </div>
            )}
        </div>
    );

    if (loading) return <div className="p-4 text-center text-[#d4af37]">Loading Data...</div>;

    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- CREATE REQUEST FORM --- */}
                <div className="dash-card h-fit">
                    <h2 className="text-xl font-bold text-[#d4af37] mb-4">💰 Build Sponsorship Plan</h2>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Event</label>
                            <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input" required>
                                <option value="" className="text-gray-500">-- Select Active Event --</option>
                                {(activeEvents || []).map(ev => {
                                    const canWrite = ev.assigned_manager_id === managerId;
                                    return (
                                        <option 
                                            key={ev.id} 
                                            value={ev.id} 
                                            disabled={!canWrite}
                                            className={canWrite ? "bg-black text-[#d4af37]" : "bg-gray-900 text-gray-600 italic"}
                                        >
                                            {ev.title} ({ev.subtype_name}) {canWrite ? '' : '— [READ-ONLY]'}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount ($)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="5000" className="dash-input" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Note to Sponsor</label>
                                <input name="request_note" value={formData.request_note} onChange={handleChange} placeholder="Brief pitch..." className="dash-input" />
                            </div>
                        </div>

                        <button disabled={submitting} type="submit" className="dash-btn mt-2">
                            {submitting ? "Saving..." : "Add to Proposed Plan"}
                        </button>
                    </form>
                </div>

                {/* --- CLIENT FINANCE APPROVALS --- */}
                <div className="dash-card h-fit">
                    <h2 className="text-xl font-bold text-[#d4af37] mb-4">📋 Client Approvals</h2>
                    
                    {approvalEvents.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No events currently have sponsorships attached.</p>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <CollapsibleSection title="⏳ Pending & Draft" count={pendingEvents.length} defaultOpen={true}>
                                {pendingEvents.length > 0 ? pendingEvents.map(renderApprovalCard) : <p className="text-gray-500 text-xs italic">No pending plans.</p>}
                            </CollapsibleSection>

                            <CollapsibleSection title="❌ Rejected Plans" count={rejectedEvents.length}>
                                {rejectedEvents.length > 0 ? rejectedEvents.map(renderApprovalCard) : <p className="text-gray-500 text-xs italic">No rejected plans.</p>}
                            </CollapsibleSection>

                            <CollapsibleSection title="✅ Approved Plans" count={approvedEvents.length}>
                                {approvedEvents.length > 0 ? approvedEvents.map(renderApprovalCard) : <p className="text-gray-500 text-xs italic">No approved plans.</p>}
                            </CollapsibleSection>
                        </div>
                    )}
                </div>

            </div>

            {/* --- HISTORY & NEGOTIATIONS --- */}
            <div className="dash-card">
                <h3 className="text-lg font-bold text-[#d4af37] mb-4">Sponsorship History</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 && <p className="text-gray-500 italic">No requests found.</p>}
                    
                    {history.map(req => {
                        const isApprovedByClient = req.events?.finance_status === 'approved';

                        return (
                            <div key={req.id} className={`p-4 border rounded shadow-sm ${
                                req.status === 'negotiating' ? 'bg-[#1a1300] border-orange-500/50' : 'bg-[#0a0a0a] border-[#333]'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-bold text-gray-200 block text-lg">{req.events?.title}</span>
                                        
                                        {/* Sponsor Display */}
                                        <div className="text-xs text-gray-400 flex items-center flex-wrap mt-1">
                                            <span className="mr-1">🏢 Sponsor:</span>
                                            {req.profiles?.company_name ? (
                                                <>
                                                    <span className="font-semibold text-gray-300">{req.profiles.company_name}</span>
                                                    <span className="text-gray-500 ml-1">({req.profiles.full_name})</span>
                                                </>
                                            ) : (
                                                <span className="font-semibold text-gray-300">{req.profiles?.full_name}</span>
                                            )}
                                            
                                            {req.profiles?.email && (
                                                <span className="ml-2 text-[#d4af37] opacity-80">
                                                    • ✉️ <a href={`mailto:${req.profiles.email}`} className="hover:underline">{req.profiles.email}</a>
                                                </span>
                                            )}
                                        </div>

                                        {/* 👇 NEW: Client Display (Needs backend update to fetch client) */}
                                        {req.events?.client && (
                                            <div className="text-[11px] text-gray-500 mt-1 flex items-center flex-wrap">
                                                <span className="mr-1">👤 Client:</span> 
                                                <span className="text-gray-300 font-medium">{req.events.client.full_name}</span>
                                                {req.events.client.email && (
                                                    <span className="ml-2 text-[#d4af37] opacity-80">
                                                        • ✉️ <a href={`mailto:${req.events.client.email}`} className="hover:underline">{req.events.client.email}</a>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border mt-1 ${
                                        !isApprovedByClient ? 'bg-gray-800 text-gray-400 border-gray-600' :
                                        req.status === 'negotiating' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 
                                        req.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                                        req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                                        'bg-[#222] text-gray-400 border-[#444]'
                                    }`}>
                                        {!isApprovedByClient ? 'Draft (Awaiting Client)' : req.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xl font-bold text-[#d4af37]">${req.amount}</span>
                                    {req.status === 'negotiating' && isApprovedByClient && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAcceptOffer(req)} className="text-[#03823c] hover:text-[#03823c] text-sm font-bold underline transition">Accept</button>
                                            <button onClick={() => { setEditingId(req.id); setEditForm({ amount: req.amount, note: '' }); }} className="text-[#04305c] hover:text-[#04305c] text-sm font-bold underline transition">Counter</button>
                                        </div>
                                    )}
                                </div>

                                {/* Counter Form */}
                                {editingId === req.id && isApprovedByClient && (
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
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ManagerSponsorships;