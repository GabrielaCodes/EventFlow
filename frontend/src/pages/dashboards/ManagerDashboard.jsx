import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import ManagerEvents from './ManagerEvents';
import ManagerSponsorships from './ManagerSponsorships';
import MasterDataRequest from '../../components/manager/MasterDataRequest';

import '../../styles/DashboardStyles.css';

// =====================================================================
// REUSABLE UI COMPONENT: Collapsible Panel
// =====================================================================
const CollapsiblePanel = ({ title, defaultOpen = false, badgeCount = 0, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="dash-card mb-6 p-0 overflow-hidden border-[#2A2A2A]">
            <div 
                className={`p-5 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-[#121212] border-b border-[#2A2A2A]' : 'bg-[#121212] hover:bg-[#181818]'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <h2 className="text-sm uppercase tracking-widest text-[#E5E5E5] font-medium mb-0">{title}</h2>
                    {badgeCount > 0 && (
                        <span className="bg-[#C5A46D] text-[#0B0B0B] text-[10px] font-bold px-2 py-0.5 rounded-[3px]">
                            {badgeCount} Action Required
                        </span>
                    )}
                </div>
                <div className="text-[#C5A46D] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            {/* Smooth transition wrapper */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


const ManagerDashboard = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState('dashboard');

    // Events & Core Data
    const [events, setEvents] = useState([]); 
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [activeEventsList, setActiveEventsList] = useState([]);
    
    // Team State
    const [teamData, setTeamData] = useState({ pending: [], verified: [], rejected: [] });
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [teamView, setTeamView] = useState('verified'); 
    const [formData, setFormData] = useState({ employee_id: '', event_id: '', role_description: '' });

    useEffect(() => { fetchDashboardData(); }, []);

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
            } catch (err) { console.error("Team fetch error", err); }

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

    const handleVerify = async (employeeId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this employee?`)) return;
        try {
            await api.post('/admin/employees/verify', { employee_id: employeeId, action });
            fetchDashboardData(); 
        } catch (err) { alert(err.response?.data?.error || "Action failed"); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!formData.employee_id || !formData.event_id) return alert("Select both");
        try {
            await api.post('/admin/assign-staff', { ...formData, role_description: formData.role_description || "General Staff" });
            alert("Task assigned!");
            setFormData({ employee_id: '', event_id: '', role_description: '' });
            fetchDashboardData(); 
        } catch (err) { alert(err.response?.data?.error); }
    };

    if (loading) return <div className="dash-wrapper flex justify-center items-center text-sm uppercase tracking-widest text-[#B0B0B0]">Loading Dashboard...</div>;

    return (
        <div className="dash-wrapper">
            
            <h1 className="dash-title">Manager <span>Dashboard</span></h1>

            {/* --- PRIMARY TAB NAVIGATION --- */}
            <div className="flex gap-8 border-b border-[#2A2A2A] mb-8">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-3 text-sm font-medium uppercase tracking-wider transition-colors border-b-2 ${
                        activeTab === 'dashboard' ? 'border-[#C5A46D] text-[#E5E5E5]' : 'border-transparent text-[#B0B0B0] hover:text-[#E5E5E5]'
                    }`}
                >
                    Overview & Operations
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 text-sm font-medium uppercase tracking-wider transition-colors border-b-2 ${
                        activeTab === 'requests' ? 'border-[#C5A46D] text-[#E5E5E5]' : 'border-transparent text-[#B0B0B0] hover:text-[#E5E5E5]'
                    }`}
                >
                    Resource Requests
                </button>
            </div>

            {/* --- TAB CONTENT --- */}
            {activeTab === 'requests' ? (
                <div className="animate-fade-in">
                    <MasterDataRequest />
                </div>
            ) : (
                <div className="animate-fade-in space-y-2">

                    {/* PANEl 1: TEAM & APPROVALS */}
                    <CollapsiblePanel 
                        title="Team Directory & Approvals" 
                        defaultOpen={true} 
                        badgeCount={teamData.pending.length}
                    >
                        {/* Urgent Approvals Sub-section */}
                        {teamData.pending.length > 0 && (
                            <div className="mb-8 border-l-2 border-[#C5A46D] pl-4">
                                <h3 className="text-xs uppercase tracking-wider text-[#C5A46D] mb-4 font-medium">Pending Approvals</h3>
                                <div className="grid gap-3">
                                    {teamData.pending.map(emp => (
                                        <div key={emp.id} className="flex justify-between items-center bg-[#181818] border border-[#2A2A2A] p-4 rounded-sm">
                                            <div>
                                                <p className="font-medium text-[#E5E5E5]">{emp.full_name}</p>
                                                <p className="text-xs text-[#B0B0B0] mt-1">{emp.email} &bull; Applied: {new Date(emp.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => handleVerify(emp.id, 'approve')} className="dash-btn px-4 py-1.5 text-xs">Approve</button>
                                                <button onClick={() => handleVerify(emp.id, 'reject')} className="dash-btn-outline px-4 py-1.5 text-xs border-[#555]">Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Directory Sub-section */}
                        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden">
                            <div className="flex border-b border-[#2A2A2A] bg-[#161616]">
                                <button 
                                    onClick={() => setTeamView('verified')}
                                    className={`flex-1 p-3 text-xs font-medium text-center uppercase tracking-wider transition-colors ${
                                        teamView === 'verified' ? 'bg-[#181818] text-[#C5A46D] border-b-2 border-[#C5A46D]' : 'text-[#B0B0B0] hover:bg-[#181818]'
                                    }`}
                                >
                                    Active Team ({teamData.verified.length})
                                </button>
                                <button 
                                    onClick={() => setTeamView('rejected')}
                                    className={`flex-1 p-3 text-xs font-medium text-center uppercase tracking-wider transition-colors ${
                                        teamView === 'rejected' ? 'bg-[#181818] text-[#C5A46D] border-b-2 border-[#C5A46D]' : 'text-[#B0B0B0] hover:bg-[#181818]'
                                    }`}
                                >
                                    Rejected ({teamData.rejected.length})
                                </button>
                            </div>

                            <div className="max-h-64 overflow-y-auto bg-[#121212]">
                                {teamView === 'verified' ? (
                                    teamData.verified.length === 0 ? <p className="text-[#B0B0B0] text-sm text-center p-6">No active team members.</p> :
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Name</th><th>Email</th><th className="text-right">Action</th></tr></thead>
                                        <tbody>
                                            {teamData.verified.map(emp => (
                                                <tr key={emp.id}>
                                                    <td className="font-medium pl-4">{emp.full_name}</td>
                                                    <td>{emp.email}</td>
                                                    <td className="text-right pr-4">
                                                        <button onClick={() => handleVerify(emp.id, 'reject')} className="text-[#B0B0B0] hover:text-[#E5E5E5] text-xs transition-colors">Deactivate</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Name</th><th>Email</th><th className="text-right">Action</th></tr></thead>
                                        <tbody>
                                            {teamData.rejected.map(emp => (
                                                <tr key={emp.id}>
                                                    <td className="font-medium pl-4">{emp.full_name}</td>
                                                    <td>{emp.email}</td>
                                                    <td className="text-right pr-4">
                                                        <button onClick={() => handleVerify(emp.id, 'approve')} className="text-[#C5A46D] hover:text-[#E5E5E5] text-xs transition-colors">Re-Approve</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </CollapsiblePanel>

                    {/* PANEL 2: EVENTS & SPONSORSHIPS */}
                    <CollapsiblePanel title="Event Management" defaultOpen={false}>
                        <div className="flex flex-col gap-8">
                            <ManagerEvents />
                            <div className="border-t border-[#2A2A2A] pt-8">
                                <ManagerSponsorships activeEvents={activeEventsList} />
                            </div>
                        </div>
                    </CollapsiblePanel>

                    {/* PANEL 3: STAFF OPERATIONS & LOGS */}
                    <CollapsiblePanel title="Staff Operations & Logs" defaultOpen={false}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Left: Assignment Form */}
                            <div>
                                <h3 className="text-xs font-medium text-[#C5A46D] uppercase tracking-wider mb-4">Assign Staff to Event</h3>
                                <form onSubmit={handleAssign} className="flex flex-col gap-4 bg-[#181818] p-5 rounded-sm border border-[#2A2A2A]">
                                    <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input m-0">
                                        <option value="">-- Select Active Event --</option>
                                        {activeEventsList.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.subtype_name})</option>)}
                                    </select>
                                    <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="dash-input m-0">
                                        <option value="">-- Select Employee --</option>
                                        {teamData.verified.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                                        ))}
                                    </select>
                                    <input name="role_description" placeholder="Role (e.g. Security, Registration)" value={formData.role_description} onChange={handleChange} className="dash-input m-0" />
                                    <button type="submit" className="dash-btn mt-2">Assign to Event</button>
                                </form>
                            </div>

                            {/* Right: Logs Tables */}
                            <div className="space-y-6">
                                <div className="border border-[#2A2A2A] rounded-sm overflow-hidden">
                                    <div className="p-3 bg-[#161616] border-b border-[#2A2A2A]">
                                        <h3 className="font-medium text-[#E5E5E5] text-xs uppercase tracking-wider mb-0">Recent Assignments</h3>
                                    </div>
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Staff</th><th>Event</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {assignments.slice(0, 4).map(task => (
                                                <tr key={task.id}>
                                                    <td className="font-medium text-xs pl-3">{task.profiles?.full_name}</td>
                                                    <td className="text-xs text-[#B0B0B0]">{task.events?.title}</td>
                                                    <td className="pr-3">
                                                        <span className="px-2 py-1 border border-[#C5A46D] text-[#C5A46D] rounded-[3px] text-[9px] uppercase tracking-wider bg-transparent">
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border border-[#2A2A2A] rounded-sm overflow-hidden">
                                    <div className="p-3 bg-[#161616] border-b border-[#2A2A2A]">
                                        <h3 className="font-medium text-[#E5E5E5] text-xs uppercase tracking-wider mb-0">Live Attendance</h3>
                                    </div>
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Staff</th><th>Event</th><th>Time</th></tr></thead>
                                        <tbody>
                                            {attendance.slice(0, 4).map(log => (
                                                <tr key={log.id}>
                                                    <td className="font-medium text-xs pl-3">{log.profiles?.full_name}</td>
                                                    <td className="text-[#B0B0B0] text-xs">{log.events?.title}</td>
                                                    <td className="text-xs pr-3">{new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </CollapsiblePanel>

                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;