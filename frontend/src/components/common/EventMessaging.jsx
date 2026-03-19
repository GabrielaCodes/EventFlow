import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/api';

const EventMessaging = ({ eventId, currentUserId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (eventId) {
            fetchMessages();
            // Optional: Subscribe to real-time updates via Supabase here
        }
    }, [eventId]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('event_messages')
            .select('*, sender:sender_id(full_name, role)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });
        
        if (!error && data) {
            setMessages(data);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Note: receiver_id is left null in this generic implementation 
        // because the event ID acts as the "Chat Room". 
        // Only Authorized managers/sponsors can read it due to RLS.
        const { error } = await supabase.from('event_messages').insert([{
            event_id: eventId,
            sender_id: currentUserId,
            message_text: newMessage
        }]);

        if (!error) {
            setNewMessage('');
            fetchMessages();
        }
    };

    return (
        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden bg-[#0B0B0B] flex flex-col h-[400px]">
            <div className="p-3 border-b border-[#2A2A2A] bg-[#161616]">
                <h3 className="text-xs font-medium text-[#C5A46D] uppercase tracking-wider mb-0">Event Discussion</h3>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && <p className="text-center text-[#555] text-xs italic mt-4">No messages yet.</p>}
                
                {messages.map(msg => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-[#555] uppercase tracking-wider mb-1 px-1">
                                {isMe ? 'You' : `${msg.sender?.full_name} (${msg.sender?.role})`}
                            </span>
                            <div className={`p-3 rounded-sm max-w-[80%] text-sm ${isMe ? 'bg-[#C5A46D] text-[#0B0B0B]' : 'bg-[#181818] text-[#E5E5E5] border border-[#2A2A2A]'}`}>
                                {msg.message_text}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-[#2A2A2A] bg-[#121212]">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder="Type a message..." 
                        className="dash-input m-0 flex-1 text-sm bg-[#0B0B0B]"
                    />
                    <button type="submit" className="dash-btn px-6 text-xs tracking-wider">Send</button>
                </form>
            </div>
        </div>
    );
};

export default EventMessaging;