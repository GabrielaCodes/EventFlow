import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { supabase } from '../../services/api'; 

const ManagerDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [events, setEvents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [assignments, setAssignments] = useState([]);
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

            // A. Employees
            const { data: empData } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'employee');

            // B. Events (Fetch all events in manager's category)
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select(`
                    id, title, event_date, status,
                    event_subtypes ( name, event_categories (name) )
                `)
                .order('event_date', { ascending: true });

            if (eventError) console.error("Event Fetch Error:", eventError);

            // C. Attendance
            const { data: attData } = await supabase.from('attendance')
                .select(`id, check_in, check_out, profiles(full_name), events(title)`)
                .order('check_in', { ascending: false }).limit(20);

            // D. Assignments
            const { data: assignData } = await supabase.from('assignments')
                .select(`id, status, role_description, assigned_at, profiles(full_name), events(id, title)`)
                .order('assigned_at', { ascending: false });

            if (empData) setEmployees(empData);
            if (eventData) setEvents(eventData);
            if (attData) setAttendance(attData);
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

            {/* 1. ASSIGN TASK FORM */}
            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-xl font-bold text-blue-700 mb-4">Assign New Task</h2>
                <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select name="event_id" value={formData.event_id} onChange={handleChange} className="p-2 border rounded">
                        <option value="">-- Select Event --</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} ({ev.event_subtypes?.name}) | {new Date(ev.event_date).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                    <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="p-2 border rounded">
                        <option value="">-- Select Employee --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>)}
                    </select>
                    <input name="role_description" placeholder="Role (e.g. Security)" value={formData.role_description} onChange={handleChange} className="p-2 border rounded" />
                    <button type="submit" className="bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition">Assign</button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 2. UPCOMING EVENTS (NEW SECTION FOR MODIFICATIONS) */}
                <div className="bg-white rounded shadow overflow-hidden col-span-1 lg:col-span-2">
                    <div className="p-4 bg-gray-100 border-b">
                        <h3 className="font-bold text-gray-700">Events in My Department</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="p-3">Event</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 font-medium">{ev.title}</td>
                                    <td className="p-3">{new Date(ev.event_date).toLocaleDateString()}</td>
                                    <td className="p-3">{ev.event_subtypes?.name}</td>
                                    <td className="p-3">
                                        <Link to={`/event-modifications/${ev.id}`} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700">
                                            Manage / Modify
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 3. TASK ASSIGNMENTS */}
                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="p-4 bg-gray-100 border-b"><h3 className="font-bold text-gray-700">Recent Staff Assignments</h3></div>
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

                {/* 4. ATTENDANCE LOGS */}
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
    );
};

export default ManagerDashboard;