import { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import api from '../../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Adjust this URL if your route is different
                const res = await api.get('/analytics/system-overview');
                setData(res.data);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Analytics...</div>;
    if (!data) return <div className="p-10 text-center">No data available</div>;

    const { overview, categories, trends, statusDistribution } = data;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            
            {/* 1. KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Events" value={overview.total_events} color="blue" />
                <KPICard title="Pending Approvals" value={overview.pending_approvals} color="orange" />
                <KPICard title="Active Venues" value={overview.active_venues} color="green" />
                <KPICard title="Total Sponsorship" value={`$${(overview.total_sponsorship_amount || 0).toLocaleString()}`} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 2. TRENDS CHART (Line) */}
                <div className="bg-white p-6 rounded shadow border">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Event Creation Trend</h3>
                    {/* ✅ FIX: Explicit Height Style */}
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month_year" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="events_created" stroke="#2563EB" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. CATEGORY PERFORMANCE (Bar) */}
                <div className="bg-white p-6 rounded shadow border">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Events by Category</h3>
                    {/* ✅ FIX: Explicit Height Style */}
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="category_name" type="category" width={100} fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="event_count" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             {/* 4. STATUS DISTRIBUTION (Pie) */}
             <div className="bg-white p-6 rounded shadow border max-w-lg mx-auto">
                <h3 className="text-lg font-bold mb-4 text-gray-700 text-center">Event Status Distribution</h3>
                {/* ✅ FIX: Explicit Height Style */}
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                label
                            >
                                {(statusDistribution || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Cards
const KPICard = ({ title, value, color }) => {
    const colorClasses = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        orange: "bg-orange-50 border-orange-200 text-orange-700",
        green: "bg-green-50 border-green-200 text-green-700",
        purple: "bg-purple-50 border-purple-200 text-purple-700",
    };

    return (
        <div className={`p-6 rounded border-l-4 shadow-sm ${colorClasses[color]}`}>
            <h4 className="text-sm font-bold uppercase opacity-80">{title}</h4>
            <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
    );
};

export default AnalyticsDashboard;