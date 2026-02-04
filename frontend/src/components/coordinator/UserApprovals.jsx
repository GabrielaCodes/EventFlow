import { useEffect, useState } from 'react';
import { getPendingUsers, verifyUser } from '../../services/coordinatorService';
import StatusBadge from '../common/StatusBadge';

const UserApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewStatus, setViewStatus] = useState('pending'); // 'pending', 'verified', 'rejected'
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [viewStatus]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch based on the current tab
            const { data } = await getPendingUsers(viewStatus);
            setUsers(data || []);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        const confirmMsg = action === 'approve' 
            ? "Approve this user? They will gain full access." 
            : "Reject/Deactivate this user? Their access will be revoked.";
            
        if (!window.confirm(confirmMsg)) return;

        setProcessingId(userId);
        try {
            await verifyUser(userId, action); 
            // Refresh list to remove the item (since it changed status)
            fetchUsers();
        } catch (err) {
            alert("Action failed.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="bg-white rounded shadow-md border border-gray-200 overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Account Approvals</h2>
                
                <div className="flex bg-white rounded p-1 border shadow-sm">
                    {['pending', 'verified', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setViewStatus(status)}
                            className={`px-4 py-1.5 text-sm font-bold capitalize rounded transition-all ${
                                viewStatus === status 
                                ? 'bg-blue-600 text-white shadow' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : users.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic">
                    No {viewStatus} manager or sponsor accounts found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                            <tr>
                                <th className="p-4">Name / Company</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{user.full_name}</div>
                                        {user.company_name && (
                                            <div className="text-xs text-gray-500">{user.company_name}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            user.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 font-mono text-xs">{user.email}</td>
                                    <td className="p-4"><StatusBadge status={user.verification_status} /></td>
                                    
                                    <td className="p-4 flex justify-center gap-3">
                                        {/* Logic for Buttons based on current view */}
                                        
                                        {/* Show APPROVE if Pending or Rejected */}
                                        {(viewStatus === 'pending' || viewStatus === 'rejected') && (
                                            <button 
                                                onClick={() => handleAction(user.id, 'approve')}
                                                disabled={processingId === user.id}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow-sm text-xs font-bold transition disabled:opacity-50"
                                            >
                                                {viewStatus === 'rejected' ? 'Re-Approve' : 'Approve'}
                                            </button>
                                        )}

                                        {/* Show REJECT if Pending or Verified */}
                                        {(viewStatus === 'pending' || viewStatus === 'verified') && (
                                            <button 
                                                onClick={() => handleAction(user.id, 'reject')}
                                                disabled={processingId === user.id}
                                                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded shadow-sm text-xs font-bold transition disabled:opacity-50"
                                            >
                                                {viewStatus === 'verified' ? 'Deactivate' : 'Reject'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserApprovals;