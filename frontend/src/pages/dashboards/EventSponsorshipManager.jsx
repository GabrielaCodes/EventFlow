import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';

// ─── Inline Message Thread ────────────────────────────────────────────────────
const InlineThread = ({ sentTitle, sentMsg, receivedTitle, receivedMsg }) => {
    if (!sentMsg && !receivedMsg) return null;
    return (
        <div className="mt-3 w-full bg-[#050505] border border-[#222] rounded p-3">
            {sentMsg && (
                <div className="mb-3 last:mb-0">
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{sentTitle}</span>
                    <p className="text-sm text-[#C5A46D] whitespace-pre-wrap leading-relaxed">{sentMsg}</p>
                </div>
            )}
            {receivedMsg && (
                <div className={`${sentMsg ? 'border-t border-[#222] pt-3' : ''}`}>
                    <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block mb-1">{receivedTitle}</span>
                    <p className="text-sm text-[#E5E5E5] whitespace-pre-wrap leading-relaxed">{receivedMsg}</p>
                </div>
            )}
        </div>
    );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, financeStatus }) => {
    let badgeText = status;
    let badgeClass = 'bg-[#222] text-gray-400 border-[#444]';

    if (financeStatus === 'rejected') {
        badgeText = 'Client Rejected Plan';
        badgeClass = 'bg-red-900/20 text-red-400 border-red-800';
    } else if (financeStatus !== 'approved') {
        badgeText = financeStatus === 'pending_client' ? 'Awaiting Client' : 'Drafting Plan';
        badgeClass = 'bg-gray-800 text-gray-400 border-gray-600';
    } else {
        if (status === 'negotiating') badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/50';
        else if (status === 'accepted') badgeClass = 'bg-green-500/20 text-green-400 border-green-500/50';
        else if (status === 'rejected') badgeClass = 'bg-red-500/20 text-red-400 border-red-500/50';
        else if (status === 'pending') badgeClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }

    return (
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border tracking-wider shrink-0 ${badgeClass}`}>
            {badgeText.replace('_', ' ')}
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EventSponsorshipManager = ({ eventId, managerId }) => {
    const [sponsors,        setSponsors]        = useState([]);
    const [sponsorships,    setSponsorships]    = useState([]);
    const [eventFinance,    setEventFinance]    = useState({});
    const [loading,         setLoading]         = useState(true);
    const [submitting,      setSubmitting]      = useState(false);

    const [form, setForm] = useState({ sponsor_id: '', amount: '', request_note: '' });
    const [editingId, setEditingId]   = useState(null);
    const [editForm,  setEditForm]    = useState({ amount: '', note: '' });
    const [pitchMsg, setPitchMsg] = useState('');

    useEffect(() => { loadData(); }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sponsorRes, eventRes] = await Promise.all([
                api.get('/sponsors/list'),
                supabase.from('events').select(`
                        id, finance_status, finance_manager_message, finance_client_feedback,
                        sponsorships(id, amount, status, request_note, sponsor_note, sponsor:profiles!sponsorships_sponsor_id_fkey(id, full_name, company_name, email))
                    `).eq('id', eventId).single()
            ]);

            setSponsors(sponsorRes.data || []);
            if (eventRes.data) {
                const { sponsorships: sp, ...rest } = eventRes.data;
                setEventFinance(rest);
                setSponsorships(sp || []);
            }
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const handleAddSponsor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/sponsors/request', { event_id: eventId, sponsor_id: form.sponsor_id, amount: form.amount, request_note: form.request_note });
            alert("Added to Proposed Plan!");
            setForm({ sponsor_id: '', amount: '', request_note: '' });
            await loadData();
        } catch (err) { alert(err.response?.data?.error || 'Error adding sponsor'); } 
        finally { setSubmitting(false); }
    };

    const handleSendToClient = async () => {
        if (sponsorships.length === 0) return alert('Add at least one sponsor first.');
        setSubmitting(true);
        try {
            await api.post(`/events/${eventId}/finance/submit`, { message: pitchMsg });
            alert("Plan sent to client for approval!");
            setPitchMsg('');
            await loadData();
        } catch (err) { alert(err.response?.data?.error || 'Error sending'); } 
        finally { setSubmitting(false); }
    };

    const handleAcceptOffer = async (s) => {
        if (!window.confirm('Accept this sponsorship offer?')) return;
        try {
            await api.post('/sponsors/request', { sponsorship_id: s.id, amount: s.amount, request_note: s.request_note, status: 'accepted' });
            await loadData();
        } catch { alert('Error accepting offer'); }
    };

    const handleCounter = async (id) => {
        try {
            await api.post('/sponsors/request', { sponsorship_id: id, amount: editForm.amount, request_note: editForm.note, status: 'pending' });
            setEditingId(null);
            await loadData();
        } catch { alert('Error sending counter'); }
    };

    const handleRejectOffer = async (s) => {
        if (!window.confirm('Reject this offer? This cannot be undone.')) return;
        try {
            await api.post('/sponsors/request', { sponsorship_id: s.id, amount: s.amount, request_note: s.request_note, status: 'rejected' });
            await loadData();
        } catch { alert('Error rejecting offer'); }
    };

    const getFinStatus = (status) => (status || '').toLowerCase().trim();
    const financeStatus    = getFinStatus(eventFinance.finance_status);
    
    const isClientApproved = financeStatus === 'approved';
    const isPendingClient  = financeStatus === 'pending_client';
    const isRejected       = financeStatus === 'rejected';
    const isDraft          = !financeStatus || financeStatus === 'draft';

    const totalAmount = sponsorships.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    if (loading) return <div className="flex justify-center items-center py-10 text-[#B0B0B0] text-xs uppercase tracking-widest">Loading Pipeline...</div>;

    return (
        <div className="space-y-6">
            
            {/* ═════════════════════════════════════════════════════════════════════════
                PIPELINE TRACKER (ALWAYS VISIBLE)
            ═════════════════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                <h3 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider mb-4">
                    Pipeline Progression
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest flex-wrap">
                    <div className={`px-4 py-2 rounded border ${isDraft || isRejected ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' : 'bg-green-900/20 border-green-800 text-green-500'}`}>
                        1. Build Plan
                    </div>
                    <span className="text-[#333]">→</span>
                    <div className={`px-4 py-2 rounded border ${isPendingClient ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : isClientApproved ? 'bg-green-900/20 border-green-800 text-green-500' : isRejected ? 'bg-red-900/20 border-red-800 text-red-500' : 'bg-[#111] border-[#333] text-[#555]'}`}>
                        2. Client Approval
                    </div>
                    <span className="text-[#333]">→</span>
                    <div className={`px-4 py-2 rounded border ${isClientApproved ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-[#111] border-[#333] text-[#555]'}`}>
                        3. Sponsor Negotiation
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════
                VIEW 1: DRAFTING & REVISING (Step 1)
            ═════════════════════════════════════════════════════════════════════════ */}
            {(isDraft || isRejected) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT: Action Forms */}
                    <div className="space-y-6">
                        
                        {/* If Rejected, show reason explicitly at the top of the action area */}
                        {isRejected && (
                            <div className="bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
                                <h4 className="text-red-400 font-bold uppercase tracking-wider text-xs mb-1">⚠️ Client Rejected Previous Plan</h4>
                                <p className="text-red-200 text-sm whitespace-pre-wrap">{eventFinance.finance_client_feedback}</p>
                            </div>
                        )}

                        <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                            <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-4">➕ Add Sponsor to Draft</h4>
                            <form onSubmit={handleAddSponsor} className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Sponsor</label>
                                    <select value={form.sponsor_id} onChange={e => setForm({ ...form, sponsor_id: e.target.value })} className="dash-input w-full" required>
                                        <option value="">— Select Sponsor —</option>
                                        {sponsors.map(sp => <option key={sp.id} value={sp.id}>{sp.company_name ? `${sp.company_name} (${sp.full_name})` : sp.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount ($)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="dash-input w-full" required /></div>
                                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Note (Optional)</label><input value={form.request_note} onChange={e => setForm({ ...form, request_note: e.target.value })} className="dash-input w-full" /></div>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full py-2 mt-2 bg-[#222] hover:bg-[#333] border border-[#444] text-white text-xs font-bold rounded transition">
                                    {submitting ? 'Saving...' : '+ Add to Plan'}
                                </button>
                            </form>
                        </div>

                        {sponsorships.length > 0 && (
                            <div className="bg-[#1a1500] border border-[#d4af37]/50 rounded-sm p-5 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                                <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-2">➡️ Next Step: Send to Client</h4>
                                <p className="text-[10px] text-gray-400 mb-3">Sponsors will NOT be notified until the client approves this draft.</p>
                                <textarea className="dash-input w-full h-20 text-sm resize-none mb-3" placeholder="Explain this proposed budget to the client..." value={pitchMsg} onChange={e => setPitchMsg(e.target.value)} />
                                <button onClick={handleSendToClient} disabled={submitting} className="dash-btn w-full !py-3 !text-sm shadow-lg shadow-[#d4af37]/20">
                                    {isRejected ? 'Submit Revised Plan' : 'Submit Plan for Approval'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Current Draft List */}
                    <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2A2A2A] pb-3">
                            <h4 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider">Current Draft ({sponsorships.length})</h4>
                            <span className="text-[#C5A46D] font-mono font-bold text-lg">${totalAmount.toLocaleString()}</span>
                        </div>

                        {sponsorships.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-center text-[#555] text-xs uppercase tracking-widest">Plan is empty. Add sponsors on the left.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                                {sponsorships.map(s => (
                                    <div key={s.id} className="p-3 rounded-sm border border-[#2A2A2A] bg-[#121212] flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-[#E5E5E5]">{s.sponsor?.company_name || s.sponsor?.full_name}</p>
                                            {s.request_note && <p className="text-[10px] text-gray-500 truncate max-w-[200px]">Note: {s.request_note}</p>}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[#C5A46D] font-mono font-bold block">${Number(s.amount).toLocaleString()}</span>
                                            <StatusBadge status={s.status} financeStatus={financeStatus} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════════
                VIEW 2: WAITING ON CLIENT (Step 2)
            ═════════════════════════════════════════════════════════════════════════ */}
            {isPendingClient && (
                <div className="space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-8 rounded-sm text-center">
                        <span className="text-4xl mb-3 block">⏳</span>
                        <h2 className="text-xl font-bold text-yellow-500 mb-2">Awaiting Client Review</h2>
                        <p className="text-sm text-yellow-200/70 max-w-lg mx-auto">
                            The proposed sponsorship plan has been sent. You cannot make changes until the client either approves the budget or sends it back with revisions.
                        </p>
                    </div>

                    <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                        <h4 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider mb-4 border-b border-[#2A2A2A] pb-3">
                            Locked Plan Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sponsorships.map(s => (
                                <div key={s.id} className="p-4 rounded-sm border border-[#333] bg-[#111] opacity-70">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-[#E5E5E5] truncate pr-2">{s.sponsor?.company_name || s.sponsor?.full_name}</p>
                                        <span className="text-[#C5A46D] font-mono font-bold">${Number(s.amount).toLocaleString()}</span>
                                    </div>
                                    <StatusBadge status={s.status} financeStatus={financeStatus} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════════════
                VIEW 3: SPONSOR NEGOTIATION (Step 3)
            ═════════════════════════════════════════════════════════════════════════ */}
            {isClientApproved && (
                <div className="space-y-6">
                    
                    <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r shadow-sm flex justify-between items-center">
                        <div>
                            <h4 className="text-green-400 font-bold uppercase tracking-wider text-xs mb-1">✅ Client Approved</h4>
                            <p className="text-green-200/70 text-sm">Sponsors have been notified and responses will appear below.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Target Goal</span>
                            <span className="text-xl font-mono font-bold text-green-400">${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sponsorships.map(s => {
                            const needsAction = s.status === 'negotiating';
                            
                            return (
                                <div key={s.id} className={`p-5 rounded-sm border flex flex-col h-full ${needsAction ? 'border-orange-500/50 bg-[#1a1300] shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'border-[#2A2A2A] bg-[#0B0B0B]'}`}>
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-base font-bold text-[#E5E5E5]">{s.sponsor?.company_name || s.sponsor?.full_name}</p>
                                            {s.sponsor?.email && <a href={`mailto:${s.sponsor.email}`} className="text-[11px] text-[#C5A46D] hover:underline mt-1 block">✉️ {s.sponsor.email}</a>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-right">
                                            <span className="text-[#C5A46D] font-mono font-bold text-lg">${Number(s.amount).toLocaleString()}</span>
                                            <StatusBadge status={s.status} financeStatus={financeStatus} />
                                        </div>
                                    </div>

                                    {/* Threads */}
                                    <div className="flex-1 mt-2">
                                        <InlineThread sentTitle="Your Note" sentMsg={s.request_note} receivedTitle="Sponsor Reply" receivedMsg={s.sponsor_note} />
                                    </div>

                                    {/* Action Block */}
                                    {needsAction && (
                                        <div className="mt-5 pt-4 border-t border-orange-500/20">
                                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3">⚠️ Action Required: Counter-Offer Received</p>
                                            
                                            {editingId === s.id ? (
                                                <div className="space-y-3 animate-fade-in">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Counter Amount ($)</label>
                                                        <input type="number" className="dash-input w-full !p-2" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Note to Sponsor</label>
                                                        <input className="dash-input w-full !p-2" value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} placeholder="Reasoning..." />
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => handleCounter(s.id)} className="dash-btn flex-1 !py-2 !text-xs">Send Counter</button>
                                                        <button onClick={() => setEditingId(null)} className="px-3 text-[#888] hover:text-white text-xs transition">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 flex-wrap">
                                                    <button onClick={() => handleAcceptOffer(s)} className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-sm transition flex-1 text-center">✓ Accept</button>
                                                    <button onClick={() => { setEditingId(s.id); setEditForm({ amount: s.amount, note: '' }); }} className="bg-[#04305c] hover:bg-[#054482] text-white text-xs font-bold px-4 py-2 rounded-sm transition flex-1 text-center">↩ Counter</button>
                                                    <button onClick={() => handleRejectOffer(s)} className="border border-red-500/50 text-red-400 hover:bg-red-900/30 text-xs font-bold px-4 py-2 rounded-sm transition flex-1 text-center">✕ Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
};

export default EventSponsorshipManager;