import { useEffect, useState } from 'react';
import api from '../../services/api';

const CoordinatorLanding = ({ setActiveTab }) => {
    const [data, setData] = useState({ pending: [], urgent: [], alerts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/coordinator/landing-data');
            setData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-[var(--text-secondary)]">Loading Control Panel...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* 1. ACTION REQUIRED */}
            <div className="bg-[var(--surface-color)] rounded shadow-sm border border-[#333] overflow-hidden">
                <div className="bg-[#111] px-6 py-4 border-b border-[#333] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--gold-main)] flex items-center gap-2">
                        ⚠️ Action Required
                        <span className="bg-[#222] text-[var(--gold-hover)] text-xs px-2 py-1 rounded-full border border-[var(--gold-dark)]">
                            {data.pending.length} Pending
                        </span>
                    </h3>
                    <button 
                        onClick={() => setActiveTab('approvals')}
                        className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--gold-main)] hover:underline"
                        style={{ padding: 0, background: 'transparent' }}
                    >
                        View All
                    </button>
                </div>
                <div className="divide-y divide-[#333]">
                    {data.pending.length === 0 ? (
                        <p className="p-6 text-[var(--text-secondary)] italic text-sm">All caught up! No pending approvals.</p>
                    ) : (
                        data.pending.map(user => (
                            <div key={user.id} className="p-4 flex justify-between items-center hover:bg-[#1a1a1a] transition">
                                <div>
                                    <p className="font-bold text-[var(--text-primary)] text-sm">{user.full_name}</p>
                                    <p className="text-xs text-[var(--text-secondary)] uppercase">{user.role} • {user.company_name || 'Individual'}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${user.days_waiting > 3 ? 'bg-red-900 text-red-200' : 'bg-[#222] text-[var(--text-secondary)]'}`}>
                                        Waited {user.days_waiting} days
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. URGENT */}
            <div className="bg-[var(--surface-color)] rounded shadow-sm border border-[#333] overflow-hidden">
                <div className="bg-[#111] px-6 py-4 border-b border-[#333] flex justify-between items-center">
                    <h3 className="font-bold text-red-500 flex items-center gap-2">
                        🔥 High Risk Events
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            {data.urgent.length}
                        </span>
                    </h3>
                    <span className="text-xs text-red-400 font-semibold bg-[#222] px-2 py-1 rounded border border-red-900">
                        Next 7 Days
                    </span>
                </div>
                
                <div className="divide-y divide-[#333]">
                    {data.urgent.length === 0 ? (
                        <p className="p-6 text-[var(--text-secondary)] italic text-sm">No urgent event issues found.</p>
                    ) : (
                        data.urgent.map(ev => (
                            <div key={ev.id} className="p-4 flex justify-between items-center hover:bg-[#1a1a1a] transition">
                                <div>
                                    <p className="font-bold text-[var(--text-primary)] text-sm">{ev.title}</p>
                                    <p className="text-xs text-red-500 font-semibold">
                                        {ev.status === 'consideration' ? 'Needs Approval' : 'Missing Venue'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-[var(--gold-main)]">In {ev.days_until_event} Days</p>
                                    <p className="text-[10px] text-[var(--text-secondary)]">{new Date(ev.event_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. SYSTEM ALERTS */}
            <div className="lg:col-span-2 bg-[var(--surface-color)] rounded shadow-sm border border-[#333]">
                <div className="bg-[#111] px-6 py-4 border-b border-[#333]">
                    <h3 className="font-bold text-[var(--gold-main)]">📉 Recent System Alerts (Last 7 Days)</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.alerts.length === 0 ? (
                        <p className="text-[var(--text-secondary)] italic text-sm col-span-3">No recent cancellations or alerts.</p>
                    ) : (
                        data.alerts.map(alert => (
                            <div key={alert.id} className="border border-[#333] p-3 rounded bg-[#111] flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-red-500 uppercase border border-red-900 px-1 rounded bg-[#222]">Cancelled</span>
                                    <p className="font-semibold text-[var(--text-primary)] text-sm mt-1">{alert.title}</p>
                                </div>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {new Date(alert.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorLanding;