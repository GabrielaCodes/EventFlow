import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketViewer from '../../components/common/TicketViewer';
import EventMessaging from '../../components/common/EventMessaging';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 });

const STATUS_META = {
    accepted:    { label: 'Accepted',    dot: '#34d399', bar: '#059669', text: '#6ee7b7' },
    rejected:    { label: 'Declined',    dot: '#f87171', bar: '#dc2626', text: '#fca5a5' },
    negotiating: { label: 'Negotiating', dot: '#fbbf24', bar: '#d97706', text: '#fde68a' },
    pending:     { label: 'Pending',     dot: '#94a3b8', bar: '#475569', text: '#cbd5e1' },
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
        <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            Investment Value
        </p>
        <p style={{ fontSize: 36, fontWeight: 300, color: '#fbbf24', lineHeight: 1, fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.5, marginRight: 2 }}>$</span>
            {fmt(amount)}
        </p>
    </div>
);

/* ─── NoteBlock ────────────────────────────────────────────────── */
const NoteBlock = ({ label, text, align = 'left', accent = '#d97706' }) => (
    <div style={{
        background: `${accent}0a`,
        border: `1px solid ${accent}30`,
        borderLeft: align === 'left' ? `3px solid ${accent}` : undefined,
        borderRight: align === 'right' ? `3px solid ${accent}` : undefined,
        borderRadius: 8, padding: '12px 14px', marginBottom: 10,
        textAlign: align,
    }}>
        <p style={{ fontSize: 9, color: accent, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 12.5, color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.5 }}>"{text}"</p>
    </div>
);

