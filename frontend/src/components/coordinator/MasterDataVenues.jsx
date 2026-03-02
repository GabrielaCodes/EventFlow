import { useState, useEffect } from 'react';
import { getVenues, createVenue, deleteVenue } from '../../services/coordinatorService';

const MasterDataVenues = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({ name: '', location: '', capacity: '' });

    useEffect(() => { fetchVenues(); }, []);

    const fetchVenues = async () => {
        try {
            const { data } = await getVenues();
            setVenues(data || []);
        } catch (err) { console.error("Failed to load venues", err); } 
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.location || !formData.capacity) return alert("All fields are required.");

        setSubmitting(true);
        try {
            const { data } = await createVenue(formData);
            setVenues([data, ...venues]); 
            setFormData({ name: '', location: '', capacity: '' }); 
            alert("Venue added successfully!");
        } catch (err) { alert(err.response?.data?.error || "Failed to add venue"); } 
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this venue? Events assigned to it might break.")) return;
        try {
            await deleteVenue(id);
            setVenues(venues.filter(v => v.id !== id));
        } catch (err) { alert("Cannot delete: Venue might be in use by active events."); }
    };

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading Venues...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: ADD FORM */}
            <div className="lg:col-span-1">
                <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] p-6 h-fit sticky top-6">
                    <h3 className="text-lg font-bold text-[var(--gold-main)] mb-4 border-b border-[#333] pb-2">Add New Venue</h3>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Venue Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Grand Hall" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Location</label>
                            <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Building A, Floor 2" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Capacity</label>
                            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="e.g. 500" />
                        </div>
                        <button disabled={submitting} className="mt-2 disabled:opacity-50">
                            {submitting ? "Saving..." : "Create Venue"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT COLUMN: VENUE LIST */}
            <div className="lg:col-span-2">
                <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] overflow-hidden">
                    <div className="p-4 bg-[#111] border-b border-[#333] flex justify-between items-center">
                        <h3 className="font-bold text-[var(--gold-main)]">Existing Venues</h3>
                        <span className="bg-[#222] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-full">{venues.length} Total</span>
                    </div>

                    {venues.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-secondary)] italic">No venues added yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#111] text-[var(--text-secondary)] uppercase font-semibold">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4 text-center">Capacity</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#333]">
                                    {venues.map(venue => (
                                        <tr key={venue.id} className="hover:bg-[#1a1a1a] transition">
                                            <td className="p-4 font-bold text-[var(--text-primary)]">{venue.name}</td>
                                            <td className="p-4 text-[var(--text-secondary)]">{venue.location}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-[#222] text-[var(--gold-main)] border border-[#333] px-2 py-1 rounded text-xs font-bold">
                                                    {venue.capacity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(venue.id)}
                                                    className="text-red-500 hover:text-red-400 font-medium text-xs border border-red-900 px-3 py-1 rounded hover:bg-[#222] transition"
                                                    style={{ background: 'transparent', padding: '0.25rem 0.75rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterDataVenues;