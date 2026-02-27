// =====================================================
// SUPABASE EDGE FUNCTION: Send Call Emails
// =====================================================
// This function processes pending email notifications
// and sends them via Gmail SMTP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getEmailTemplate } from './email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get pending emails from database
    const { data: emails, error: fetchError } = await supabaseClient
      .rpc('get_pending_emails')

    if (fetchError) {
      console.error('Error fetching emails:', fetchError)
      throw fetchError
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${emails.length} emails to send`)

    // Initialize SMTP client
    const client = new SmtpClient();

    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: Deno.env.get('SMTP_USERNAME') ?? '',
      password: Deno.env.get('SMTP_PASSWORD') ?? '',
    });

    let sentCount = 0;
    let failedCount = 0;

    // Process each email
    for (const email of emails) {
      try {
        console.log(`Processing email ${email.email_id} for ${email.recipient_email}`)

        // Get email template
        const template = getEmailTemplate(
          email.recipient_type,
          email.email_type,
          {
            student_name: email.student_name,
            student_email: email.student_email,
            student_whatsapp: email.student_whatsapp,
            mentor_name: email.mentor_name,
            mentor_email: email.mentor_email,
            mentor_whatsapp: email.mentor_whatsapp,
            scheduled_date: email.scheduled_date,
            scheduled_time: email.scheduled_time,
            call_notes: email.call_notes || '',
            landmark_title: email.landmark_title || ''
          }
        )

        // Send email via SMTP
        await client.send({
          from: Deno.env.get('SMTP_FROM') ?? 'marcosantoniodv@gmail.com',
          to: email.recipient_email,
          subject: template.subject,
          content: template.html,
          mimeType: "text/html",
        });

        // Mark as sent
        const { error: updateError } = await supabaseClient
          .rpc('mark_email_sent', { p_email_id: email.email_id })

        if (updateError) {
          console.error(`Error marking email ${email.email_id} as sent:`, updateError)
        } else {
          sentCount++
          console.log(`✅ Email ${email.email_id} sent successfully to ${email.recipient_email}`)
        }

      } catch (emailError) {
        console.error(`Error sending email ${email.email_id}:`, emailError)

        // Mark as failed
        const { error: failError } = await supabaseClient
          .rpc('mark_email_failed', {
            p_email_id: email.email_id,
            p_error_message: String(emailError)
          })

        if (failError) {
          console.error(`Error marking email ${email.email_id} as failed:`, failError)
        }

        failedCount++
      }
    }

    // Close SMTP connection
    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email processing complete',
        total: emails.length,
        sent: sentCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
