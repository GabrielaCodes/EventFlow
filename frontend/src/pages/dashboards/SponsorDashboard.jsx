import { useEffect, useState } from 'react';
import api from '../../services/api'; // Ensure this path matches your structure

const SponsorDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // This endpoint returns sponsorships joined with event details
            const { data } = await api.get('/sponsors/requests');
            setRequests(data);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, action) => {
        if (!window.confirm(`Are you sure you want to mark this as ${action}?`)) return;

        try {
            // action: 'accepted' | 'rejected'
            await api.patch('/sponsors/respond', { sponsorship_id: id, action });
            
            // Remove from UI immediately for responsiveness
            setRequests(prev => prev.filter(req => req.id !== id));
            alert(`Sponsorship request ${action}!`);
        } catch (err) {
            console.error(err);
            alert('Error processing request');
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading opportunities...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Sponsorship Opportunities</h1>
                <p className="text-gray-500">Review pending requests from event managers.</p>
            </header>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-xl text-gray-600 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-400">No pending sponsorship requests at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300">
                            
                            {/* Card Header: Event Title & Date */}
                            <div className="bg-indigo-600 p-5">
                                <h3 className="text-white font-bold text-lg truncate" title={req.events?.title}>
                                    {req.events?.title || 'Untitled Event'}
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
                                    📅 {new Date(req.events?.event_date).toLocaleDateString()}
                                </p>
                            </div>
                            
                            {/* Card Body: Details */}
                            <div className="p-6">
                                <div className="flex justify-between items-end mb-4 border-b pb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Amount</p>
                                        <p className="text-2xl font-extrabold text-gray-900">${req.amount?.toLocaleString()}</p>
                                    </div>
                                    {req.events?.venues && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Venue</p>
                                            <p className="text-sm text-gray-700 font-medium">{req.events.venues.name}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {req.request_note ? (
                                    <div className="mb-6 bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Note from Manager:</p>
                                        <p className="text-sm text-gray-600 italic">"{req.request_note}"</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic mb-6">No additional notes.</p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-auto">
                                    <button 
                                        onClick={() => handleRespond(req.id, 'accepted')}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition shadow-sm"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleRespond(req.id, 'rejected')}
                                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg font-semibold transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SponsorDashboard;