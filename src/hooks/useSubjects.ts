import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SubjectWithCounts,
  CreateSubjectInput,
  UpdateSubjectInput,
} from "@/types/subject";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";

interface UseSubjectsOptions {
  classYear?: "year_6" | "year_9" | "all";
  onlyActive?: boolean;
  withCounts?: boolean;
}

async function fetchSubjects(
  classYear: "year_6" | "year_9" | "all",
  onlyActive: boolean,
  withCounts: boolean
): Promise<SubjectWithCounts[]> {
  if (withCounts) {
    // RPC returns subjects with per-cohort question counts
    const { data, error: rpcError } = await supabase.rpc(
      "get_admin_subjects_with_counts"
    );
    if (rpcError) throw rpcError;

    let filtered: SubjectWithCounts[] = (data as unknown as SubjectWithCounts[]) || [];
    if (onlyActive) {
      filtered = filtered.filter((s) => s.is_active);
    }
    if (classYear === "year_6") {
      filtered = filtered.filter((s) => s.available_year_6);
    } else if (classYear === "year_9") {
      filtered = filtered.filter((s) => s.available_year_9);
    }
    return filtered;
  }

  // Direct query to public.subjects
  let query = supabase
    .from("subjects")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (onlyActive) {
    query = query.eq("is_active", true);
  }
  if (classYear === "year_6") {
    query = query.eq("available_year_6", true);
  } else if (classYear === "year_9") {
    query = query.eq("available_year_9", true);
  }

  const { data, error: fetchErr } = await query;
  if (fetchErr) throw fetchErr;

  return (data || []).map((s) => ({
    ...s,
    category: s.category as SubjectWithCounts["category"],
    year_6_count: 0,
    year_9_count: 0,
    total_count: 0,
  }));
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const { classYear = "all", onlyActive = true, withCounts = false } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.subjects(classYear, onlyActive, withCounts),
    queryFn: () => fetchSubjects(classYear, onlyActive, withCounts),
  });

  const subjects = query.data ?? [];

  const createSubject = useMutation({
    mutationFn: async (input: CreateSubjectInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const insertPayload = {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        icon: input.icon || "📚",
        category: input.category || "core",
        description: input.description?.trim() || null,
        available_year_6: !!input.available_year_6,
        available_year_9: !!input.available_year_9,
        is_active: input.is_active !== undefined ? input.is_active : true,
        display_order: input.display_order ?? (subjects.length + 1),
        created_by: userData.user?.id || null,
      };

      const { data, error: insertError } = await supabase
        .from("subjects")
        .insert(insertPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (data, input) => {
      toast.success(`Subject "${input.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      return { success: true, data };
    },
    onError: (err: Error) => {
      console.error("Error creating subject:", err);
      toast.error(err.message || "Failed to create subject");
      return { success: false, error: err.message };
    },
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateSubjectInput }) => {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.name !== undefined) updatePayload.name = input.name.trim();
      if (input.code !== undefined) updatePayload.code = input.code.trim().toUpperCase();
      if (input.icon !== undefined) updatePayload.icon = input.icon;
      if (input.category !== undefined) updatePayload.category = input.category;
      if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
      if (input.available_year_6 !== undefined) updatePayload.available_year_6 = input.available_year_6;
      if (input.available_year_9 !== undefined) updatePayload.available_year_9 = input.available_year_9;
      if (input.is_active !== undefined) updatePayload.is_active = input.is_active;
      if (input.display_order !== undefined) updatePayload.display_order = input.display_order;

      const { data, error: updateError } = await supabase
        .from("subjects")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (updateError) throw updateError;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Subject updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      return { success: true, data };
    },
    onError: (err: Error) => {
      console.error("Error updating subject:", err);
      toast.error(err.message || "Failed to update subject");
      return { success: false, error: err.message };
    },
  });

  const renameSubjectCascade = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const { data, error: renameError } = await supabase.rpc("rename_subject_cascade", {
        p_subject_id: id,
        p_new_name: newName.trim(),
      });
      if (renameError) throw renameError;
      return { data, newName };
    },
    onSuccess: ({ newName }) => {
      toast.success(`Subject renamed to "${newName}" and all questions updated!`);
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      return { success: true };
    },
    onError: (err: Error) => {
      console.error("Error renaming subject:", err);
      toast.error(err.message || "Failed to rename subject");
      return { success: false, error: err.message };
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async ({ id, forceArchiveIfPopulated }: { id: string; forceArchiveIfPopulated: boolean }) => {
      const { data, error: deleteError } = await supabase.rpc("delete_subject_safe", {
        p_subject_id: id,
        p_force_archive_if_populated: forceArchiveIfPopulated,
      });
      if (deleteError) throw deleteError;
      return data as unknown as { action?: string; message?: string } | null;
    },
    onSuccess: (result) => {
      if (result?.action === "archived") {
        toast.info(result.message || "Subject deactivated because it contains questions.");
      } else {
        toast.success(result?.message || "Subject permanently deleted!");
      }
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      return { success: true, result };
    },
    onError: (err: Error) => {
      console.error("Error deleting subject:", err);
      toast.error(err.message || "Failed to delete subject");
      return { success: false, error: err.message };
    },
  });

  return {
    subjects,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: async () => {
      await query.refetch();
    },
    createSubject: async (input: CreateSubjectInput) => {
      try {
        const data = await createSubject.mutateAsync(input);
        return { success: true as const, data };
      } catch {
        return { success: false as const, error: (createSubject.error as Error | null)?.message ?? "Failed to create subject" };
      }
    },
    updateSubject: async (id: string, input: UpdateSubjectInput) => {
      try {
        const data = await updateSubject.mutateAsync({ id, input });
        return { success: true as const, data };
      } catch {
        return { success: false as const, error: (updateSubject.error as Error | null)?.message ?? "Failed to update subject" };
      }
    },
    renameSubjectCascade: async (id: string, newName: string) => {
      try {
        await renameSubjectCascade.mutateAsync({ id, newName });
        return { success: true as const };
      } catch {
        return { success: false as const, error: (renameSubjectCascade.error as Error | null)?.message ?? "Failed to rename subject" };
      }
    },
    deleteSubject: async (id: string, forceArchiveIfPopulated = false) => {
      try {
        const result = await deleteSubject.mutateAsync({ id, forceArchiveIfPopulated });
        return { success: true as const, result };
      } catch {
        return { success: false as const, error: (deleteSubject.error as Error | null)?.message ?? "Failed to delete subject" };
      }
    },
  };
}
