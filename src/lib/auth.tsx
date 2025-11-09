import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase";

type AuthState = {
  loading: boolean;
  user: import("@supabase/supabase-js").User | null;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState>({ loading: true, user: null, isAdmin: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from("admin_accounts")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setIsAdmin(Boolean(data && !error));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo(() => ({ loading, user, isAdmin }), [loading, user, isAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) {
    // Redirect imperatively (no hooks here) using location
    window.location.replace("/login");
    return null;
  }
  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { loading, user, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) {
    window.location.replace("/admin/login");
    return null;
  }
  if (!isAdmin) {
    window.location.replace("/");
    return null;
  }
  return <>{children}</>;
};
