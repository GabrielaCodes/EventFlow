import supabase from '../config/supabaseClient.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // 1. THE QUOTE FIX: If localStorage saved the token with double quotes, this strips them out!
  const token = authHeader.split(' ')[1].replace(/"/g, '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // 2. THE EXPOSURE FIX: Print the exact Supabase error to your backend terminal
    if (error) {
      console.error("❌ SUPABASE REJECTED TOKEN. Reason:", error.message);
      return res.status(401).json({ error: 'Invalid token', details: error.message });
    }

    if (!user) {
      console.error("❌ TOKEN VALID, BUT NO USER FOUND.");
      return res.status(401).json({ error: 'User not found for this token' });
    }

    // Fetch user profile to get the role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(403).json({ error: 'User profile not found in database' });
    }

    req.user = profile; // Attach full profile
    next();
  } catch (err) {
    console.error("🔥 Auth Middleware Crash:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};