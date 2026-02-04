import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import ManagerEvents from './ManagerEvents';
import ManagerSponsorships from './ManagerSponsorships';
// ✅ 1. Import New Component
import MasterDataRequest from '../../components/manager/MasterDataRequest';

const ManagerDashboard = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState('dashboard');

    // Events & Core Data
    const [events, setEvents] = useState([]); 
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [activeEventsList, setActiveEventsList] = useState([]);
    
    // Team State
    const [teamData, setTeamData] = useState({
        pending: [],
        verified: [],
        rejected: []
    });
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [teamView, setTeamView] = useState('verified'); 

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

            // 1. Fetch Events & Overview
            const { data: eventData } = await supabase
                .from('manager_event_overview')
                .select('id, title, subtype_name')
                .neq('status', 'completed')
                .order('event_date', { ascending: true });
            if (eventData) setActiveEventsList(eventData);

            // 2. Fetch Team
            try {
                const res = await api.get('/admin/employees/managed');
                const allEmployees = res.data || [];
                
                setTeamData({
                    pending: allEmployees.filter(e => e.verification_status === 'pending'),
                    verified: allEmployees.filter(e => e.verification_status === 'verified'),
                    rejected: allEmployees.filter(e => e.verification_status === 'rejected')
                });
            } catch (err) {
                console.error("Team fetch error", err);
            }

            // 3. Fetch Attendance & Assignments
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

    // Handle Approve / Reject
    const handleVerify = async (employeeId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this employee?`)) return;
        
        try {
            await api.post('/admin/employees/verify', { employee_id: employeeId, action });
            fetchDashboardData(); 
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
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Manager Dashboard</h1>

            {/* ✅ 2. TAB NAVIGATION */}
            <div className="flex gap-4 border-b border-gray-300 mb-6">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 ${
                        activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Overview & Team
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 ${
                        activeTab === 'requests' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Resource Requests
                </button>
            </div>

            {/* ✅ 3. TAB CONTENT */}
            {activeTab === 'requests' ? (
                <div className="animate-fade-in">
                    <MasterDataRequest />
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* --- EXISTING DASHBOARD CONTENT --- */}

                    {/* SECTION 1: URGENT PENDING APPROVALS */}
                    {teamData.pending.length > 0 && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded shadow mb-8">
                            <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                                🔔 Pending Approvals ({teamData.pending.length})
                            </h2>
                            <div className="grid gap-3">
                                {teamData.pending.map(emp => (
                                    <div key={emp.id} className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-800">{emp.full_name}</p>
                                            <p className="text-sm text-gray-500">{emp.email} • Signed up: {new Date(emp.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVerify(emp.id, 'approve')} className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 shadow">Approve</button>
                                            <button onClick={() => handleVerify(emp.id, 'reject')} className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600 shadow">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: TEAM MANAGEMENT */}
                    <div className="bg-white rounded shadow mb-8 overflow-hidden">
                        <div className="flex border-b">
                            <button 
                                onClick={() => setTeamView('verified')}
                                className={`flex-1 p-4 font-bold text-center transition ${teamView === 'verified' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                ✅ Active Team ({teamData.verified.length})
                            </button>
                            <button 
                                onClick={() => setTeamView('rejected')}
                                className={`flex-1 p-4 font-bold text-center transition ${teamView === 'rejected' ? 'bg-red-50 text-red-700 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                🚫 Rejected Applicants ({teamData.rejected.length})
                            </button>
                        </div>

                        <div className="p-6 max-h-64 overflow-y-auto">
                            {teamView === 'verified' ? (
                                teamData.verified.length === 0 ? <p className="text-gray-400 italic text-center">No active team members.</p> :
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-gray-500"><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                    <tbody className="divide-y">
                                        {teamData.verified.map(emp => (
                                            <tr key={emp.id} className="hover:bg-gray-50">
                                                <td className="py-3 font-medium">{emp.full_name}</td>
                                                <td className="py-3 text-gray-500">{emp.email}</td>
                                                <td className="py-3">
                                                    <button onClick={() => handleVerify(emp.id, 'reject')} className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 px-2 py-1 rounded">Deactivate</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-gray-500"><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                    <tbody className="divide-y">
                                        {teamData.rejected.map(emp => (
                                            <tr key={emp.id} className="hover:bg-red-50">
                                                <td className="py-3 font-medium text-gray-700">{emp.full_name}</td>
                                                <td className="py-3 text-gray-500">{emp.email}</td>
                                                <td className="py-3">
                                                    <button onClick={() => handleVerify(emp.id, 'approve')} className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 px-2 py-1 rounded">Re-Approve</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: EVENTS */}
                    <ManagerEvents />

                    {/* SECTION 4: ACTIONS & LISTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        
                        {/* LEFT COLUMN: FORMS */}
                        <div className="flex flex-col gap-8">
                            
                            {/* A. Assign Staff Form */}
                            <div className="bg-white p-6 rounded shadow h-fit">
                                <h2 className="text-xl font-bold text-blue-700 mb-4">Assign Staff</h2>
                                <form onSubmit={handleAssign} className="flex flex-col gap-4">
                                    <select name="event_id" value={formData.event_id} onChange={handleChange} className="p-2 border rounded">
                                        <option value="">-- Select Active Event --</option>
                                        {activeEventsList.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.subtype_name})</option>)}
                                    </select>
                                    <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="p-2 border rounded">
                                        <option value="">-- Select Employee --</option>
                                        {teamData.verified.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                                        ))}
                                    </select>
                                    <input name="role_description" placeholder="Role (e.g. Security)" value={formData.role_description} onChange={handleChange} className="p-2 border rounded" />
                                    <button type="submit" className="bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition py-2">Assign</button>
                                </form>
                            </div>

                            {/* B. Request Sponsorship */}
                            <ManagerSponsorships activeEvents={activeEventsList} />
                        </div>

                        {/* RIGHT COLUMN: LISTS */}
                        <div className="space-y-8">
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
                            <div className="bg-white rounded shadow overflow-hidden">
                                <div className="p-4 bg-gray-100 border-b"><h3 className="font-bold text-gray-700">Recent Attendance</h3></div>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left"><tr><th className="p-3">Staff</th><th className="p-3">Event</th><th className="p-3">Time</th></tr></thead>
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
            )}
        </div>
    );
};

export default ManagerDashboard;