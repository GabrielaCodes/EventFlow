import { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import api from '../../../services/api';

import AnalyticsLoader from './AnalyticsLoader';

// Reverted to a classic, vibrant data visualization palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666'];

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
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

    if (loading) {
    return (
        <div className="flex justify-center items-center w-full min-h-[400px]">
            <AnalyticsLoader />
        </div>
    );
}
    if (!data) return <div className="p-10 text-center" style={{ color: 'var(--text-primary)' }}>No data available</div>;

    const { overview, categories, trends, statusDistribution } = data;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            
            {/* 1. KPI CARDS (Kept Dark/Gold) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Events" value={overview.total_events} />
                <KPICard title="Pending Approvals" value={overview.pending_approvals} />
                <KPICard title="Active Venues" value={overview.active_venues} />
                <KPICard title="Total Sponsorship" value={`$${(overview.total_sponsorship_amount || 0).toLocaleString()}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 2. TRENDS CHART (Line) */}
                <div className="p-6 rounded shadow border border-[#2a2a2a]" style={{ backgroundColor: 'var(--surface-color)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Event Creation Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="month_year" tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: '#333', color: 'var(--text-primary)' }} 
                                />
                                {/* Bright Blue Line for contrast */}
                                <Line type="monotone" dataKey="events_created" stroke="#0088FE" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. CATEGORY PERFORMANCE (Bar) */}
                <div className="p-6 rounded shadow border border-[#2a2a2a]" style={{ backgroundColor: 'var(--surface-color)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Events by Category</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis dataKey="category_name" type="category" width={100} fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: '#333', color: 'var(--text-primary)' }} 
                                    cursor={{ fill: '#2a2a2a' }}
                                />
                                <Bar dataKey="event_count" barSize={20} radius={[0, 4, 4, 0]}>
                                    {/* Maps over the data to give each bar a unique vibrant color */}
                                    {(categories || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             {/* 4. STATUS DISTRIBUTION (Pie) */}
             <div className="p-6 rounded shadow border border-[#2a2a2a] max-w-lg mx-auto w-full" style={{ backgroundColor: 'var(--surface-color)' }}>
                <h3 className="text-lg font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>Event Status Distribution</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                label={{ fill: 'var(--text-primary)' }}
                            >
                                {/* Automatically uses the vibrant COLORS array */}
                                {(statusDistribution || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: '#333', color: 'var(--text-primary)' }} 
                            />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Sleek Dark/Gold KPI Card remains unchanged to keep the theme anchor
const KPICard = ({ title, value }) => {
    return (
        <div 
            className="p-6 rounded shadow-sm border-l-4" 
            style={{ 
                backgroundColor: 'var(--surface-color)', 
                borderColor: 'var(--gold-main)' 
            }}
        >
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {title}
            </h4>
            <p className="text-3xl font-bold mt-2" style={{ color: 'var(--gold-main)' }}>
                {value}
            </p>
        </div>
    );
};

export default AnalyticsDashboard;