import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api';

// ─── Inline Message Thread (Always Renders) ───────────────────────────────────
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
                    <p className="text-sm text-[#C5A46D] whitespace-pre-wrap leading-relaxed">{sentMsg}</p>
                </div>
            )}
            {hasReceived && (
                <div className={`${hasSent ? 'border-t border-[#222] pt-4' : ''}`}>
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
        badgeText = 'Client Rejected Package';
        badgeClass = 'bg-red-900/20 text-red-400 border-red-800';
    } else if (financeStatus !== 'approved') {
        badgeText = financeStatus === 'pending_client' ? 'Awaiting Client' : 'Not Sent to Client';
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

    const getFinStatus = (status) => (status || '').toLowerCase().trim();
    const financeStatus = getFinStatus(eventFinance.finance_status);

    const handleAddSponsor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/sponsors/request', { event_id: eventId, sponsor_id: form.sponsor_id, amount: form.amount, request_note: form.request_note });
            
            // If plan was pending, adding a new sponsor forces it back to Draft
            if (financeStatus === 'pending_client' || financeStatus === 'rejected') {
                await supabase.from('events').update({ finance_status: 'draft' }).eq('id', eventId);
            }

            alert("Added to Proposed Package!");
            setForm({ sponsor_id: '', amount: '', request_note: '' });
            await loadData();
        } catch (err) { alert(err.response?.data?.error || 'Error adding sponsor'); } 
        finally { setSubmitting(false); }
    };

    const handleSendToClient = async () => {
        if (sponsorships.length === 0) return alert('Add at least one sponsor first.');
        setSubmitting(true);
        try {
            const existingMsg = eventFinance.finance_manager_message || '';
            const newMsg = pitchMsg.trim();
            const finalMsg = newMsg ? (existingMsg ? `${existingMsg}\n\n[Update]: ${newMsg}` : newMsg) : existingMsg;

            await api.post(`/events/${eventId}/finance/submit`, { message: finalMsg });
            alert("Package sent to client for approval!");
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

    const isClientApproved = financeStatus === 'approved';
    const isPendingClient  = financeStatus === 'pending_client';
    const isRejected       = financeStatus === 'rejected';
    const isDraft          = !financeStatus || financeStatus === 'draft';

    const totalAmount = sponsorships.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    if (loading) return <div className="flex justify-center items-center py-10 text-[#B0B0B0] text-xs uppercase tracking-widest">Loading Pipeline...</div>;

    return (
        <div className="space-y-6">
            
            {/* ═════════════════════════════════════════════════════════════════════════
                PACKAGE SUMMARY & ACTION BLOCK
            ═════════════════════════════════════════════════════════════════════════ */}
            <div className="bg-[#0a0a0a] border border-[#d4af37]/60 p-6 rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.05)] text-center relative overflow-hidden">
                <h2 className="text-2xl font-bold text-[#d4af37] mb-2 uppercase tracking-widest">Sponsorship Package</h2>
                <p className="text-[#888] text-sm max-w-xl mx-auto">
                    {sponsorships.length === 0 
                        ? "Start by adding sponsors to your package below. Nothing is sent until you submit the entire package." 
                        : <>This package currently contains <span className="text-white font-bold">{sponsorships.length} sponsors</span> for a total of <span className="text-[#d4af37] font-mono font-bold">${totalAmount.toLocaleString()}</span>.</>}
                </p>

                {/* Submit Action (Only if Draft/Rejected/Pending) */}
                {!isClientApproved && sponsorships.length > 0 && (
                    <div className="max-w-2xl mx-auto mt-6 bg-[#111] p-5 rounded border border-[#333] text-left">
                        {isPendingClient ? (
                            <div className="mb-4">
                                <h4 className="text-yellow-500 font-bold uppercase tracking-wider text-xs mb-1">⏳ Awaiting Client Approval</h4>
                                <p className="text-gray-400 text-[10px]">The client is reviewing this package. You can still add sponsors below, but doing so will require them to re-approve the package.</p>
                            </div>
                        ) : isRejected ? (
                            <div className="mb-4 bg-red-950/30 border-l-2 border-red-500 p-3 rounded-r">
                                <h4 className="text-red-400 font-bold uppercase tracking-wider text-[10px] mb-1">⚠️ Client Rejected Previous Package</h4>
                                <p className="text-red-200/80 text-xs whitespace-pre-wrap">{eventFinance.finance_client_feedback}</p>
                            </div>
                        ) : (
                            <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-2">➡️ Submit Package to Client</h4>
                        )}
                        
                        <p className="text-[10px] text-gray-500 mb-2">Sponsors will NOT be notified until the client approves the entire package.</p>
                        <textarea className="dash-input w-full h-20 text-sm resize-none mb-3" placeholder={isPendingClient ? "Add a new update or message..." : "Explain this proposed package to the client..."} value={pitchMsg} onChange={e => setPitchMsg(e.target.value)} />
                        
                        <button onClick={handleSendToClient} disabled={submitting} className="dash-btn w-full !py-3 !text-sm shadow-lg shadow-[#d4af37]/20">
                            {isPendingClient ? `Send Package Update (${sponsorships.length} Sponsors)` : `Submit Package (${sponsorships.length} Sponsors) to Client`}
                        </button>
                    </div>
                )}

                {isClientApproved && (
                    <div className="max-w-2xl mx-auto mt-6 bg-green-900/20 border border-green-800 p-4 rounded text-left flex justify-between items-center">
                        <div>
                            <h4 className="text-green-400 font-bold uppercase tracking-wider text-xs mb-1">✅ Package Approved</h4>
                            <p className="text-green-200/70 text-xs">Sponsors have been notified. Manage negotiations below.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════
                TWO COLUMN GRID (Building & Managing)
            ═════════════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── LEFT: Add Form & Client History ── */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Add Form stays open even while pending */}
                    <div className={`bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5 ${isClientApproved ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-4">➕ Add to Package</h4>
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
                                {submitting ? 'Saving...' : '+ Add Sponsor'}
                            </button>
                        </form>
                    </div>

                    {/* Client Comms */}
                    <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                        <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-2">💬 Client Communication</h4>
                        <InlineThread 
                            sentTitle="Your Pitches/Updates" sentMsg={eventFinance.finance_manager_message} 
                            receivedTitle="Client Feedback" receivedMsg={eventFinance.finance_client_feedback} 
                        />
                    </div>
                </div>

                {/* ── RIGHT: Package Contents & Sponsor Negotiations ── */}
                <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-[#2A2A2A] pb-3">
                        <h4 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider">Package Contents</h4>
                    </div>

                    {sponsorships.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-center text-[#555] text-xs uppercase tracking-widest">Package is empty. Add sponsors on the left.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[800px]">
                            {sponsorships.map(s => {
                                const needsAction = isClientApproved && s.status === 'negotiating';
                                
                                return (
                                    <div key={s.id} className={`p-4 rounded-sm border ${needsAction ? 'border-orange-500/50 bg-[#1a1300] shadow-[0_0_15px_rgba(249,115,22,0.05)]' : 'border-[#2A2A2A] bg-[#121212]'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-[#E5E5E5]">{s.sponsor?.company_name || s.sponsor?.full_name}</p>
                                                {isClientApproved && s.sponsor?.email && <a href={`mailto:${s.sponsor.email}`} className="text-[10px] text-[#C5A46D] hover:underline mt-0.5 block">✉️ {s.sponsor.email}</a>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-right">
                                                <span className="text-[#C5A46D] font-mono font-bold">${Number(s.amount).toLocaleString()}</span>
                                                <StatusBadge status={s.status} financeStatus={financeStatus} />
                                            </div>
                                        </div>

                                        <InlineThread sentTitle="Your Note" sentMsg={s.request_note} receivedTitle="Sponsor Reply" receivedMsg={s.sponsor_note} />

                                        {needsAction && (
                                            <div className="mt-4 pt-3 border-t border-orange-500/20">
                                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3">⚠️ Action Required: Respond to Counter</p>
                                                {editingId === s.id ? (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <div><input type="number" className="dash-input w-full !p-2" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="New Counter ($)" /></div>
                                                        <div><input className="dash-input w-full !p-2" value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} placeholder="Reasoning..." /></div>
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventSponsorshipManager;