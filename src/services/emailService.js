/**
 * Email Service
 * Handles sending emails via Resend, SendGrid, or Supabase Edge Functions
 * 
 * Setup Instructions:
 * 1. Choose your email provider (Resend recommended for simplicity)
 * 2. Add API key to .env.local:
 *    - For Resend: REACT_APP_RESEND_API_KEY=re_xxxxx
 *    - For SendGrid: REACT_APP_SENDGRID_API_KEY=SG.xxxxx
 * 3. Set FROM_EMAIL in .env.local: REACT_APP_FROM_EMAIL=noreply@yourapp.com
 */

const EMAIL_PROVIDER = process.env.REACT_APP_EMAIL_PROVIDER || 'resend'; // 'resend', 'sendgrid', or 'supabase'
const FROM_EMAIL = process.env.REACT_APP_FROM_EMAIL || 'noreply@swissstartupconnect.com';
const FROM_NAME = process.env.REACT_APP_FROM_NAME || 'Startup Connect';

/**
 * Send email via Resend API (recommended)
 * https://resend.com/docs/send-with-nodejs
 */
const sendViaResend = async (to, subject, html, text) => {
  const RESEND_API_KEY = process.env.REACT_APP_RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via SendGrid API
 * https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
const sendViaSendGrid = async (to, subject, html, text) => {
  const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;

  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject,
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.errors?.[0]?.message || 'Failed to send email' };
    }

    return { success: true, messageId: response.headers.get('x-message-id') };
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Supabase Edge Function
 * This is useful if you deploy to Supabase and want to keep everything in one place
 */
