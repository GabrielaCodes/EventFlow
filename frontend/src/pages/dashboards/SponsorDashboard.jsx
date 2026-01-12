import { useEffect, useState } from 'react';
import api from '../../services/api';

const SponsorDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/sponsors/requests');
            setRequests(data);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, action) => {
        try {
            // action must be 'accepted' or 'rejected'
            await api.patch('/sponsors/respond', { sponsorship_id: id, action });
            
            // Remove the item from the list instantly for good UI
            setRequests(requests.filter(req => req.id !== id));
            alert(`Sponsorship ${action}!`);
        } catch (err) {
            alert('Error processing request');
        }
    };

    if (loading) return <div className="p-8">Loading opportunities...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Sponsorship Opportunities</h1>

            {requests.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded border border-dashed">
                    <p className="text-xl text-gray-500">No pending sponsorship requests.</p>
                    <p className="text-sm text-gray-400">Great job! You're all caught up.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow">
                            <div className="bg-purple-600 p-4">
                                <h3 className="text-white font-bold text-lg truncate">{req.events?.title}</h3>
                                <p className="text-purple-100 text-sm">
                                    Date: {new Date(req.events?.event_date).toLocaleDateString()}
                                </p>
                            </div>
                            
                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 uppercase font-semibold">Requested Amount</p>
                                    <p className="text-3xl font-bold text-gray-800">${req.amount}</p>
                                </div>
                                
                                {req.request_note && (
                                    <div className="mb-6 bg-gray-50 p-3 rounded text-sm text-gray-600 italic">
                                        "{req.request_note}"
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleRespond(req.id, 'accepted')}
                                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleRespond(req.id, 'rejected')}
                                        className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200 transition-colors font-medium"
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