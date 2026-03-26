import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoordinatorStats } from '../../services/coordinatorService';
import Loader from '../../components/common/Loader'; // <-- Imported Loader

// Child Components
import UserApprovals from '../../components/coordinator/UserApprovals';
import MasterDataCategories from '../../components/coordinator/MasterDataCategories';
import MasterDataVenues from '../../components/coordinator/MasterDataVenues';
import MasterRequestApprovals from '../../components/coordinator/MasterRequestApprovals';
import AnalyticsDashboard from '../../components/coordinator/analytics/AnalyticsDashboard';
import CoordinatorLanding from '../../components/coordinator/CoordinatorLanding';

//assigned manager
import ManagerWorkloads from '../../components/coordinator/ManagerWorkloads';

const ChiefCoordinatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true); // <-- 1. Added loading state
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch basic stats on load
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await getCoordinatorStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setLoading(false); // <-- 2. Turn off loader when fetch finishes (success or fail)
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    // Render Logic
    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <CoordinatorLanding setActiveTab={setActiveTab} />;
            case 'approvals': return <UserApprovals />;
            case 'workloads': return <ManagerWorkloads />;//assigned manager
            case 'categories': return <MasterDataCategories />; 
            case 'venues': return <MasterDataVenues />;
            case 'resource_requests': return <MasterRequestApprovals />;
            case 'analytics': return <AnalyticsDashboard />;
            default: return <div style={{ color: 'var(--text-primary)' }}>Select a tab</div>;
        }
    };

    // <-- 3. Show hamster while loading is true
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        // Removed bg-gray-100 to let the theme.css dark background take over
        <div className="min-h-screen flex flex-col">
            
            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                
                {/* Tabs Container - Changed border-gray-300 to a dark hex */}
                <div className="flex gap-4 border-b border-[#333] mb-6 overflow-x-auto">
                    {['overview' ,'analytics', 'workloads', 'approvals', 'categories', 'venues', 'resource_requests'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            // Swapped Tailwind colors for theme CSS variables
                            className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 whitespace-nowrap ${
                                activeTab === tab 
                                ? 'border-[var(--gold-main)] text-[var(--gold-main)]' 
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--gold-hover)]'
                            }`}
                            // Overriding the global theme.css button background so tabs look like tabs
                            style={{ backgroundColor: 'transparent', padding: '0.75rem 1rem' }}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Dynamic Content */}
                {renderContent()}
            </main>
        </div>
    );
};

export default ChiefCoordinatorDashboard;