import { useEffect, useState } from 'react';
import { getPendingUsers, verifyUser } from '../../services/coordinatorService';
import StatusBadge from '../common/StatusBadge';

const UserApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewStatus, setViewStatus] = useState('pending');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [viewStatus]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getPendingUsers(viewStatus);
            setUsers(data || []);
        } catch (err) { console.error("Failed to load users", err); } 
        finally { setLoading(false); }
    };

    const handleAction = async (userId, action) => {
        const confirmMsg = action === 'approve' 
            ? "Approve this user? They will gain full access." 
            : "Reject/Deactivate this user? Their access will be revoked.";
        if (!window.confirm(confirmMsg)) return;
        setProcessingId(userId);
        try {
            await verifyUser(userId, action); 
            fetchUsers();
        } catch (err) { alert("Action failed."); } 
        finally { setProcessingId(null); }
    };

    return (
        <div className="bg-[var(--surface-color)] rounded shadow-md border border-[#333] overflow-hidden">
            <div className="p-4 border-b border-[#333] bg-[#111] flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-[var(--gold-main)]">Account Approvals</h2>
                
                <div className="flex bg-[#222] rounded p-1 border border-[#333] shadow-sm">
                    {['pending', 'verified', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setViewStatus(status)}
                            className={`px-4 py-1.5 text-sm font-bold capitalize rounded transition-all ${
                                viewStatus === status 
                                ? 'bg-[var(--surface-color)] text-[var(--gold-main)] border border-[#333]' 
                                : 'text-[var(--text-secondary)] hover:bg-[#1a1a1a]'
                            }`}
                            style={{ padding: '0.375rem 1rem', background: viewStatus === status ? 'var(--surface-color)' : 'transparent' }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-10 text-center text-[var(--text-secondary)]">Loading...</div>
            ) : users.length === 0 ? (
                <div className="p-10 text-center text-[var(--text-secondary)] italic">
                    No {viewStatus} manager or sponsor accounts found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#111] text-[var(--gold-main)] uppercase font-semibold">
                            <tr>
                                <th className="p-4">Name / Company</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#1a1a1a] transition">
                                    <td className="p-4">
                                        <div className="font-bold text-[var(--text-primary)]">{user.full_name}</div>
                                        {user.company_name && (
                                            <div className="text-xs text-[var(--text-secondary)]">{user.company_name}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            user.role === 'manager' ? 'bg-[#222] text-[var(--gold-main)] border border-[#333]' : 'bg-[#111] text-[var(--text-primary)] border border-[#333]'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[var(--text-secondary)] font-mono text-xs">{user.email}</td>
                                    <td className="p-4"><StatusBadge status={user.verification_status} /></td>
                                    
                                    <td className="p-4 flex justify-center gap-3">
                                        {(viewStatus === 'pending' || viewStatus === 'rejected') && (
                                            <button 
                                                onClick={() => handleAction(user.id, 'approve')}
                                                disabled={processingId === user.id}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                                className="disabled:opacity-50"
                                            >
                                                {viewStatus === 'rejected' ? 'Re-Approve' : 'Approve'}
                                            </button>
                                        )}
                                        {(viewStatus === 'pending' || viewStatus === 'verified') && (
                                            <button 
                                                onClick={() => handleAction(user.id, 'reject')}
                                                disabled={processingId === user.id}
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#333', color: '#ff6b6b' }}
                                                className="disabled:opacity-50 hover:bg-[#444]"
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