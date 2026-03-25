import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketViewer from '../../components/common/TicketViewer';
import EventMessaging from '../../components/common/EventMessaging';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 });

const STATUS_META = {
    accepted:    { label: 'Accepted',    dot: '#10b981', bar: '#047857', text: '#6ee7b7' },
    rejected:    { label: 'Declined',    dot: '#ef4444', bar: '#b91c1c', text: '#fca5a5' },
    negotiating: { label: 'Negotiating', dot: '#d4af37', bar: '#a68a3c', text: '#fde68a' },
    pending:     { label: 'Pending',     dot: '#888888', bar: '#444444', text: '#cccccc' },
};

const Dot = ({ color }) => (
    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, marginRight: 6 }} />
);

/* ─── StatusPill ───────────────────────────────────────────────── */
const StatusPill = ({ status }) => {
    const m = STATUS_META[status] ?? STATUS_META.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 4,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: `${m.bar}18`, color: m.text,
            border: `1px solid ${m.bar}55`,
        }}>
            <Dot color={m.dot} />{m.label}
        </span>
    );
};

/* ─── AmountDisplay ────────────────────────────────────────────── */
const AmountDisplay = ({ amount }) => (
    <div style={{ margin: '20px 0' }}>
        <p style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            Investment Value
        </p>
        <p style={{ fontSize: 36, fontWeight: 300, color: '#d4af37', lineHeight: 1, fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.5, marginRight: 2 }}>$</span>
            {fmt(amount)}
        </p>
    </div>
);

/* ─── NoteBlock ────────────────────────────────────────────────── */
const NoteBlock = ({ label, text, align = 'left', accent = '#d4af37' }) => (
    <div style={{
        background: `${accent}0a`,
        border: `1px solid ${accent}30`,
        borderLeft: align === 'left' ? `3px solid ${accent}` : undefined,
        borderRight: align === 'right' ? `3px solid ${accent}` : undefined,
        borderRadius: 8, padding: '12px 14px', marginBottom: 10,
        textAlign: align,
    }}>
        <p style={{ fontSize: 9, color: accent, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 12.5, color: '#ccc', fontStyle: 'italic', lineHeight: 1.5 }}>"{text}"</p>
    </div>
);

