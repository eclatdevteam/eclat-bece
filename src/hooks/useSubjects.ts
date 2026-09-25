import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Subject,
  SubjectWithCounts,
  CreateSubjectInput,
  UpdateSubjectInput,
} from "@/types/subject";
import { toast } from "sonner";

interface UseSubjectsOptions {
  classYear?: "year_6" | "year_9" | "all";
  onlyActive?: boolean;
  withCounts?: boolean;
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const { classYear = "all", onlyActive = true, withCounts = false } = options;
  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (withCounts) {
        // Call RPC get_admin_subjects_with_counts
        const { data, error: rpcError } = await supabase.rpc(
          "get_admin_subjects_with_counts" as any
        );

        if (rpcError) throw rpcError;

        let filtered: SubjectWithCounts[] = (data as any) || [];

        if (onlyActive) {
          filtered = filtered.filter((s) => s.is_active);
        }

        if (classYear === "year_6") {
          filtered = filtered.filter((s) => s.available_year_6);
        } else if (classYear === "year_9") {
          filtered = filtered.filter((s) => s.available_year_9);
        }

        setSubjects(filtered);
      } else {
        // Direct query to public.subjects
        let query = (supabase.from("subjects" as any) as any)
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

        const mapped: SubjectWithCounts[] = (data || []).map((s: any) => ({
          ...s,
          year_6_count: 0,
          year_9_count: 0,
          total_count: 0,
        }));
        setSubjects(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching subjects:", err);
      setError(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [classYear, onlyActive, withCounts]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (input: CreateSubjectInput) => {
    try {
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

      const { data, error: insertError } = await (supabase
        .from("subjects" as any) as any)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Subject "${input.name}" created successfully!`);
      await fetchSubjects();
      return { success: true, data };
    } catch (err: any) {
      console.error("Error creating subject:", err);
      toast.error(err.message || "Failed to create subject");
      return { success: false, error: err.message };
    }
  };

  const updateSubject = async (id: string, input: UpdateSubjectInput) => {
    try {
      const updatePayload: Record<string, any> = {
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

      const { data, error: updateError } = await (supabase
        .from("subjects" as any) as any)
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success("Subject updated successfully!");
      await fetchSubjects();
      return { success: true, data };
    } catch (err: any) {
      console.error("Error updating subject:", err);
      toast.error(err.message || "Failed to update subject");
      return { success: false, error: err.message };
    }
  };

  const renameSubjectCascade = async (id: string, newName: string) => {
    try {
      const { data, error: renameError } = await supabase.rpc(
        "rename_subject_cascade" as any,
        {
          p_subject_id: id,
          p_new_name: newName.trim(),
        }
      );

      if (renameError) throw renameError;

      toast.success(`Subject renamed to "${newName}" and all questions updated!`);
      await fetchSubjects();
      return { success: true, data };
    } catch (err: any) {
      console.error("Error renaming subject:", err);
      toast.error(err.message || "Failed to rename subject");
      return { success: false, error: err.message };
    }
  };

  const deleteSubject = async (
    id: string,
    forceArchiveIfPopulated = false
  ) => {
    try {
      const { data, error: deleteError } = await supabase.rpc(
        "delete_subject_safe" as any,
        {
          p_subject_id: id,
          p_force_archive_if_populated: forceArchiveIfPopulated,
        }
      );

      if (deleteError) throw deleteError;

      const result = data as any;
      if (result?.action === "archived") {
        toast.info(result.message || "Subject deactivated because it contains questions.");
      } else {
        toast.success(result?.message || "Subject permanently deleted!");
      }

      await fetchSubjects();
      return { success: true, result };
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      toast.error(err.message || "Failed to delete subject");
      return { success: false, error: err.message };
    }
  };

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
    createSubject,
    updateSubject,
    renameSubjectCascade,
    deleteSubject,
  };
}
