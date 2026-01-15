import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { supabase } from '../../services/api'; // Adjust path if needed

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

    // 1. Fetch Assignments + Event Details
    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('assignments')
                .select(`
                    id,
                    status,
                    role_description,
                    assigned_at,
                    event:events (
                        id, title, event_date, venue:venues(name, location)
                    )
                `)
                .eq('employee_id', user.id)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            setTasks(data);
        } catch (err) {
            console.error("Error fetching tasks:", err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Check if currently checked in (to toggle button)
    const checkCurrentAttendance = async () => {
        // Find a record where check_out is NULL
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', user.id)
            .is('check_out', null)
            .maybeSingle();
        
        setActiveAttendance(data);
    };

    // 3. Handle Accept / Reject
    const updateStatus = async (assignmentId, newStatus) => {
        const { error } = await supabase
            .from('assignments')
            .update({ status: newStatus })
            .eq('id', assignmentId);

        if (error) alert("Error updating status");
        else fetchTasks(); // Refresh UI
    };

    // 4. Handle Check In
    const handleCheckIn = async (eventId) => {
        const { data, error } = await supabase
            .from('attendance')
            .insert([{ 
                employee_id: user.id, 
                event_id: eventId,
                check_in: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            alert(error.message);
        } else {
            setActiveAttendance(data);
            alert("Checked In Successfully!");
        }
    };

    // 5. Handle Check Out
    const handleCheckOut = async () => {
        if (!activeAttendance) return;

        const { error } = await supabase
            .from('attendance')
            .update({ check_out: new Date().toISOString() })
            .eq('id', activeAttendance.id);

        if (error) {
            alert("Error checking out");
        } else {
            setActiveAttendance(null);
            alert("Checked Out Successfully!");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Assignments...</div>;

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const acceptedTasks = tasks.filter(t => t.status === 'accepted');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Workspace</h1>
                    <p className="text-gray-500">Welcome, {user.email}</p>
                </div>
                {activeAttendance ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center gap-3">
                        <span className="animate-pulse">●</span> Currently On Duty
                        <button 
                            onClick={handleCheckOut}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                            Clock Out
                        </button>
                    </div>
                ) : (
                    <button onClick={logout} className="text-red-500 hover:underline">Logout</button>
                )}
            </header>

            {/* --- SECTION 1: PENDING INVITES --- */}
            {pendingTasks.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-orange-600">⚠ Pending Invites</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingTasks.map((task) => (
                            <div key={task.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-orange-400">
                                {/* NEW SAFE CODE */}
<h3 className="font-bold text-lg">{task.event?.title || 'Unknown Event'}</h3>
<p className="text-sm text-gray-500 mb-2">
    {task.event?.event_date ? new Date(task.event.event_date).toDateString() : 'Date N/A'}
</p>
                                <p className="text-sm bg-gray-100 p-2 rounded mb-4">Role: <strong>{task.role_description}</strong></p>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateStatus(task.id, 'accepted')}
                                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(task.id, 'rejected')}
                                        className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- SECTION 2: MY SCHEDULE --- */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-700">📅 My Schedule</h2>
                {acceptedTasks.length === 0 ? (
                    <p className="text-gray-500 italic">No active jobs. Wait for a manager to assign you tasks.</p>
                ) : (
                    <div className="space-y-4">
                        {acceptedTasks.map((task) => (
                            <div key={task.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-blue-900">{task.event?.title || 'Unknown Event'}</h3>
                                    <div className="text-gray-600 mt-1 flex flex-col gap-1">
                                       <span>📍 {task.event?.venue?.name || 'To be decided'}</span>
<span>📅 {task.event?.event_date ? new Date(task.event.event_date).toDateString() : 'Date N/A'}</span>
                                        <span>💼 Role: {task.role_description}</span>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0">
                                    {/* Show Check-In Button ONLY if not currently working somewhere else */}
                                    {!activeAttendance && (
                                        <button 
                                            onClick={() => task.event?.id && handleCheckIn(task.event.id)}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
                                        >
                                            📍 Check In Here
                                        </button>
                                    )}
                                    
                                    {/* Visual feedback if this is the active event */}
                                    {activeAttendance?.event_id === task.event.id && (
                                        <span className="text-green-600 font-bold border border-green-600 px-4 py-2 rounded">
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