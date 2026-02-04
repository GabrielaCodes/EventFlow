import supabase from '../config/supabaseClient.js';

export const getLandingData = async (req, res) => {
    // 1. CONFIRM ROUTE HIT
    console.log("⚡️ [LandingController] Request Received from:", req.user?.email || 'Unknown User');

    try {
        console.log("⏳ [LandingController] Fetching parallel queries...");

        // Run parallel queries for speed
        const [pending, urgent, alerts] = await Promise.all([
            supabase.from('view_coordinator_pending_actions').select('*').limit(5),
            supabase.from('view_coordinator_urgent_events').select('*').limit(5),
            supabase.from('view_coordinator_recent_alerts').select('*').limit(5)
        ]);

        // 2. CHECK FOR ERRORS
        if (pending.error) {
            console.error("❌ [LandingController] Pending Actions Error:", pending.error.message);
            throw pending.error;
        }
        if (urgent.error) {
            console.error("❌ [LandingController] Urgent Events Error:", urgent.error.message);
            throw urgent.error;
        }
        if (alerts.error) {
            console.error("❌ [LandingController] Recent Alerts Error:", alerts.error.message);
            throw alerts.error;
        }

        // 3. LOG DATA COUNTS (Helps verify if Views are empty)
        console.log("✅ [LandingController] Data Fetched Successfully:");
        console.log(`   - Pending Actions: ${pending.data.length}`);
        console.log(`   - Urgent Events:   ${urgent.data.length}`);
        console.log(`   - Recent Alerts:   ${alerts.data.length}`);

        // Optional: Log the urgent events specifically to debug date logic
        if (urgent.data.length > 0) {
            console.log("   🔍 Urgent Event Details:", JSON.stringify(urgent.data, null, 2));
        }

        res.json({
            pending: pending.data,
            urgent: urgent.data,
            alerts: alerts.data
        });

    } catch (err) {
        console.error("🔥 [LandingController] CRITICAL FAILURE:", err.message);
        res.status(500).json({ error: err.message });
    }
};