/* ─── NegotiationForm ──────────────────────────────────────────── */
const NegotiationForm = ({ negForm, setNegForm, onSubmit, onCancel }) => (
    <div style={{ animation: 'fadeSlideIn 0.18s ease' }}>
        <p style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            ↩ Counter Proposal
        </p>
        <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Counter Amount ($)
            </label>
            <input
                type="number"
                style={{
                    width: '100%', background: '#0f172a', border: '1px solid #334155',
                    padding: '10px 12px', borderRadius: 8, color: '#fbbf24',
                    fontSize: 18, fontWeight: 300, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                }}
                value={negForm.amount}
                onChange={e => setNegForm({ ...negForm, amount: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#d97706'}
                onBlur={e => e.target.style.borderColor = '#334155'}
            />
        </div>
        <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Terms / Note (Optional)
            </label>
            <textarea
                placeholder="Add conditions or remarks…"
                style={{
                    width: '100%', background: '#0f172a', border: '1px solid #334155',
                    padding: '10px 12px', borderRadius: 8, color: '#94a3b8',
                    fontSize: 13, height: 88, resize: 'none', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                }}
                value={negForm.note}
                onChange={e => setNegForm({ ...negForm, note: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#d97706'}
                onBlur={e => e.target.style.borderColor = '#334155'}
            />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            <button
                onClick={onSubmit}
                style={{
                    flex: 1, background: 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#0f172a', fontWeight: 800, fontSize: 12,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '10px 0', borderRadius: 8, border: 'none',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.target.style.opacity = 0.85}
                onMouseLeave={e => e.target.style.opacity = 1}
            >
                Submit Counter
            </button>
            <button
                onClick={onCancel}
                style={{
                    padding: '10px 16px', borderRadius: 8, background: 'transparent',
                    border: '1px solid #334155', color: '#64748b',
                    fontSize: 12, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.target.style.color = '#e2e8f0'; e.target.style.borderColor = '#475569'; }}
                onMouseLeave={e => { e.target.style.color = '#64748b'; e.target.style.borderColor = '#334155'; }}
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
    const accentColor = isPending ? '#d97706' : (STATUS_META[req.status]?.bar ?? '#475569');

    return (
        <div style={{
            background: '#0f172a',
            borderRadius: 14,
            border: `1px solid ${isRejected ? '#dc262630' : isPending ? '#d9770640' : '#1e293b'}`,
            boxShadow: isPending ? '0 0 30px #d9770610' : '0 4px 24px #00000040',
            transition: 'box-shadow 0.3s, transform 0.2s',
            overflow: 'hidden',
            opacity: isRejected ? 0.72 : 1,
        }}
            onMouseEnter={e => { if (!isRejected) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {/* ── top accent bar ── */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

            {/* ── header ── */}
            <div style={{
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                borderBottom: '1px solid #1e293b',
                background: '#ffffff04',
            }}>
                <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
                    <p style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Event
                    </p>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.events?.title}>
                        {req.events?.title}
                    </h3>
                    <p style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: 500 }}>
                        {req.events?.event_date ? new Date(req.events.event_date).toDateString() : '—'}
                    </p>
                    
                    {req.events?.client && (
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                            <span style={{ opacity: 0.7 }}>Client:</span> <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{req.events.client.company_name ? `${req.events.client.company_name} (${req.events.client.full_name})` : req.events.client.full_name}</span>
                        </p>
                    )}
                </div>
                <StatusPill status={req.status} />
            </div>

            {/* ── body ── */}
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

                        {/* Notes */}
                        {req.request_note && <NoteBlock label="Event Memo" text={req.request_note} />}
                        {req.sponsor_note && <NoteBlock label="Your Terms" text={req.sponsor_note} align="right" accent="#7c3aed" />}

                        {/* 👇 NEW: Hide action buttons entirely if already accepted */}
                        {!isRejected && !isAccepted && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                                <button
                                    onClick={() => onAction(req.id, 'accepted')}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #059669, #047857)',
                                        color: '#ecfdf5', fontWeight: 700, fontSize: 11,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        padding: '9px 0', borderRadius: 8, border: 'none',
                                        cursor: 'pointer', transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={e => e.target.style.opacity = 0.85}
                                    onMouseLeave={e => e.target.style.opacity = 1}
                                >
                                    ✓ Approve
                                </button>

                                <button
                                    onClick={() => onNegotiate(req)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: '1px solid #334155',
                                        color: '#fbbf24', fontWeight: 700, fontSize: 11,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        padding: '9px 0', borderRadius: 8,
                                        cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.target.style.background = '#1e293b'; e.target.style.borderColor = '#d97706'; }}
                                    onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#334155'; }}
                                >
                                    ↩ Counter
                                </button>
                                
                                <button
                                    onClick={() => onAction(req.id, 'rejected')}
                                    style={{
                                        padding: '9px 14px', borderRadius: 8,
                                        background: 'transparent', border: '1px solid #dc262650',
                                        color: '#f87171', fontSize: 11, fontWeight: 700,
                                        cursor: 'pointer', transition: 'background 0.15s',
                                        textTransform: 'uppercase', letterSpacing: '0.06em',
                                    }}
                                    onMouseEnter={e => e.target.style.background = '#dc262618'}
                                    onMouseLeave={e => e.target.style.background = 'transparent'}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* ── accepted: review counter ── */}
                        {isRejected && (
                            <button
                                onClick={() => onNegotiate(req)}
                                style={{
                                    width: '100%', marginTop: 16,
                                    background: 'transparent', border: '1px solid #334155',
                                    color: '#94a3b8', fontWeight: 700, fontSize: 11,
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    padding: '9px 0', borderRadius: 8,
                                    cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                                }}
                                onMouseEnter={e => { e.target.style.color = '#fbbf24'; e.target.style.borderColor = '#d97706'; }}
                                onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.borderColor = '#334155'; }}
                            >
                                Reconsider / Counter
                            </button>
                        )}

                        {/* ── tickets & chat toggle ── */}
                        <div style={{ borderTop: '1px solid #1e293b', marginTop: 20, paddingTop: 14 }}>
                            <button
                                onClick={() => setExpandedEventId(isExpanded ? null : req.events?.id)}
                                style={{
                                    width: '100%', background: 'transparent', border: 'none',
                                    color: isExpanded ? '#fbbf24' : '#475569',
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                                    textTransform: 'uppercase', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
                                    transition: 'color 0.2s', padding: '2px 0',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
                                onMouseLeave={e => e.currentTarget.style.color = isExpanded ? '#fbbf24' : '#475569'}
                            >
                                <span style={{ display: 'inline-block', transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                {isExpanded ? 'Hide Details' : 'Tickets & Chat'}
                            </button>

                            {isExpanded && (
                                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeSlideIn 0.22s ease' }}>
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

/* ─── SponsorDashboard ─────────────────────────────────────────── */
const SponsorDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [negotiatingId, setNegotiatingId] = useState(null);
    const [negForm, setNegForm] = useState({ amount: '', note: '' });
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [showRejected, setShowRejected] = useState(false);

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
            setNegotiatingId(null);
            fetchRequests();
        } catch { alert('Error processing request'); }
    };

    const startNegotiation = (req) => {
        if (req === null) { setNegotiatingId(null); return; }
        setNegotiatingId(req.id);
        setNegForm({ amount: req.amount, note: '' });
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, border: '2px solid #d9770640', borderTop: '2px solid #d97706', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#d97706', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Loading Portal</p>
            </div>
        </div>
    );

    const activeRequests = requests.filter(r => r.status !== 'rejected');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    const sharedCardProps = {
        user, negotiatingId, negForm, setNegForm,
        onAction: handleAction,
        onNegotiate: startNegotiation,
        expandedEventId, setExpandedEventId,
    };

    return (
        <>
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#020617', padding: '36px 24px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                    {/* ── Page Header ── */}
                    <div style={{ marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid #1e293b' }}>
                        <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Sponsor Portal
                        </p>
                        <h1 style={{
                            fontSize: 'clamp(28px, 4vw, 42px)',
                            fontWeight: 300,
                            color: '#f8fafc',
                            letterSpacing: '-0.02em',
                            fontFamily: "'Georgia', serif",
                            lineHeight: 1.1,
                        }}>
                            Sponsorship <span style={{ color: '#d97706', fontStyle: 'italic' }}>Requests</span>
                        </h1>

                        {/* ── summary counts ── */}
                        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
                            {[
                                { label: 'Pending',     count: requests.filter(r => r.status === 'pending').length,     color: '#d97706' },
                                { label: 'Accepted',    count: requests.filter(r => r.status === 'accepted').length,    color: '#059669' },
                                { label: 'Negotiating', count: requests.filter(r => r.status === 'negotiating').length, color: '#7c3aed' },
                                { label: 'Declined',    count: rejectedRequests.length,                                  color: '#dc2626' },
                            ].map(({ label, count, color }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                        <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{count}</span> {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Active Requests Grid ── */}
                    {activeRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>No active sponsorship requests</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
                            {activeRequests.map(req => (
                                <SponsorCard key={req.id} req={req} {...sharedCardProps} />
                            ))}
                        </div>
                    )}

                    {/* ── Rejected Section with toggle ── */}
                    {rejectedRequests.length > 0 && (
                        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 28 }}>
                            <button
                                onClick={() => setShowRejected(v => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: 'transparent', border: 'none',
                                    cursor: 'pointer', marginBottom: showRejected ? 24 : 0,
                                    padding: 0,
                                }}
                            >
                                {/* toggle pill */}
                                <div style={{
                                    width: 36, height: 20, borderRadius: 10,
                                    background: showRejected ? '#dc262640' : '#1e293b',
                                    border: `1px solid ${showRejected ? '#dc2626' : '#334155'}`,
                                    position: 'relative', transition: 'background 0.25s, border-color 0.25s',
                                    flexShrink: 0,
                                }}>
                                    <div style={{
                                        position: 'absolute', top: 2,
                                        left: showRejected ? 17 : 2,
                                        width: 14, height: 14, borderRadius: '50%',
                                        background: showRejected ? '#f87171' : '#475569',
                                        transition: 'left 0.25s, background 0.25s',
                                    }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: showRejected ? '#f87171' : '#475569', transition: 'color 0.2s' }}>
                                    {showRejected ? 'Hide' : 'Show'} Declined Requests
                                </span>
                                <span style={{
                                    fontSize: 10, fontWeight: 800, color: '#dc2626',
                                    background: '#dc262620', border: '1px solid #dc262640',
                                    borderRadius: 4, padding: '2px 7px',
                                }}>
                                    {rejectedRequests.length}
                                </span>
                            </button>

                            {showRejected && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, animation: 'fadeSlideIn 0.25s ease' }}>
                                    {rejectedRequests.map(req => (
                                        <SponsorCard key={req.id} req={req} {...sharedCardProps} />
                                    ))}
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