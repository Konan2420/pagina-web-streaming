import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Reads the signed-in user's persisted roles. UI checks never replace server authorization. */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsEditor(false);
          setIsSupplier(false);
          setLoading(false);
        }
        return;
      }

      try {
        if (userError) throw userError;
        const { data: rows, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (error) throw error;

        const roles = (rows ?? []).map((row) => row.role);
        const admin = roles.includes("admin");
        const editor = roles.includes("editor");
        const supplier = roles.includes("proveedor");

        if (!cancelled) {
          setIsAdmin(admin);
          setIsEditor(editor);
          setIsSupplier(supplier);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in useIsAdmin check:", err);
        if (!cancelled) setLoading(false);
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setLoading(true);
        check();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isEditor, isSupplier, isAuthorized: isAdmin || isSupplier, loading };
}
