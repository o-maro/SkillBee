import { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD PROFILE (SOURCE OF TRUTH)
  =============================== */
  const loadProfile = useCallback(async (userId) => {
    try {
      setLoading(true);

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
        return null;
      }

      setProfile(userData);
      return userData;
    } catch (err) {
      console.error("Unexpected profile error:", err);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===============================
     INITIAL SESSION CHECK
  =============================== */
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /* ===============================
     SIGN UP
  =============================== */
  const signUp = async (email, password, role, extraData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: extraData.full_name || null,
          },
        },
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { user: null, error };
    }
  };

  /* ===============================
     SIGN IN
  =============================== */
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Signin error:", error);
      return { user: null, error };
    }
  };

  /* ===============================
     SIGN OUT
  =============================== */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);

      return { error: null };
    } catch (error) {
      console.error("Signout error:", error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
