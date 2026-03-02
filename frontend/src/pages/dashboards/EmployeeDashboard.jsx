import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeAttendance, setActiveAttendance] = useState(null);

    useEffect(() => {
        if (user) {
            fetchTasks();
            checkCurrentAttendance();
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('assignments')
                .select(`id, status, role_description, assigned_at, event:events (id, title, event_date, venue:venues(name, location))`)
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

    const updateStatus = async (assignmentId, newStatus) => {
        const { error } = await supabase.from('assignments').update({ status: newStatus }).eq('id', assignmentId);
        if (error) alert("Error updating status");
        else fetchTasks(); 
    };

    const handleCheckIn = async (eventId) => {
        const { data, error } = await supabase.from('attendance').insert([{ employee_id: user.id, event_id: eventId, check_in: new Date().toISOString() }]).select().single();
        if (error) { alert(error.message); } 
        else { setActiveAttendance(data); alert("Checked In Successfully!"); }
    };

    const handleCheckOut = async () => {
        if (!activeAttendance) return;
        const { error } = await supabase.from('attendance').update({ check_out: new Date().toISOString() }).eq('id', activeAttendance.id);
        if (error) { alert("Error checking out"); } 
        else { setActiveAttendance(null); alert("Checked Out Successfully!"); }
    };

    if (loading) return <div className="p-10 text-center text-[var(--text-secondary)]">Loading Assignments...</div>;

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const acceptedTasks = tasks.filter(t => t.status === 'accepted');

    return (
        <div className="min-h-screen p-6">
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
            <div>
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
        </div>
    );
};

export default EmployeeDashboard;