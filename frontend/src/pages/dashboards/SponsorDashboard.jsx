import { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketViewer from '../../components/common/TicketViewer';
import EventMessaging from '../../components/common/EventMessaging';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// NEW HELPER: Safely extracts the Category and Subtype from the nested Supabase query
const getEventCategory = (req) => {
    const category = req.events?.event_subtypes?.event_categories?.name;
    const subtype = req.events?.event_subtypes?.name;
    
    if (category && subtype) return `${category} (${subtype})`;
    if (category) return category;
    if (subtype) return subtype;
    return 'Uncategorized';
};

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
            background: `${m.bar}18`, color: m.text, border: `1px solid ${m.bar}55`,
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

/* ─── FilterBar ────────────────────────────────────────────────── */
const FilterBar = ({ filters, setFilters, requestCounts, categories }) => {
    const amountRanges = [
        { label: 'All Amounts', value: 'all' },
        { label: '< $1,000', value: '0-1000' },
        { label: '$1,000 - $5,000', value: '1000-5000' },
        { label: '$5,000 - $10,000', value: '5000-10000' },
        { label: '$10,000 - $50,000', value: '10000-50000' },
        { label: '> $50,000', value: '50000-999999999' },
    ];

    const handleClear = () => setFilters({ search: '', amountRange: 'all', status: 'all', category: 'all', eventDate: '', requestDate: '' });
    const hasActiveFilters = filters.search || filters.amountRange !== 'all' || filters.status !== 'all' || filters.category !== 'all' || filters.eventDate || filters.requestDate;

    const inputStyle = { width: '100%', background: '#111', border: '1px solid #333', padding: '10px 12px', borderRadius: 8, color: '#E5E5E5', fontSize: 13, outline: 'none' };
    const labelStyle = { fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 };

    return (
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <p style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Advanced Filters</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Search Event Name</label>
                    <input type="text" placeholder="Search events..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={{...inputStyle, borderColor: filters.search ? '#d4af37' : '#333'}} />
                </div>
                
                <div>
                    <label style={{...labelStyle, color: '#d4af37'}}>Category / Type</label>
                    <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={inputStyle}>
                        <option value="all">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                
                <div>
                    <label style={{...labelStyle, color: '#10b981'}}>Status</label>
                    <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={inputStyle}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending ({requestCounts.pending})</option>
                        <option value="negotiating">Negotiating ({requestCounts.negotiating})</option>
                        <option value="accepted">Accepted ({requestCounts.accepted})</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Amount Range</label>
                    <select value={filters.amountRange} onChange={e => setFilters({ ...filters, amountRange: e.target.value })} style={inputStyle}>
                        {amountRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Event Date</label>
                    <input type="date" value={filters.eventDate} onChange={e => setFilters({ ...filters, eventDate: e.target.value })} style={inputStyle} />
                </div>

                <div>
                    <label style={labelStyle}>Requested Date</label>
                    <input type="date" value={filters.requestDate} onChange={e => setFilters({ ...filters, requestDate: e.target.value })} style={inputStyle} />
                </div>
            </div>

            {hasActiveFilters && (
                <button onClick={handleClear} style={{ marginTop: 16, background: 'transparent', border: '1px solid #444', color: '#888', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                    Clear All Filters
                </button>
            )}
        </div>
    );
};

/* ─── SponsorCard (Reusable) ───────────────────────────────────── */
const SponsorCard = ({ req, onClick }) => {
    const isRejected = req.status === 'rejected';
    const isPending = req.status === 'pending';
    const accentColor = isPending ? '#d4af37' : (STATUS_META[req.status]?.bar ?? '#444');

    return (
        <div style={{
            background: '#0a0a0a', borderRadius: 14, 
            border: `1px solid ${isRejected ? '#dc262630' : isPending ? '#d4af3740' : '#222'}`,
            boxShadow: isPending ? '0 0 30px #d4af3710' : '0 4px 24px #00000060', 
            overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s',
            opacity: isRejected ? 0.72 : 1,
        }}
        onClick={() => onClick(req)}
        onMouseEnter={e => { if(!isRejected) e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', background: '#111' }}>
                <div>
                    <p style={{ fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {getEventCategory(req)}
                    </p>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E5E5E5', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }} title={req.events?.title}>
                        {req.events?.title}
                    </h3>
                    <p style={{ fontSize: 11, color: '#d4af37', marginTop: 3, fontWeight: 500 }}>{formatDate(req.events?.event_date)}</p>
                </div>
                <StatusPill status={req.status} />
            </div>
            <div style={{ padding: '4px 20px 20px' }}>
                <AmountDisplay amount={req.amount} />
                <p style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Click to review terms & details →</p>
            </div>
        </div>
    );
};


/* ─── SponsorDashboard ─────────────────────────────────────────── */
const SponsorDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [selectedRequest, setSelectedRequest] = useState(null); // For Slide Panel
    const [expandedEventId, setExpandedEventId] = useState(null); // For Tickets & Chat
    const [showRejected, setShowRejected] = useState(false);
    
    // Filter State
    const [filters, setFilters] = useState({ 
        search: '', amountRange: 'all', status: 'all', category: 'all', eventDate: '', requestDate: '' 
    });

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/sponsors/requests');
            setRequests(data || []);
        } catch (err) { console.error("Failed to load", err); }
        finally { setLoading(false); }
    };

    const handleAction = async (id, action, customAmount, customNote) => {
        if (action !== 'negotiating' && !window.confirm(`Confirm ${action}?`)) return;
        try {
            const payload = { sponsorship_id: id, action };
            if (action === 'negotiating') {
                payload.amount = customAmount;
                payload.sponsor_note = customNote;
            }
            await api.patch('/sponsors/respond', payload);
            fetchRequests(); // Refresh data
        } catch { alert('Error processing request'); }
    };

    // Filter Logic
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            if (filters.status !== 'all' && req.status !== filters.status) return false;
            
            // Replaced event_type with getEventCategory
            if (filters.category !== 'all' && getEventCategory(req) !== filters.category) return false;
            
            if (filters.search) {
                const q = filters.search.toLowerCase();
                if (!req.events?.title?.toLowerCase().includes(q)) return false;
            }

            if (filters.eventDate) {
                const eDate = req.events?.event_date?.split('T')[0];
                if (eDate !== filters.eventDate) return false;
            }

            if (filters.requestDate) {
                const rDate = req.created_at?.split('T')[0];
                if (rDate !== filters.requestDate) return false;
            }

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
    
    // Extracted Unique Categories based on the new nested schema helper
    const uniqueCategoriesRaw = [...new Set(requests.map(r => getEventCategory(r)).filter(c => c !== 'Uncategorized'))];

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

    return (
        <>
            <style>{`
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                /* Custom Scrollbar for side panel */
                .panel-scroll::-webkit-scrollbar { width: 6px; }
                .panel-scroll::-webkit-scrollbar-track { background: transparent; }
                .panel-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            `}</style>

            <div style={{ minHeight: '100vh', background: '#050505', padding: '36px 24px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid #1a1a1a' }}>
                        <p style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Sponsor Portal</p>
                        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 300, color: '#E5E5E5', letterSpacing: '-0.02em', fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>
                            Sponsorship <span style={{ color: '#d4af37', fontStyle: 'italic' }}>Requests</span>
                        </h1>

                        {/* LIVE STATUS COUNTS */}
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

                    <FilterBar filters={filters} setFilters={setFilters} requestCounts={requestCounts} categories={uniqueCategoriesRaw} />

                    {/* Active Cards Grid */}
                    {activeRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555', fontSize: 14, fontWeight: 600 }}>No active requests match your filters</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 40 }}>
                            {activeRequests.map(req => (
                                <SponsorCard key={req.id} req={req} onClick={setSelectedRequest} />
                            ))}
                        </div>
                    )}

                    {/* Rejected / Declined Events Toggle */}
                    {rejectedRequests.length > 0 && (
                        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 28, marginBottom: 40 }}>
                            <button onClick={() => setShowRejected(!showRejected)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: showRejected ? 24 : 0, padding: 0 }}>
                                <div style={{ width: 36, height: 20, borderRadius: 10, background: showRejected ? '#dc262620' : '#111', border: `1px solid ${showRejected ? '#dc262650' : '#333'}`, position: 'relative', transition: 'background 0.25s, border-color 0.25s', flexShrink: 0 }}>
                                    <div style={{ position: 'absolute', top: 2, left: showRejected ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: showRejected ? '#f87171' : '#888', transition: 'left 0.25s' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: showRejected ? '#f87171' : '#888' }}>{showRejected ? 'Hide' : 'Show'} Declined Requests</span>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', background: '#dc262620', border: '1px solid #dc262640', borderRadius: 4, padding: '2px 7px' }}>{rejectedRequests.length}</span>
                            </button>
                            
                            {showRejected && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                                    {rejectedRequests.map(req => (
                                        <SponsorCard key={req.id} req={req} onClick={setSelectedRequest} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEPARATE CHIEF COORDINATOR CONTACT SECTION */}
                    <div style={{ 
                        marginTop: 40, padding: '24px 32px', background: '#0a0a0a', 
                        borderRadius: 14, border: '1px solid #1a1a1a', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 
                    }}>
                        <div>
                            <p style={{ fontSize: 10, color: '#d4af37', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Support</p>
                            <h3 style={{ fontSize: 18, color: '#E5E5E5', fontWeight: 600, marginBottom: 4 }}>Contact Chief Coordinator</h3>
                            <p style={{ fontSize: 13, color: '#888' }}>Need help with the portal or general sponsorship inquiries?</p>
                        </div>
                        <a 
                            href="mailto:sanasiju84@gmail.com" 
                            style={{ 
                                background: 'linear-gradient(135deg, #d4af37, #a68a3c)', color: '#000', 
                                padding: '12px 24px', borderRadius: 8, textDecoration: 'none', 
                                fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'lowercase'
                            }}
                        >
                            ✉ eventflowchiefcord@gmail.com
                        </a>
                    </div>

                </div>
            </div>

            {/* =========================================================
                SLIDING SIDE PANEL
            ========================================================= */}
            {/* Backdrop Overlay */}
            <div 
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    opacity: selectedRequest ? 1 : 0, pointerEvents: selectedRequest ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease', zIndex: 99
                }}
                onClick={() => setSelectedRequest(null)}
            />

            {/* Panel */}
            <div className="panel-scroll" style={{
                position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: 480, height: '100vh',
                background: '#0a0a0a', borderLeft: '1px solid #222', zIndex: 100,
                transform: selectedRequest ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column', overflowY: 'auto'
            }}>
                {selectedRequest && (() => {
                    const req = selectedRequest;
                    
                    return (
                        <>
                            {/* Panel Header */}
                            <div style={{ padding: '24px', borderBottom: '1px solid #1a1a1a', background: '#111', position: 'sticky', top: 0, zIndex: 2 }}>
                                <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
                                    ← Close Panel
                                </button>
                                <div>
                                    <StatusPill status={req.status} />
                                    <h2 style={{ fontSize: 22, color: '#E5E5E5', marginTop: 12, lineHeight: 1.2 }}>{req.events?.title}</h2>
                                </div>
                            </div>

                            {/* Panel Body */}
                            <div style={{ padding: '24px', flex: 1 }}>
                                
                                {/* Fact Sheet */}
                                <div style={{ background: '#111', borderRadius: 12, padding: 16, border: '1px solid #1a1a1a', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <p style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Category</p>
                                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{getEventCategory(req)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Event Date</p>
                                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{formatDate(req.events?.event_date)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Requested On</p>
                                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{formatDate(req.created_at)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Venue</p>
                                        <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{req.events?.venues?.name || 'TBD'}</p>
                                    </div>
                                </div>

                                {/* Event Manager Contact Section */}
                                <div style={{ background: '#1a1a1a', borderLeft: '3px solid #10b981', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: 24 }}>
                                    <h4 style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Assigned Event Manager</h4>
                                    
                                    <div>
                                        <p style={{ fontSize: 14, color: '#E5E5E5', fontWeight: 600 }}>{req.events?.manager?.full_name || 'Not Assigned'}</p>
                                        {req.events?.manager?.email ? (
                                            <a href={`mailto:${req.events.manager.email}`} style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>✉ {req.events.manager.email}</a>
                                        ) : (
                                            <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>No email provided</p>
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Chief Coordinator (Client)</p>
                                        <p style={{ fontSize: 14, color: '#E5E5E5', fontWeight: 600 }}>{req.events?.client?.company_name || req.events?.client?.full_name || 'Not Assigned'}</p>
                                        {req.events?.client?.email ? (
                                            <a href={`mailto:${req.events.client.email}`} style={{ fontSize: 12, color: '#d4af37', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>✉ {req.events.client.email}</a>
                                        ) : (
                                            <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>No email provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* Terms */}
                                <AmountDisplay amount={req.amount} />
                                {req.request_note && (
                                    <div style={{ background: '#d4af370a', borderLeft: '3px solid #d4af37', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                                        <p style={{ fontSize: 9, color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>Proposal Memo</p>
                                        <p style={{ fontSize: 13, color: '#ccc', fontStyle: 'italic', marginTop: 4 }}>"{req.request_note}"</p>
                                    </div>
                                )}
                                {req.sponsor_note && (
                                    <div style={{ background: '#7c3aed0a', borderRight: '3px solid #7c3aed', padding: 12, borderRadius: 6, textAlign: 'right' }}>
                                        <p style={{ fontSize: 9, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>Your Counter Terms</p>
                                        <p style={{ fontSize: 13, color: '#ccc', fontStyle: 'italic', marginTop: 4 }}>"{req.sponsor_note}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Panel Actions / Footer */}
                            <div style={{ padding: '20px 24px', background: '#111', borderTop: '1px solid #1a1a1a' }}>
                                {(req.status === 'pending' || req.status === 'negotiating') && (
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button 
                                            onClick={() => handleAction(req.id, 'accepted')}
                                            style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                                        >✓ Accept Terms</button>
                                        <button 
                                            onClick={() => {
                                                const amt = prompt("Enter Counter Amount:", req.amount);
                                                if(amt === null) return;
                                                const note = prompt("Enter conditions/remarks (optional):", "");
                                                handleAction(req.id, 'negotiating', amt, note);
                                            }}
                                            style={{ flex: 1, background: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                                        >↩ Counter Offer</button>
                                        <button 
                                            onClick={() => handleAction(req.id, 'rejected')}
                                            style={{ background: 'transparent', border: '1px solid #dc262650', color: '#f87171', padding: '12px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                                        >✕</button>
                                    </div>
                                )}

                                {/* Tools Toggle */}
                                <button 
                                    onClick={() => setExpandedEventId(expandedEventId === req.events?.id ? null : req.events?.id)}
                                    style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#888', padding: '12px', borderRadius: 8, marginTop: 16, cursor: 'pointer', fontWeight: 600 }}
                                >
                                    {expandedEventId === req.events?.id ? 'Hide Tickets & Chat' : 'Open Event Tickets & Chat'}
                                </button>
                                
                                {expandedEventId === req.events?.id && (
                                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <TicketViewer eventId={req.events?.id} />
                                        <EventMessaging eventId={req.events?.id} currentUserId={user?.id} />
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
        </>
    );
};

export default SponsorDashboard;