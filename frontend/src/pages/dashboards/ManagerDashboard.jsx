import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManagerDashboard = () => {
    const [stats, setStats] = useState({ totalEvents: 0, mostBookedType: 'None' });
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // We use Promise.allSettled so one error doesn't kill the whole page
                const [statsRes, attRes] = await Promise.allSettled([
                    api.get('/admin/analytics'),
                    api.get('/admin/attendance')
                ]);

                if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
                if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
                
            } catch (err) {
                console.error("Dashboard Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10">Loading Dashboard...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats?.totalEvents || 0}</p>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium">Top Event Type</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats?.mostBookedType || 'N/A'}</p>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Recent Staff Logs</h2>
                </div>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Employee</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Event</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.length > 0 ? (
                            attendance.map((log) => (
                                <tr key={log.id} className="border-t">
                                    <td className="py-3 px-4">{log.profiles?.full_name || 'Unknown'}</td>
                                    <td className="py-3 px-4">{log.events?.title || 'Unknown'}</td>
                                    <td className="py-3 px-4 text-gray-500">
                                        {new Date(log.check_in).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-4 text-center text-gray-500">
                                    No attendance records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManagerDashboard;