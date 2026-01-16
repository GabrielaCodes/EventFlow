import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("1. Starting Session Check...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          console.log("2. User found:", session.user.email);
          setUser(session.user);
          await fetchRole(session.user.id);
        } else {
          console.log("2. No active session found.");
        }
      } catch (err) {
        console.error("CRITICAL ERROR in Auth:", err.message);
      } finally {
        console.log("4. Loading set to false.");
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  // Delay helper
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchRole = async (userId, retries = 3) => {
    try {
      console.log(`Fetching role... Attempts left: ${retries}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.role) {
        console.log("Role found:", data.role);
        setRole(data.role);
      } else if (retries > 0) {
        console.log("Profile missing. Retrying in 500ms...");
        await delay(500);
        return fetchRole(userId, retries - 1);
      } else {
        console.warn("User has no profile row! Defaulting to null");
        setRole(null);

      }
    } catch (err) {
      console.error("FetchRole Error:", err.message);
      setRole(null);
    }
  };

  // 🔑 REQUIRED by Login / Navbar
  const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error; // 🔥 force it to bubble
  }

  return data;
};


  const logout = async () => {
    console.log("1. User clicked logout - Starting process...");
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
