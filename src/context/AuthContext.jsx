
import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "Unable to load your profile."
    );
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the profile belonging to the currently authenticated user.
  const loadUserProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    const userProfile = await fetchProfile(currentUser.id);
    setProfile(userProfile);
    return userProfile;
  }, []);

  // Restore the session and respond to authentication changes.
  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!active) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            const currentProfile = await fetchProfile(
              currentUser.id
            );

            if (active) setProfile(currentProfile);
          } catch (error) {
            console.error(
              "Profile loading failed:",
              error.message
            );

            if (active) setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Authentication initialization failed:",
          error.message
        );

        if (active) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setLoading(true);

        // Defer the profile request until the auth callback completes.
        Promise.resolve().then(async () => {
          try {
            const currentProfile = await fetchProfile(
              currentUser.id
            );

            if (active) {
              setProfile(currentProfile);
            }
          } catch (error) {
            console.error(
              "Profile loading failed:",
              error.message
            );

            if (active) setProfile(null);
          } finally {
            if (active) setLoading(false);
          }
        });
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in an existing account.
  const signIn = async (email, password) => {
    setLoading(true);
    setProfile(null);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) throw error;

      setUser(data.user);

      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);

      return {
        user: data.user,
        profile: userProfile,
        session: data.session,
      };
    } catch (error) {
      setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register a customer. Registration never assigns an admin role.
  const signUp = async (email, password, metadata = {}) => {
    const fullName = String(
      metadata.full_name ?? ""
    ).trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Only establish local state when Supabase returns a session.
    if (data.user && data.session) {
      setUser(data.user);
      setLoading(true);

      try {
        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
      } catch (error) {
        console.error(
          "New profile loading failed:",
          error.message
        );

        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    return data;
  };

  // Sign out the current account.
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  // Refresh the current user's profile and role.
  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    try {
      return await loadUserProfile(user);
    } catch (error) {
      setProfile(null);
      throw error;
    }
  }, [user, loadUserProfile]);

  const value = {
    user,
    profile,
    loading,

    isAuthenticated: Boolean(user),
    isAdmin: profile?.role === "admin",

    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
