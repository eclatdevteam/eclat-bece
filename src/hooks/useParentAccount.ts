import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useParentAccount() {
  const { user } = useAuth();
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrProvisionParent = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setParentId(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      let { data: parentData, error: parentError } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (parentError && parentError.code !== "PGRST116") {
        console.warn("Parent lookup error, attempting recovery:", parentError);
      }

      // If parent record is missing, invoke provision-user fallback
      if (!parentData) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("provision-user", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          const { data: retryParent } = await supabase
            .from("parents")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          parentData = retryParent;
        }
      }

      if (parentData?.id) {
        setParentId(parentData.id);
        return parentData.id;
      } else {
        setError("Could not locate or provision parent record.");
        return null;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load parent account";
      console.error("useParentAccount error:", err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrProvisionParent();
  }, [fetchOrProvisionParent]);

  return { parentId, loading, error, refetch: fetchOrProvisionParent };
}
