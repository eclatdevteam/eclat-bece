import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const requestSchema = z.object({
  user_id: z.string().uuid(),
  message: z.string().trim().min(5, "Message must be at least 5 characters"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { user_id, message } = parsed.data;

    // Supabase service client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user profile securely
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, display_name, email")
      .eq("id", user_id)
      .single();

    if (profileErr || !profile) {
      console.error("Error fetching user profile", profileErr);
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const senderName = profile.full_name || profile.display_name || "Parent User";
    const senderEmail = profile.email;

    // Send the email via Resend to support@eclatapp.xyz
    const emailResponse = await resend.emails.send({
      from: "Éclat Support Desk <support@bece.eclatapp.xyz>",
      to: ["support@eclatapp.xyz"],
      subject: `[Support Query] from ${senderName}`,
      text: `Support Message from ${senderName} (${senderEmail}):\n\n${message}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>New Support Query</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.5; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
              .header { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #0891b2; }
              .message-box { background-color: #f1f3f5; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2; font-style: italic; white-space: pre-wrap; margin-top: 10px; }
              p { margin: 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin-top: 0; color: #0891b2;">New Support Ticket</h2>
                <p><strong>From:</strong> ${senderName} (<a href="mailto:${senderEmail}">${senderEmail}</a>)</p>
                <p><strong>Role:</strong> Parent Account</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p><strong>Message from Parent:</strong></p>
              <div class="message-box">${message}</div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Support email sent successfully for user:", user_id, "Response:", emailResponse);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err: any) {
    console.error("send-support-email error:", err);
    return new Response(JSON.stringify({ error: "Internal error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
