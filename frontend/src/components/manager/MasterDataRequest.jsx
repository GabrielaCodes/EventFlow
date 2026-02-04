// Manger can request Chief Coordinator to add venues,category,sub category
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
            // ✅ Uses the admin route we just updated
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
            <div className="bg-white p-6 rounded shadow border">
                <h2 className="text-xl font-bold mb-4 text-purple-700">Request New Resource</h2>
                
                <div className="flex gap-2 mb-4">
                    {['venue', 'category', 'subtype'].map(t => (
                        <button key={t} onClick={() => { setType(t); setFormData({}); }}
                            className={`px-3 py-1 rounded capitalize text-sm font-bold ${type === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {type === 'venue' && (
                        <>
                            <input placeholder="Venue Name" className="border p-2 rounded" required 
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input placeholder="Location" className="border p-2 rounded" required 
                                onChange={e => setFormData({...formData, location: e.target.value})} />
                            <input type="number" placeholder="Capacity" className="border p-2 rounded" required 
                                onChange={e => setFormData({...formData, capacity: e.target.value})} />
                        </>
                    )}

                    {type === 'category' && (
                         <input placeholder="Category Name" className="border p-2 rounded" required 
                            onChange={e => setFormData({...formData, name: e.target.value})} />
                    )}

                    {type === 'subtype' && (
                        <>
                            <select className="border p-2 rounded" required onChange={e => setFormData({...formData, category_id: e.target.value})}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input placeholder="Subtype Name" className="border p-2 rounded" required 
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                        </>
                    )}

                    <textarea placeholder="Why do you need this?" className="border p-2 rounded h-20" 
                        value={note} onChange={e => setNote(e.target.value)} />

                    <button disabled={submitting} className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700">
                        {submitting ? 'Sending...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            {/* RIGHT: HISTORY */}
            <div className="bg-white p-6 rounded shadow border">
                <h3 className="font-bold mb-4 text-gray-800">My Requests</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.length === 0 && <p className="text-gray-400 italic">No requests yet.</p>}
                    {history.map(req => (
                        <div key={req.id} className="border p-3 rounded flex justify-between items-center text-sm">
                            <div>
                                <span className="font-bold capitalize block text-gray-800">{req.type}</span>
                                <span className="text-gray-600">
                                    {req.request_data.name} 
                                </span>
                                {req.status === 'rejected' && <p className="text-red-500 text-xs mt-1">Reason: {req.rejection_reason}</p>}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                                req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>{req.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MasterDataRequest;