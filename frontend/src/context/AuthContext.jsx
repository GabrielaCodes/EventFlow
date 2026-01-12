import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext();

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
                // This MUST run, or the screen stays on "Loading..."
                console.log("4. Loading set to false.");
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

    const fetchRole = async (userId) => {
        try {
            console.log("3. Fetching Role for:", userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (error) {
                console.error("Error fetching role (RLS?):", error.message);
            }

            if (data) {
                console.log("Role found:", data.role);
                setRole(data.role);
            } else {
                console.warn("User has no profile row!");
            }
        } catch (err) {
            console.error("FetchRole crash:", err);
        }
    };

    const login = async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const logout = async () => {
        return supabase.auth.signOut();
    };

    const value = { user, role, login, logout, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);