import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Check if the request is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify requesting user is a parent
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: parentRecord, error: parentError } = await adminClient
      .from("parents")
      .select("id")
      .eq("user_id", requestingUser.id)
      .single();

    if (parentError || !parentRecord) {
      return new Response(JSON.stringify({ error: "Only parents can create student accounts" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { fullName, classYear, username, password } = await req.json();

    if (!fullName || !classYear || !username || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const dummyEmail = `${username.trim().toLowerCase()}@student.eclat.com`;

    // 1. Create User via Admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const newUserId = newUser.user.id;

    // 2. Insert into user_roles
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: newUserId, role: "student" });

    if (roleError) {
      console.error("Error setting role:", roleError);
    }

    // 3. Update profile with username
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ username: username.trim().toLowerCase() })
      .eq("id", newUserId);

    if (profileError) {
      console.error("Error updating profile username:", profileError);
    }

    // 4. Create student record linked to parent
    const { error: studentError } = await adminClient
      .from("students")
      .insert({
        user_id: newUserId,
        parent_id: parentRecord.id,
        class_year: classYear,
        onboarding_completed: true, // Auto-complete onboarding since parent provided details
        is_premium: false
      });

    if (studentError) {
      console.error("Error creating student record:", studentError);
      return new Response(JSON.stringify({ error: "Failed to link student to parent" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, user: newUser.user }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
