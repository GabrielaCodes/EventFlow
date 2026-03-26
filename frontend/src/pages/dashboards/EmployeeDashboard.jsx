import Loader from '../../components/common/Loader';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { supabase } from '../../services/api';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- ATTENDANCE STATES ---
    const [activeAttendance, setActiveAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    // --- LEAVE STATES ---
    const [myLeaves, setMyLeaves] = useState([]);
    const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' });
    
    // --- MANAGER STATE ---
    const [assignedManager, setAssignedManager] = useState(null);

    useEffect(() => {
        if (user) {
            fetchTasks();
            checkCurrentAttendance();
            fetchAttendanceHistory(); // NEW: Fetch attendance logs
            fetchMyLeaves();
            fetchAssignedManager();
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('assignments')
                .select(`id, status, role_description, assigned_at, rejection_reason, event:events (id, title, event_date, venue:venues(name, location))`)
                .eq('employee_id', user.id)
                .order('assigned_at', { ascending: false });
            if (error) throw error;
            setTasks(data);
        } catch (err) { console.error("Error fetching tasks:", err.message); } 
        finally { setLoading(false); }
    };

    const checkCurrentAttendance = async () => {
        const { data } = await supabase.from('attendance').select('*').eq('employee_id', user.id).is('check_out', null).maybeSingle();
        setActiveAttendance(data);
    };

    // NEW: Fetch all attendance records for the employee
    const fetchAttendanceHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select(`id, check_in, check_out, event:events(title)`)
                .eq('employee_id', user.id)
                .order('check_in', { ascending: false });
            if (error) throw error;
            setAttendanceHistory(data);
        } catch (err) {
            console.error("Error fetching attendance history:", err.message);
        }
    };

    const fetchMyLeaves = async () => {
        const { data } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('employee_id', user.id)
            .order('start_date', { ascending: false });
        if (data) setMyLeaves(data);
    };

    const fetchAssignedManager = async () => {
        try {
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('category_id')
                .eq('id', user.id)
                .single();

            if (myProfile?.category_id) {
                const { data: manager } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('role', 'manager')
                    .eq('category_id', myProfile.category_id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single();

                if (manager) setAssignedManager(manager);
            }
        } catch (err) {
            console.error("Error fetching manager:", err);
        }
    };

    const updateStatus = async (assignmentId, newStatus) => {
        let rejection_reason = null;
        if (newStatus === 'rejected') {
            rejection_reason = prompt("Please provide a reason for rejecting this assignment (optional):");
            if (rejection_reason === null) return;
            rejection_reason = rejection_reason.trim() || null;
        }

        const updatePayload = { status: newStatus };
        if (rejection_reason !== null) updatePayload.rejection_reason = rejection_reason;

        const { error } = await supabase
            .from('assignments')
            .update(updatePayload)
            .eq('id', assignmentId);

        if (error) alert("Error updating status");
        else fetchTasks(); 
    };

    const handleCheckIn = async (eventId) => {
        const { data, error } = await supabase.from('attendance').insert([{ employee_id: user.id, event_id: eventId, check_in: new Date().toISOString() }]).select().single();
        if (error) { alert(error.message); } 
        else { 
            setActiveAttendance(data); 
            fetchAttendanceHistory(); // Update list after checking in
            alert("Checked In Successfully!"); 
        }
    };

    const handleCheckOut = async () => {
        if (!activeAttendance) return;
        const { error } = await supabase.from('attendance').update({ check_out: new Date().toISOString() }).eq('id', activeAttendance.id);
        if (error) { alert("Error checking out"); } 
        else { 
            setActiveAttendance(null); 
            fetchAttendanceHistory(); // Update list to show checkout time
            alert("Checked Out Successfully!"); 
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employee/leave', leaveForm);
            alert('Leave request submitted successfully!');
            setLeaveForm({ start_date: '', end_date: '', reason: '' });
            fetchMyLeaves(); 
        } catch (err) { 
            alert(err.response?.data?.error || "Error requesting leave"); 
        }
    };

   if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader /></div>;

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const acceptedTasks = tasks.filter(t => t.status === 'accepted');
    const rejectedTasks = tasks.filter(t => t.status === 'rejected');

    return (
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--gold-main)]">My Workspace</h1>
                    <p className="text-[var(--text-secondary)]">Welcome, {user.email}</p>
                </div>
                {activeAttendance ? (
                    <div className="bg-[#111] border border-green-600 text-green-500 px-4 py-2 rounded flex items-center gap-3">
                        <span className="animate-pulse">●</span> Currently On Duty
                        <button onClick={handleCheckOut} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#dc2626', color: 'white' }}>
                            Clock Out
                        </button>
                    </div>
                ) : (
                    <button onClick={logout} className="text-red-500 hover:underline" style={{ background: 'transparent', padding: 0 }}>Logout</button>
                )}
            </header>

            {/* PENDING INVITES */}
            {pendingTasks.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-orange-400">⚠ Pending Invites</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingTasks.map((task) => (
                            <div key={task.id} className="bg-[var(--surface-color)] p-5 rounded-lg shadow-md border-l-4 border-orange-500">
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{task.event?.title || 'Unknown Event'}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-2">
                                    {task.event?.event_date ? new Date(task.event.event_date).toDateString() : 'Date N/A'}
                                </p>
                                <p className="text-sm bg-[#111] border border-[#333] p-2 rounded mb-4 text-[var(--text-primary)]">
                                    Role: <strong className="text-[var(--gold-main)]">{task.role_description}</strong>
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => updateStatus(task.id, 'accepted')} className="flex-1" style={{ padding: '0.5rem', backgroundColor: '#16a34a', color: 'white' }}>Accept</button>
                                    <button onClick={() => updateStatus(task.id, 'rejected')} className="flex-1" style={{ padding: '0.5rem', backgroundColor: '#dc2626', color: 'white' }}>Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MY SCHEDULE */}
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-[var(--gold-main)]">📅 My Schedule</h2>
                {acceptedTasks.length === 0 ? (
                    <p className="text-[var(--text-secondary)] italic">No active jobs. Wait for a manager to assign you tasks.</p>
                ) : (
                    <div className="space-y-4">
                        {acceptedTasks.map((task) => (
                            <div key={task.id} className="bg-[var(--surface-color)] p-6 rounded-lg shadow border border-[#333] flex flex-col md:flex-row justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{task.event?.title || 'Unknown Event'}</h3>
                                    <div className="text-[var(--text-secondary)] mt-1 flex flex-col gap-1">
                                       <span>📍 {task.event?.venue?.name || 'To be decided'}</span>
                                       <span>📅 {task.event?.event_date ? new Date(task.event.event_date).toDateString() : 'Date N/A'}</span>
                                       <span>💼 Role: <span className="text-[var(--gold-main)] font-semibold">{task.role_description}</span></span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    {!activeAttendance && (
                                        <button onClick={() => task.event?.id && handleCheckIn(task.event.id)}>
                                            📍 Check In Here
                                        </button>
                                    )}
                                    {activeAttendance?.event_id === task.event.id && (
                                        <span className="text-green-500 font-bold border border-green-500 bg-[#111] px-4 py-2 rounded">
                                            ✅ Checked In
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* NEW: ATTENDANCE HISTORY */}
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-[var(--gold-main)]">🕒 My Attendance History</h2>
                <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow border border-[#333] max-h-[300px] overflow-y-auto">
                    {attendanceHistory.length === 0 ? (
                        <p className="text-[var(--text-secondary)] italic">No attendance records found.</p>
                    ) : (
                        <div className="space-y-3 pr-2">
                            {attendanceHistory.map(record => (
                                <div key={record.id} className="flex flex-col md:flex-row justify-between md:items-center bg-[#111] p-4 rounded border border-[#222]">
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">{record.event?.title || 'General Shift / Unknown Event'}</p>
                                    </div>
                                    <div className="mt-2 md:mt-0 flex gap-4 text-sm">
                                        <div>
                                            <span className="text-[10px] text-[#888] uppercase block">Check-In</span>
                                            <span className="text-green-400 font-mono">{new Date(record.check_in).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-[#888] uppercase block">Check-Out</span>
                                            <span className={record.check_out ? "text-gray-300 font-mono" : "text-yellow-500 font-mono animate-pulse"}>
                                                {record.check_out ? new Date(record.check_out).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In Progress'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* REJECTED ASSIGNMENTS HISTORY */}
            {rejectedTasks.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-4 text-red-400">✕ Rejected Assignments</h2>
                    <div className="space-y-3">
                        {rejectedTasks.map((task) => (
                            <div key={task.id} className="bg-[var(--surface-color)] p-4 rounded-lg border border-[#333] border-l-4 border-l-red-600">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">{task.event?.title || 'Unknown Event'}</p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                            Role: <span className="text-[var(--gold-main)]">{task.role_description}</span>
                                        </p>
                                        <p className="text-xs text-[#555] mt-1">
                                            Assigned: {new Date(task.assigned_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-800 whitespace-nowrap">
                                        Rejected
                                    </span>
                                </div>
                                {task.rejection_reason && (
                                    <div className="mt-2 pt-2 border-t border-[#222]">
                                        <p className="text-[10px] uppercase text-red-400 font-bold tracking-tighter">Your Reason:</p>
                                        <p className="text-[11px] text-gray-300 italic">{task.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LEAVE MANAGEMENT SECTION */}
            <div className="pt-8 border-t border-[#333] grid md:grid-cols-2 gap-8 mb-12">
                
                {/* Leave Form */}
                <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow border border-[#333]">
                    <h2 className="text-xl font-bold mb-4 text-[var(--gold-main)] flex items-center gap-2">Request Leave</h2>
                    
                    {assignedManager ? (
                        <div className="mb-6 p-3 bg-[#111] border-l-2 border-[var(--gold-main)] rounded-r text-sm">
                            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1">Directing request to Manager:</p>
                            <p className="text-[var(--text-primary)] font-bold">{assignedManager.full_name || 'Manager'}</p>
                            <p className="text-[var(--gold-main)] text-xs">{assignedManager.email}</p>
                        </div>
                    ) : (
                        <div className="mb-6 p-3 bg-[#111] border-l-2 border-orange-500 rounded-r text-sm text-orange-400">
                            No manager is currently assigned to your department.
                        </div>
                    )}

                    <form onSubmit={handleLeaveSubmit} className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-[#888] uppercase mb-1 block">Start Date</label>
                                <input type="date" required className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:outline-none focus:border-[var(--gold-main)]" 
                                    value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[#888] uppercase mb-1 block">End Date</label>
                                <input type="date" required className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:outline-none focus:border-[var(--gold-main)]" 
                                    value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-[#888] uppercase mb-1 block">Reason (Optional)</label>
                            <input type="text" placeholder="e.g., Family Vacation, Medical" className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:outline-none focus:border-[var(--gold-main)]" 
                                value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                        </div>
                        <button type="submit" disabled={!assignedManager} className={`font-bold py-2 rounded mt-2 transition ${assignedManager ? 'bg-[var(--gold-main)] text-black hover:bg-[#a68a3c]' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}>
                            {assignedManager ? 'Submit Leave Request' : 'Cannot Submit'}
                        </button>
                    </form>
                </div>

                {/* Leave History */}
                <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow border border-[#333]">
                    <h2 className="text-xl font-bold mb-4 text-[var(--gold-main)]">My Leave History</h2>
                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                        {myLeaves.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-sm italic">No leaves requested yet.</p>
                        ) : (
                            myLeaves.map(leave => (
                                <div key={leave.id} className="flex flex-col bg-[#111] p-3 rounded border border-[#222]">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                                            <p className="text-white font-medium">
                                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-[11px] text-[#888] mt-1">{leave.reason || 'No reason provided'}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider ${
                                            leave.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                                            leave.status === 'rejected' ? 'bg-red-900/30 text-red-400 border border-red-800' : 
                                            'bg-orange-900/30 text-orange-400 border border-orange-800'
                                        }`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                    {leave.status === 'rejected' && leave.denial_reason && (
                                        <div className="mt-2 pt-2 border-t border-[#222]">
                                            <p className="text-[10px] uppercase text-red-400 font-bold tracking-tighter">Manager Note:</p>
                                            <p className="text-[11px] text-gray-300 italic">{leave.denial_reason}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;