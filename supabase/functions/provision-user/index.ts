import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedSelfServiceRoles = new Set(["parent", "school"]);

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

    const accessToken = authHeader.replace(/^[Bb]earer\s+/, "").trim();
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser(accessToken);
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: authUser, error: getAuthUserErr } = await admin.auth.admin.getUserById(userId);
    if (getAuthUserErr || !authUser.user) {
      return json({ error: "Failed to fetch auth user" }, 500);
    }

    const metaRole = authUser.user.user_metadata?.role as string | undefined;

    if (!metaRole) {
      return json({ error: "Account role is missing. Please restart signup from role selection." }, 400);
    }

    if (metaRole === "student") {
      const { data: existingStudent, error: studentLookupError } = await admin
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (studentLookupError) {
        throw studentLookupError;
      }

      if (!existingStudent) {
        return json({ error: "Student accounts must be created by a parent." }, 403);
      }

      const { error: roleUpsertErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "student" }, { onConflict: "user_id,role" });

      if (roleUpsertErr) {
        throw roleUpsertErr;
      }

      return json({ ok: true, role: "student" });
    }

    if (!allowedSelfServiceRoles.has(metaRole)) {
      return json({ error: "Unsupported account role" }, 400);
    }

    const { error: roleUpsertErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: metaRole }, { onConflict: "user_id,role" });

    if (roleUpsertErr) {
      console.error("provision-user role upsert error:", roleUpsertErr);
      return json({ error: "Failed to set role" }, 500);
    }

    if (metaRole === "parent") {
      const { data: exists } = await admin
        .from("parents")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!exists) {
        const { error } = await admin.from("parents").insert({ user_id: userId });
        if (error) throw error;
      }
    }

    if (metaRole === "school") {
      const schoolName =
        authUser.user.user_metadata?.school_name ||
        authUser.user.user_metadata?.schoolName ||
        null;

      const { data: exists } = await admin
        .from("schools")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!exists) {
        const { error } = await admin
          .from("schools")
          .insert({ user_id: userId, school_name: schoolName });

        if (error) throw error;
      }
    }

    return json({ ok: true, role: metaRole });
  } catch (err) {
    console.error("provision-user error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
