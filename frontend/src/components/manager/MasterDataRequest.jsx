import { useState, useEffect } from 'react';
import api, { supabase } from '../../services/api';

const MasterDataRequest = () => {
    const [type, setType] = useState('venue');
    const [categories, setCategories] = useState([]);
    const [history, setHistory] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({});
    const [note, setNote] = useState('');

    useEffect(() => {
        loadHistory();
        if (type === 'subtype') loadCategories();
    }, [type]);

    const loadHistory = async () => {
        try {
            const { data } = await api.get('/admin/master-requests');
            setHistory(data);
        } catch (err) { console.error(err); }
    };

    const loadCategories = async () => {
        const { data } = await supabase.from('event_categories').select('*');
        setCategories(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/master-request', {
                type,
                request_data: formData,
                request_note: note
            });
            alert("Request Sent!");
            setFormData({});
            setNote('');
            loadHistory();
        } catch (err) {
            alert("Error sending request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT: REQUEST FORM */}
            <div className="bg-[var(--surface-color)] p-6 rounded shadow border border-[#333]">
                <h2 className="text-xl font-bold mb-4 text-[var(--gold-main)]">Request New Resource</h2>
                
                <div className="flex gap-2 mb-4">
                    {['venue', 'category', 'subtype'].map(t => (
                        <button key={t} onClick={() => { setType(t); setFormData({}); }}
                            className={`px-3 py-1 rounded capitalize text-sm font-bold ${type === t ? 'bg-[var(--gold-main)] text-[var(--bg-color)]' : 'bg-[#111] text-[var(--text-secondary)]'}`}
                            style={{ padding: '0.25rem 0.75rem' }}>
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {type === 'venue' && (
                        <>
                            <input placeholder="Venue Name" required 
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input placeholder="Location" required 
                                onChange={e => setFormData({...formData, location: e.target.value})} />
                            <input type="number" placeholder="Capacity" required 
                                onChange={e => setFormData({...formData, capacity: e.target.value})} />
                        </>
                    )}

                    {type === 'category' && (
                         <input placeholder="Category Name" required 
                            onChange={e => setFormData({...formData, name: e.target.value})} />
                    )}

                    {type === 'subtype' && (
                        <>
                            <select required onChange={e => setFormData({...formData, category_id: e.target.value})}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input placeholder="Subtype Name" required 
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                        </>
                    )}

                    <textarea placeholder="Why do you need this?" className="h-20" 
                        value={note} onChange={e => setNote(e.target.value)} />

                    <button disabled={submitting} className="mt-2">
                        {submitting ? 'Sending...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* RIGHT: HISTORY */}
            <div className="bg-[var(--surface-color)] p-6 rounded shadow border border-[#333]">
                <h3 className="font-bold mb-4 text-[var(--gold-main)]">My Requests</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {history.length === 0 && <p className="text-[var(--text-secondary)] italic">No requests yet.</p>}
                    {history.map(req => (
                        <div key={req.id} className="border border-[#333] bg-[#111] p-3 rounded flex justify-between items-center text-sm">
                            <div>
                                <span className="font-bold capitalize block text-[var(--text-primary)]">{req.type}</span>
                                <span className="text-[var(--text-secondary)]">
                                    {req.request_data.name} 
                                </span>
                                {req.status === 'rejected' && <p className="text-red-500 text-xs mt-1">Reason: {req.rejection_reason}</p>}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                                req.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                                req.status === 'approved' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                            }`}>{req.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MasterDataRequest;