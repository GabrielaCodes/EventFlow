import { useState, useEffect } from 'react';
import { getVenues, createVenue, deleteVenue } from '../../services/coordinatorService';

const MasterDataVenues = () => {
    // State
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: ''
    });

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            const { data } = await getVenues();
            setVenues(data || []);
        } catch (err) {
            console.error("Failed to load venues", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.location || !formData.capacity) {
            alert("All fields are required.");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await createVenue(formData);
            setVenues([data, ...venues]); // Add new venue to top of list
            setFormData({ name: '', location: '', capacity: '' }); // Reset form
            alert("Venue added successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add venue");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this venue? Events assigned to it might break.")) return;
        
        try {
            await deleteVenue(id);
            setVenues(venues.filter(v => v.id !== id));
        } catch (err) {
            alert("Cannot delete: Venue might be in use by active events.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Venues...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: ADD FORM */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded shadow border border-gray-200 p-6 h-fit sticky top-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Add New Venue</h3>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Venue Name</label>
                            <input 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange}
                                placeholder="e.g. Grand Hall" 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                            <input 
                                name="location" 
                                value={formData.location} 
                                onChange={handleChange}
                                placeholder="e.g. Building A, Floor 2" 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacity</label>
                            <input 
                                type="number"
                                name="capacity" 
                                value={formData.capacity} 
                                onChange={handleChange}
                                placeholder="e.g. 500" 
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <button 
                            disabled={submitting}
                            className="bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 transition disabled:opacity-50 mt-2"
                        >
                            {submitting ? "Saving..." : "Create Venue"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT COLUMN: VENUE LIST */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Existing Venues</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{venues.length} Total</span>
                    </div>

                    {venues.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic">No venues added yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-500 uppercase font-semibold">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4 text-center">Capacity</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {venues.map(venue => (
                                        <tr key={venue.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-bold text-gray-800">{venue.name}</td>
                                            <td className="p-4 text-gray-600">{venue.location}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                                    {venue.capacity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(venue.id)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
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