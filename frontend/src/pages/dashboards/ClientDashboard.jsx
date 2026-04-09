import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import api, { supabase } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketViewer from '../../components/common/TicketViewer'; 

// --- AI QUIZ CONFIGURATION ---
const QUIZ_DATA = {
    'wedding': {
        buttonText: "Let's Pick Your Theme",
        questions: [
            { id: 'q1', label: 'Describe your wedding aesthetic in exactly 3 words.', type: 'text' },
            { id: 'q2', label: 'What type of venue setting do you prefer?', type: 'select', options: ['Indoor ballroom', 'Outdoor garden', 'Rooftop / terrace', 'Auditorium / hall', 'Conference-style venue'] },
            { id: 'q3', label: 'What mood should your wedding create?', type: 'select', options: ['Grand and royal', 'Romantic and dreamy', 'Fun and lively', 'Calm and elegant', 'Traditional and cultural'] },
            { id: 'q4', label: 'Which color style do you prefer?', type: 'select', options: ['Gold and red', 'Pastel tones', 'White and green', 'Bright vibrant colors', 'Neutral minimal colors'] },
            { id: 'q5', label: 'What level of decoration do you want?', type: 'select', options: ['Simple and minimal', 'Moderately decorated', 'Rich and detailed', 'Luxury and premium'] },
            { id: 'q6', label: 'What matters most to you?', type: 'select', options: ['Photography aesthetics', 'Guest comfort', 'Cultural rituals', 'Budget management', 'Visual beauty'] }
        ]
    },
    'graduation': {
        buttonText: "Let's Pick Your Graduation Style",
        questions: [
            { id: 'q1', label: 'Describe your graduation celebration in exactly 3 words.', type: 'text' },
            { id: 'q2', label: 'What type of graduation event are you planning?', type: 'select', options: ['Formal ceremony with speeches', 'Party with music and dancing', 'Outdoor celebration', 'Academic department event', 'Small gathering with friends'] },
            { id: 'q3', label: 'What atmosphere do you want?', type: 'select', options: ['Professional and formal', 'Fun and energetic', 'Relaxed and social', 'Proud and celebratory', 'Elegant and classy'] },
            { id: 'q4', label: 'What is the main highlight of the event?', type: 'select', options: ['Certificate distribution', 'Dance and entertainment', 'Group photos', 'Dinner and networking', 'Speeches and presentations'] },
            { id: 'q5', label: 'How many guests are expected?', type: 'select', options: ['Less than 50', '50 to 100', '100 to 200', 'More than 200'] },
            { id: 'q6', label: 'What matters most for this graduation event?', type: 'select', options: ['Stage visibility', 'Fun experience', 'Photography', 'Comfort for guests', 'Budget control'] }
        ]
    },
    'private party': {
        buttonText: "Let's Plan Your Party Style",
        questions: [
            { id: 'q1', label: 'Describe your party vibe in exactly 3 words.', type: 'text' },
            { id: 'q2', label: 'What type of party are you hosting?', type: 'select', options: ['Birthday party', 'Anniversary celebration', 'Friends gathering', 'Family celebration', 'Corporate party'] },
            { id: 'q3', label: 'What atmosphere do you want?', type: 'select', options: ['Fun and energetic', 'Relaxed and cozy', 'Elegant and classy', 'Loud and lively', 'Premium and luxurious'] },
            { id: 'q4', label: 'What is the main activity?', type: 'select', options: ['Dance and music', 'Dining and socializing', 'Games and entertainment', 'Celebration ceremony', 'Networking'] },
            { id: 'q5', label: 'What time will the party happen?', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night'] },
            { id: 'q6', label: 'What matters most for your party?', type: 'select', options: ['Entertainment', 'Comfort', 'Budget', 'Ambience', 'Privacy'] }
        ]
    }
};

const statusStyles = {
    consideration: 'bg-yellow-900 text-yellow-200 border-yellow-700',
    in_progress: 'bg-blue-900 text-blue-200 border-blue-700',
    completed: 'bg-green-900 text-green-200 border-green-700',
    cancelled: 'bg-red-900 text-red-200 border-red-700'
};

// --- Hover Message Popup Component for Client ---
const MessagePopup = ({ sentTitle, sentMsg, receivedTitle, receivedMsg }) => {
    if (!sentMsg && !receivedMsg) return null;
    
    return (
        <div className="relative group inline-flex items-center ml-3 cursor-help z-10">
            <span className="flex items-center justify-center w-6 h-6 bg-[#1a1a1a] border border-[#333] rounded-full text-[10px] text-[var(--gold-main)] shadow-sm group-hover:bg-[#222] transition-colors">
                💬
            </span>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 bg-[#111] border border-[#333] rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex flex-col gap-3 z-[100]">
                {receivedMsg && (
                    <div>
                        <p className="text-[10px] uppercase font-bold text-[#888] mb-1 tracking-wider">{receivedTitle || 'Received'}</p>
                        <p className="text-sm text-[var(--gold-main)] italic whitespace-pre-wrap leading-relaxed">"{receivedMsg}"</p>
                    </div>
                )}
                {sentMsg && (
                    <div className={receivedMsg ? "border-t border-[#222] pt-3" : ""}>
                        <p className="text-[10px] uppercase font-bold text-[#888] mb-1 tracking-wider">{sentTitle || 'Sent'}</p>
                        <p className="text-sm text-gray-300 italic whitespace-pre-wrap leading-relaxed">"{sentMsg}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClientDashboard = () => {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState([]);
    
    const [categories, setCategories] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [venues, setVenues] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: ''
    });

    const [editingEvent, setEditingEvent] = useState(null);
    const [financeFeedback, setFinanceFeedback] = useState({});
    const [expandedTickets, setExpandedTickets] = useState({});

    // --- AI FEATURE STATE ---
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [quizImage, setQuizImage] = useState(null);

    // --- SMART EVENT MATCHING LOGIC ---
    // Get both Category and Subtype Names
    const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase() || '';
    const selectedSubtypeName = subtypes.find(s => s.id === formData.subtype_id)?.name?.toLowerCase() || '';
    
    // Combine them so the AI trigger searches both fields (e.g., "education graduation")
    const combinedSelectionText = `${selectedCategoryName} ${selectedSubtypeName}`;
    
    // Smart matcher to ensure categories or subtypes trigger the right quiz
    const getActiveQuizConfig = (searchString) => {
        if (!searchString || !searchString.trim()) return null;
        if (searchString.includes('wedding')) return QUIZ_DATA['wedding'];
        if (searchString.includes('graduation')) return QUIZ_DATA['graduation'];
        if (searchString.includes('private') || searchString.includes('party')) return QUIZ_DATA['private party'];
        return null;
    };

    const activeQuizConfig = getActiveQuizConfig(combinedSelectionText);

    useEffect(() => {
        if (!loading && user?.id) fetchData();
    }, [loading, user]);

    const fetchData = async () => {
        try {
            const { data: catData } = await supabase.from('event_categories').select('*');
            if (catData) setCategories(catData);

            const { data: venData } = await supabase.from('venues').select('id, name, capacity');
            if (venData) setVenues(venData);

            try {
                const response = await api.get('/events/my-events');
                if (Array.isArray(response.data)) setEvents(response.data);
                else setEvents([]); 
            } catch (apiErr) { setEvents([]); }
        } catch (err) { console.error("Dashboard Load Error:", err); }
    };

    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setFormData({ ...formData, subtype_id: '' }); 
        if (catId) {
            const { data } = await supabase.from('event_subtypes').select('*').eq('category_id', catId);
            setSubtypes(data || []);
        } else { setSubtypes([]); }
    };

    // Helper to convert image file to Base64
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        
        let imageBase64 = null;
        if (quizImage) {
            try {
                imageBase64 = await fileToBase64(quizImage);
            } catch (err) {
                console.error("Failed to read image file", err);
                alert("Could not process the image. Please try another one.");
                setIsGenerating(false);
                return;
            }
        }

        try {
            // Pass the combined selection text so the backend AI knows exactly what the event is
            const response = await api.post('/events/ai-suggest-theme', {
                category: combinedSelectionText, 
                answers: quizAnswers,
                imageBase64: imageBase64 
            });

            const { theme_name, suggested_venue } = response.data;
            const matchedVenue = venues.find(v => v.name.toLowerCase() === suggested_venue?.toLowerCase());

            setFormData(prev => ({
                ...prev,
                theme: theme_name || prev.theme,
                venue_id: matchedVenue ? matchedVenue.id : prev.venue_id,
                client_notes: `AI Suggested Theme: ${theme_name || 'Custom'}\nSuggested Venue: ${suggested_venue || 'TBD'}\n\n${prev.client_notes}`
            }));

            alert("Theme generated and form automatically updated!");
            setIsQuizModalOpen(false);
            setQuizAnswers({}); 
            setQuizImage(null);
        } catch (err) {
            console.error(err);
            alert("Failed to generate theme. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.subtype_id || !formData.venue_id) {
            alert("Please select both an Event Type and a Venue.");
            return;
        }
        try {
            await api.post('/events', { ...formData, client_id: user.id });
            alert('Event Booked Successfully!');
            fetchData(); 
            setFormData({ title: '', subtype_id: '', event_date: '', venue_id: '', theme: '', client_notes: '' });
            setSelectedCategory('');
            setSubtypes([]); 
        } catch (err) { alert('Error booking event.'); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/events/${editingEvent.id}`, editingEvent);
            alert('Event Updated Successfully!');
            setEditingEvent(null); 
            fetchData(); 
        } catch (err) {
            alert(err.response?.data?.error || 'Error updating event.');
        }
    };

    const handleFinanceResponse = async (eventId, action) => {
        const feedback = financeFeedback[eventId] || '';
        if (action === 'reject' && !feedback.trim()) {
            return alert("Please provide a reason for rejection.");
        }
        try {
            await api.post(`/events/${eventId}/finance/respond`, { action, feedback });
            alert(action === 'approve' ? "Plan Approved! Sponsors notified." : "Plan Rejected.");
            setFinanceFeedback(prev => ({ ...prev, [eventId]: '' }));
            fetchData(); 
        } catch (err) {
            alert(err.response?.data?.error || "Error responding to plan");
        }
    };

    const toggleTickets = (id) => {
        setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    
    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen relative">
            <h1 className="text-3xl font-bold mb-6 text-[var(--gold-main)]">Client Dashboard</h1>
            
            {/* BOOKING FORM */}
            <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow-md mb-8 border border-[#333]">
                <h3 className="text-xl font-bold mb-4 text-[var(--gold-main)]">Book New Event</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <input placeholder="Event Title" required value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#111] border border-[#444] p-2 rounded text-white" />
                    
                    <select value={selectedCategory} onChange={handleCategoryChange} required className="w-full bg-[#111] border border-[#444] p-2 rounded text-white">
                        <option value="">-- Select Category --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    
                    <select value={formData.subtype_id} onChange={e => setFormData({...formData, subtype_id: e.target.value})} disabled={!selectedCategory} required className="w-full bg-[#111] border border-[#444] p-2 rounded text-white">
                        <option value="">-- Select Subtype --</option>
                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    
                    <input type="date" required value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} className="w-full bg-[#111] border border-[#444] p-2 rounded text-white" />
                    
                    <div className="flex flex-col w-full md:col-span-2">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <span className="text-xs text-[var(--text-secondary)]">Venue</span>
                            <Link 
                                to="/gallery" target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[var(--gold-main)] hover:text-white underline decoration-[var(--gold-main)] underline-offset-2 transition-colors font-medium"
                            >
                                📸 Click to discover our venues
                            </Link>
                        </div>
                        <select value={formData.venue_id} onChange={e => setFormData({...formData, venue_id: e.target.value})} required className="w-full m-0 bg-[#111] border border-[#444] p-2 rounded text-white">
                            <option value="">-- Select Venue --</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>)}
                        </select>
                    </div>

                    {/* --- AI QUIZ TRIGGER BUTTON --- */}
                    {activeQuizConfig && (
                        <div className="md:col-span-2 flex justify-start mt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsQuizModalOpen(true)}
                                className="bg-[#1a1a1a] border border-[var(--gold-main)] text-[var(--gold-main)] font-bold py-2 px-4 rounded flex items-center gap-2 hover:bg-[var(--gold-main)] hover:text-black transition shadow-lg"
                            >
                                ✨ {activeQuizConfig.buttonText}
                            </button>
                        </div>
                    )}
                    
                    <textarea 
                        placeholder="You can specify the event theme, the number of days the event will run, and whether any preparations need to begin in advance. We are happy to be of service!" 
                        className="md:col-span-2 h-24 mt-2 bg-[#111] border border-[#444] p-2 rounded text-white" 
                        value={formData.client_notes} 
                        onChange={e => setFormData({...formData, client_notes: e.target.value})} 
                    />
                    
                    <button className="md:col-span-2 bg-[var(--gold-main)] text-black font-bold py-2 rounded hover:bg-yellow-600 transition">Book Event</button>
                </form>
            </div>

            {/* EVENT LIST */}
            <div className="bg-[var(--surface-color)] p-6 rounded-lg shadow-md border border-[#333]">
                <h3 className="text-xl font-bold mb-4 text-[var(--gold-main)]">My Events</h3>
                {Array.isArray(events) && events.length > 0 ? (
                    <div className="space-y-4">
                        {events.map(ev => {
                            const isPlanApproved = ev.finance_status === 'approved';
                            const allSponsorships = ev.sponsorships || [];
                            const acceptedSponsorships = allSponsorships.filter(s => s.status === 'accepted');
                            const pendingSponsorships = allSponsorships.filter(s => s.status === 'pending' || s.status === 'negotiating');
                            const rejectedSponsorships = allSponsorships.filter(s => s.status === 'rejected');
                            const totalSponsorship = acceptedSponsorships.reduce((sum, s) => sum + Number(s.amount), 0);

                            return (
                                <div key={ev.id} className="border-l-4 border-[var(--gold-main)] bg-[#111] p-5 rounded shadow-sm hover:bg-[#1a1a1a] transition flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center">
                                                <h4 className="font-bold text-xl text-[var(--text-primary)] text-white">{ev.title}</h4>
                                                {(ev.finance_manager_message || ev.finance_client_feedback) && (
                                                    <MessagePopup 
                                                        sentTitle="Your Feedback"
                                                        sentMsg={ev.finance_client_feedback}
                                                        receivedTitle={`Message from ${ev.manager?.full_name?.split(' ')[0] || 'Manager'}`}
                                                        receivedMsg={ev.finance_manager_message}
                                                    />
                                                )}
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)] mt-2 space-y-1.5">
                                                <p>📅 <span className="text-[#ccc]">{new Date(ev.event_date).toDateString()}</span></p>
                                                {ev.event_subtypes && <p>📌 Type: <span className="font-medium text-[var(--gold-main)]">{ev.event_subtypes.name}</span></p>}
                                                {ev.venues && <p>📍 Venue: <span className="text-[#ccc]">{ev.venues.name}, {ev.venues.location}</span></p>}
                                                {ev.manager && <p>👨‍💼 Manager: <span className="font-medium text-blue-400">{ev.manager.full_name}</span></p>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded border ${statusStyles[ev.status] || 'bg-[#222] text-[var(--text-secondary)]'}`}>
                                                {ev.status.replace('_', ' ')}
                                            </span>
                                            
                                            <div className="flex gap-2 w-full md:w-auto">
                                                {ev.status === 'consideration' && (
                                                    <button onClick={() => setEditingEvent(ev)} className="bg-[#333] text-white px-4 py-2 rounded text-sm hover:bg-[#444] font-bold transition w-full md:w-auto border border-[#555]">
                                                        Edit Details
                                                    </button>
                                                )}
                                                <Link to={`/event-modifications/${ev.id}`} className="bg-[var(--gold-main)] text-[var(--bg-color)] px-4 py-2 rounded text-sm hover:bg-[var(--gold-hover)] font-bold transition text-center w-full md:w-auto">
                                                    Manage
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TICKETS SECTION */}
                                    {isPlanApproved && (
                                        <div className="mt-2 pt-4 border-t border-[#333]">
                                            <button onClick={() => toggleTickets(ev.id)} className="text-[var(--gold-main)] text-sm font-bold tracking-wider uppercase flex items-center gap-2 hover:text-white transition-colors">
                                                {expandedTickets[ev.id] ? '▼ Hide Ticket Info' : '▶ Show Ticket Info'}
                                            </button>
                                            {expandedTickets[ev.id] && (
                                                <div className="mt-4 bg-[#0a0a0a] border border-[#222] rounded p-4">
                                                    <TicketViewer eventId={ev.id} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FINANCE APPROVAL ACTION BLOCK */}
                                    {ev.finance_status === 'pending_client' && (
                                        <div className="mt-2 p-4 bg-[#1a1a1a] border border-yellow-600 rounded-sm">
                                            <h5 className="text-sm font-bold text-yellow-500 mb-3 flex items-center gap-2">⚠️ Action Required: Review Proposed Budget</h5>
                                            
                                            <div className="mb-4 p-3 border-l-2 border-yellow-600 bg-[#111]">
                                                <p className="text-xs uppercase font-bold text-yellow-600 mb-1">Message from {ev.manager?.full_name?.split(' ')[0] || 'Manager'}:</p>
                                                <p className="text-sm text-[#E5E5E5] whitespace-pre-wrap">{ev.finance_manager_message}</p>
                                            </div>

                                            {allSponsorships.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-xs uppercase font-bold text-[var(--text-secondary)] mb-2">Proposed Sponsorships:</p>
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {allSponsorships.map(sponsor => (
                                                            <li key={sponsor.id} className="bg-[#111] p-2 rounded border border-[#333] flex justify-between items-center text-sm">
                                                                <span className="truncate pr-2 text-[#ccc]">{sponsor.sponsor?.company_name || sponsor.sponsor?.full_name || 'Sponsor'}</span>
                                                                <span className="text-[var(--gold-main)] font-mono">${Number(sponsor.amount).toLocaleString()}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <textarea 
                                                className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:border-yellow-600 outline-none text-sm mb-3" 
                                                placeholder="If rejecting, please explain what needs to be changed..."
                                                value={financeFeedback[ev.id] || ''} 
                                                onChange={e => setFinanceFeedback({...financeFeedback, [ev.id]: e.target.value})}
                                            />
                                            
                                            <div className="flex gap-3">
                                                <button onClick={() => handleFinanceResponse(ev.id, 'approve')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold transition flex-1">Approve Plan</button>
                                                <button onClick={() => handleFinanceResponse(ev.id, 'reject')} className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded text-sm font-bold transition flex-1">Reject with Feedback</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Client Rejected Display */}
                                    {ev.finance_status === 'rejected' && (
                                        <div className="mt-2 p-3 border-l-2 border-red-500 bg-red-900/20 flex justify-between items-start">
                                            <div>
                                                <p className="text-xs uppercase font-bold text-red-400 mb-1">You Rejected This Plan. Awaiting Manager Revision.</p>
                                                <p className="text-sm text-red-200 whitespace-pre-wrap">Your Feedback: {ev.finance_client_feedback}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* APPROVED PLAN TRACKING */}
                                    {isPlanApproved && (
                                        <div className="mt-2 pt-4 border-t border-[#333]">
                                            <h5 className="text-sm font-bold text-[var(--gold-main)] mb-3 uppercase tracking-wider">Sponsorship Status</h5>
                                            <ul className="text-xs grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {acceptedSponsorships.map(sponsor => (
                                                    <li key={sponsor.id} className="bg-[#052e16] p-2 rounded border border-[#047857] flex justify-between items-center">
                                                        <span className="truncate pr-2 font-medium text-green-100 flex items-center gap-1.5"><span className="text-[10px]">✅</span> {sponsor.sponsor?.company_name || sponsor.sponsor?.full_name || 'Sponsor'}</span>
                                                        <span className="text-green-400 font-mono font-bold">${Number(sponsor.amount).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                                {pendingSponsorships.map(sponsor => (
                                                    <li key={sponsor.id} className="bg-[#1a1a1a] p-2 rounded border border-[#333] flex justify-between items-center">
                                                        <span className="truncate pr-2 font-medium text-gray-300 flex items-center gap-1.5"><span className="text-[10px]">✅</span> {sponsor.sponsor?.company_name || sponsor.sponsor?.full_name || 'Sponsor'} <span className="ml-2 text-[9px] uppercase text-yellow-500 font-bold border border-yellow-600/50 bg-yellow-900/20 px-1.5 py-0.5 rounded tracking-wider">Awaiting Sponsor</span></span>
                                                        <span className="text-[var(--gold-main)] font-mono opacity-80">${Number(sponsor.amount).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                                {rejectedSponsorships.map(sponsor => (
                                                    <li key={sponsor.id} className="bg-[#3b0712] p-2 rounded border border-[#7f1d1d] flex justify-between items-center">
                                                        <span className="truncate pr-2 font-medium text-red-200 flex items-center gap-1.5 opacity-70"><span className="text-[10px]">❌</span> <span className="line-through">{sponsor.sponsor?.company_name || sponsor.sponsor?.full_name || 'Sponsor'}</span> <span className="ml-2 text-[9px] uppercase text-red-400 font-bold border border-red-800 bg-red-950/50 px-1.5 py-0.5 rounded tracking-wider">Declined</span></span>
                                                        <span className="text-red-400 font-mono line-through opacity-70">${Number(sponsor.amount).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {totalSponsorship > 0 && (
                                                <div className="mt-4 text-right">
                                                    <span className="text-green-400 font-mono font-bold bg-green-900/20 px-3 py-1.5 rounded border border-green-800 uppercase text-xs tracking-wider">Total Secured: ${totalSponsorship.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-[var(--text-secondary)] italic">No events booked yet.</div>
                )}
            </div>

            {/* --- EDIT MODAL --- */}
            {editingEvent && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-xl border border-[var(--gold-main)] w-full max-w-2xl">
                        <h3 className="text-xl font-bold mb-4 text-[var(--gold-main)]">Edit Event Details</h3>
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="w-full">
                                <label className="text-xs text-[var(--text-secondary)] uppercase block mb-1">Event Title</label>
                                <input required value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:border-[var(--gold-main)] outline-none" />
                            </div>
                            <div className="w-full">
                                <label className="text-xs text-[var(--text-secondary)] uppercase block mb-1">Event Date</label>
                                <input type="date" required value={editingEvent.event_date ? new Date(editingEvent.event_date).toISOString().split('T')[0] : ''} onChange={e => setEditingEvent({...editingEvent, event_date: e.target.value})} className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:border-[var(--gold-main)] outline-none" />
                            </div>
                            <div className="w-full md:col-span-2">
                                <label className="text-xs text-[var(--text-secondary)] uppercase block mb-1">Venue</label>
                                <select value={editingEvent.venue_id || ''} onChange={e => setEditingEvent({...editingEvent, venue_id: e.target.value})} required className="w-full bg-[#111] border border-[#444] p-2 rounded text-white focus:border-[var(--gold-main)] outline-none">
                                    <option value="">-- Select Venue --</option>
                                    {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Cap: {v.capacity})</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-[var(--text-secondary)] uppercase block mb-1">Notes / Instructions</label>
                                <textarea className="w-full h-24 bg-[#111] border border-[#444] p-2 rounded text-white focus:border-[var(--gold-main)] outline-none resize-none" value={editingEvent.client_notes || ''} onChange={e => setEditingEvent({...editingEvent, client_notes: e.target.value})} />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-[#333]">
                                <button type="button" onClick={() => setEditingEvent(null)} className="px-5 py-2 bg-transparent border border-[#555] text-white hover:bg-[#333] rounded font-medium transition">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[var(--gold-main)] hover:bg-[#a68a3c] text-black rounded font-bold transition">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- AI QUIZ MODAL --- */}
            {isQuizModalOpen && activeQuizConfig && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
                    <div className="bg-[#111] border border-[var(--gold-main)] p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-2xl font-bold text-[var(--gold-main)] mb-4">{activeQuizConfig.buttonText}</h2>
                        
                        <form onSubmit={handleQuizSubmit} className="space-y-4">
                            {activeQuizConfig.questions.map((q, index) => (
                                <div key={q.id} className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-300">{index + 1}. {q.label}</label>
                                    
                                    {q.type === 'text' ? (
                                        <input 
                                            required
                                            type="text" 
                                            className="bg-[#222] border border-[#444] rounded p-2 text-white focus:border-[var(--gold-main)] outline-none"
                                            onChange={(e) => setQuizAnswers(prev => ({...prev, [q.label]: e.target.value}))}
                                        />
                                    ) : (
                                        <select 
                                            required
                                            className="bg-[#222] border border-[#444] rounded p-2 text-white focus:border-[var(--gold-main)] outline-none"
                                            onChange={(e) => setQuizAnswers(prev => ({...prev, [q.label]: e.target.value}))}
                                        >
                                            <option value="">-- Select an option --</option>
                                            {q.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                            
                            <div className="flex flex-col gap-1 mt-4 p-4 border border-[#444] rounded bg-[#1a1a1a]">
                                <label className="text-sm text-[var(--gold-main)] font-bold">📸 Upload Inspiration Image (Optional)</label>
                                <p className="text-xs text-gray-400 mb-2">Have a Pinterest board vibe in mind? Show us!</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setQuizImage(e.target.files[0])}
                                    className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[var(--gold-main)] file:text-black hover:file:bg-yellow-600 transition cursor-pointer"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#333]">
                                <button type="button" onClick={() => setIsQuizModalOpen(false)} className="text-gray-400 hover:text-white px-4">Cancel</button>
                                <button type="submit" disabled={isGenerating} className="bg-[var(--gold-main)] text-black font-bold px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2">
                                    {isGenerating ? "Analyzing Vibe..." : "Find My Theme"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;