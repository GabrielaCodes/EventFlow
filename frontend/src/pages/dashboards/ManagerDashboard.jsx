import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import ManagerEvents from './ManagerEvents';

const ManagerDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [activeEventsList, setActiveEventsList] = useState([]);
    
    // ✅ NEW: State for Pending Employees
    const [pendingEmployees, setPendingEmployees] = useState([]);
    
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        employee_id: '',
        event_id: '',
        role_description: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch lightweight event list
            const { data: eventData } = await supabase
                .from('manager_event_overview')
                .select('id, title, subtype_name')
                .neq('status', 'completed')
                .order('event_date', { ascending: true });
            if (eventData) setActiveEventsList(eventData);

            // 2. Fetch Active Employees (For assignment dropdown)
            const { data: empData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'employee')
                .eq('verification_status', 'verified'); // Only show verified
            if (empData) setEmployees(empData);

            // 3. ✅ NEW: Fetch Pending Employees (For verification)
            try {
                const res = await api.get('/admin/employees/pending');
                setPendingEmployees(res.data);
            } catch (err) {
                console.error("Pending employees fetch error", err);
            }

            // 4. Fetch Attendance & Assignments (Existing logic)
            const { data: attData } = await supabase.from('attendance')
                .select(`id, check_in, check_out, profiles(full_name), events(title)`)
                .order('check_in', { ascending: false }).limit(20);
            if (attData) setAttendance(attData);

            const { data: assignData } = await supabase.from('assignments')
                .select(`id, status, role_description, assigned_at, profiles(full_name), events(id, title)`)
                .order('assigned_at', { ascending: false });
            if (assignData) setAssignments(assignData);

        } catch (error) {
            console.error("Dashboard load error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // ✅ NEW: Handle Verification
    const handleVerify = async (employeeId, action) => {
        try {
            await api.post('/admin/employees/verify', { employee_id: employeeId, action });
            alert(`Employee ${action === 'approve' ? 'Approved' : 'Rejected'}`);
            fetchDashboardData(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.error || "Action failed");
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.event_id) return alert("Select both");
        try {
            await api.post('/admin/assign-staff', { ...formData, role_description: formData.role_description || "General Staff" });
            alert("Task assigned!");
            setFormData({ employee_id: '', event_id: '', role_description: '' });
            fetchDashboardData(); 
        } catch (err) {
            alert(err.response?.data?.error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Manager Dashboard</h1>

            {/* ✅ NEW: Pending Verifications Section */}
            {pendingEmployees.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded shadow mb-8">
                    <h2 className="text-xl font-bold text-orange-800 mb-4">🔔 Pending Staff Approvals</h2>
                    <div className="grid gap-4">
                        {pendingEmployees.map(emp => (
                            <div key={emp.id} className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
                                <div>
                                    <p className="font-bold">{emp.full_name}</p>
                                    <p className="text-sm text-gray-600">{emp.email}</p>
                                    <p className="text-xs text-gray-400">Signed up: {new Date(emp.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerify(emp.id, 'approve')} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">Approve</button>
                                    <button onClick={() => handleVerify(emp.id, 'reject')} className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ManagerEvents />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Assign Task Form */}
                <div className="bg-white p-6 rounded shadow mb-8 h-fit">
                    <h2 className="text-xl font-bold text-blue-700 mb-4">Assign Staff</h2>
                    <form onSubmit={handleAssign} className="flex flex-col gap-4">
                        <select name="event_id" value={formData.event_id} onChange={handleChange} className="p-2 border rounded">
                            <option value="">-- Select Active Event --</option>
                            {activeEventsList.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.subtype_name})</option>)}
                        </select>
                        <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="p-2 border rounded">
                            <option value="">-- Select Verified Employee --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>)}
                        </select>
                        <input name="role_description" placeholder="Role (e.g. Security)" value={formData.role_description} onChange={handleChange} className="p-2 border rounded" />
                        <button type="submit" className="bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition py-2">Assign</button>
                    </form>
                </div>

                {/* Lists Section */}
                <div className="space-y-8">
                    {/* ... (Existing Attendance/Assignments Tables) ... */}
                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="p-4 bg-gray-100 border-b"><h3 className="font-bold text-gray-700">Recent Assignments</h3></div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left"><tr><th className="p-3">Staff</th><th className="p-3">Event</th><th className="p-3">Status</th></tr></thead>
                            <tbody>
                                {assignments.map(task => (
                                    <tr key={task.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{task.profiles?.full_name}</td>
                                        <td className="p-3">{task.events?.title}</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{task.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;