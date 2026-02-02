import { useEffect, useState } from 'react';
import api from '../../services/api';

const ManagerSponsorships = ({ activeEvents }) => {
    const [sponsors, setSponsors] = useState([]);
    const [history, setHistory] = useState([]); // ✅ State for sent requests
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        event_id: '',
        sponsor_id: '',
        amount: '',
        request_note: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [sponsorRes, historyRes] = await Promise.all([
                api.get('/sponsors/list'),
                api.get('/sponsors/sent-requests') // ✅ Fetch History
            ]);
            setSponsors(sponsorRes.data || []);
            setHistory(historyRes.data || []);
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.event_id || !formData.sponsor_id || !formData.amount) {
            alert("Please fill in Event, Sponsor, and Amount.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/sponsors/request', formData);
            alert("Sponsorship request sent successfully!");
            setFormData({ ...formData, sponsor_id: '', amount: '', request_note: '' });
            loadInitialData(); // ✅ Refresh history list
        } catch (err) {
            alert(err.response?.data?.error || "Failed to send request.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading...</div>;

    // Helper for Status Badge
    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="space-y-8">
            {/* FORM SECTION */}
            <div className="bg-white p-6 rounded shadow h-fit border border-purple-100">
                <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                    💰 Request Sponsorship
                </h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event</label>
                        <select name="event_id" value={formData.event_id} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none">
                            <option value="">-- Select Active Event --</option>
                            {activeEvents.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title} ({ev.subtype_name})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Potential Sponsor</label>
                        <select name="sponsor_id" value={formData.sponsor_id} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none">
                            <option value="">-- Select Sponsor --</option>
                            {sponsors.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.company_name ? `${sp.company_name} (${sp.full_name})` : sp.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Request Amount ($)</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="e.g. 5000" className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"/>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pitch / Notes</label>
                        <textarea name="request_note" value={formData.request_note} onChange={handleChange} placeholder="e.g. Gold tier benefits..." className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none h-20"/>
                    </div>

                    <button disabled={submitting} type="submit" className="bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 transition py-2 shadow-sm disabled:opacity-50">
                        {submitting ? "Sending..." : "Send Request"}
                    </button>
                </form>
            </div>

            {/* HISTORY SECTION (New) */}
            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsorship Request History</h3>
                {history.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No requests sent yet.</p>
                ) : (
                    <div className="overflow-y-auto max-h-60">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left sticky top-0">
                                <tr>
                                    <th className="p-2">Event</th>
                                    <th className="p-2">Sponsor</th>
                                    <th className="p-2">Amount</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {history.map(req => (
                                    <tr key={req.id}>
                                        <td className="p-2">{req.events?.title}</td>
                                        <td className="p-2">
                                            <div className="font-medium">{req.profiles?.company_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{req.profiles?.full_name}</div>
                                        </td>
                                        <td className="p-2">${req.amount}</td>
                                        <td className="p-2">{getStatusBadge(req.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerSponsorships;