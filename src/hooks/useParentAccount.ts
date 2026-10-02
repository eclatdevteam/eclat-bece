import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

interface ParentAccountData {
  parentId: string | null;
  parentCode: string | null;
  error: string | null;
}

/**
 * Resolves the signed-in parent's row id and connection code. If the parent
 * record is missing (e.g. signup flow skipped provisioning) the provision-user
 * Edge Function is invoked as a self-healing fallback, then lookup is retried.
 */
export function useParentAccount() {
  const { user } = useAuth();

  const query = useQuery<ParentAccountData>({
    queryKey: queryKeys.parentAccount(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // parent records are effectively immutable
    retry: false,
    queryFn: async (): Promise<ParentAccountData> => {
      const [parentRes, profileRes] = await Promise.all([
        supabase
          .from("parents")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("unique_id")
          .eq("id", user!.id)
          .maybeSingle(),
      ]);

      let parentData = parentRes.data;
      let parentCode = profileRes.data?.unique_id ?? null;

      if (parentRes.error && parentRes.error.code !== "PGRST116") {
        console.warn("Parent lookup error, attempting recovery:", parentRes.error);
      }

      // If parent record is missing, invoke provision-user fallback
      if (!parentData) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.functions.invoke("provision-user", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          const [retryParentRes, retryProfileRes] = await Promise.all([
            supabase
              .from("parents")
              .select("id")
              .eq("user_id", user!.id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("unique_id")
              .eq("id", user!.id)
              .maybeSingle(),
          ]);

          parentData = retryParentRes.data;
          parentCode = retryProfileRes.data?.unique_id ?? parentCode;
        }
      }

      if (!parentData?.id) {
        return { parentId: null, parentCode, error: "Could not locate or provision parent record." };
      }

      return { parentId: parentData.id, parentCode, error: null };
    },
  });

  return {
    parentId: query.data?.parentId ?? null,
    parentCode: query.data?.parentCode ?? null,
    loading: query.isLoading,
    error: query.data?.error ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
