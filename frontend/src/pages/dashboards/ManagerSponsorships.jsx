import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';

// ─── Utility Data Extractors (Fixes Missing Supabase Data) ────────────────────
const getSponsorDetails = (req) => {
    let sp = req.sponsor || req.profiles;
    if (Array.isArray(sp)) sp = sp[0];
    return {
        name: sp?.company_name || sp?.full_name || 'Unknown Sponsor',
        email: sp?.email || ''
    };
};

const getClientDetails = (ev) => {
    let cl = ev?.client;
    if (Array.isArray(cl)) cl = cl[0];
    return {
        name: cl?.full_name || 'Unknown Client',
        email: cl?.email || ''
    };
};

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
        badgeText = finStatus === 'pending_client' ? 'Awaiting Client' : 'Not Sent to Client';
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
    const hasSent = sentMsg && typeof sentMsg === 'string' && sentMsg.trim() !== '';
    const hasReceived = receivedMsg && typeof receivedMsg === 'string' && receivedMsg.trim() !== '';

    if (!hasSent && !hasReceived) {
        return (
            <div className="mt-2 w-full bg-[#050505] border border-[#222] rounded p-4 shadow-inner flex items-center justify-center min-h-[60px]">
                <span className="text-[10px] uppercase font-bold text-[#444] tracking-widest">No Messages Yet</span>
            </div>
        );
    }

    return (
        <div className="mt-2 w-full bg-[#050505] border border-[#222] rounded p-4 shadow-inner">
            {hasSent && (
                <div className="mb-4 last:mb-0">
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{sentTitle}</span>
                    <p className="text-sm text-[#d4af37] whitespace-pre-wrap leading-relaxed">{sentMsg}</p>
                </div>
            )}
            {hasReceived && (
                <div className={`${hasSent ? 'border-t border-[#222] pt-4' : ''}`}>
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{receivedTitle}</span>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{receivedMsg}</p>
                </div>
            )}
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const ManagerSponsorships = () => {
    const [sponsors, setSponsors] = useState([]);
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ event_id: '', sponsor_id: '', amount: '', request_note: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', note: '' });

    const [allMyEvents, setAllMyEvents] = useState([]);
    const [approvalEvents, setApprovalEvents] = useState([]);
    const [financeMsgs, setFinanceMsgs] = useState({});
    
    const [historyFilter, setHistoryFilter] = useState('all');
    const [panelData, setPanelData] = useState(null); 

    useEffect(() => { loadInitialData(); }, []);

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

            const [sponsorRes, historyRes, eventsRes] = await Promise.all([
                api.get('/sponsors/list'),
                api.get('/sponsors/sent-requests'),
                supabase.from('events').select(`
                        id, title, finance_status, finance_client_feedback, finance_manager_message,
                        client:profiles!events_client_id_fkey(full_name, email),
                        sponsorships(id, amount, status, request_note, sponsor_note, sponsor:profiles!sponsorships_sponsor_id_fkey(full_name, company_name, email))
                    `).eq('assigned_manager_id', user?.id)
            ]);
            
            setSponsors(sponsorRes.data || []);
            const rawEvents = eventsRes.data || [];
            setAllMyEvents(rawEvents); 
            
            // Maps the events object to explicitly extract client comms and prevent missing data
            const mappedHistory = (historyRes.data || []).map(req => {
                const evArray = Array.isArray(req.events) ? req.events : [req.events];
                const evTitle = evArray[0]?.title;
                const matchingEvent = rawEvents.find(e => e.title === evTitle);

                return {
                    ...req,
                    mapped_manager_message: matchingEvent?.finance_manager_message || '',
                    mapped_client_feedback: matchingEvent?.finance_client_feedback || '',
                    mapped_event_id: matchingEvent?.id || ''
                };
            });
            setHistory(mappedHistory);
            setApprovalEvents(rawEvents.filter(e => e.sponsorships && e.sponsorships.length > 0));
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/sponsors/request', formData);
            
            const targetEvent = allMyEvents.find(ev => ev.id === formData.event_id);
            if (targetEvent) {
                const stat = getFinStatus(targetEvent.finance_status);
                if (stat === 'pending_client' || stat === 'rejected') {
                    await supabase.from('events').update({ finance_status: 'draft' }).eq('id', formData.event_id);
                }
            }

            alert("Added to Package!");
            setFormData({ event_id: '', sponsor_id: '', amount: '', request_note: '' }); 
            loadInitialData();
        } catch (err) { alert(err.response?.data?.error || "Error sending request"); } 
        finally { setSubmitting(false); }
    };

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
            const ev = approvalEvents.find(e => e.id === eventId);
            const existingMsg = ev?.finance_manager_message || '';
            const newMsg = (financeMsgs[eventId] || '').trim();
            const finalMsg = newMsg ? (existingMsg ? `${existingMsg}\n\n[Update]: ${newMsg}` : newMsg) : existingMsg;

            await api.post(`/events/${eventId}/finance/submit`, { message: finalMsg });
            alert("Package sent to client for approval!");
            setFinanceMsgs(prev => ({ ...prev, [eventId]: '' }));
            loadInitialData();
        } catch(err) { alert(err.response?.data?.error || "Error sending to client"); } 
        finally { setSubmitting(false); }
    };

    const pendingEvents = approvalEvents.filter(ev => { const stat = getFinStatus(ev.finance_status); return !stat || stat === 'draft' || stat === 'pending_client'; });
    const approvedEvents = approvalEvents.filter(ev => getFinStatus(ev.finance_status) === 'approved');
    const rejectedEvents = approvalEvents.filter(ev => getFinStatus(ev.finance_status) === 'rejected');

    const renderCompactApprovalRow = (ev) => {
        const badge = getEventBadgeProps(ev.finance_status);
        return (
            <div key={ev.id} onClick={() => setPanelData({ type: 'event', data: ev })} className="p-3 border border-[#333] rounded bg-[#111] mb-2 last:mb-0 cursor-pointer hover:border-[#d4af37] hover:bg-[#161616] transition-all flex justify-between items-center group">
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-gray-200 text-sm truncate">{ev.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{ev.sponsorships?.length || 0} Sponsors Attached</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badge.className}`}>{badge.text}</span>
                    <span className="text-[10px] text-[#d4af37] mt-1 group-hover:underline opacity-0 group-hover:opacity-100 transition-opacity">View Details ➔</span>
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
                <div className="dash-card h-fit">
                    <h2 className="text-xl font-bold text-[#d4af37] mb-4">💰 Build Sponsorship Package</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Event</label>
                            <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input" required>
                                <option value="" className="text-gray-500">-- Select Event --</option>
                                {allMyEvents.map(ev => (
                                    <option key={ev.id} value={ev.id} className="bg-black text-[#d4af37]">
                                        {ev.title} {ev.subtype_name ? `(${ev.subtype_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Sponsor</label>
                            <select name="sponsor_id" value={formData.sponsor_id} onChange={handleChange} className="dash-input" required>
                                <option value="" className="text-gray-500">-- Select Sponsor --</option>
                                {sponsors.map(sp => <option key={sp.id} value={sp.id} className="bg-black text-[#d4af37]">{sp.company_name ? `${sp.company_name} (${sp.full_name})` : sp.full_name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount ($)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="dash-input" required /></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Note</label><input name="request_note" value={formData.request_note} onChange={handleChange} className="dash-input" /></div>
                        </div>
                        <button disabled={submitting} type="submit" className="dash-btn mt-2">{submitting ? "Saving..." : "Add to Package"}</button>
                    </form>
                </div>

                <div className="dash-card h-fit">
                    <h2 className="text-xl font-bold text-[#d4af37] mb-4">📋 Client Approvals</h2>
                    {approvalEvents.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No events currently have packages attached.</p>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-2">⏳ Pending & Draft <span className="bg-[#222] border border-[#444] text-[#ccc] px-2 py-0.5 rounded text-[10px]">{pendingEvents.length}</span></h3>
                                {pendingEvents.length > 0 ? pendingEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic">No pending packages.</p>}
                            </div>
                            <div className="mb-4">
                                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-2">❌ Rejected Packages <span className="bg-[#222] border border-[#444] text-[#ccc] px-2 py-0.5 rounded text-[10px]">{rejectedEvents.length}</span></h3>
                                {rejectedEvents.length > 0 ? rejectedEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic">No rejected packages.</p>}
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-2">✅ Approved Packages <span className="bg-[#222] border border-[#444] text-[#ccc] px-2 py-0.5 rounded text-[10px]">{approvedEvents.length}</span></h3>
                                {approvedEvents.length > 0 ? approvedEvents.map(renderCompactApprovalRow) : <p className="text-gray-500 text-xs italic">No approved packages.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                        const sponsor = getSponsorDetails(req);
                        return (
                            <div key={req.id} onClick={() => setPanelData({ type: 'sponsorship', data: req })} className="p-4 border border-[#333] rounded bg-[#111] cursor-pointer hover:border-[#d4af37] hover:bg-[#161616] transition-all group flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${badge.className}`}>{badge.text}</span>
                                        <span className="text-[#d4af37] font-mono font-bold">${req.amount}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-200 text-sm mb-1 truncate">{req.events?.title || 'Unknown Event'}</h4>
                                    <p className="text-xs text-gray-400 truncate">{sponsor.name}</p>
                                </div>
                                <div className="mt-3 text-right">
                                    <span className="text-[10px] text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">Open Thread ➔</span>
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
                    <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity" onClick={() => setPanelData(null)} />
                    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#0a0a0a] border-l border-[#333] z-[110] shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
                        <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#0a0a0a] shrink-0">
                            <h2 className="text-lg font-bold text-[#d4af37] uppercase tracking-wider">
                                {panelData.type === 'event' ? 'Package Details' : 'Sponsorship Details'}
                            </h2>
                            <button onClick={() => setPanelData(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                            
                            {/* --- EVENT (APPROVAL) VIEW --- */}
                            {panelData.type === 'event' && (() => {
                                const ev = panelData.data;
                                const client = getClientDetails(ev);
                                const stat = getFinStatus(ev.finance_status);
                                const isRejected = stat === 'rejected';
                                const isPending = stat === 'pending_client';

                                return (
                                    <>
                                        <div>
                                            <h1 className="text-2xl font-bold text-white mb-2">{ev.title}</h1>
                                            <p className="text-xs text-gray-400 flex items-center mb-4">
                                                👤 <span className="font-medium text-gray-300 mx-1">{client.name}</span> 
                                                {client.email && (<>(<a href={`mailto:${client.email}`} className="text-[#d4af37] hover:underline">{client.email}</a>)</>)}
                                            </p>
                                            <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded border ${getEventBadgeProps(ev.finance_status).className}`}>
                                                {getEventBadgeProps(ev.finance_status).text}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-xs uppercase font-bold text-[#888] mb-2 tracking-wider">Client Communication</h3>
                                            <InlineThread sentTitle="Your Pitches/Updates" sentMsg={ev.finance_manager_message} receivedTitle="Client Feedback" receivedMsg={ev.finance_client_feedback} />
                                        </div>

                                        {ev.sponsorships && ev.sponsorships.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-xs uppercase font-bold text-[#888] mb-3 tracking-wider">Attached Sponsors ({ev.sponsorships.length})</h3>
                                                <div className="space-y-3">
                                                    {ev.sponsorships.map(s => {
                                                        const sp = getSponsorDetails(s);
                                                        return (
                                                            <div key={s.id} className="p-3 bg-[#111] rounded border border-[#222] flex justify-between items-center">
                                                                <span className="text-sm font-medium text-[#E5E5E5] truncate pr-4">{sp.name}</span>
                                                                <span className="text-[#d4af37] font-mono font-bold">${Number(s.amount).toLocaleString()}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {(!stat || stat === 'draft' || isRejected || isPending) && (
                                            <div className="mt-8 pt-6 border-t border-[#333]">
                                                {isRejected && <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-3">Re-submit Revised Package:</p>}
                                                {isPending && <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-3">Send Package Update:</p>}
                                                
                                                <textarea 
                                                    className="dash-input w-full h-24 text-sm mb-3 resize-none" 
                                                    placeholder="Write a message or update to the client explaining the package..."
                                                    value={financeMsgs[ev.id] || ''} 
                                                    onChange={e => setFinanceMsgs({...financeMsgs, [ev.id]: e.target.value})}
                                                />
                                                <button disabled={submitting} onClick={() => handleFinanceSubmit(ev.id)} className="dash-btn w-full !py-3">
                                                    📨 Send {isPending ? 'Update' : 'Package'} to Client
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* --- SPONSORSHIP (HISTORY) VIEW --- */}
                            {panelData.type === 'sponsorship' && (() => {
                                const req = panelData.data;
                                const sponsor = getSponsorDetails(req);
                                const finStatus = getFinStatus(req.events?.finance_status);
                                const isApprovedByClient = finStatus === 'approved';
                                const badge = getSponsorBadgeProps(req.status, req.events?.finance_status);

                                // Uses the explicitly mapped fields to ensure it NEVER drops
                                const clientPitch = req.mapped_manager_message;
                                const clientFeedback = req.mapped_client_feedback;

                                return (
                                    <>
                                        <div className="border-b border-[#222] pb-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded border ${badge.className}`}>{badge.text}</span>
                                                <span className="text-3xl font-bold font-mono text-[#d4af37]">${req.amount}</span>
                                            </div>
                                            <h1 className="text-xl font-bold text-white mb-1">{sponsor.name}</h1>
                                            {sponsor.email && <a href={`mailto:${sponsor.email}`} className="text-xs text-[#d4af37] hover:underline">✉️ {sponsor.email}</a>}
                                        </div>

                                        <div className="bg-[#111] p-4 rounded border border-[#333]">
                                            <p className="text-[10px] uppercase font-bold text-[#888] mb-1">Target Event Package</p>
                                            <p className="font-bold text-gray-200">{req.events?.title || 'Unknown Event'}</p>
                                        </div>

                                        <div className="space-y-6 mt-6">
                                            <div>
                                                <h3 className="text-xs uppercase font-bold text-[#888] mb-2 tracking-wider">Sponsor Communication</h3>
                                                <InlineThread sentTitle="Your Note to Sponsor" sentMsg={req.request_note} receivedTitle="Sponsor Feedback/Terms" receivedMsg={req.sponsor_note} />
                                            </div>

                                            <div>
                                                <h3 className="text-xs uppercase font-bold text-[#888] mb-2 tracking-wider mt-4">Client Context</h3>
                                                <div className="opacity-70">
                                                    <InlineThread sentTitle="Pitch to Client" sentMsg={clientPitch} receivedTitle="Client Feedback" receivedMsg={clientFeedback} />
                                                </div>
                                            </div>
                                        </div>

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
                                                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Counter Amount ($)</label><input type="number" className="dash-input w-full !p-3" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} /></div>
                                                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Counter Note</label><textarea className="dash-input w-full h-20 resize-none !p-3" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} placeholder="Reason for counter..." /></div>
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