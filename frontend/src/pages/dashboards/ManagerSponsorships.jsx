import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';

// ─── Utility: Status Parsing & Badge Generation ───────────────────────────────
const getFinStatus = (status) => (status || '').toLowerCase().trim();

const getEventBadgeProps = (financeStatus) => {
    const stat = getFinStatus(financeStatus);
    if (stat === 'approved') return { text: 'Approved', className: 'bg-green-500/20 text-green-400 border-green-500/50' };
    if (stat === 'pending_client') return { text: 'Awaiting Client', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    if (stat === 'rejected') return { text: 'Client Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/50' };
    return { text: 'Drafting', className: 'bg-[#222] text-gray-400 border-[#444]' };
};

const getSponsorBadgeProps = (status, financeStatus) => {
    const finStatus = getFinStatus(financeStatus);
    const isApprovedByClient = finStatus === 'approved';

    let badgeText = status || 'Draft'; 
    let badgeClass = 'bg-[#222] text-gray-400 border-[#444]'; 
    
    if (finStatus === 'rejected') {
        badgeText = 'Client Rejected';
        badgeClass = 'bg-red-900/20 text-red-400 border-red-800';
    } else if (!isApprovedByClient) {
        badgeText = finStatus === 'pending_client' ? 'Awaiting Client' : 'Drafting Plan';
        badgeClass = 'bg-gray-800 text-gray-400 border-gray-600';
    } else {
        if (status === 'negotiating') badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/50';
        else if (status === 'accepted') badgeClass = 'bg-green-500/20 text-green-400 border-green-500/50';
        else if (status === 'rejected') badgeClass = 'bg-red-500/20 text-red-400 border-red-500/50';
        else if (status === 'pending') badgeClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
    return { text: badgeText.replace('_', ' '), className: badgeClass };
};

// ─── Inline Message Thread ──────────────────────────────────────────────────
const InlineThread = ({ sentTitle, sentMsg, receivedTitle, receivedMsg }) => {
    if (!sentMsg && !receivedMsg) return null;
    return (
        <div className="mt-3 w-full bg-[#050505] border border-[#222] rounded p-4 shadow-inner">
            {sentMsg && (
                <div className="mb-4 last:mb-0">
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{sentTitle}</span>
                    <p className="text-sm text-[#d4af37] whitespace-pre-wrap leading-relaxed">{sentMsg}</p>
                </div>
            )}
            {receivedMsg && (
                <div className={`${sentMsg ? 'border-t border-[#222] pt-4' : ''}`}>
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{receivedTitle}</span>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{receivedMsg}</p>
                </div>
            )}
        </div>
    );
};

// ─── Reusable Collapsible Section ───────────────────────────────────────────
const CollapsibleSection = ({ title, count, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[#333] rounded mb-3 bg-[#0a0a0a] overflow-hidden">
            <div 
                className="p-3 flex justify-between items-center cursor-pointer bg-[#111] hover:bg-[#161616] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-xs font-bold text-[#d4af37] flex items-center gap-2 uppercase tracking-wider">
                    {title}
                    <span className="bg-[#222] border border-[#444] text-[#ccc] px-2 py-0.5 rounded text-[10px]">{count}</span>
                </h3>
                <div className="text-[#d4af37] transition-transform duration-300 text-xs" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-3 border-t border-[#333] bg-[#0a0a0a]">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const ManagerSponsorships = ({ activeEvents }) => {
    const [sponsors, setSponsors] = useState([]);
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ event_id: '', sponsor_id: '', amount: '', request_note: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', note: '' });

    const [approvalEvents, setApprovalEvents] = useState([]);
    const [financeMsgs, setFinanceMsgs] = useState({});
    
    const [managerId, setManagerId] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('all');

    // Panel State
    const [panelData, setPanelData] = useState(null); // { type: 'event' | 'sponsorship', data: {} }

    useEffect(() => { loadInitialData(); }, []);

    // Sync panel data if underlying lists update while panel is open
    useEffect(() => {
        if (panelData) {
            if (panelData.type === 'event') {
                const updated = approvalEvents.find(e => e.id === panelData.data.id);
                if (updated) setPanelData({ type: 'event', data: updated });
            } else if (panelData.type === 'sponsorship') {
                const updated = history.find(h => h.id === panelData.data.id);
                if (updated) setPanelData({ type: 'sponsorship', data: updated });
            }
        }
    }, [approvalEvents, history]);

    const loadInitialData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setManagerId(user?.id);

            const [sponsorRes, historyRes, eventsRes] = await Promise.all([
                api.get('/sponsors/list'),
                api.get('/sponsors/sent-requests'),
                supabase.from('events')
                    .select(`
                        id, title, finance_status, finance_client_feedback, finance_manager_message,
                        client:profiles!events_client_id_fkey(full_name, email),
                        sponsorships(
                            id, amount, status, request_note, sponsor_note,
                            sponsor:profiles!sponsorships_sponsor_id_fkey(full_name, company_name, email)
                        )
                    `)
                    .eq('assigned_manager_id', user?.id)
            ]);
            
            setSponsors(sponsorRes.data || []);
            
            const rawEvents = eventsRes.data || [];
            
            // FIX: The backend query doesn't return manager/client messages in history. 
            // We map those messages directly from the active events list so the panel has them!
            const mappedHistory = (historyRes.data || []).map(req => {
                const matchingEvent = rawEvents.find(e => e.title === req.events?.title);
                if (matchingEvent) {
                    req.events = {
                        ...req.events,
                        id: matchingEvent.id,
                        finance_manager_message: matchingEvent.finance_manager_message,
                        finance_client_feedback: matchingEvent.finance_client_feedback
                    };
                }
                return req;
            });
            setHistory(mappedHistory);
            
            const eventsWithSponsors = rawEvents.filter(e => e.sponsorships && e.sponsorships.length > 0);
            setApprovalEvents(eventsWithSponsors);

        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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

    // ── Actions ──────────────────────────────────────────────────────────────
    const handleAcceptOffer = async (req) => {
        if(!window.confirm("Accept this sponsorship offer?")) return;
        try {
            await api.post('/sponsors/request', { sponsorship_id: req.id, amount: req.amount, request_note: req.request_note, status: 'accepted' });
            loadInitialData();
        } catch (err) { alert("Error accepting offer"); }
    };

    const handleCounterUpdate = async (id) => {
        try {
            await api.post('/sponsors/request', { sponsorship_id: id, amount: editForm.amount, request_note: editForm.note, status: 'pending' });
            setEditingId(null);
            loadInitialData();
        } catch (err) { alert("Error sending counter"); }
    };

    const handleRejectOffer = async (req) => {
        if(!window.confirm("Are you sure you want to reject this offer? This cannot be undone.")) return;
        try {
            await api.post('/sponsors/request', { sponsorship_id: req.id, amount: req.amount, request_note: req.request_note, status: 'rejected' });
            loadInitialData();
        } catch (err) { alert("Error rejecting offer"); }
    };

    const handleFinanceSubmit = async (eventId) => {
        setSubmitting(true);
        try {
            await api.post(`/events/${eventId}/finance/submit`, { message: financeMsgs[eventId] || '' });
            alert("Sent to client for approval!");
            setFinanceMsgs(prev => ({ ...prev, [eventId]: '' }));
            loadInitialData();
            setPanelData(null); // Close panel on major flow change
        } catch(err) { alert(err.response?.data?.error || "Error sending to client"); } 
        finally { setSubmitting(false); }
    };

    // ─── Compact Rendering Logic ─────────────────────────────────────────────
    
    const pendingEvents = approvalEvents.filter(ev => {
        const stat = getFinStatus(ev.finance_status);
        return !stat || stat === 'draft' || stat === 'pending_client';
    });
    const approvedEvents = approvalEvents.filter(ev => getFinStatus(ev.finance_status) === 'approved');
    const rejectedEvents = approvalEvents.filter(ev => getFinStatus(ev.finance_status) === 'rejected');

    const renderCompactApprovalRow = (ev) => {
        const badge = getEventBadgeProps(ev.finance_status);
        return (
            <div 
                key={ev.id} 
                onClick={() => setPanelData({ type: 'event', data: ev })}
                className="p-3 border border-[#333] rounded bg-[#111] mb-2 last:mb-0 cursor-pointer hover:border-[#d4af37] hover:bg-[#161616] transition-all flex justify-between items-center group"
            >
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-gray-200 text-sm truncate">{ev.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        {ev.sponsorships?.length || 0} Sponsors Attached
                    </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badge.className}`}>
                        {badge.text}
                    </span>
                    <span className="text-[10px] text-[#d4af37] mt-1 group-hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details ➔
                    </span>
                </div>
            </div>
        );
    };

    const filteredHistory = history.filter(req => {
        const finStatus = getFinStatus(req.events?.finance_status);
        if (historyFilter === 'all') return true;
        if (historyFilter === 'awaiting_client') return finStatus === 'pending_client' || !finStatus || finStatus === 'draft';
        if (historyFilter === 'rejected_client') return finStatus === 'rejected';
        
        if (finStatus !== 'approved') return false; 
        return req.status === historyFilter;
    });

    if (loading) return <div className="p-4 text-center text-[#d4af37]">Loading Data...</div>;

    return (
        <div className="space-y-8 relative">
            
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
                                        <option key={ev.id} value={ev.id} disabled={!canWrite} className={canWrite ? "bg-black text-[#d4af37]" : "bg-gray-900 text-gray-600 italic"}>
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

                {/* --- CLIENT FINANCE APPROVALS (Compact) --- */}
                <div className="dash-card h-fit">
                    <h2 className="text-xl font-bold text-[#d4af37] mb-4">📋 Client Approvals</h2>
                    {approvalEvents.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No events currently have sponsorships attached.</p>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <CollapsibleSection title="⏳ Pending & Draft" count={pendingEvents.length} defaultOpen={true}>
                                {pendingEvents.length > 0 ? pendingEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic p-2">No pending plans.</p>}
                            </CollapsibleSection>
                            <CollapsibleSection title="❌ Rejected Plans" count={rejectedEvents.length} defaultOpen={true}>
                                {rejectedEvents.length > 0 ? rejectedEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic p-2">No rejected plans.</p>}
                            </CollapsibleSection>
                            <CollapsibleSection title="✅ Approved Plans" count={approvedEvents.length}>
                                {approvedEvents.length > 0 ? approvedEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic p-2">No approved plans.</p>}
                            </CollapsibleSection>
                        </div>
                    )}
                </div>
            </div>

            {/* --- HISTORY & NEGOTIATIONS (Compact) --- */}
            <div className="dash-card">
                <h3 className="text-lg font-bold text-[#d4af37] mb-4">Sponsorship History</h3>
                
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                    {[
                        { id: 'all', label: 'All History' }, { id: 'awaiting_client', label: 'Awaiting Client' },
                        { id: 'rejected_client', label: 'Rejected by Client' }, { id: 'pending', label: 'Pending Sponsor' },
                        { id: 'negotiating', label: 'Negotiating' }, { id: 'accepted', label: 'Accepted' }, { id: 'rejected', label: 'Rejected' }
                    ].map(opt => (
                        <button
                            key={opt.id} onClick={() => setHistoryFilter(opt.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                                historyFilter === opt.id ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-[#111] text-gray-400 border-[#333] hover:border-[#555]'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                    {filteredHistory.length === 0 && <p className="text-gray-500 italic col-span-full">No requests found for this filter.</p>}
                    
                    {filteredHistory.map(req => {
                        const badge = getSponsorBadgeProps(req.status, req.events?.finance_status);
                        return (
                            <div 
                                key={req.id} 
                                onClick={() => setPanelData({ type: 'sponsorship', data: req })}
                                className="p-4 border border-[#333] rounded bg-[#111] cursor-pointer hover:border-[#d4af37] hover:bg-[#161616] transition-all group flex flex-col justify-between h-full"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badge.className}`}>
                                            {badge.text}
                                        </span>
                                        <span className="text-[#d4af37] font-mono font-bold">${req.amount}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-200 text-sm mb-1">{req.events?.title}</h4>
                                    <p className="text-xs text-gray-400 truncate">
                                        {req.profiles?.company_name || req.profiles?.full_name}
                                    </p>
                                </div>
                                <div className="mt-3 text-right">
                                    <span className="text-[10px] text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Open Thread ➔
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════
                SLIDE-OUT SIDE PANEL (DRAWER) 
            ═════════════════════════════════════════════════════════════════════════ */}
            {panelData && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity" 
                        onClick={() => setPanelData(null)} 
                    />
                    
                    {/* Panel Container */}
                    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#0a0a0a] border-l border-[#333] z-[110] shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
                        
                        {/* Header */}
                        <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#0a0a0a] shrink-0">
                            <h2 className="text-lg font-bold text-[#d4af37] uppercase tracking-wider">
                                {panelData.type === 'event' ? 'Plan Details' : 'Sponsorship Details'}
                            </h2>
                            <button onClick={() => setPanelData(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>

                        {/* Scrollable Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                            
                            {/* --- EVENT (APPROVAL) VIEW --- */}
                            {panelData.type === 'event' && (() => {
                                const ev = panelData.data;
                                const stat = getFinStatus(ev.finance_status);
                                const isApproved = stat === 'approved';
                                const isPending = stat === 'pending_client';
                                const isRejected = stat === 'rejected';

                                return (
                                    <>
                                        <div>
                                            <h1 className="text-2xl font-bold text-white mb-2">{ev.title}</h1>
                                            {ev.client && (
                                                <p className="text-xs text-gray-400 flex items-center mb-4">
                                                    👤 <span className="font-medium text-gray-300 mx-1">{ev.client.full_name}</span> 
                                                    (<a href={`mailto:${ev.client.email}`} className="text-[#d4af37] hover:underline">{ev.client.email}</a>)
                                                </p>
                                            )}
                                            {getEventBadgeProps(ev.finance_status) && (
                                                <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded border ${getEventBadgeProps(ev.finance_status).className}`}>
                                                    {getEventBadgeProps(ev.finance_status).text}
                                                </span>
                                            )}
                                        </div>

                                        {/* Client Communication Thread */}
                                        <InlineThread 
                                            sentTitle="Your Pitch to Client" sentMsg={ev.finance_manager_message}
                                            receivedTitle="Client Feedback" receivedMsg={ev.finance_client_feedback}
                                        />

                                        {/* Sponsorships Breakdown */}
                                        {ev.sponsorships && ev.sponsorships.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-xs uppercase font-bold text-[#888] mb-3 tracking-wider">Attached Sponsors ({ev.sponsorships.length})</h3>
                                                <div className="space-y-3">
                                                    {ev.sponsorships.map(s => (
                                                        <div key={s.id} className="p-3 bg-[#111] rounded border border-[#222] flex justify-between items-center">
                                                            <span className="text-sm font-medium text-[#E5E5E5] truncate pr-4">
                                                                {s.sponsor?.company_name || s.sponsor?.full_name}
                                                            </span>
                                                            <span className="text-[#d4af37] font-mono font-bold">${Number(s.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {(!stat || stat === 'draft' || isRejected) && (
                                            <div className="mt-8 pt-6 border-t border-[#333]">
                                                {isRejected && <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-3">Re-submit Revised Plan:</p>}
                                                <textarea 
                                                    className="dash-input w-full h-24 text-sm mb-3 resize-none" 
                                                    placeholder="Write a message to the client explaining the budget..."
                                                    value={financeMsgs[ev.id] || ''} 
                                                    onChange={e => setFinanceMsgs({...financeMsgs, [ev.id]: e.target.value})}
                                                />
                                                <button disabled={submitting} onClick={() => handleFinanceSubmit(ev.id)} className="dash-btn w-full !py-3">
                                                    📨 Send Plan to Client
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* --- SPONSORSHIP (HISTORY) VIEW --- */}
                            {panelData.type === 'sponsorship' && (() => {
                                const req = panelData.data;
                                const finStatus = getFinStatus(req.events?.finance_status);
                                const isApprovedByClient = finStatus === 'approved';
                                const badge = getSponsorBadgeProps(req.status, req.events?.finance_status);

                                return (
                                    <>
                                        <div className="border-b border-[#222] pb-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded border ${badge.className}`}>{badge.text}</span>
                                                <span className="text-3xl font-bold font-mono text-[#d4af37]">${req.amount}</span>
                                            </div>
                                            <h1 className="text-xl font-bold text-white mb-1">{req.profiles?.company_name || req.profiles?.full_name}</h1>
                                            {req.profiles?.email && (
                                                <a href={`mailto:${req.profiles.email}`} className="text-xs text-[#d4af37] hover:underline">✉️ {req.profiles.email}</a>
                                            )}
                                        </div>

                                        <div className="bg-[#111] p-4 rounded border border-[#333]">
                                            <p className="text-[10px] uppercase font-bold text-[#888] mb-1">Target Event</p>
                                            <p className="font-bold text-gray-200">{req.events?.title}</p>
                                            {req.events?.client && <p className="text-xs text-gray-500 mt-1">Client: {req.events.client.full_name}</p>}
                                        </div>

                                        <div className="space-y-6 mt-6">
                                            {/* Sponsor Thread */}
                                            <div>
                                                <h3 className="text-xs uppercase font-bold text-[#888] mb-2 tracking-wider">Sponsor Communication</h3>
                                                <InlineThread sentTitle="Your Note to Sponsor" sentMsg={req.request_note} receivedTitle="Sponsor Feedback/Terms" receivedMsg={req.sponsor_note} />
                                            </div>

                                            {/* Client Context Thread */}
                                            {(req.events?.finance_manager_message || req.events?.finance_client_feedback) && (
                                                <div>
                                                    <h3 className="text-xs uppercase font-bold text-[#888] mb-2 tracking-wider mt-4">Client Context</h3>
                                                    <div className="opacity-70">
                                                        <InlineThread sentTitle="Pitch to Client" sentMsg={req.events?.finance_manager_message} receivedTitle="Client Feedback" receivedMsg={req.events?.finance_client_feedback} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Negotiation Actions */}
                                        {req.status === 'negotiating' && isApprovedByClient && (
                                            <div className="mt-8 p-5 bg-[#050505] border border-orange-500/40 rounded-sm">
                                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-4">Action Required: Respond to Counter</p>
                                                
                                                {!editingId || editingId !== req.id ? (
                                                    <div className="flex flex-col gap-3">
                                                        <button onClick={() => handleAcceptOffer(req)} className="bg-green-700 hover:bg-green-600 text-white py-2.5 rounded text-sm font-bold transition w-full">✓ Accept Offer</button>
                                                        <button onClick={() => { setEditingId(req.id); setEditForm({ amount: req.amount, note: '' }); }} className="bg-[#04305c] hover:bg-[#054482] text-white py-2.5 rounded text-sm font-bold transition w-full">↩ Counter Again</button>
                                                        <button onClick={() => handleRejectOffer(req)} className="bg-transparent border border-red-500 text-red-500 hover:bg-red-900/30 py-2.5 rounded text-sm font-bold transition w-full">✕ Reject Offer</button>
                                                    </div>
                                                ) : (
                                                    <div className="animate-fade-in space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Counter Amount ($)</label>
                                                            <input type="number" className="dash-input w-full !p-3" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Counter Note</label>
                                                            <textarea className="dash-input w-full h-20 resize-none !p-3" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} placeholder="Reason for counter..." />
                                                        </div>
                                                        <div className="flex gap-3 pt-2">
                                                            <button onClick={() => handleCounterUpdate(req.id)} className="dash-btn flex-1 !py-2.5">Send Counter</button>
                                                            <button onClick={() => setEditingId(null)} className="px-4 text-gray-500 hover:text-gray-300 text-sm font-semibold transition">Cancel</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManagerSponsorships;