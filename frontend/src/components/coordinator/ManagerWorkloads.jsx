import { useState, useEffect, useMemo } from 'react';
import { getManagerWorkloads } from '../../services/coordinatorService';

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

    // Collapse States (Track which categories and managers are currently OPEN)
    const [openCategories, setOpenCategories] = useState({});
    const [openManagers, setOpenManagers] = useState({});

    useEffect(() => {
        fetchWorkloads();
    }, []);

    const fetchWorkloads = async () => {
        setLoading(true);
        try {
            const response = await getManagerWorkloads();
            setRawEvents(response.data || []);
            setError(null);
            
            // Auto-open all categories by default when data loads
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

    // --- DYNAMIC FILTER OPTIONS ---
    // Extract unique categories and subtypes from the data to populate the dropdowns
    const uniqueCategories = useMemo(() => ['All', ...new Set(rawEvents.map(e => e.subtype?.category?.name).filter(Boolean))], [rawEvents]);
    const uniqueSubtypes = useMemo(() => {
        let subtypes = rawEvents.map(e => e.subtype?.name).filter(Boolean);
        return ['All', ...new Set(subtypes)];
    }, [rawEvents]);

    // --- FILTER & GROUPING ENGINE ---
    const groupedWorkloads = useMemo(() => {
        // 1. Apply Filters
        const filtered = rawEvents.filter(event => {
            const catName = event.subtype?.category?.name || 'Uncategorized';
            const subName = event.subtype?.name || 'Unknown';
            const hasSponsors = event.sponsorships && event.sponsorships.length > 0;
            
            // Search Text Match (Checks Title, Client, Venue, Manager)
            const searchString = `${event.title} ${event.client?.full_name} ${event.venue?.name} ${event.manager?.full_name}`.toLowerCase();
            const matchesSearch = searchString.includes(searchTerm.toLowerCase());

            // Dropdown Matches
            const matchesCategory = filterCategory === 'All' || catName === filterCategory;
            const matchesSubtype = filterSubtype === 'All' || subName === filterSubtype;
            const matchesStatus = filterStatus === 'All' || event.status === filterStatus;
            
            let matchesSponsors = true;
            if (filterSponsors === 'Assigned') matchesSponsors = hasSponsors;
            if (filterSponsors === 'None') matchesSponsors = !hasSponsors;

            return matchesSearch && matchesCategory && matchesSubtype && matchesStatus && matchesSponsors;
        });

        // 2. Group by Category -> Manager
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

    if (loading) return <div style={{ color: 'var(--text-secondary)' }} className="p-6">Loading workloads...</div>;
    if (error) return <div className="text-red-500 font-bold p-6">Error: {error}</div>;

    return (
        <div className="space-y-6">
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
                        
                        return (
                            <div key={categoryName} className="border border-[#333] rounded-lg overflow-hidden">
                                {/* CATEGORY HEADER */}
                                <button 
                                    onClick={() => toggleCategory(categoryName)}
                                    className="w-full flex justify-between items-center p-4 bg-[#222] hover:bg-[#2a2a2a] transition-colors border-b border-[#333]"
                                >
                                    <h3 className="text-xl font-bold text-[var(--gold-main)] uppercase tracking-wider">
                                        📁 {categoryName}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm px-3 py-1 bg-[#333] rounded-full text-[var(--text-secondary)]">
                                            {Object.keys(managers).length} Manager{Object.keys(managers).length !== 1 ? 's' : ''}
                                        </span>
                                        <ChevronIcon isOpen={isCatOpen} />
                                    </div>
                                </button>

                                {/* MANAGERS WRAPPER (Collapsible) */}
                                {isCatOpen && (
                                    <div className="p-4 bg-[#1a1a1a] space-y-4">
                                        {Object.entries(managers).map(([managerName, events]) => {
                                            const catMgrKey = `${categoryName}-${managerName}`;
                                            const isMgrOpen = openManagers[catMgrKey] !== false; // Managers open by default

                                            return (
                                                <div key={managerName} className="border border-[#444] rounded bg-[#1e1e1e]">
                                                    {/* MANAGER HEADER */}
                                                    <button 
                                                        onClick={() => toggleManager(catMgrKey)}
                                                        className="w-full flex justify-between items-center p-3 hover:bg-[#252525] transition-colors border-b border-[#444]"
                                                    >
                                                        <h4 className="font-semibold text-[var(--text-primary)] text-lg">
                                                            👤 {managerName}
                                                        </h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs px-2 py-1 bg-[#333] rounded text-[var(--text-secondary)]">
                                                                {events.length} Event{events.length !== 1 ? 's' : ''}
                                                            </span>
                                                            <ChevronIcon isOpen={isMgrOpen} />
                                                        </div>
                                                    </button>

                                                    {/* EVENTS TABLE (Collapsible) */}
                                                    {isMgrOpen && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-[#252525] text-[var(--text-secondary)] uppercase text-xs tracking-wider">
                                                                        <th className="p-3">Event Title</th>
                                                                        <th className="p-3">Subtype</th>
                                                                        <th className="p-3">Client</th>
                                                                        <th className="p-3">Status</th>
                                                                        <th className="p-3 min-w-[200px]">Sponsors</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {events.map(event => (
                                                                        <tr key={event.id} className="border-t border-[#444] hover:bg-[#2a2a2a] transition-colors">
                                                                            <td className="p-3 font-semibold text-[var(--text-primary)]">{event.title}</td>
                                                                            <td className="p-3 text-[var(--text-secondary)]">{event.subtype?.name || 'N/A'}</td>
                                                                            <td className="p-3 text-[var(--text-secondary)]">{event.client?.full_name || 'N/A'}</td>
                                                                            <td className="p-3">
                                                                                <span className="px-2 py-1 text-xs rounded uppercase bg-[#333] text-[var(--text-primary)] whitespace-nowrap">
                                                                                    {event.status.replace('_', ' ')}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3 text-[var(--text-secondary)] text-sm">
                                                                                {event.sponsorships && event.sponsorships.length > 0 ? (
                                                                                    <ul className="list-disc list-inside space-y-1">
                                                                                        {event.sponsorships.map((sponsorRow, idx) => (
                                                                                            <li key={idx}>
                                                                                                {sponsorRow.sponsor?.full_name || 'Unknown'} - ${sponsorRow.amount} 
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                ) : (
                                                                                    <span className="italic opacity-50">None</span>
                                                                                )}
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
        </div>
    );
};

export default ManagerWorkloads;