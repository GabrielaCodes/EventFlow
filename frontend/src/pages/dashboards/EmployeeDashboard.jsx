import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestNote, setRequestNote] = useState('');
    const [selectedEventId, setSelectedEventId] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const { data } = await api.get('/events/assigned');
            setAssignments(data);
        } catch (err) {
            console.error("Failed to load assignments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleModificationRequest = async (e) => {
        e.preventDefault();
        if (!selectedEventId) return;

        try {
            await api.post('/events/modify', {
                event_id: selectedEventId,
                request_details: requestNote
            });
            alert('Request sent to Manager!');
            setRequestNote('');
            setSelectedEventId(null);
        } catch (err) {
            alert('Failed to send request: ' + err.message);
        }
    };

    if (loading) return <div className="p-8">Loading schedule...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Schedule</h1>
                <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || 'Employee'}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: List of Assignments */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Events</h2>
                    <div className="space-y-4">
                        {assignments.length === 0 ? (
                            <p className="text-gray-500 italic">No shifts assigned yet.</p>
                        ) : (
                            assignments.map((event) => (
                                <div key={event.id} className="bg-white p-4 rounded-lg shadow border border-l-4 border-l-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{event.title}</h3>
                                            <p className="text-sm text-gray-500">{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            event.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setSelectedEventId(event.id)}
                                        className="mt-3 text-sm text-blue-600 underline hover:text-blue-800"
                                    >
                                        Request Changes / Help
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Action Panel */}
                <div>
                    <div className="bg-gray-50 p-6 rounded-lg border">
                        <h2 className="text-xl font-semibold mb-4">Actions</h2>
                        
                        {selectedEventId ? (
                            <form onSubmit={handleModificationRequest}>
                                <h3 className="text-sm font-bold text-gray-700 mb-2">
                                    Submit Request for Event ID: ...{selectedEventId.slice(-4)}
                                </h3>
                                <textarea
                                    className="w-full p-3 border rounded mb-3 text-sm"
                                    rows="4"
                                    placeholder="Describe the issue (e.g., need more chairs, venue locked, etc.)"
                                    value={requestNote}
                                    onChange={(e) => setRequestNote(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                                        Submit Request
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedEventId(null)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-gray-500 text-sm">Select an event from the list to submit a modification request or report an issue.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;