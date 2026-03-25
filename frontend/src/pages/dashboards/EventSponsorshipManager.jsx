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
        <div className="space-y-8">
            <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-4">
                <h3 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider mb-4 border-b border-[#2A2A2A] pb-2">
                    Sponsorship Pipeline Status
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest flex-wrap">
                    <span className={isDraft || isRejected ? "text-[#C5A46D]" : "text-green-500"}>
                        {isDraft || isRejected ? '1. Drafting Plan' : '✓ Plan Drafted'}
                    </span>
                    <span className="text-[#333]">→</span>
                    <span className={isPendingClient ? "text-yellow-500" : isClientApproved ? "text-green-500" : isRejected ? "text-red-500" : "text-[#555]"}>
                        {isPendingClient ? '⏳ 2. Awaiting Client' : isClientApproved ? '✓ Client Approved' : isRejected ? '❌ Client Rejected' : '2. Client Approval'}
                    </span>
                    <span className="text-[#333]">→</span>
                    <span className={isClientApproved ? "text-[#C5A46D]" : "text-[#555]"}>
                        {isClientApproved ? '3. Sponsors Notified & Negotiating' : '3. Send to Sponsors'}
                    </span>
                </div>

                {(eventFinance.finance_manager_message || eventFinance.finance_client_feedback) && (
                    <div className="mt-4">
                        <InlineThread sentTitle="Your Pitch to Client" sentMsg={eventFinance.finance_manager_message} receivedTitle="Client Feedback" receivedMsg={eventFinance.finance_client_feedback} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {(!isClientApproved && !isPendingClient) && (
                        <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                            <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider mb-4">➕ Build Sponsorship Plan</h4>
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
                                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Note</label><input value={form.request_note} onChange={e => setForm({ ...form, request_note: e.target.value })} className="dash-input w-full" /></div>
                                </div>
                                <button type="submit" disabled={submitting} className="dash-btn w-full !py-2 mt-2">{submitting ? 'Saving...' : 'Add to Proposed Plan'}</button>
                            </form>
                        </div>
                    )}

                    {sponsorships.length > 0 && (isDraft || isRejected) && (
                        <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5 space-y-3">
                            <h4 className="text-xs font-bold text-[#C5A46D] uppercase tracking-wider">📨 Send Plan to Client</h4>
                            <textarea className="dash-input w-full h-20 text-sm resize-none" placeholder="Add a message to the client..." value={pitchMsg} onChange={e => setPitchMsg(e.target.value)} />
                            <button onClick={handleSendToClient} disabled={submitting} className="dash-btn w-full !py-2.5">Send Plan to Client</button>
                        </div>
                    )}
                </div>

                <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-sm p-5">
                    <div className="flex justify-between items-center mb-4 border-b border-[#2A2A2A] pb-3">
                        <h4 className="text-sm font-bold text-[#C5A46D] uppercase tracking-wider">Plan Details ({sponsorships.length})</h4>
                        <span className="text-[#C5A46D] font-mono font-bold">Total: ${totalAmount.toLocaleString()}</span>
                    </div>

                    {sponsorships.length === 0 ? (
                        <p className="text-center text-[#888] text-xs uppercase tracking-widest py-8">No sponsors added to plan yet.</p>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {sponsorships.map(s => (
                                <div key={s.id} className={`p-4 rounded-sm border ${s.status === 'negotiating' ? 'border-orange-500/40 bg-orange-900/5' : 'border-[#2A2A2A] bg-[#121212]'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-[#E5E5E5]">{s.sponsor?.company_name || s.sponsor?.full_name}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-right">
                                            <span className="text-[#C5A46D] font-mono font-bold">${Number(s.amount).toLocaleString()}</span>
                                            <StatusBadge status={s.status} financeStatus={financeStatus} />
                                        </div>
                                    </div>

                                    <InlineThread sentTitle="Note to Sponsor" sentMsg={s.request_note} receivedTitle="Sponsor Feedback" receivedMsg={s.sponsor_note} />

                                    {s.status === 'negotiating' && isClientApproved && (
                                        <div className="mt-4 pt-3 border-t border-orange-500/20">
                                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3">Action Required: Respond to Counter</p>
                                            {editingId === s.id ? (
                                                <div className="space-y-2">
                                                    <input type="number" className="dash-input w-full !p-2" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="New Amount" />
                                                    <input className="dash-input w-full !p-2" value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} placeholder="Your counter note..." />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleCounter(s.id)} className="dash-btn !py-1.5 !px-4 !text-xs">Send Counter</button>
                                                        <button onClick={() => setEditingId(null)} className="text-[#888] hover:text-[#B0B0B0] text-xs transition">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 flex-wrap">
                                                    <button onClick={() => handleAcceptOffer(s)} className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-sm transition">✓ Accept</button>
                                                    <button onClick={() => { setEditingId(s.id); setEditForm({ amount: s.amount, note: '' }); }} className="bg-[#04305c] hover:bg-[#054482] text-white text-xs font-bold px-4 py-1.5 rounded-sm transition">↩ Counter</button>
                                                    <button onClick={() => handleRejectOffer(s)} className="border border-red-500 text-red-400 hover:bg-red-500/10 text-xs font-bold px-4 py-1.5 rounded-sm transition">✕ Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventSponsorshipManager;