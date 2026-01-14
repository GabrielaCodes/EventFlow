import { useEffect, useState } from 'react';
import { supabase } from '../../services/api'; // ✅ Use direct Supabase client

const ManagerDashboard = () => {
    // Data State
    const [employees, setEmployees] = useState([]);
    const [events, setEvents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [assignments, setAssignments] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        employee_id: '',
        event_id: '',
        role_description: ''
    });

    // 1. Fetch Data on Load
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // A. Fetch Employees (for dropdown)
            const { data: empData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'employee');

          
            // B. Fetch Events (for dropdown)
const { data: eventData, error: eventError } = await supabase // 👈 Capture error
    .from('events')
    .select('id, title, event_date')
    .order('event_date', { ascending: true });

if (eventError) {
    console.error("CRITICAL SUPABASE ERROR:", eventError.message, eventError.details);
    alert("Error fetching events: " + eventError.message);
} else {
    console.log("Events Fetched:", eventData); 
    setEvents(eventData);
}

            // C. Fetch Recent Attendance Logs
            const { data: attData } = await supabase
                .from('attendance')
                .select(`
                    id, check_in, check_out,
                    profiles(full_name),
                    events(title)
                `)
                .order('check_in', { ascending: false })
                .limit(20);

            // D. Fetch Existing Assignments (History)
            const { data: assignData } = await supabase
                .from('assignments')
                .select(`
                    id, status, role_description,
                    profiles(full_name),
                    events(title)
                `)
                .order('assigned_at', { ascending: false });

            if (empData) setEmployees(empData);
            if (eventData) setEvents(eventData);
            if (attData) setAttendance(attData);
            if (assignData) setAssignments(assignData);

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Form Input
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Submit Assignment
    const handleAssign = async (e) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.event_id) {
            alert("Please select both an employee and an event.");
            return;
        }

        try {
            const { error } = await supabase
                .from('assignments')
                .insert([{
                    employee_id: formData.employee_id,
                    event_id: formData.event_id,
                    role_description: formData.role_description || "General Staff"
                }]);

            if (error) throw error;

            alert("Task Assigned Successfully!");
            setFormData({ employee_id: '', event_id: '', role_description: '' });
            fetchDashboardData(); // Refresh list
        } catch (err) {
            alert("Error assigning task: " + err.message);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Manager Dashboard</h1>

            {/* --- TOP SECTION: TASK ASSIGNMENT PANEL --- */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                <h2 className="text-xl font-bold text-blue-700 mb-4">📢 Assign New Task</h2>
                <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Select Event */}
                    <select 
                        name="event_id" 
                        value={formData.event_id} 
                        onChange={handleChange}
                        className="p-2 border rounded bg-gray-50"
                    >
                        <option value="">-- Select Event --</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>
                                {ev.title} ({new Date(ev.event_date).toLocaleDateString()})
                            </option>
                        ))}
                    </select>

                    {/* Select Employee */}
                    <select 
                        name="employee_id" 
                        value={formData.employee_id} 
                        onChange={handleChange}
                        className="p-2 border rounded bg-gray-50"
                    >
                        <option value="">-- Select Employee --</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.full_name || emp.email}
                            </option>
                        ))}
                    </select>

                    {/* Role Description */}
                    <input 
                        name="role_description" 
                        placeholder="Role (e.g. Security, Catering)" 
                        value={formData.role_description} 
                        onChange={handleChange}
                        className="p-2 border rounded"
                    />

                    <button 
                        type="submit" 
                        className="bg-blue-600 text-white font-semibold p-2 rounded hover:bg-blue-700 transition"
                    >
                        Assign Task
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- LEFT: RECENT ASSIGNMENTS --- */}
                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="p-4 bg-gray-100 border-b">
                        <h3 className="font-bold text-gray-700">📋 Task Status</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="p-3">Employee</th>
                                    <th className="p-3">Task</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((task) => (
                                    <tr key={task.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3">{task.profiles?.full_name}</td>
                                        <td className="p-3">
                                            <div className="font-medium">{task.events?.title}</div>
                                            <div className="text-xs text-gray-500">{task.role_description}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                task.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {task.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- RIGHT: LIVE ATTENDANCE --- */}
                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="p-4 bg-gray-100 border-b">
                        <h3 className="font-bold text-gray-700">⏱ Recent Attendance Logs</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="p-3">Staff</th>
                                    <th className="p-3">Event</th>
                                    <th className="p-3">Time In/Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr><td colSpan="3" className="p-4 text-center text-gray-400">No active logs</td></tr>
                                ) : attendance.map((log) => (
                                    <tr key={log.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{log.profiles?.full_name}</td>
                                        <td className="p-3">{log.events?.title}</td>
                                        <td className="p-3">
                                            <div className="text-green-600">IN: {new Date(log.check_in).toLocaleTimeString()}</div>
                                            {log.check_out ? (
                                                <div className="text-red-500">OUT: {new Date(log.check_out).toLocaleTimeString()}</div>
                                            ) : (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 rounded animate-pulse">Active</span>
                                            )}
                                        </td>
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