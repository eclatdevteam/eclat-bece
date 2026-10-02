import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Assignment, ChildAnalytics, LinkedChild, QuizResult } from "@/types/parent";

export interface ChildrenDataset {
  children: LinkedChild[];
  childrenAnalytics: Map<string, ChildAnalytics>;
  childrenAssignments: Map<string, Assignment[]>;
  /** Three most recent quizzes across all children, with student names attached. */
  globalActivities: Array<QuizResult & { student_name: string }>;
  /** Only populated when `withGamification` is enabled. */
  gameProfiles: Array<Record<string, unknown>>;
  /** Only populated when `withGamification` is enabled. */
  masteries: Array<Record<string, unknown>>;
}

interface UseChildrenDataOptions {
  /** Also fetch gamification profiles and topic mastery rows for the children. */
  withGamification?: boolean;
}

/**
 * Shared parent-portal dataset: linked children enriched with quiz analytics
 * and assignments. Used by MyChildren and ParentDashboard (which previously
 * kept copy-pasted variants of this aggregation).
 */
export function useChildrenData(parentId: string | null | undefined, options: UseChildrenDataOptions = {}) {
  const { withGamification = false } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["parent-children", parentId ?? "none", withGamification ? "enriched" : "basic"],
    enabled: !!parentId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<ChildrenDataset> => {
      const pId = parentId as string;

      const { data, error } = await supabase
        .from("students")
        .select(`
            id,
            user_id,
            class_year,
            is_premium,
            profile:profiles(full_name, unique_id, username)
        `)
        .eq("parent_id", pId);

      if (error) throw error;
      const typedChildren = (data ?? []) as unknown as LinkedChild[];
      if (typedChildren.length === 0) {
        return { children: [], childrenAnalytics: new Map(), childrenAssignments: new Map(), globalActivities: [], gameProfiles: [], masteries: [] };
      }

      const studentIds = typedChildren.map((c) => c.id);
      const userIds = typedChildren.map((c) => c.user_id);

      const [quizzesRes, assignmentsRes, profilesRes, gameRes, masteryRes] = await Promise.all([
        supabase
          .from("quiz_results")
          .select("*")
          .in("student_id", studentIds)
          .order("completed_at", { ascending: false }),
        supabase
          .from("practice_assignments")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false }),
        userIds.length > 0
          ? supabase.from("profiles").select("id, full_name, username, unique_id").in("id", userIds)
          : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; username: string | null; unique_id: string }> }),
        withGamification
          ? supabase.from("student_gamification_profile").select("*").in("student_id", studentIds)
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
        withGamification
          ? supabase.from("student_topic_mastery").select("student_id, subject, topic, rolling_accuracy, status").in("student_id", studentIds)
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      ]);

      const allQuizzes = (quizzesRes.data ?? []) as unknown as QuizResult[];
      const allAssignments = (assignmentsRes.data ?? []) as unknown as Assignment[];
      const nameMap = new Map(typedChildren.map((c) => [c.id, c.profile?.full_name || "Unknown"]));
      const globalActivities = allQuizzes
        .map((q) => ({ ...q, student_name: nameMap.get(q.student_id) || "Student" }))
        .slice(0, 3);

      const assignMap = new Map<string, Assignment[]>();
      const analyticsMap = new Map<string, ChildAnalytics>();

      studentIds.forEach((sId) => {
        const childAssignments = allAssignments.filter((a) => a.student_id === sId);
        assignMap.set(sId, childAssignments);

        const childQuizzes = allQuizzes.filter((q) => q.student_id === sId);
        const pending = childAssignments.filter((a) => a.status === "pending").length;
        const completed = childAssignments.filter((a) => a.status === "completed").length;

        const subjectMap = new Map<string, { totalScore: number; count: number }>();
        childQuizzes.forEach((result) => {
          const existing = subjectMap.get(result.subject) || { totalScore: 0, count: 0 };
          subjectMap.set(result.subject, {
            totalScore: existing.totalScore + result.score,
            count: existing.count + 1,
          });
        });
        const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, subData]) => ({
          subject: subject.charAt(0).toUpperCase() + subject.slice(1),
          avgScore: Math.round(subData.totalScore / subData.count),
          count: subData.count,
        }));

        analyticsMap.set(sId, {
          studentId: sId,
          averageScore: childQuizzes.length > 0
            ? Math.round(childQuizzes.reduce((acc, result) => acc + result.score, 0) / childQuizzes.length)
            : 0,
          totalQuizzes: childQuizzes.length,
          subjectPerformance,
          recentQuizzes: childQuizzes.slice(0, 5),
          pendingAssignments: pending,
          completedAssignments: completed,
        });
      });

      return {
        children: typedChildren,
        childrenAnalytics: analyticsMap,
        childrenAssignments: assignMap,
        globalActivities,
        gameProfiles: (gameRes.data ?? []) as Array<Record<string, unknown>>,
        masteries: (masteryRes.data ?? []) as Array<Record<string, unknown>>,
      };
    },
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["parent-children", parentId ?? "none"] }),
    [queryClient, parentId]
  );

  return {
    children: query.data?.children ?? [],
    childrenAnalytics: query.data?.childrenAnalytics ?? new Map<string, ChildAnalytics>(),
    childrenAssignments: query.data?.childrenAssignments ?? new Map<string, Assignment[]>(),
    globalActivities: query.data?.globalActivities ?? [],
    gameProfiles: query.data?.gameProfiles ?? [],
    masteries: query.data?.masteries ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    refresh,
  };
}
