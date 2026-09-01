import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordResetRequest {
  email: string
  siteUrl?: string
  role?: 'admin' | 'student' | 'parent' | 'school' | 'general'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { email, siteUrl: payloadSiteUrl, role = 'general' } = await req.json() as PasswordResetRequest

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid email address is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const headerOrigin = req.headers.get('origin')
    const siteUrl = (payloadSiteUrl || headerOrigin || Deno.env.get('PUBLIC_SITE_URL') || 'https://eclatapp.xyz').replace(/\/+$/, '')

    const isAdmin = role === 'admin'
    const targetRedirectBase = isAdmin
      ? `${siteUrl}/admin/reset-password`
      : `${siteUrl}/password-reset`

    // Generate recovery link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${targetRedirectBase}?type=recovery`,
      },
    })

    if (linkError) {
      console.warn('generateLink warning:', linkError.message)
      // Return generic success to avoid email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If an account exists with this email, a reset link has been dispatched.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const hashedToken = linkData?.properties?.hashed_token
    const emailOtp = linkData?.properties?.email_otp

    // Construct DIRECT application link (bypassing raw Supabase internal project URL)
    const directActionLink = hashedToken
      ? `${targetRedirectBase}?token_hash=${hashedToken}&type=recovery`
      : (linkData?.properties?.action_link || `${targetRedirectBase}?type=recovery`)

    // Check if user is an admin in database
    let adminName = 'Administrator'
    let adminId: string | null = null
    if (isAdmin) {
      const { data: adminRecord } = await supabaseAdmin
        .from('admins')
        .select('id, full_name')
        .eq('user_id', linkData.user.id)
        .maybeSingle()

      if (adminRecord) {
        adminName = adminRecord.full_name || 'Administrator'
        adminId = adminRecord.id
      }
    }

    // Email Template definition
    const subject = isAdmin
      ? '🔒 Reset Your Éclat Administrator Password'
      : 'Reset Your Éclat Password'

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: ${isAdmin ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'}; padding: 32px 24px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 8px;">${isAdmin ? '🛡️' : '🔑'}</div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        ${isAdmin ? 'Éclat Admin Security' : 'Éclat Password Reset'}
      </h1>
      <p style="color: rgba(255, 255, 255, 0.85); margin: 6px 0 0 0; font-size: 13px;">
        ${isAdmin ? 'Authorized Administrator Password Recovery' : 'Account Security Verification'}
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 15px; color: #334155; margin-top: 0;">
        Hello <strong>${isAdmin ? adminName : 'there'}</strong>,
      </p>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We received a request to reset the password associated with your account (<strong>${cleanEmail}</strong>).
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${directActionLink}" 
           style="background: ${isAdmin ? '#0f172a' : '#0284c7'}; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          ${isAdmin ? 'Configure New Admin Password →' : 'Reset My Password →'}
        </a>
      </div>

      <div style="background-color: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          ⏱️ <strong>Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong>. If you did not request this password reset, you can safely ignore this email — your account remains secure.
        </p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${directActionLink}" style="color: #0284c7; word-break: break-all; font-size: 11px;">${directActionLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        © ${new Date().getFullYear()} Éclat Education Platform. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Attempt sending email via Resend (try eclatapp.xyz first, fallback to bece.eclatapp.xyz if domain unverified)
    let resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Éclat Security <noreply@eclatapp.xyz>',
        to: [cleanEmail],
        subject: subject,
        html: emailHtml,
      }),
    })

    let resendResult = await resendResponse.json()

    // Fallback if domain is configured under bece.eclatapp.xyz in Resend
    if (!resendResponse.ok && (resendResult.message?.includes('domain') || resendResult.message?.includes('verify'))) {
      console.warn('Retrying with fallback sender domain...', resendResult.message)
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Éclat Security <noreply@bece.eclatapp.xyz>',
          to: [cleanEmail],
          subject: subject,
          html: emailHtml,
        }),
      })
      resendResult = await resendResponse.json()
    }

    if (!resendResponse.ok) {
      console.error('Resend dispatch error:', resendResult)
      throw new Error(resendResult.message || 'Failed to dispatch email through Resend')
    }

    // Audit log for admin password reset requests
    if (isAdmin && adminId) {
      try {
        await supabaseAdmin.rpc('log_admin_action', {
          _admin_id: adminId,
          _action: 'request_password_reset',
          _resource_type: 'admin',
          _resource_id: adminId,
          _details: {
            email: cleanEmail,
            origin: siteUrl,
            direct_link_used: !!hashedToken,
          },
        })
      } catch (logErr) {
        console.warn('Audit log error on reset request:', logErr)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset link sent successfully',
        emailSent: true 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error: any) {
    console.error('Error in send-password-reset function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
