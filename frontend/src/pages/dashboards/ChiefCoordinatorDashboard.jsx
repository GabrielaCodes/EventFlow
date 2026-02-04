import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoordinatorStats } from '../../services/coordinatorService';

// Child Components
import UserApprovals from '../../components/coordinator/UserApprovals';
import MasterDataCategories from '../../components/coordinator/MasterDataCategories';
import MasterDataVenues from '../../components/coordinator/MasterDataVenues';
// Manager request to Chief Coordinator
import MasterRequestApprovals from '../../components/coordinator/MasterRequestApprovals';
// Analytics
import AnalyticsDashboard from '../../components/coordinator/analytics/AnalyticsDashboard';
//Overview
import CoordinatorLanding from '../../components/coordinator/CoordinatorLanding';

const ChiefCoordinatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
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
            case 'overview':
                return <CoordinatorLanding setActiveTab={setActiveTab} />;
            case 'approvals':
                return <UserApprovals />;
            case 'categories':
                return <MasterDataCategories />; 
            case 'venues':
                return <MasterDataVenues />;
            // ✅ 2. Add New Case
            case 'resource_requests':
                return <MasterRequestApprovals />;
            case 'analytics':
                return <AnalyticsDashboard />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-300 mb-6 overflow-x-auto">
                    {/* ✅ 3. Update Tab List */}
                    {['overview' ,'analytics', 'approvals', 'categories', 'venues', 'resource_requests'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-4 whitespace-nowrap ${
                                activeTab === tab 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
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