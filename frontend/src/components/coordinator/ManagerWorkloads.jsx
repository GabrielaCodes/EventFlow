import { useState, useEffect } from 'react';
import { getManagerWorkloads } from '../../services/coordinatorService';

const ManagerWorkloads = () => {
    const [groupedEvents, setGroupedEvents] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWorkloads();
    }, []);

    const fetchWorkloads = async () => {
        setLoading(true); // Ensure loading state is true when refreshing
        try {
            // Look how clean this is now! Your api.js handles the token automatically.
            const response = await getManagerWorkloads();
            
            // Axios puts the backend JSON payload inside the `.data` property
            const data = response.data; 

            // Group events by manager name
            const grouped = data.reduce((acc, event) => {
                const managerName = event.manager?.full_name || 'Unassigned';
                if (!acc[managerName]) {
                    acc[managerName] = [];
                }
                acc[managerName].push(event);
                return acc;
            }, {});

            setGroupedEvents(grouped);
            setError(null);
        } catch (err) {
            console.error("Fetch Workloads Error:", err);
            // Axios places backend error messages inside err.response.data
            const backendError = err.response?.data?.error || err.message;
            setError(backendError || "Failed to fetch workloads");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)' }} className="p-6">Loading workloads...</div>;
    if (error) return <div className="text-red-500 font-bold p-6">Error: {error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Manager Event Workloads
                </h2>
                <button 
                    onClick={fetchWorkloads}
                    className="px-4 py-2 bg-[#333] hover:bg-[#444] text-[var(--text-primary)] rounded transition-colors text-sm font-semibold"
                >
                    Refresh Data
                </button>
            </div>

            {Object.keys(groupedEvents).length === 0 && !loading && (
                <p style={{ color: 'var(--text-secondary)' }}>No events found in the system.</p>
            )}

            {Object.entries(groupedEvents).map(([managerName, events]) => (
                <div key={managerName} className="border border-[#333] rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary, #1a1a1a)' }}>
                    <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                        <h3 className="text-xl font-bold text-[var(--gold-main)]">
                            {managerName}
                        </h3>
                        <span className="text-sm font-semibold px-3 py-1 bg-[#333] rounded-full text-[var(--text-secondary)]">
                            {events.length} Event{events.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#444] text-[var(--text-secondary)] uppercase text-xs tracking-wider">
                                    <th className="p-3 whitespace-nowrap">Event Title</th>
                                    <th className="p-3 whitespace-nowrap">Client</th>
                                    <th className="p-3 whitespace-nowrap">Venue</th>
                                    <th className="p-3 whitespace-nowrap">Status</th>
                                    <th className="p-3 min-w-[200px]">Sponsors & Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event.id} className="border-b border-[#333] hover:bg-[#252525] transition-colors">
                                        <td className="p-3 font-semibold text-[var(--text-primary)]">{event.title}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{event.client?.full_name || 'N/A'}</td>
                                        <td className="p-3 text-[var(--text-secondary)]">{event.venue?.name || 'TBD'}</td>
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
                                                            <span className="text-xs ml-1 opacity-70">({sponsorRow.status})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="italic opacity-50">No sponsors</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ManagerWorkloads;