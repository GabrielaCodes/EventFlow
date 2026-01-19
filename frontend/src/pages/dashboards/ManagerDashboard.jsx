import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import ManagerEvents from './ManagerEvents'; // ✅ Import the new component

const ManagerDashboard = () => {
    // We removed event-fetching state from here
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [activeEventsList, setActiveEventsList] = useState([]); // Lightweight list for dropdown
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

            // 1. Fetch lightweight event list JUST for the dropdown
            const { data: eventData } = await supabase
                .from('manager_event_overview')
                .select('id, title, subtype_name')
                .neq('status', 'completed')
                .order('event_date', { ascending: true });
            
            if (eventData) setActiveEventsList(eventData);

            // 2. Fetch Employees
            const { data: empData } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'employee');
            if (empData) setEmployees(empData);

            // 3. Fetch Attendance
            const { data: attData } = await supabase.from('attendance')
                .select(`id, check_in, check_out, profiles(full_name), events(title)`)
                .order('check_in', { ascending: false }).limit(20);
            if (attData) setAttendance(attData);

            // 4. Fetch Assignments
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

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.event_id) {
            alert("Select both employee and event");
            return;
        }
        try {
            await api.post('/admin/assign-staff', {
                event_id: formData.event_id,
                employee_id: formData.employee_id,
                role_description: formData.role_description || "General Staff"
            });
            alert("Task assigned successfully!");
            setFormData({ employee_id: '', event_id: '', role_description: '' });
            fetchDashboardData(); 
        } catch (err) {
            alert(err.response?.data?.error || "Failed to assign task.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Manager Dashboard</h1>

            {/* ✅ Section 1: Event Overview (New Component) */}
            <ManagerEvents />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                
                {/* Section 2: Assign Task Form */}
                <div className="bg-white p-6 rounded shadow mb-8 h-fit">
                    <h2 className="text-xl font-bold text-blue-700 mb-4">Assign Staff</h2>
                    <form onSubmit={handleAssign} className="flex flex-col gap-4">
                        <select name="event_id" value={formData.event_id} onChange={handleChange} className="p-2 border rounded">
                            <option value="">-- Select Active Event --</option>
                            {activeEventsList.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title} ({ev.subtype_name})
                                </option>
                            ))}
                        </select>
                        <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="p-2 border rounded">
                            <option value="">-- Select Employee --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>)}
                        </select>
                        <input name="role_description" placeholder="Role (e.g. Security)" value={formData.role_description} onChange={handleChange} className="p-2 border rounded" />
                        <button type="submit" className="bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition py-2">Assign</button>
                    </form>
                </div>

                {/* Section 3: Lists */}
                <div className="space-y-8">
                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="p-4 bg-gray-100 border-b"><h3 className="font-bold text-gray-700">Recent Assignments</h3></div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr><th className="p-3">Staff</th><th className="p-3">Event</th><th className="p-3">Status</th></tr>
                            </thead>
                            <tbody>
                                {assignments.map(task => (
                                    <tr key={task.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{task.profiles?.full_name}</td>
                                        <td className="p-3">{task.events?.title} ({task.role_description})</td>
                                        <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{task.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="p-4 bg-gray-100 border-b"><h3 className="font-bold text-gray-700">Recent Attendance</h3></div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr><th className="p-3">Staff</th><th className="p-3">Event</th><th className="p-3">Time</th></tr>
                            </thead>
                            <tbody>
                                {attendance.map(log => (
                                    <tr key={log.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{log.profiles?.full_name}</td>
                                        <td className="p-3 text-gray-600">{log.events?.title}</td>
                                        <td className="p-3 text-green-600">{new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
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