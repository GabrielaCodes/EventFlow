import { useState, useEffect, useMemo } from 'react';
import { getManagerWorkloads, getEventStaff } from '../../services/coordinatorService';

// Simple SVG Icon for Collapsible Headers
const ChevronIcon = ({ isOpen }) => (
    <svg 
        className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
);

const ManagerWorkloads = () => {
    const [rawEvents, setRawEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubtype, setFilterSubtype] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSponsors, setFilterSponsors] = useState('All');

    // Detail States (Side Panel)
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [panelView, setPanelView] = useState('staff'); // 'staff' | 'sponsors'
    const [eventStaff, setEventStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Collapse States
    const [openCategories, setOpenCategories] = useState({});
    const [openManagers, setOpenManagers] = useState({});
    const [openRankings, setOpenRankings] = useState({});

    useEffect(() => {
        fetchWorkloads();
    }, []);

    const fetchWorkloads = async () => {
        setLoading(true);
        try {
            const response = await getManagerWorkloads();
            setRawEvents(response.data || []);
            setError(null);
            
            const initialCats = {};
            response.data.forEach(e => {
                const cat = e.subtype?.category?.name || 'Uncategorized';
                initialCats[cat] = true;
            });
            setOpenCategories(initialCats);

        } catch (err) {
            const backendError = err.response?.data?.error || err.message;
            setError(backendError || "Failed to fetch workloads");
        } finally {
            setLoading(false);
        }
    };

    // --- PANEL LOGIC ---
    const handleStaffClick = async (e, event) => {
        e.stopPropagation();
        setPanelView('staff');
        setSelectedEvent(event);
        setLoadingStaff(true);
        try {
            const res = await getEventStaff(event.id);
            setEventStaff(res.data || []);
        } catch (err) {
            console.error("Failed to fetch staff", err);
            setEventStaff([]);
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleSponsorClick = (e, event) => {
        e.stopPropagation();
        if (event.sponsorships && event.sponsorships.length > 0) {
            setPanelView('sponsors');
            setSelectedEvent(event);
        }
    };

    // --- DYNAMIC FILTER OPTIONS ---
    const uniqueCategories = useMemo(() => ['All', ...new Set(rawEvents.map(e => e.subtype?.category?.name).filter(Boolean))], [rawEvents]);
    const uniqueSubtypes = useMemo(() => {
        let subtypes = rawEvents.map(e => e.subtype?.name).filter(Boolean);
        return ['All', ...new Set(subtypes)];
    }, [rawEvents]);

    // --- FILTER & GROUPING ENGINE ---
    const groupedWorkloads = useMemo(() => {
        const filtered = rawEvents.filter(event => {
            const catName = event.subtype?.category?.name || 'Uncategorized';
            const subName = event.subtype?.name || 'Unknown';
            const hasSponsors = event.sponsorships && event.sponsorships.length > 0;
            
            const searchString = `${event.title} ${event.client?.full_name} ${event.venue?.name} ${event.manager?.full_name}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());

            const matchesCategory = filterCategory === 'All' || catName === filterCategory;
            const matchesSubtype = filterSubtype === 'All' || subName === filterSubtype;
            const matchesStatus = filterStatus === 'All' || event.status === filterStatus;
            
            let matchesSponsors = true;
            if (filterSponsors === 'Assigned') matchesSponsors = hasSponsors;
            if (filterSponsors === 'None') matchesSponsors = !hasSponsors;

            return matchesSearch && matchesCategory && matchesSubtype && matchesStatus && matchesSponsors;
        });

        return filtered.reduce((acc, event) => {
            const catName = event.subtype?.category?.name || 'Uncategorized';
            const managerName = event.manager?.full_name || 'Unassigned';

            if (!acc[catName]) acc[catName] = {};
            if (!acc[catName][managerName]) acc[catName][managerName] = [];
            
            acc[catName][managerName].push(event);
            return acc;
        }, {});
    }, [rawEvents, searchTerm, filterCategory, filterSubtype, filterStatus, filterSponsors]);

    // Toggle Handlers
    const toggleCategory = (cat) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    const toggleManager = (catMgrKey) => setOpenManagers(prev => ({ ...prev, [catMgrKey]: !prev[catMgrKey] }));
    const toggleRanking = (cat) => setOpenRankings(prev => ({ ...prev, [cat]: !prev[cat] }));

    if (loading) return <div style={{ color: 'var(--text-secondary)' }} className="p-6">Loading workloads...</div>;
    if (error) return <div className="text-red-500 font-bold p-6">Error: {error}</div>;

    return (
        <div className="space-y-6 relative min-h-screen">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Manager Event Workloads</h2>
                <button onClick={fetchWorkloads} className="px-4 py-2 bg-[#333] hover:bg-[#444] text-[var(--text-primary)] rounded transition-colors text-sm font-semibold">
                    Refresh Data
                </button>
            </div>

            {/* --- FILTER TOOLBAR --- */}
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <input 
                    type="text" placeholder="Search events, clients, managers..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 rounded bg-[#252525] border border-[#444] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-main)] w-full"
                />
                
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-2 rounded bg-[#252525] border border-[#444] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-main)]">
                    <option value="All">All Categories</option>
                    {uniqueCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={filterSubtype} onChange={(e) => setFilterSubtype(e.target.value)} className="p-2 rounded bg-[#252525] border border-[#444] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-main)]">
                    <option value="All">All Subtypes</option>
                    {uniqueSubtypes.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 rounded bg-[#252525] border border-[#444] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-main)]">
                    <option value="All">All Statuses</option>
                    <option value="consideration">Consideration</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <select value={filterSponsors} onChange={(e) => setFilterSponsors(e.target.value)} className="p-2 rounded bg-[#252525] border border-[#444] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-main)]">
                    <option value="All">Sponsors: All</option>
                    <option value="Assigned">Has Sponsors</option>
                    <option value="None">No Sponsors</option>
                </select>
            </div>

            {/* --- DATA RENDERING --- */}
            {Object.keys(groupedWorkloads).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }} className="text-center py-8">No events match your current filters.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedWorkloads).map(([categoryName, managers]) => {
                        const isCatOpen = openCategories[categoryName];
                        const isRankingOpen = openRankings[categoryName];

                        const rankedManagers = Object.entries(managers)
                            .filter(([mName]) => mName !== 'Unassigned')
                            .map(([mName, mEvents]) => {
                                const inProgressCount = mEvents.filter(e => e.status === 'in_progress').length;
                                return {
                                    name: mName,
                                    count: inProgressCount,
                                    createdAt: mEvents[0]?.manager?.created_at || '1970-01-01T00:00:00Z' 
                                };
                            })
                            .sort((a, b) => {
                                if (a.count !== b.count) return a.count - b.count;
                                return new Date(a.createdAt) - new Date(b.createdAt);
                            });

                        return (
                            <div key={categoryName} className="border border-[#333] rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => toggleCategory(categoryName)}
                                    className="w-full flex justify-between items-center p-4 bg-[#222] hover:bg-[#2a2a2a] transition-colors border-b border-[#333]"
                                >
                                    <h3 className="text-xl font-bold text-[var(--gold-main)] uppercase tracking-wider">📁 {categoryName}</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm px-3 py-1 bg-[#333] rounded-full text-[var(--text-secondary)]">
                                            {Object.keys(managers).length} Group{Object.keys(managers).length !== 1 ? 's' : ''}
                                        </span>
                                        <ChevronIcon isOpen={isCatOpen} />
                                    </div>
                                </button>

                                {isCatOpen && (
                                    <div className="p-4 bg-[#1a1a1a] space-y-4">
                                        {rankedManagers.length > 0 && (
                                            <div className="border border-[var(--gold-main)] rounded bg-[#1e1a15]">
                                                <button onClick={() => toggleRanking(categoryName)} className="w-full flex justify-between items-center p-3 hover:bg-[#251f18] transition-colors">
                                                    <h4 className="font-semibold text-[var(--gold-main)] text-sm uppercase tracking-wide flex items-center gap-2">📊 Manager Rankings</h4>
                                                    <ChevronIcon isOpen={isRankingOpen} />
                                                </button>
                                                {isRankingOpen && (
                                                    <div className="p-3 border-t border-[var(--gold-main)]/30">
                                                        <div className="flex flex-col gap-2">
                                                            {rankedManagers.map((mgr, index) => (
                                                                <div key={mgr.name} className="flex justify-between items-center bg-[#252525] p-2 rounded text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`font-bold w-6 h-6 rounded-full flex items-center justify-center ${index === 0 ? 'bg-[var(--gold-main)] text-black' : 'bg-[#444] text-[var(--text-secondary)]'}`}>{index+1}</span>
                                                                        <span className="font-medium text-[var(--text-primary)]">{mgr.name}</span>
                                                                    </div>
                                                                    <span className="px-2 py-1 bg-[#333] rounded text-[var(--text-secondary)]">{mgr.count} In Progress</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {Object.entries(managers)
                                            .sort(([a], [b]) => a === 'Unassigned' ? -1 : b === 'Unassigned' ? 1 : a.localeCompare(b))
                                            .map(([managerName, events]) => {
                                                const catMgrKey = `${categoryName}-${managerName}`;
                                                const isMgrOpen = openManagers[catMgrKey] !== false; 
                                                const isUnassigned = managerName === 'Unassigned';

                                                return (
                                                    <div key={managerName} className={`border rounded ${isUnassigned ? 'border-orange-500/30 bg-[#2a1e15]' : 'border-[#444] bg-[#1e1e1e]'}`}>
                                                        <button onClick={() => toggleManager(catMgrKey)} className={`w-full flex justify-between items-center p-3 border-b ${isUnassigned ? 'border-orange-500/30' : 'border-[#444]'}`}>
                                                            <h4 className={`font-semibold text-lg ${isUnassigned ? 'text-orange-400' : 'text-[var(--text-primary)]'}`}>{isUnassigned ? '⚠️ ' : '👤 '} {managerName}</h4>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs px-2 py-1 bg-[#333] rounded text-[var(--text-secondary)]">{events.length} Events</span>
                                                                <ChevronIcon isOpen={isMgrOpen} />
                                                            </div>
                                                        </button>
                                                        {isMgrOpen && (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-[#252525] text-[var(--text-secondary)] uppercase text-xs">
                                                                            <th className="p-3">Event Title</th>
                                                                            <th className="p-3">Subtype</th>
                                                                            <th className="p-3">Client</th>
                                                                            <th className="p-3">Status</th>
                                                                            <th className="p-3 text-center">Staff</th>
                                                                            <th className="p-3 text-center">Sponsors</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {events.map(event => (
                                                                            <tr 
                                                                                key={event.id} 
                                                                                className="border-t border-[#444] hover:bg-[#333] transition-colors"
                                                                            >
                                                                                <td className="p-3 font-semibold text-[var(--gold-main)]">
                                                                                    {event.title}
                                                                                </td>
                                                                                <td className="p-3 text-[var(--text-secondary)]">{event.subtype?.name}</td>
                                                                                <td className="p-3 text-[var(--text-secondary)]">{event.client?.full_name}</td>
                                                                                <td className="p-3">
                                                                                    <span className="px-2 py-1 text-xs rounded uppercase bg-[#333]">{event.status.replace('_', ' ')}</span>
                                                                                </td>
                                                                                
                                                                                {/* STAFF COLUMN - CLICKABLE */}
                                                                                <td 
                                                                                    className="p-3 text-center text-[var(--text-primary)] font-bold cursor-pointer hover:text-[var(--gold-main)] hover:underline"
                                                                                    onClick={(e) => handleStaffClick(e, event)}
                                                                                    title="Click to view staff assignments"
                                                                                >
                                                                                    {event.assignments?.length || 0}
                                                                                </td>

                                                                                {/* SPONSOR COLUMN - CLICKABLE */}
                                                                                <td 
                                                                                    className="p-3 text-center text-[var(--text-primary)] font-bold cursor-pointer hover:text-green-400 hover:underline"
                                                                                    onClick={(e) => handleSponsorClick(e, event)}
                                                                                    title="Click to view sponsorships"
                                                                                >
                                                                                    {event.sponsorships?.length || 0}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- SIDE PANEL (Handles both Staff and Sponsors) --- */}
            {selectedEvent && (
                <>
                    {/* Overlay to close when clicking outside */}
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedEvent(null)}></div>
                    
                    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111] border-l border-[var(--gold-main)] shadow-2xl z-50 p-6 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[var(--gold-main)]">
                                {panelView === 'staff' ? 'Employee Assignments' : 'Sponsorship Details'}
                            </h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-white hover:text-[var(--gold-main)] transition-colors text-2xl">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#1a1a1a] p-4 rounded border border-[#333]">
                                <h4 className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-1">Event</h4>
                                <p className="text-xl font-bold">{selectedEvent.title}</p>
                                <p className="text-sm text-[var(--gold-main)]">{selectedEvent.subtype?.name}</p>
                            </div>

                            {/* CONDITIONAL RENDER: STAFF vs SPONSORS */}
                            {panelView === 'staff' ? (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        👷 Assigned Personnel
                                    </h4>
                                    
                                    {loadingStaff ? (
                                        <div className="flex justify-center py-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--gold-main)]"></div>
                                        </div>
                                    ) : eventStaff.length > 0 ? (
                                        <div className="grid gap-3">
                                            {eventStaff.map(staff => (
                                                <div key={staff.id} className="bg-[#1a1a1a] p-3 rounded border border-[#333] hover:border-[var(--gold-main)] transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-[var(--text-primary)]">{staff.employee?.full_name}</p>
                                                            <p className="text-xs text-[var(--text-secondary)]">{staff.employee?.email}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[10px] bg-[#333] text-[var(--gold-main)] px-2 py-0.5 rounded uppercase font-bold text-right">
                                                                {staff.role_description || 'General Staff'}
                                                            </span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${staff.status === 'accepted' ? 'text-green-400' : staff.status === 'pending' ? 'text-orange-400' : 'text-red-400'}`}>
                                                                {staff.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-[#2a1a1a] border border-red-900/50 p-6 rounded-lg text-center">
                                            <p className="text-red-400 text-sm italic">No employees assigned to this event yet.</p>
                                            <p className="text-[10px] text-red-500/70 mt-2">Check with the Manager for updates.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-green-400">
                                        🤝 Sponsors for Event
                                    </h4>
                                    <div className="grid gap-3">
                                        {selectedEvent.sponsorships?.map(sponsor => (
                                            <div key={sponsor.id} className="bg-[#1a1a1a] p-4 rounded border border-[#333] hover:border-green-500/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-white text-lg">
                                                            {sponsor.sponsor?.company_name || sponsor.sponsor?.full_name || 'Anonymous Sponsor'}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${
                                                        sponsor.status === 'accepted' || sponsor.status === 'paid' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                                                        sponsor.status === 'pending' || sponsor.status === 'negotiating' ? 'bg-orange-900/30 text-orange-400 border border-orange-800' : 
                                                        'bg-red-900/30 text-red-400 border border-red-800'
                                                    }`}>
                                                        {sponsor.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1 text-sm border-t border-[#333] pt-3 mt-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-[var(--text-secondary)]">Amount:</span>
                                                        <span className="text-green-400 font-mono font-bold">
                                                            ${Number(sponsor.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-10">
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className="w-full py-3 bg-[#222] hover:bg-[#333] text-white rounded font-bold transition-colors border border-[#444]"
                            >
                                Close Panel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManagerWorkloads;