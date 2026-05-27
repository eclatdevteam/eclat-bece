import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { studentId } = await req.json();
    if (!studentId) {
      return json({ error: "Student ID is required" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: parentRecord, error: parentError } = await adminClient
      .from("parents")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (parentError || !parentRecord) {
      return json({ error: "Only parents can delete student accounts" }, 403);
    }

    const { data: studentRecord, error: studentError } = await adminClient
      .from("students")
      .select("id, user_id, parent_id")
      .eq("id", studentId)
      .single();

    if (studentError || !studentRecord) {
      return json({ error: "Student not found" }, 404);
    }

    if (studentRecord.parent_id !== parentRecord.id) {
      return json({ error: "Access denied: You are not this student's parent" }, 403);
    }

    await adminClient
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("student_id", studentRecord.id)
      .eq("status", "active");

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(studentRecord.user_id);

    if (deleteError) {
      console.error("delete-student-account auth delete error:", deleteError);
      return json({ error: deleteError.message }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("delete-student-account error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
