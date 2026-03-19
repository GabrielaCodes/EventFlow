import { useState, useEffect } from 'react';
import { supabase } from '../../services/api';

const TicketViewer = ({ eventId }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (eventId) fetchTickets();
    }, [eventId]);

    const fetchTickets = async () => {
        setLoading(true);
        // RLS will automatically filter this based on the user's role!
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', eventId)
            .order('type_name', { ascending: true });
            
        if (!error && data) setTickets(data);
        setLoading(false);
    };

    if (loading) return <div className="text-[#B0B0B0] text-xs">Loading tickets...</div>;

    return (
        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden bg-[#121212]">
            <div className="p-4 border-b border-[#2A2A2A] bg-[#161616]">
                <h3 className="text-xs font-medium text-[#C5A46D] uppercase tracking-wider mb-0">Event Ticket Allocations</h3>
            </div>
            <div className="overflow-x-auto p-4">
                <table className="dash-table w-full border border-[#2A2A2A]">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Price</th>
                            <th>Availability</th>
                            <th>Sponsor Cut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length === 0 && <tr><td colSpan="4" className="text-center text-[#B0B0B0] italic">No tickets allocated yet.</td></tr>}
                        {tickets.map(t => (
                            <tr key={t.id}>
                                <td className="font-medium text-[#E5E5E5]">{t.type_name}</td>
                                <td className="text-[#C5A46D]">${t.price}</td>
                                <td className="text-[#B0B0B0]">{t.quantity_available} Total</td>
                                <td className="text-[#B0B0B0]">${t.sponsor_allocation_amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TicketViewer;