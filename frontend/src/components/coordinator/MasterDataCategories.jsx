import { useState, useEffect } from 'react';
import { 
    getCategories, createCategory, deleteCategory,
    getSubtypes, createSubtype, deleteSubtype 
} from '../../services/coordinatorService';

const MasterDataCategories = () => {
    // Data State
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newCatName, setNewCatName] = useState('');
    const [newSubtypeName, setNewSubtypeName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [catRes, subRes] = await Promise.all([
                getCategories(),
                getSubtypes()
            ]);
            setCategories(catRes.data || []);
            setSubtypes(subRes.data || []);
        } catch (err) {
            console.error("Failed to load master data", err);
        } finally {
            setLoading(false);
        }
    };

    // --- CATEGORY ACTIONS ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        try {
            const { data } = await createCategory({ name: newCatName });
            setCategories([...categories, data]);
            setNewCatName('');
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add category");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category? This might fail if subtypes exist.")) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            // Remove related subtypes from UI instantly
            setSubtypes(subtypes.filter(s => s.category_id !== id));
        } catch (err) {
            alert("Cannot delete: Category might be in use.");
        }
    };

    // --- SUBTYPE ACTIONS ---
    const handleAddSubtype = async (e) => {
        e.preventDefault();
        if (!newSubtypeName.trim() || !selectedCatId) return;

        try {
            const { data } = await createSubtype({ 
                name: newSubtypeName, 
                category_id: selectedCatId 
            });
            setSubtypes([...subtypes, data]);
            setNewSubtypeName('');
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add subtype");
        }
    };

    const handleDeleteSubtype = async (id) => {
        if (!window.confirm("Delete this subtype?")) return;
        try {
            await deleteSubtype(id);
            setSubtypes(subtypes.filter(s => s.id !== id));
        } catch (err) {
            alert("Cannot delete: Subtype might be in use.");
        }
    };

    // Helper to find category name for subtype list
    const getCatName = (catId) => categories.find(c => c.id === catId)?.name || 'Unknown';

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Master Data...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COL: CATEGORIES */}
            <div className="bg-white rounded shadow border border-gray-200 h-fit">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">📂 Event Categories</h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{categories.length}</span>
                </div>
                
                <div className="p-4">
                    {/* Add Form */}
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            placeholder="New Category Name" 
                            className="flex-1 p-2 border rounded"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                            Add
                        </button>
                    </form>

                    {/* List */}
                    <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {categories.map(cat => (
                            <li key={cat.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                                <span className="font-medium text-gray-700">{cat.name}</span>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="text-red-500 text-xs hover:underline"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT COL: SUBTYPES */}
            <div className="bg-white rounded shadow border border-gray-200 h-fit">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">🏷️ Event Subtypes</h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{subtypes.length}</span>
                </div>

                <div className="p-4">
                    {/* Add Form */}
                    <form onSubmit={handleAddSubtype} className="flex flex-col gap-3 mb-6 bg-gray-50 p-3 rounded border">
                        <select 
                            className="p-2 border rounded w-full bg-white"
                            value={selectedCatId}
                            onChange={(e) => setSelectedCatId(e.target.value)}
                        >
                            <option value="">-- Select Parent Category --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="New Subtype Name" 
                                className="flex-1 p-2 border rounded"
                                value={newSubtypeName}
                                onChange={(e) => setNewSubtypeName(e.target.value)}
                            />
                            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium">
                                Add
                            </button>
                        </div>
                    </form>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-left text-gray-500">
                                <tr>
                                    <th className="p-2">Subtype</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {subtypes.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50">
                                        <td className="p-2 font-medium">{sub.name}</td>
                                        <td className="p-2">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                {getCatName(sub.category_id)}
                                            </span>
                                        </td>
                                        <td className="p-2 text-right">
                                            <button 
                                                onClick={() => handleDeleteSubtype(sub.id)}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MasterDataCategories;