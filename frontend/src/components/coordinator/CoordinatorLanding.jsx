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

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Control Panel...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* 1. ACTION REQUIRED: Pending Approvals */}
            <div className="bg-white rounded shadow-sm border border-orange-100 overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                        ⚠️ Action Required
                        <span className="bg-white text-orange-600 text-xs px-2 py-1 rounded-full border border-orange-200">
                            {data.pending.length} Pending
                        </span>
                    </h3>
                    <button 
                        onClick={() => setActiveTab('approvals')}
                        className="text-xs font-bold text-orange-700 hover:underline"
                    >
                        View All
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {data.pending.length === 0 ? (
                        <p className="p-6 text-gray-400 italic text-sm">All caught up! No pending approvals.</p>
                    ) : (
                        data.pending.map(user => (
                            <div key={user.id} className="p-4 flex justify-between items-center hover:bg-orange-50/50 transition">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{user.full_name}</p>
                                    <p className="text-xs text-gray-500 uppercase">{user.role} • {user.company_name || 'Individual'}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${user.days_waiting > 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        Waited {user.days_waiting} days
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

          

{/* 2. URGENT: Events Starting Soon with Issues */}
<div className="bg-white rounded shadow-sm border border-red-100 overflow-hidden">
    <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
        <h3 className="font-bold text-red-800 flex items-center gap-2">
            🔥 High Risk Events
            {/* ✅ NEW: VISIBLE NUMBER BADGE */}
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                {data.urgent.length}
            </span>
        </h3>
        <span className="text-xs text-red-600 font-semibold bg-white px-2 py-1 rounded border border-red-200">
            Next 7 Days
        </span>
    </div>
    
    <div className="divide-y divide-gray-100">
        {data.urgent.length === 0 ? (
            <p className="p-6 text-gray-400 italic text-sm">No urgent event issues found.</p>
        ) : (
            data.urgent.map(ev => (
                <div key={ev.id} className="p-4 flex justify-between items-center hover:bg-red-50/50 transition">
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                        <p className="text-xs text-red-600 font-semibold">
                            {ev.status === 'consideration' ? 'Needs Approval' : 'Missing Venue'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-700">In {ev.days_until_event} Days</p>
                        <p className="text-[10px] text-gray-500">{new Date(ev.event_date).toLocaleDateString()}</p>
                    </div>
                </div>
            ))
        )}
    </div>
</div>

            {/* 3. SYSTEM ALERTS: Recent Cancellations */}
            <div className="lg:col-span-2 bg-white rounded shadow-sm border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-700">📉 Recent System Alerts (Last 7 Days)</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.alerts.length === 0 ? (
                        <p className="text-gray-400 italic text-sm col-span-3">No recent cancellations or alerts.</p>
                    ) : (
                        data.alerts.map(alert => (
                            <div key={alert.id} className="border border-gray-200 p-3 rounded bg-gray-50 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-red-600 uppercase border border-red-200 px-1 rounded bg-white">Cancelled</span>
                                    <p className="font-semibold text-gray-800 text-sm mt-1">{alert.title}</p>
                                </div>
                                <span className="text-xs text-gray-400">
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