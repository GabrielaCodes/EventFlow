import { useState, useEffect } from 'react';
import { 
    getCategories, createCategory, deleteCategory,
    getSubtypes, createSubtype, deleteSubtype 
} from '../../services/coordinatorService';

const MasterDataCategories = () => {
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newCatName, setNewCatName] = useState('');
    const [newSubtypeName, setNewSubtypeName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [catRes, subRes] = await Promise.all([getCategories(), getSubtypes()]);
            setCategories(catRes.data || []);
            setSubtypes(subRes.data || []);
        } catch (err) { console.error("Failed to load master data", err); } 
        finally { setLoading(false); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            const { data } = await createCategory({ name: newCatName });
            setCategories([...categories, data]);
            setNewCatName('');
        } catch (err) { alert(err.response?.data?.error || "Failed to add category"); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category? This might fail if subtypes exist.")) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            setSubtypes(subtypes.filter(s => s.category_id !== id));
        } catch (err) { alert("Cannot delete: Category might be in use."); }
    };

    const handleAddSubtype = async (e) => {
        e.preventDefault();
        if (!newSubtypeName.trim() || !selectedCatId) return;
        try {
            const { data } = await createSubtype({ name: newSubtypeName, category_id: selectedCatId });
            setSubtypes([...subtypes, data]);
            setNewSubtypeName('');
        } catch (err) { alert(err.response?.data?.error || "Failed to add subtype"); }
    };

    const handleDeleteSubtype = async (id) => {
        if (!window.confirm("Delete this subtype?")) return;
        try {
            await deleteSubtype(id);
            setSubtypes(subtypes.filter(s => s.id !== id));
        } catch (err) { alert("Cannot delete: Subtype might be in use."); }
    };

    const getCatName = (catId) => categories.find(c => c.id === catId)?.name || 'Unknown';

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading Master Data...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COL: CATEGORIES */}
            <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] h-fit">
                <div className="p-4 border-b border-[#333] bg-[#111] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--gold-main)]">📂 Event Categories</h3>
                    <span className="text-xs bg-[#222] text-[var(--text-secondary)] px-2 py-1 rounded-full">{categories.length}</span>
                </div>
                
                <div className="p-4">
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            placeholder="New Category Name" 
                            className="flex-1 mb-0"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                        />
                        <button className="mb-0">Add</button>
                    </form>

                    <ul className="divide-y divide-[#333] max-h-96 overflow-y-auto pr-2">
                        {categories.map(cat => (
                            <li key={cat.id} className="py-3 flex justify-between items-center hover:bg-[#1a1a1a] px-2 rounded">
                                <span className="font-medium text-[var(--text-primary)]">{cat.name}</span>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="text-red-500 text-xs hover:underline"
                                    style={{ background: 'transparent', padding: 0 }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT COL: SUBTYPES */}
            <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] h-fit">
                <div className="p-4 border-b border-[#333] bg-[#111] flex justify-between items-center">
                    <h3 className="font-bold text-[var(--gold-main)]">🏷️ Event Subtypes</h3>
                    <span className="text-xs bg-[#222] text-[var(--text-secondary)] px-2 py-1 rounded-full">{subtypes.length}</span>
                </div>

                <div className="p-4">
                    <form onSubmit={handleAddSubtype} className="flex flex-col gap-3 mb-6 bg-[#111] p-3 rounded border border-[#333]">
                        <select 
                            className="mb-0"
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
                                className="flex-1 mb-0"
                                value={newSubtypeName}
                                onChange={(e) => setNewSubtypeName(e.target.value)}
                            />
                            <button className="mb-0">Add</button>
                        </div>
                    </form>

                    <div className="max-h-96 overflow-y-auto pr-2">
                        <table className="w-full text-sm">
                            <thead className="bg-[#111] text-left text-[var(--text-secondary)]">
                                <tr>
                                    <th className="p-2">Subtype</th>
                                    <th className="p-2">Category</th>
                                    <th className="p-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {subtypes.map(sub => (
                                    <tr key={sub.id} className="hover:bg-[#1a1a1a]">
                                        <td className="p-2 font-medium text-[var(--text-primary)]">{sub.name}</td>
                                        <td className="p-2">
                                            <span className="bg-[#222] text-[var(--gold-main)] px-2 py-0.5 rounded text-xs border border-[#333]">
                                                {getCatName(sub.category_id)}
                                            </span>
                                        </td>
                                        <td className="p-2 text-right">
                                            <button 
                                                onClick={() => handleDeleteSubtype(sub.id)}
                                                className="text-red-500 text-xs hover:underline"
                                                style={{ background: 'transparent', padding: 0 }}
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