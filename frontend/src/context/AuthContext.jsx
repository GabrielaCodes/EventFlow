import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  const lastCheckedUserId = useRef(null);

  const ensureProfileExists = async (sessionUser) => {
    if (lastCheckedUserId.current === sessionUser.id && role !== null) {
        return { role, ...profile }; 
    }
    
    lastCheckedUserId.current = sessionUser.id;

    try {
      let attempts = 0;
      let existingProfile = null;

      while (attempts < 5 && !existingProfile) {
          // ✅ MODIFIED: Fetch profile AND the category name
          const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                event_categories ( name )
            `)
            .eq('id', sessionUser.id)
            .maybeSingle();

          if (!error && data) {
              existingProfile = data;
          } else {
              console.log(`⏳ Profile not ready yet. Retrying (${attempts + 1}/5)...`);
              await new Promise(r => setTimeout(r, 500));
              attempts++;
          }
      }

      if (existingProfile) return existingProfile;
      console.error("❌ Profile missing.");
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
            const userProfile = await ensureProfileExists(session.user);
            
            if (mounted) {
                setRole(userProfile?.role || null);
                setProfile(userProfile); 
            }
        } else {
            if (mounted) {
                setUser(null);
                setRole(null);
                setProfile(null);
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
    setProfile(null);
    lastCheckedUserId.current = null;
    localStorage.clear();
    try {
        await supabase.auth.signOut();
    } catch (err) {
        console.warn("Logout warning:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);