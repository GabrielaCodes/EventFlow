import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoordinatorStats } from '../../services/coordinatorService';

// Child Components
import UserApprovals from '../../components/coordinator/UserApprovals';
import MasterDataCategories from '../../components/coordinator/MasterDataCategories';
import MasterDataVenues from '../../components/coordinator/MasterDataVenues';
// ✅ 1. Import New Component
import MasterRequestApprovals from '../../components/coordinator/MasterRequestApprovals';

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
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="bg-blue-600 text-white p-6 rounded shadow">
                            <h3 className="text-lg font-bold">Total Events</h3>
                            <p className="text-4xl font-bold">{stats?.totalEvents || 0}</p>
                        </div>
                        <div className="bg-orange-500 text-white p-6 rounded shadow">
                            <h3 className="text-lg font-bold">Pending Approvals</h3>
                            <p className="text-4xl font-bold">{stats?.pendingUsers || 0}</p>
                        </div>
                        <div className="bg-green-600 text-white p-6 rounded shadow">
                            <h3 className="text-lg font-bold">Active Venues</h3>
                            <p className="text-4xl font-bold">{stats?.activeVenues || 0}</p>
                        </div>
                    </div>
                );
            case 'approvals':
                return <UserApprovals />;
            case 'categories':
                return <MasterDataCategories />; 
            case 'venues':
                return <MasterDataVenues />;
            // ✅ 2. Add New Case
            case 'resource_requests':
                return <MasterRequestApprovals />;
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
                    {['overview', 'approvals', 'categories', 'venues', 'resource_requests'].map((tab) => (
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