import supabase from '../config/supabaseClient.js';

export const getSystemAnalytics = async (req, res) => {
    try {
        // Run queries in parallel for performance
        const [overview, categories, trends, status] = await Promise.all([
            supabase.from('analytics_overview').select('*').single(),
            supabase.from('analytics_category_performance').select('*'),
            supabase.from('analytics_monthly_trends').select('*'),
            supabase.from('analytics_status_distribution').select('*')
        ]);

        if (overview.error) throw overview.error;
        if (categories.error) throw categories.error;
        if (trends.error) throw trends.error;
        if (status.error) throw status.error;

        res.json({
            overview: overview.data,
            categories: categories.data,
            trends: trends.data,
            statusDistribution: status.data
        });

    } catch (err) {
        console.error("Analytics Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};