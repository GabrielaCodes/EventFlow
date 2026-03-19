import { useEffect, useState } from 'react';
import api, { supabase } from '../../services/api'; 
import { useAuth } from '../../context/AuthContext';
import ManagerEvents from './ManagerEvents';
import ManagerSponsorships from './ManagerSponsorships';
import MasterDataRequest from '../../components/manager/MasterDataRequest';

import '../../styles/DashboardStyles.css';

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
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const NestedPanel = ({ title, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-[#2A2A2A] rounded-sm mb-4 bg-[#121212] overflow-hidden">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#181818] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-xs font-medium text-[#C5A46D] uppercase tracking-wider mb-0">{title}</h3>
                <div className="text-[#B0B0B0] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 border-t border-[#2A2A2A] bg-[#0B0B0B]">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const [events, setEvents] = useState([]); 
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [activeEventsList, setActiveEventsList] = useState([]);
    
    const [teamData, setTeamData] = useState({ pending: [], verified: [], rejected: [] });
    const [loading, setLoading] = useState(true);
    const [teamView, setTeamView] = useState('verified'); 
    const [formData, setFormData] = useState({ employee_id: '', event_id: '', role_description: '' });

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // FIX: Query events directly to ensure assigned_manager_id is loaded
            const { data: eventData } = await supabase
                .from('events')
                .select('id, title, assigned_manager_id, status, event_subtypes(name)')
                .neq('status', 'completed')
                .order('event_date', { ascending: true });
                
            if (eventData) {
                const formattedEvents = eventData.map(ev => ({
                    ...ev,
                    subtype_name: ev.event_subtypes?.name
                }));
                setActiveEventsList(formattedEvents);
            }

            try {
                const res = await api.get('/admin/employees/managed');
                const allEmployees = res.data || [];
                setTeamData({
                    pending: allEmployees.filter(e => e.verification_status === 'pending'),
                    verified: allEmployees.filter(e => e.verification_status === 'verified'),
                    rejected: allEmployees.filter(e => e.verification_status === 'rejected')
                });
            } catch (err) { console.error("Team fetch error", err); }

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

            {activeTab === 'requests' ? (
                <div className="animate-fade-in">
                    <MasterDataRequest />
                </div>
            ) : (
                <div className="animate-fade-in space-y-2">

                    <CollapsiblePanel 
                        title="Team Directory & Approvals" 
                        defaultOpen={true} 
                        badgeCount={teamData.pending.length}
                    >
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

                        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden">
                            <div className="flex border-b border-[#2A2A2A] bg-[#161616]">
                                <button onClick={() => setTeamView('verified')} className={`flex-1 p-3 text-xs font-medium text-center uppercase tracking-wider transition-colors ${teamView === 'verified' ? 'bg-[#181818] text-[#C5A46D] border-b-2 border-[#C5A46D]' : 'text-[#B0B0B0] hover:bg-[#181818]'}`}>
                                    Active Team ({teamData.verified.length})
                                </button>
                                <button onClick={() => setTeamView('rejected')} className={`flex-1 p-3 text-xs font-medium text-center uppercase tracking-wider transition-colors ${teamView === 'rejected' ? 'bg-[#181818] text-[#C5A46D] border-b-2 border-[#C5A46D]' : 'text-[#B0B0B0] hover:bg-[#181818]'}`}>
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

                    <CollapsiblePanel title="Event Management" defaultOpen={false}>
                        <NestedPanel title="1. Events in Consideration" defaultOpen={true}>
                            <ManagerEvents filterStatus="consideration" />
                        </NestedPanel>

                        <NestedPanel title="2. Events In Progress">
                            <ManagerEvents filterStatus="in_progress" />
                        </NestedPanel>

                        <NestedPanel title="3. Completed Events">
                            <ManagerEvents filterStatus="completed" />
                        </NestedPanel>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Sponsorships & Funding" defaultOpen={false}>
                        <NestedPanel title="Request New Sponsorship" defaultOpen={true}>
                            <ManagerSponsorships activeEvents={activeEventsList} />
                        </NestedPanel>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Staff Operations & Logs" defaultOpen={false}>
                        <NestedPanel title="Assign Staff to Event" defaultOpen={true}>
                            <form onSubmit={handleAssign} className="flex flex-col gap-4 max-w-2xl">
                                <select name="event_id" value={formData.event_id} onChange={handleChange} className="dash-input m-0">
                                    <option value="">-- Select Active Event --</option>
                                    {activeEventsList.map(ev => {
                                        const isMine = ev.assigned_manager_id === user?.id;
                                        return (
                                            <option key={ev.id} value={ev.id} disabled={!isMine} className={!isMine ? "text-[#555]" : ""}>
                                                {ev.title} {ev.subtype_name && `(${ev.subtype_name})`} {!isMine && '- (Read Only)'}
                                            </option>
                                        );
                                    })}
                                </select>
                                <select name="employee_id" value={formData.employee_id} onChange={handleChange} className="dash-input m-0">
                                    <option value="">-- Select Employee --</option>
                                    {teamData.verified.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name || emp.email}</option>
                                    ))}
                                </select>
                                <input name="role_description" placeholder="Role (e.g. Security, Registration)" value={formData.role_description} onChange={handleChange} className="dash-input m-0" />
                                <button type="submit" className="dash-btn mt-2 w-fit">Assign to Event</button>
                            </form>
                        </NestedPanel>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <NestedPanel title="Recent Assignments" defaultOpen={false}>
                                <div className="overflow-x-auto">
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Staff</th><th>Event</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {assignments.slice(0, 5).map(task => (
                                                <tr key={task.id}>
                                                    <td className="font-medium text-xs pl-2">{task.profiles?.full_name}</td>
                                                    <td className="text-xs text-[#B0B0B0]">{task.events?.title}</td>
                                                    <td className="pr-2">
                                                        <span className="px-2 py-1 border border-[#C5A46D] text-[#C5A46D] rounded-[3px] text-[9px] uppercase tracking-wider bg-transparent">
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </NestedPanel>

                            <NestedPanel title="Live Attendance" defaultOpen={false}>
                                <div className="overflow-x-auto">
                                    <table className="dash-table w-full">
                                        <thead><tr><th>Staff</th><th>Event</th><th>Time</th></tr></thead>
                                        <tbody>
                                            {attendance.slice(0, 5).map(log => (
                                                <tr key={log.id}>
                                                    <td className="font-medium text-xs pl-2">{log.profiles?.full_name}</td>
                                                    <td className="text-[#B0B0B0] text-xs">{log.events?.title}</td>
                                                    <td className="text-xs pr-2">{new Date(log.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </NestedPanel>
                        </div>
                    </CollapsiblePanel>

                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;