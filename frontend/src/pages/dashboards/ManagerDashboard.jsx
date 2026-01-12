import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const statsRes = await api.get('/admin/analytics');
                const attRes = await api.get('/admin/attendance');
                setStats(statsRes.data);
                setAttendance(attRes.data);
            } catch (err) {
                console.error("Error loading dashboard data", err);
            }
        };
        loadData();
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats?.totalEvents || 0}</p>
                </div>
                <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium">Most Booked Type</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats?.mostBookedType || 'N/A'}</p>
                </div>
            </div>

            {/* Attendance Log Section */}
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Staff Attendance Logs</h2>
                </div>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Employee</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Event</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check In Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {attendance.map(log => (
                            <tr key={log.id}>
                                <td className="py-3 px-4">{log.profiles?.full_name || 'Unknown'}</td>
                                <td className="py-3 px-4">{log.events?.title || 'Unknown'}</td>
                                <td className="py-3 px-4 text-gray-500">{new Date(log.check_in).toLocaleString()}</td>
                            </tr>
                        ))}
                        {attendance.length === 0 && (
                            <tr>
                                <td colSpan="3" className="py-4 text-center text-gray-500">No attendance records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManagerDashboard;