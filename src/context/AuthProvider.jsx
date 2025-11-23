import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ABOVE useEffect
  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ useEffect can now safely use loadProfile
  useEffect(() => {
    let mounted = true;
    
    // Safety timeout - if loading takes more than 5 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - stopping loading state');
        setLoading(false);
      }
    }, 5000);
    
    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);

        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        console.error('Error in getSession:', error);
        setLoading(false);
      });

    // Listen for auth changes
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;
          
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email, password, role, extraData = {}) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { user: null, error };

    if (data?.user) {
      // Insert profile
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        role,
        ...extraData,
      });

      // Create wallet
      await supabase.from("wallets").insert({
        user_id: data.user.id,
        balance: 0,
      });

      await loadProfile(data.user.id);
    }

    return { user: data.user, error: null };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      await loadProfile(data.user.id);
    }

    return { user: data.user, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setProfile(null);
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signUp, signIn, signOut, loadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
