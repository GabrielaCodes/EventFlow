import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import ManagerEvents from './ManagerEvents';
import ManagerSponsorships from './ManagerSponsorships';
import MasterDataRequest from '../../components/manager/MasterDataRequest';

// ✅ IMPORT THE DARK/GOLD DASHBOARD THEME
import '../../styles/DashboardStyles.css';

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

    if (loading) return <div className="dash-wrapper flex justify-center items-center text-xl text-[#d4af37]">Loading Dashboard...</div>;

    return (
        // ✅ 1. Apply 'dash-wrapper' to set the pitch-black background and fonts
        <div className="dash-wrapper">
            
            {/* ✅ 2. Apply 'dash-title' */}
            <h1 className="dash-title">Manager <span>Dashboard</span></h1>

            {/* --- TAB NAVIGATION (Adapted for Dark Mode) --- */}
            <div className="flex gap-4 border-b border-[#333] mb-8">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 ${
                        activeTab === 'dashboard' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Overview & Team
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 ${
                        activeTab === 'requests' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Resource Requests
                </button>
            </div>

            {/* --- TAB CONTENT --- */}
            {activeTab === 'requests' ? (
                <div className="animate-fade-in">
                    {/* Note: Ensure MasterDataRequest component also gets updated styling eventually */}
                    <MasterDataRequest />
                </div>
            ) : (
                <div className="animate-fade-in">

                    {/* SECTION 1: URGENT PENDING APPROVALS */}
                    {teamData.pending.length > 0 && (
                        <div className="dash-card mb-8 border-l-4 border-l-red-500">
                            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                                🔔 Pending Approvals ({teamData.pending.length})
                            </h2>
                            <div className="grid gap-3">
                                {teamData.pending.map(emp => (
                                    <div key={emp.id} className="flex justify-between items-center bg-[#111] border border-[#222] p-4 rounded shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-200">{emp.full_name}</p>
                                            <p className="text-sm text-gray-500">{emp.email} • Signed up: {new Date(emp.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVerify(emp.id, 'approve')} className="dash-btn px-4 py-1 text-xs">Approve</button>
                                            <button onClick={() => handleVerify(emp.id, 'reject')} className="dash-btn-outline px-4 py-1 text-xs border-red-500 text-red-500 hover:bg-red-900/30">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: TEAM MANAGEMENT */}
                    <div className="dash-card mb-8 p-0 overflow-hidden">
                        <div className="flex border-b border-[#333]">
                            <button 
                                onClick={() => setTeamView('verified')}
                                className={`flex-1 p-4 font-bold text-center transition ${teamView === 'verified' ? 'bg-[#111] text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}
                            >
                                ✅ Active Team ({teamData.verified.length})
                            </button>
                            <button 
                                onClick={() => setTeamView('rejected')}
                                className={`flex-1 p-4 font-bold text-center transition ${teamView === 'rejected' ? 'bg-[#111] text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}
                            >
                                🚫 Rejected Applicants ({teamData.rejected.length})
                            </button>
                        </div>

                        <div className="p-0 max-h-64 overflow-y-auto">
                            {teamView === 'verified' ? (
                                teamData.verified.length === 0 ? <p className="text-gray-500 italic text-center p-6">No active team members.</p> :
                                <table className="dash-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {teamData.verified.map(emp => (
                                            <tr key={emp.id}>
                                                <td className="font-medium">{emp.full_name}</td>
                                                <td>{emp.email}</td>
                                                <td>
                                                    <button onClick={() => handleVerify(emp.id, 'reject')} className="text-red-500 hover:text-red-400 font-medium text-xs border border-red-500 px-2 py-1 rounded transition">Deactivate</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="dash-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {teamData.rejected.map(emp => (
                                            <tr key={emp.id}>
                                                <td className="font-medium">{emp.full_name}</td>
                                                <td>{emp.email}</td>
                                                <td>
                                                    <button onClick={() => handleVerify(emp.id, 'approve')} className="text-green-500 hover:text-green-400 font-medium text-xs border border-green-500 px-2 py-1 rounded transition">Re-Approve</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: EVENTS */}
                    {/* Note: Ensure ManagerEvents is styled internally with dash-card and dash-table classes */}
                    <ManagerEvents />

                    {/* SECTION 4: ACTIONS & LISTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        
                        {/* LEFT COLUMN: FORMS */}
                        <div className="flex flex-col gap-8">
                            
                            {/* A. Assign Staff Form */}
                            <div className="dash-card h-fit">
                                <h3 className="mb-4">Assign Staff</h3>
                                <form onSubmit={handleAssign} className="flex flex-col gap-4">
                                    <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input">
                                        <option value="" className="text-gray-500">-- Select Active Event --</option>
                                        {activeEventsList.map(ev => <option key={ev.id} value={ev.id} className="bg-black">{ev.title} ({ev.subtype_name})</option>)}
                                    </select>
                                    <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="dash-input">
                                        <option value="" className="text-gray-500">-- Select Employee --</option>
                                        {teamData.verified.map(emp => (
                                            <option key={emp.id} value={emp.id} className="bg-black">{emp.full_name || emp.email}</option>
                                        ))}
                                    </select>
                                    <input name="role_description" placeholder="Role (e.g. Security)" value={formData.role_description} onChange={handleChange} className="dash-input" />
                                    <button type="submit" className="dash-btn mt-2">Assign to Event</button>
                                </form>
                            </div>

                            {/* B. Request Sponsorship */}
                            <ManagerSponsorships activeEvents={activeEventsList} />
                        </div>

                        {/* RIGHT COLUMN: LISTS */}
                        <div className="space-y-8">
                            {/* Assignments Table */}
                            <div className="dash-table-container">
                                <div className="p-4 bg-[#111] border-b border-[#222]">
                                    <h3 className="font-bold text-[#d4af37] text-sm uppercase tracking-wider">Recent Assignments</h3>
                                </div>
                                <table className="dash-table">
                                    <thead><tr><th>Staff</th><th>Event</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {assignments.map(task => (
                                            <tr key={task.id}>
                                                <td className="font-medium text-gray-200">{task.profiles?.full_name}</td>
                                                <td>{task.events?.title}</td>
                                                <td><span className="px-2 py-1 bg-[#222] text-[#d4af37] rounded text-xs border border-[#333]">{task.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Attendance Table */}
                            <div className="dash-table-container">
                                <div className="p-4 bg-[#111] border-b border-[#222]">
                                    <h3 className="font-bold text-[#d4af37] text-sm uppercase tracking-wider">Recent Attendance</h3>
                                </div>
                                <table className="dash-table">
                                    <thead><tr><th>Staff</th><th>Event</th><th>Time</th></tr></thead>
                                    <tbody>
                                        {attendance.map(log => (
                                            <tr key={log.id}>
                                                <td className="font-medium text-gray-200">{log.profiles?.full_name}</td>
                                                <td className="text-gray-400">{log.events?.title}</td>
                                                <td className="text-[#d4af37]">{new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
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