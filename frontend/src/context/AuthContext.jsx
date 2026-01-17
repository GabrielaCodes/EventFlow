import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const lastCheckedUserId = useRef(null);

  // ✅ FIXED: This function ONLY READS. It never INSERTS.
  // ✅ COPY THIS EXACT FUNCTION
  const ensureProfileExists = async (sessionUser) => {
    // Optimization: Don't fetch if we already have it
    if (lastCheckedUserId.current === sessionUser.id && role !== null) {
        return { role }; 
    }
    
    lastCheckedUserId.current = sessionUser.id;

    try {
      let attempts = 0;
      let existingProfile = null;

      // 🔄 RETRY LOOP: Wait for the Database Trigger to finish creating the profile
      while (attempts < 5 && !existingProfile) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle(); // 👈 IMPORTANT: Use 'maybeSingle', NOT 'single'

          if (!error && data) {
              existingProfile = data;
          } else {
              // Wait 500ms before checking again
              console.log(`⏳ Profile not ready yet. Retrying (${attempts + 1}/5)...`);
              await new Promise(r => setTimeout(r, 500));
              attempts++;
          }
      }

      if (existingProfile) {
        return existingProfile;
      }

      console.error("❌ Profile missing. The database trigger may have failed.");
      return null;

    } catch (err) {
      console.error("Profile Fetch Error:", err.message);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session) => {
        if (session?.user) {
            setUser(session.user);
            const profile = await ensureProfileExists(session.user);
            if (mounted) setRole(profile?.role || 'client');
        } else {
            if (mounted) {
                setUser(null);
                setRole(null);
                lastCheckedUserId.current = null; 
            }
        }
        if (mounted) setLoading(false);
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
    });

    // 2. Listen for Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    lastCheckedUserId.current = null;
    localStorage.clear();
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.warn("Logout warning:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);