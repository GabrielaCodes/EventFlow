import { useState, useEffect, useMemo } from 'react';
import { 
    getCategories, createCategory, deleteCategory,
    getSubtypes, createSubtype, deleteSubtype 
} from '../../services/coordinatorService';

const MasterDataCategories = () => {
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newCatName, setNewCatName] = useState('');
    const [newSubtypeName, setNewSubtypeName] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');

    // Search & Filter States
    const [catSearch, setCatSearch] = useState('');
    const [subSearch, setSubSearch] = useState('');
    const [subFilterCatId, setSubFilterCatId] = useState('All');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [catRes, subRes] = await Promise.all([getCategories(), getSubtypes()]);
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
            setCategories([...categories, data].sort((a,b) => a.name.localeCompare(b.name)));
            setNewCatName('');
        } catch (err) { alert(err.response?.data?.error || "Failed to add category"); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete category? This will fail if subtypes are linked.")) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            setSubtypes(subtypes.filter(s => s.category_id !== id));
        } catch (err) { alert("Action denied: Category is in use."); }
    };

    // --- SUBTYPE ACTIONS ---
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
        } catch (err) { alert("Action denied: Subtype is in use."); }
    };

    // --- FILTERING & GROUPING LOGIC ---
    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
    }, [categories, catSearch]);

    const groupedSubtypes = useMemo(() => {
        const filteredList = subtypes.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(subSearch.toLowerCase());
            const matchesCat = subFilterCatId === 'All' || s.category_id === subFilterCatId;
            return matchesSearch && matchesCat;
        });

        return filteredList.reduce((acc, sub) => {
            const catName = categories.find(c => c.id === sub.category_id)?.name || 'Uncategorized';
            if (!acc[catName]) acc[catName] = [];
            acc[catName].push(sub);
            return acc;
        }, {});
    }, [subtypes, subSearch, subFilterCatId, categories]);

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading Master Data...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
            
            {/* LEFT COL: CATEGORIES */}
            <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] h-fit flex flex-col">
                <div className="p-4 border-b border-[#333] bg-[#111] flex justify-between items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[var(--gold-main)]">📂 Event Categories</h3>
                    <input 
                        type="text" 
                        placeholder="🔍 Search Categories..." 
                        className="text-xs p-2 min-w-0 flex-1 sm:flex-none sm:w-1/2 mb-0 bg-[#222]"
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                    />
                </div>
                
                <div className="p-4">
                    <form onSubmit={handleAddCategory} className="flex flex-wrap sm:flex-nowrap gap-2 mb-6 items-stretch">
                        <input 
                            type="text" 
                            placeholder="New Category Name" 
                            className="flex-1 min-w-0 mb-0 bg-[#111] px-3 py-2"
                            value={newCatName} 
                            onChange={(e) => setNewCatName(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="mb-0 bg-[var(--gold-main)] text-black font-bold px-4 py-2 whitespace-nowrap flex-shrink-0 rounded"
                        >
                            Add
                        </button>
                    </form>

                    <ul className="divide-y divide-[#333] max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredCategories.map(cat => (
                            <li key={cat.id} className="py-3 flex justify-between items-center hover:bg-[#1a1a1a] px-2 rounded group">
                                <span className="font-medium text-[var(--text-primary)]">{cat.name}</span>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="bg-[var(--surface-color)] rounded shadow border border-[#333] h-fit flex flex-col">
                <div className="p-4 border-b border-[#333] bg-[#111] flex flex-col gap-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="font-bold text-[var(--gold-main)]">🏷️ Event Subtypes</h3>
                        <span className="text-xs bg-[#222] text-[var(--text-secondary)] px-2 py-1 rounded-full">
                            {subtypes.length} total
                        </span>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                        <input 
                            type="text" 
                            placeholder="🔍 Search Subtypes..." 
                            className="text-xs p-2 px-2 flex-1 min-w-0 mb-0 bg-[#222]"
                            value={subSearch} 
                            onChange={(e) => setSubSearch(e.target.value)}
                        />
                        <select 
                            className="text-xs p-2 mb-0 bg-[#222] sm:w-1/3 min-w-[140px]"
                            value={subFilterCatId} 
                            onChange={(e) => setSubFilterCatId(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-4">
                    <form 
                        onSubmit={handleAddSubtype} 
                        className="flex flex-col gap-3 mb-6 bg-[#111] p-3 rounded border border-[#333]"
                    >
                        <select 
                            className="mb-0 text-sm p-2"
                            value={selectedCatId} 
                            onChange={(e) => setSelectedCatId(e.target.value)}
                        >
                            <option value="">-- Assign Parent Category --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-stretch">
                            <input 
                                type="text" 
                                placeholder="New Subtype Name" 
                                className="flex-1 min-w-0 mb-0 bg-[#1a1a1a] px-3 py-2"
                                value={newSubtypeName} 
                                onChange={(e) => setNewSubtypeName(e.target.value)}
                            />
                            <button 
                                type="submit"
                                className="mb-0 bg-[var(--gold-main)] text-black font-bold px-4 py-2 whitespace-nowrap flex-shrink-0 rounded"
                            >
                                Add
                            </button>
                        </div>
                    </form>

                    <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.keys(groupedSubtypes).length === 0 ? (
                            <p className="text-center text-xs text-[var(--text-secondary)] py-4">
                                No subtypes found matching filters.
                            </p>
                        ) : (
                            Object.entries(groupedSubtypes).map(([catName, subs]) => (
                                <div key={catName} className="mb-6">
                                    <div className="text-[10px] uppercase tracking-widest text-[var(--gold-main)] font-bold mb-2 flex items-center gap-2">
                                        <span className="h-[1px] flex-1 bg-[#333]"></span>
                                        {catName}
                                        <span className="h-[1px] flex-1 bg-[#333]"></span>
                                    </div>
                                    <div className="space-y-1">
                                        {subs.map(sub => (
                                            <div key={sub.id} className="flex justify-between items-center p-2 hover:bg-[#1a1a1a] rounded group">
                                                <span className="text-sm text-[var(--text-primary)]">{sub.name}</span>
                                                <button 
                                                    onClick={() => handleDeleteSubtype(sub.id)}
                                                    className="text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: 'transparent', padding: 0 }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterDataCategories;
