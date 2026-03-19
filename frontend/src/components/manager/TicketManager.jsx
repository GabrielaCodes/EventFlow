import { useState, useEffect } from 'react';
import { supabase } from '../../services/api';

const TicketManager = ({ eventId }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        type_name: '', price: '', quantity_available: '', quantity_sold: '0', sponsor_allocation_amount: '0'
    });

    useEffect(() => {
        if (eventId) fetchTickets();
    }, [eventId]);

    const fetchTickets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', eventId)
            .order('type_name', { ascending: true });
            
        if (!error && data) setTickets(data);
        setLoading(false);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddTicket = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('tickets').insert([{
            event_id: eventId,
            type_name: formData.type_name,
            price: parseFloat(formData.price),
            quantity_available: parseInt(formData.quantity_available),
            quantity_sold: parseInt(formData.quantity_sold),
            sponsor_allocation_amount: parseFloat(formData.sponsor_allocation_amount)
        }]);

        if (error) {
            alert("Failed to add ticket. " + error.message);
        } else {
            setFormData({ type_name: '', price: '', quantity_available: '', quantity_sold: '0', sponsor_allocation_amount: '0' });
            fetchTickets();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this ticket tier?")) return;
        await supabase.from('tickets').delete().eq('id', id);
        fetchTickets();
    };

    return (
        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden bg-[#121212]">
            <div className="p-4 border-b border-[#2A2A2A] bg-[#161616]">
                <h3 className="text-xs font-medium text-[#C5A46D] uppercase tracking-wider mb-0">Ticket Allocations</h3>
            </div>
            
            <div className="p-5">
                {/* Form to Add Tickets with Clear Labels */}
                <form onSubmit={handleAddTicket} className="bg-[#0B0B0B] p-4 rounded-sm border border-[#2A2A2A] mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">Ticket Type</label>
                            <input name="type_name" placeholder="e.g. VIP" value={formData.type_name} onChange={handleChange} required className="dash-input m-0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">Price ($)</label>
                            <input name="price" type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={handleChange} required className="dash-input m-0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">Total Qty</label>
                            <input name="quantity_available" type="number" placeholder="100" value={formData.quantity_available} onChange={handleChange} required className="dash-input m-0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-[#C5A46D] uppercase tracking-wider mb-1.5">Sponsor Cut ($)</label>
                            <input name="sponsor_allocation_amount" type="number" step="0.01" placeholder="0.00" value={formData.sponsor_allocation_amount} onChange={handleChange} required className="dash-input m-0 border-[#C5A46D]/50 focus:border-[#C5A46D]" />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-[#2A2A2A]">
                        <button type="submit" className="dash-btn !py-1.5 px-6">Add Ticket Tier</button>
                    </div>
                </form>

                {/* Tickets Table */}
                {loading ? <p className="text-[#B0B0B0] text-xs">Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="dash-table w-full border border-[#2A2A2A]">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Price</th>
                                    <th>Available / Sold</th>
                                    <th>Sponsor Cut</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 && <tr><td colSpan="5" className="text-center text-[#B0B0B0] italic py-6">No tickets added yet.</td></tr>}
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td className="font-medium text-[#E5E5E5]">{t.type_name}</td>
                                        <td className="text-[#C5A46D]">${t.price}</td>
                                        <td className="text-[#B0B0B0]">{t.quantity_available} / {t.quantity_sold}</td>
                                        <td className="text-[#B0B0B0]">${t.sponsor_allocation_amount}</td>
                                        <td className="text-right">
                                            <button onClick={() => handleDelete(t.id)} className="text-[#555] hover:text-[#E5E5E5] transition-colors">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
    );
};

export default TicketManager;