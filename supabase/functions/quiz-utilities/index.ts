import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const questionTables = {
  year_6: "quiz_questions_year6",
  year_9: "quiz_questions_year9",
} as const;

type ClassYear = keyof typeof questionTables;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace(/^[Bb]earer\s+/, "").trim();
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "Invalid token" }, 401);
    }

    const { classYear, action, subject, topics } = await req.json();

    if (!classYear || !(classYear in questionTables)) {
      return json({ error: "Invalid class year" }, 400);
    }

    if (!action || !["get-metadata", "get-question-count"].includes(action)) {
      return json({ error: "Invalid action" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const tableName = questionTables[classYear as ClassYear];

    if (action === "get-metadata") {
      const { data, error } = await adminClient
        .from(tableName)
        .select("subject, topic")
        .not("subject", "is", null)
        .order("subject", { ascending: true })
        .order("topic", { ascending: true });

      if (error) {
        console.error("quiz-utilities metadata error:", error);
        return json({ error: "Failed to load quiz metadata" }, 500);
      }

      const metadata: Record<string, Set<string>> = {};
      for (const row of data || []) {
        const rowSubject = row.subject?.trim();
        const rowTopic = row.topic?.trim();
        if (!rowSubject || !rowTopic) continue;

        if (!metadata[rowSubject]) {
          metadata[rowSubject] = new Set<string>();
        }
        metadata[rowSubject].add(rowTopic);
      }

      const serialized = Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [key, [...value].sort()])
      );

      return json({ metadata: serialized });
    }

    const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
    const normalizedTopics = Array.isArray(topics)
      ? topics.filter((topic) => typeof topic === "string" && topic.trim()).map((topic) => topic.trim())
      : [];

    if (!normalizedSubject) {
      return json({ error: "Subject is required" }, 400);
    }

    let query = adminClient
      .from(tableName)
      .select("id", { count: "exact", head: true })
      .eq("subject", normalizedSubject);

    if (normalizedTopics.length > 0) {
      query = query.in("topic", normalizedTopics);
    }

    const { count, error } = await query;

    if (error) {
      console.error("quiz-utilities count error:", error);
      return json({ error: "Failed to count questions" }, 500);
    }

    return json({ count: count || 0 });
  } catch (error) {
    console.error("quiz-utilities error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
