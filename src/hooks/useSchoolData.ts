import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SchoolData } from "@/components/school/SchoolSettingsDialog";

export interface SchoolStudent {
  id: string;
  user_id: string;
  class_id?: string | null;
  class_year: "year_6" | "year_9" | null;
  is_premium: boolean | null;
  created_at: string;
  name: string;
  username: string;
  unique_id: string;
  avgScore: number;
  quizCount: number;
  rank: number;
  status: "Active" | "Inactive";
}

export function useSchoolData() {
  const [isLoading, setIsLoading] = useState(true);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch School record
      const { data: existingSchool, error: schoolErr } = await supabase
        .from("schools")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (schoolErr) throw schoolErr;

      let currentSchool = existingSchool;
      if (!currentSchool) {
        const { data: newSchool, error: createErr } = await supabase
          .from("schools")
          .insert({
            user_id: user.id,
            school_name: user.user_metadata?.full_name || user.user_metadata?.school_name || "My School",
          })
          .select("*")
          .single();

        if (createErr) throw createErr;
        currentSchool = newSchool;
      }

      setSchool(currentSchool as SchoolData);

      // 2. Fetch Linked Students
      const { data: rawStudents, error: studentsErr } = await supabase
        .from("students")
        .select("id, user_id, class_year, class_id, is_premium, created_at")
        .eq("school_id", currentSchool.id);

      if (studentsErr) throw studentsErr;

      const studentList = rawStudents || [];
      const userIds = studentList.map((s) => s.user_id);
      const studentIds = studentList.map((s) => s.id);

      // 3. Fetch Profiles for Students
      const profileMap = new Map<string, { full_name: string | null; username: string | null; unique_id: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, unique_id")
          .in("id", userIds);

        if (profiles) {
          profiles.forEach((p) => profileMap.set(p.id, p));
        }
      }

      // 4. Fetch Quiz Results
      const scoreMap: Record<string, { total: number; count: number }> = {};
      if (studentIds.length > 0) {
        const { data: results } = await supabase
          .from("quiz_results")
          .select("student_id, score")
          .in("student_id", studentIds);

        if (results) {
          results.forEach((r) => {
            if (!scoreMap[r.student_id]) scoreMap[r.student_id] = { total: 0, count: 0 };
            scoreMap[r.student_id].total += r.score;
            scoreMap[r.student_id].count += 1;
          });
        }
      }

      // 5. Assemble formatted student records
      const parsed: SchoolStudent[] = studentList.map((s) => {
        const prof = profileMap.get(s.user_id);
        const name = prof?.full_name || prof?.username || "Student";
        const stats = scoreMap[s.id];
        const avgScore = stats && stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
        const quizCount = stats?.count || 0;

        return {
          id: s.id,
          user_id: s.user_id,
          class_id: s.class_id,
          class_year: s.class_year,
          is_premium: s.is_premium,
          created_at: s.created_at,
          name,
          username: prof?.username || "",
          unique_id: prof?.unique_id || "",
          avgScore,
          quizCount,
          rank: 0,
          status: quizCount > 0 ? "Active" : "Active",
        };
      });

      parsed.sort((a, b) => b.avgScore - a.avgScore);
      parsed.forEach((s, i) => { s.rank = i + 1; });

      setStudents(parsed);
    } catch (err: unknown) {
      console.error("Failed to load school data:", err);
      setError(err instanceof Error ? err.message : "Error loading school data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchoolData();
  }, [fetchSchoolData]);

  return {
    school,
    students,
    isLoading,
    error,
    refresh: fetchSchoolData,
  };
}