const sendViaSupabase = async (to, subject, html, text) => {
  // This would call your Supabase Edge Function
  // Example: https://your-project.supabase.co/functions/v1/send-email
  
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Error sending email via Supabase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Main email sending function
 * Automatically routes to the configured provider
 */
export const sendEmail = async (to, subject, html, text = null) => {
  // If text not provided, strip HTML for text version
  const plainText = text || html.replace(/<[^>]*>/g, '');

  switch (EMAIL_PROVIDER) {
    case 'sendgrid':
      return sendViaSendGrid(to, subject, html, plainText);
    case 'supabase':
      return sendViaSupabase(to, subject, html, plainText);
    case 'resend':
    default:
      return sendViaResend(to, subject, html, plainText);
  }
};

/**
 * Send job alert email
 */
export const sendJobAlertEmail = async (to, jobs, searchName = 'your saved search') => {
  const subject = `${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching "${searchName}"`;
  
  const html = generateJobAlertHTML(jobs, searchName);
  const text = generateJobAlertText(jobs, searchName);

  return sendEmail(to, subject, html, text);
};

/**
 * Send application status update email
 */
export const sendApplicationStatusEmail = async (to, jobTitle, companyName, newStatus, message = '') => {
  const subject = `Application update: ${jobTitle} at ${companyName}`;
  
  const html = generateApplicationStatusHTML(jobTitle, companyName, newStatus, message);
  const text = generateApplicationStatusText(jobTitle, companyName, newStatus, message);

  return sendEmail(to, subject, html, text);
};

/**
 * Send new company job notification
 */
export const sendNewCompanyJobEmail = async (to, companyName, job) => {
  const subject = `${companyName} posted a new job: ${job.title}`;
  
  const html = generateNewCompanyJobHTML(companyName, job);
  const text = generateNewCompanyJobText(companyName, job);

  return sendEmail(to, subject, html, text);
};

/**
 * Send weekly digest email
 */
export const sendWeeklyDigestEmail = async (to, stats) => {
  const subject = 'Your weekly job digest - Startup Connect';
  
  const html = generateWeeklyDigestHTML(stats);
  const text = generateWeeklyDigestText(stats);

  return sendEmail(to, subject, html, text);
};

/**
 * HTML Template Generators
 */

function generateJobAlertHTML(jobs, searchName) {
  const jobsHTML = jobs.map(job => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1f2937;">
        ${job.title}
      </h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.company_name}</strong> • ${job.location || 'Remote'}
      </p>
      ${job.salary_min_value || job.salary_max_value ? `
        <p style="margin: 0 0 12px 0; color: #059669; font-weight: 500;">
          CHF ${job.salary_min_value || ''} ${job.salary_max_value ? `- ${job.salary_max_value}` : ''}
        </p>
      ` : ''}
      <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
        ${(job.description || '').substring(0, 150)}...
      </p>
      <a href="${process.env.REACT_APP_URL || 'https://swissstartupconnect.com'}?job=${job.id}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Job
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Startup Connect</h1>
        </div>
        
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1f2937;">
            ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your search
          </h2>
          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
            Search: <strong>${searchName}</strong>
          </p>
          
          ${jobsHTML}
          
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <a href="${process.env.REACT_APP_URL || 'https://swissstartupconnect.com'}" 
               style="color: #3b82f6; text-decoration: none; font-size: 14px;">
              View all jobs →
            </a>
          </div>
        </div>
        
        <div style="margin-top: 32px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            You're receiving this because you have job alerts enabled for "${searchName}".
          </p>
          <p style="margin: 0;">
            <a href="${process.env.REACT_APP_URL}/settings/notifications" style="color: #6b7280; text-decoration: none;">
              Manage your notification preferences
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateJobAlertText(jobs, searchName) {
  const jobsText = jobs.map(job => `
${job.title}
${job.company_name} • ${job.location || 'Remote'}
${job.salary_min_value || job.salary_max_value ? `CHF ${job.salary_min_value || ''} - ${job.salary_max_value || ''}` : ''}

${(job.description || '').substring(0, 150)}...

View job: ${process.env.REACT_APP_URL}?job=${job.id}
---
  `).join('\n');

  return `
Startup Connect

${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching "${searchName}"

${jobsText}

View all jobs: ${process.env.REACT_APP_URL}

---
You're receiving this because you have job alerts enabled for "${searchName}".
Manage your notification preferences: ${process.env.REACT_APP_URL}/settings/notifications
  `;
}

function generateApplicationStatusHTML(jobTitle, companyName, status, message) {
  const statusColors = {
    'under review': '#3b82f6',
    'interview': '#10b981',
    'offer': '#059669',
    'rejected': '#ef4444',
  };

  const statusColor = statusColors[status.toLowerCase()] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937;">Application Update</h2>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Position</p>
            <h3 style="margin: 0; font-size: 18px; color: #1f2937;">${jobTitle}</h3>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Company</p>
            <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1f2937;">${companyName}</p>
          </div>
          
          <div style="background: ${statusColor}; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.9); font-size: 14px;">Status</p>
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: white;">${status}</p>
          </div>
          
          ${message ? `
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; color: #4b5563; line-height: 1.5;">${message}</p>
            </div>
          ` : ''}
          
          <a href="${process.env.REACT_APP_URL}/applications" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 16px;">
            View Application
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateApplicationStatusText(jobTitle, companyName, status, message) {
  return `
Application Update

Position: ${jobTitle}
Company: ${companyName}
Status: ${status}

${message ? `Message:\n${message}\n` : ''}

View your application: ${process.env.REACT_APP_URL}/applications
  `;
}

function generateNewCompanyJobHTML(companyName, job) {
  return generateJobAlertHTML([job], `jobs from ${companyName}`);
}

function generateNewCompanyJobText(companyName, job) {
  return generateJobAlertText([job], `jobs from ${companyName}`);
}

function generateWeeklyDigestHTML(stats) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 24px 0; color: #1f2937;">Your Weekly Summary</h2>
          
          <div style="display: grid; gap: 16px; margin-bottom: 24px;">
            <div style="background: #dbeafe; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 4px 0; color: #1e40af; font-size: 32px; font-weight: 700;">
                ${stats.newJobs || 0}
              </p>
              <p style="margin: 0; color: #3b82f6; font-size: 14px;">New jobs matching your searches</p>
            </div>
            
            <div style="background: #d1fae5; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 4px 0; color: #065f46; font-size: 32px; font-weight: 700;">
                ${stats.applications || 0}
              </p>
              <p style="margin: 0; color: #059669; font-size: 14px;">Applications this week</p>
            </div>
          </div>
          
          <a href="${process.env.REACT_APP_URL}" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Browse Jobs
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWeeklyDigestText(stats) {
  return `
Your Weekly Summary

New jobs matching your searches: ${stats.newJobs || 0}
Applications this week: ${stats.applications || 0}

Browse jobs: ${process.env.REACT_APP_URL}
  `;
}

export default {
  sendEmail,
  sendJobAlertEmail,
  sendApplicationStatusEmail,
  sendNewCompanyJobEmail,
  sendWeeklyDigestEmail,
};

