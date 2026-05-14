import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  // Role is stored in user metadata: { role: "admin" | "supplier", supplier_id? }
  const role       = session?.user?.user_metadata?.role || null;
  const supplierId = session?.user?.user_metadata?.supplier_id || null;
  const isAdmin    = role === "admin";
  const isSupplier = role === "supplier";

  return { session, loading, signOut, role, supplierId, isAdmin, isSupplier };
}
