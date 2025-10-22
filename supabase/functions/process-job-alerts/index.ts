// Supabase Edge Function: process-job-alerts
// This function runs on a schedule (cron job) to process pending job alerts
// Deploy with: supabase functions deploy process-job-alerts
// Schedule with: Create a cron job in Supabase Dashboard or use pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  subject: string;
  savedSearchId?: string;
  savedSearchName?: string;
  jobs?: Array<{
    id: string;
    title: string;
    company_name: string;
    location?: string;
    salary_min_value?: number;
    salary_max_value?: number;
    description?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get email service configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@swissstartupconnect.com';
    const fromName = Deno.env.get('FROM_NAME') || 'Swiss Startup Connect';
    const appUrl = Deno.env.get('APP_URL') || 'https://swissstartupconnect.com';

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Fetch pending notifications from queue
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select(`
        *,
        profiles:user_id (
          email,
          name
        )
      `)
      .eq('status', 'pending')
      .eq('delivery_channel', 'email')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Processing ${pendingNotifications.length} notifications`);

    // Process each notification
    let sent = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', notification.id);

        const userEmail = notification.profiles?.email;
        if (!userEmail) {
          console.error(`No email for user ${notification.user_id}`);
          await supabase
            .from('notification_queue')
            .update({
              status: 'failed',
              error_message: 'User email not found',
              failed_at: new Date().toISOString(),
            })
            .eq('id', notification.id);
          failed++;
          continue;
        }

        // Generate email HTML based on notification type
        const { html, text, subject } = generateEmailContent(
          notification.notification_type,
          notification.payload as NotificationPayload,
          appUrl
        );

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [userEmail],
            subject,
            html,
            text,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.message || 'Failed to send email');
        }

        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        // Add to notification history
        await supabase.from('notification_history').insert({
          user_id: notification.user_id,
          notification_type: notification.notification_type,
          subject,
          delivery_channel: 'email',
          sent_at: new Date().toISOString(),
        });

        sent++;
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);

        // Update retry count
        const retryCount = (notification.retry_count || 0) + 1;
        const maxRetries = notification.max_retries || 3;

        if (retryCount >= maxRetries) {
          // Max retries reached, mark as failed
          await supabase
            .from('notification_queue')
            .update({
              status: 'failed',
              error_message: error.message,
              failed_at: new Date().toISOString(),
              retry_count: retryCount,
            })
            .eq('id', notification.id);
        } else {
          // Schedule for retry
          const retryDelay = Math.pow(2, retryCount) * 60 * 1000; // Exponential backoff
          const retryAt = new Date(Date.now() + retryDelay);

          await supabase
            .from('notification_queue')
            .update({
              status: 'pending',
              retry_count: retryCount,
              scheduled_for: retryAt.toISOString(),
            })
            .eq('id', notification.id);
        }

        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Job alerts processed',
        processed: pendingNotifications.length,
        sent,
        failed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in process-job-alerts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Generate email content based on notification type
 */
function generateEmailContent(
  type: string,
  payload: NotificationPayload,
  appUrl: string
): { html: string; text: string; subject: string } {
  const subject = payload.subject || 'Notification from Swiss Startup Connect';

  switch (type) {
    case 'job_alert':
      return generateJobAlertEmail(payload, appUrl);
    case 'application_status_update':
      return generateApplicationStatusEmail(payload, appUrl);
    case 'company_new_job':
      return generateNewCompanyJobEmail(payload, appUrl);
    default:
      return {
        subject,
        html: `<p>${subject}</p>`,
        text: subject,
      };
  }
}

function generateJobAlertEmail(
  payload: NotificationPayload,
  appUrl: string
): { html: string; text: string; subject: string } {
  const jobs = payload.jobs || [];
  const searchName = payload.savedSearchName || 'your saved search';
  const subject = `${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching "${searchName}"`;

  const jobsHTML = jobs
    .map(
      (job) => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1f2937;">${job.title}</h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.company_name}</strong> • ${job.location || 'Remote'}
      </p>
      ${job.salary_min_value || job.salary_max_value ? `
        <p style="margin: 0 0 12px 0; color: #059669; font-weight: 500;">
          CHF ${job.salary_min_value || ''} ${job.salary_max_value ? `- ${job.salary_max_value}` : ''}
        </p>
      ` : ''}
      <a href="${appUrl}?job=${job.id}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Job
      </a>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #1f2937;">
          ${subject}
        </h2>
        ${jobsHTML}
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px; text-align: center;">
          <a href="${appUrl}/settings/notifications" style="color: #6b7280;">
            Manage notification preferences
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  const text = jobs
    .map(
      (job) => `
${job.title}
${job.company_name} • ${job.location || 'Remote'}
${job.salary_min_value || job.salary_max_value ? `CHF ${job.salary_min_value || ''} - ${job.salary_max_value || ''}` : ''}

View: ${appUrl}?job=${job.id}
---
  `
    )
    .join('\n');

  return { html, text, subject };
}

function generateApplicationStatusEmail(
  payload: any,
  appUrl: string
): { html: string; text: string; subject: string } {
  const subject = payload.subject || 'Application update';
  const html = `<p>${subject}</p>`;
  const text = subject;

  return { html, text, subject };
}

function generateNewCompanyJobEmail(
  payload: any,
  appUrl: string
): { html: string; text: string; subject: string } {
  const subject = payload.subject || 'New job posted';
  const html = `<p>${subject}</p>`;
  const text = subject;

  return { html, text, subject };
}