/* ─── NegotiationForm ──────────────────────────────────────────── */
const NegotiationForm = ({ negForm, setNegForm, onSubmit, onCancel }) => (
    <div style={{ animation: 'fadeSlideIn 0.18s ease' }}>
        <p style={{ fontSize: 10, color: '#d4af37', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            ↩ Counter Proposal
        </p>
        <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Counter Amount ($)
            </label>
            <input
                type="number"
                style={{
                    width: '100%', background: '#111', border: '1px solid #333',
                    padding: '10px 12px', borderRadius: 8, color: '#d4af37',
                    fontSize: 18, fontWeight: 300, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                }}
                value={negForm.amount}
                onChange={e => setNegForm({ ...negForm, amount: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#d4af37'}
                onBlur={e => e.target.style.borderColor = '#333'}
            />
        </div>
        <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Terms / Note (Optional)
            </label>
            <textarea
                placeholder="Add conditions or remarks…"
                style={{
                    width: '100%', background: '#111', border: '1px solid #333',
                    padding: '10px 12px', borderRadius: 8, color: '#ccc',
                    fontSize: 13, height: 88, resize: 'none', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                }}
                value={negForm.note}
                onChange={e => setNegForm({ ...negForm, note: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#d4af37'}
                onBlur={e => e.target.style.borderColor = '#333'}
            />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            <button
                onClick={onSubmit}
                style={{
                    flex: 1, background: 'linear-gradient(135deg, #d4af37, #a68a3c)',
                    color: '#000', fontWeight: 800, fontSize: 12,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                }}
            >
                Submit Counter
            </button>
            <button
                onClick={onCancel}
                style={{
                    padding: '10px 16px', borderRadius: 8, background: 'transparent',
                    border: '1px solid #444', color: '#B0B0B0',
                    fontSize: 12, cursor: 'pointer',
                }}
            >
                Cancel
            </button>
        </div>
    </div>
);

/* ─── SponsorCard ──────────────────────────────────────────────── */
const SponsorCard = ({ req, user, negotiatingId, negForm, setNegForm, onAction, onNegotiate, expandedEventId, setExpandedEventId }) => {
    const isNegotiating = negotiatingId === req.id;
    const isExpanded = expandedEventId === req.events?.id;
    const isPending = req.status === 'pending';
    const isRejected = req.status === 'rejected';
    const isAccepted = req.status === 'accepted';
    const accentColor = isPending ? '#d4af37' : (STATUS_META[req.status]?.bar ?? '#444');

    return (
        <div style={{
            background: '#0a0a0a',
            borderRadius: 14,
            border: `1px solid ${isRejected ? '#dc262630' : isPending ? '#d4af3740' : '#222'}`,
            boxShadow: isPending ? '0 0 30px #d4af3710' : '0 4px 24px #00000060',
            transition: 'box-shadow 0.3s, transform 0.2s',
            overflow: 'hidden',
            opacity: isRejected ? 0.72 : 1,
        }}
            onMouseEnter={e => { if (!isRejected) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

            <div style={{
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                borderBottom: '1px solid #1a1a1a',
                background: '#111',
            }}>
                <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                    <p style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Event
                    </p>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E5E5E5', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.events?.title}>
                        {req.events?.title}
                    </h3>
                    <p style={{ fontSize: 11, color: '#d4af37', marginTop: 3, fontWeight: 500 }}>
                        {req.events?.event_date ? new Date(req.events.event_date).toDateString() : '—'}
                    </p>
                    
                    {/* MANAGER NAME DISPLAY */}
                    <p style={{ fontSize: 11, color: '#B0B0B0', marginTop: 6 }}>
                        <span style={{ opacity: 0.7 }}>Manager:</span> <span style={{ color: '#E5E5E5', fontWeight: 600 }}>{req.events?.manager?.full_name || 'Not Assigned'}</span>
                    </p>
                    {req.events?.client && (
                        <p style={{ fontSize: 11, color: '#B0B0B0', marginTop: 4 }}>
                            <span style={{ opacity: 0.7 }}>Client:</span> <span style={{ color: '#E5E5E5', fontWeight: 600 }}>{req.events.client.company_name || req.events.client.full_name}</span>
                        </p>
                    )}
                </div>
                <StatusPill status={req.status} />
            </div>

            <div style={{ padding: '4px 20px 20px' }}>
                {isNegotiating ? (
                    <NegotiationForm
                        negForm={negForm}
                        setNegForm={setNegForm}
                        onSubmit={() => onAction(req.id, 'negotiating')}
                        onCancel={() => onNegotiate(null)}
                    />
                ) : (
                    <>
                        <AmountDisplay amount={req.amount} />
                        {req.request_note && <NoteBlock label="Event Memo" text={req.request_note} />}
                        {req.sponsor_note && <NoteBlock label="Your Terms" text={req.sponsor_note} align="right" accent="#7c3aed" />}

                        {!isRejected && !isAccepted && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                                <button
                                    onClick={() => onAction(req.id, 'accepted')}
                                    style={{
                                        flex: 1, background: 'linear-gradient(135deg, #059669, #047857)',
                                        color: '#ecfdf5', fontWeight: 700, fontSize: 11,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        padding: '9px 0', borderRadius: 8, border: 'none',
                                        cursor: 'pointer', transition: 'opacity 0.15s',
                                    }}
                                >
                                    ✓ Approve
                                </button>
                                <button
                                    onClick={() => onNegotiate(req)}
                                    style={{
                                        flex: 1, background: 'transparent', border: '1px solid #333',
                                        color: '#d4af37', fontWeight: 700, fontSize: 11,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                                    }}
                                >
                                    ↩ Counter
                                </button>
                                <button
                                    onClick={() => onAction(req.id, 'rejected')}
                                    style={{
                                        padding: '9px 14px', borderRadius: 8, background: 'transparent',
                                        border: '1px solid #dc262650', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {isRejected && (
                            <button
                                onClick={() => onNegotiate(req)}
                                style={{
                                    width: '100%', marginTop: 16, background: 'transparent', border: '1px solid #333',
                                    color: '#888', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                                }}
                            >
                                Reconsider / Counter
                            </button>
                        )}

                        <div style={{ borderTop: '1px solid #1a1a1a', marginTop: 20, paddingTop: 14 }}>
                            <button
                                onClick={() => setExpandedEventId(isExpanded ? null : req.events?.id)}
                                style={{
                                    width: '100%', background: 'transparent', border: 'none', color: isExpanded ? '#d4af37' : '#888',
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'color 0.2s', padding: '2px 0',
                                }}
                            >
                                <span style={{ display: 'inline-block', transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                {isExpanded ? 'Hide Details' : 'Tickets & Chat'}
                            </button>

                            {isExpanded && (
                                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <TicketViewer eventId={req.events?.id} />
                                    <EventMessaging eventId={req.events?.id} currentUserId={user?.id} />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/* ─── FilterBar ────────────────────────────────────────────────── */
const FilterBar = ({ filters, setFilters, requestCounts }) => {
    const amountRanges = [
        { label: 'All Amounts', value: 'all' },
        { label: '< $1,000', value: '0-1000' },
        { label: '$1,000 - $5,000', value: '1000-5000' },
        { label: '$5,000 - $10,000', value: '5000-10000' },
        { label: '$10,000 - $50,000', value: '10000-50000' },
        { label: '> $50,000', value: '50000-999999999' },
    ];

    return (
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <p style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Filters</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                    <label style={{ fontSize: 9, color: '#d4af37', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Amount Range</label>
                    <select value={filters.amountRange} onChange={e => setFilters({ ...filters, amountRange: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '10px 12px', borderRadius: 8, color: '#E5E5E5', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                        {amountRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 9, color: '#10b981', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Status</label>
                    <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '10px 12px', borderRadius: 8, color: '#E5E5E5', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending ({requestCounts.pending})</option>
                        <option value="negotiating">Negotiating ({requestCounts.negotiating})</option>
                        <option value="accepted">Accepted ({requestCounts.accepted})</option>
                    </select>
                </div>
            </div>
            {(filters.amountRange !== 'all' || filters.status !== 'all') && (
                <button onClick={() => setFilters({ amountRange: 'all', status: 'all' })} style={{ marginTop: 16, background: 'transparent', border: '1px solid #444', color: '#888', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Clear All Filters</button>
            )}
        </div>
    );
};

/* ─── SponsorDashboard ─────────────────────────────────────────── */
const SponsorDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negotiatingId, setNegotiatingId] = useState(null);
    const [negForm, setNegForm] = useState({ amount: '', note: '' });
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [showRejected, setShowRejected] = useState(false);
    const [filters, setFilters] = useState({ amountRange: 'all', status: 'all' });

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/sponsors/requests');
            setRequests(data || []);
        } catch (err) { console.error("Failed to load", err); }
        finally { setLoading(false); }
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
            setNegotiatingId(null);
            fetchRequests();
        } catch { alert('Error processing request'); }
    };

    const startNegotiation = (req) => {
        if (!req) { setNegotiatingId(null); return; }
        setNegotiatingId(req.id);
        setNegForm({ amount: req.amount, note: '' });
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            if (filters.status !== 'all' && req.status !== filters.status) return false;
            if (filters.amountRange !== 'all') {
                const [min, max] = filters.amountRange.split('-').map(Number);
                const amt = Number(req.amount);
                if (amt < min || amt > max) return false;
            }
            return true;
        });
    }, [requests, filters]);

    const activeRequests = filteredRequests.filter(r => r.status !== 'rejected');
    const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected');

    const requestCounts = {
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        negotiating: requests.filter(r => r.status === 'negotiating').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, border: '2px solid #d4af3740', borderTop: '2px solid #d4af37', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#d4af37', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Loading Portal</p>
            </div>
        </div>
    );

    const sharedCardProps = { user, negotiatingId, negForm, setNegForm, onAction: handleAction, onNegotiate: startNegotiation, expandedEventId, setExpandedEventId };

    return (
        <>
            <style>{`
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#050505', padding: '36px 24px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                    {/* Header Section */}
                    <div style={{ marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid #1a1a1a' }}>
                        <p style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Sponsor Portal</p>
                        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 300, color: '#E5E5E5', letterSpacing: '-0.02em', fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>
                            Sponsorship <span style={{ color: '#d4af37', fontStyle: 'italic' }}>Requests</span>
                        </h1>
                        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Pending', count: requestCounts.pending, color: '#888888' },
                                { label: 'Accepted', count: requestCounts.accepted, color: '#10b981' },
                                { label: 'Negotiating', count: requestCounts.negotiating, color: '#d4af37' },
                                { label: 'Declined', count: requestCounts.rejected, color: '#ef4444' },
                            ].map(({ label, count, color }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                    <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
                                        <span style={{ color: '#E5E5E5', fontWeight: 700 }}>{count}</span> {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <FilterBar filters={filters} setFilters={setFilters} requestCounts={requestCounts} />

                    {activeRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>No requests match your filters</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
                            {activeRequests.map(req => <SponsorCard key={req.id} req={req} {...sharedCardProps} />)}
                        </div>
                    )}

                    {rejectedRequests.length > 0 && (
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 28 }}>
                            <button onClick={() => setShowRejected(!showRejected)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: showRejected ? 24 : 0, padding: 0 }}>
                                <div style={{ width: 36, height: 20, borderRadius: 10, background: showRejected ? '#dc262620' : '#111', border: `1px solid ${showRejected ? '#dc262650' : '#333'}`, position: 'relative', transition: 'background 0.25s, border-color 0.25s', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', top: 2, left: showRejected ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: showRejected ? '#f87171' : '#888', transition: 'left 0.25s' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: showRejected ? '#f87171' : '#888' }}>{showRejected ? 'Hide' : 'Show'} Declined Requests</span>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', background: '#dc262620', border: '1px solid #dc262640', borderRadius: 4, padding: '2px 7px' }}>{rejectedRequests.length}</span>
                            </button>
                            {showRejected && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                                    {rejectedRequests.map(req => <SponsorCard key={req.id} req={req} {...sharedCardProps} />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SponsorDashboard;