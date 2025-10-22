

# 🔔 Notification System Setup Guide

This guide will help you set up the comprehensive email notification and job alert system for Swiss Startup Connect.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features Included](#features-included)
3. [Database Setup](#database-setup)
4. [Email Service Setup](#email-service-setup)
5. [Frontend Integration](#frontend-integration)
6. [Scheduled Processing](#scheduled-processing)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## 🎯 Overview

The notification system provides:
- **Email notifications** for job alerts, application updates, and company news
- **Saved searches** with customizable alert frequencies (instant, daily, weekly)
- **Notification preferences** management
- **In-app notification center** with real-time updates
- **Smart job matching** against saved search criteria
- **Email templates** for various notification types

---

## ✨ Features Included

### For Job Seekers:
- ✅ Save job searches with custom filters
- ✅ Get email alerts for matching jobs (instant/daily/weekly)
- ✅ Application status change notifications
- ✅ New jobs from followed companies
- ✅ In-app notification center
- ✅ Granular notification preferences

### For Employers:
- ✅ Application view tracking
- ✅ Engagement analytics
- ✅ Company metrics and trust signals

---

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

```bash
# Navigate to your project directory
cd /Users/luca/cloneswiss/swiss

# Run the notification schema
psql -h your-supabase-db.supabase.co -U postgres -d postgres -f supabase-notifications-schema.sql

# Or use Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase-notifications-schema.sql
# 3. Run the query
```

This creates the following tables:
- `notification_preferences` - User notification settings
- `saved_searches` - Saved job searches with alert configuration
- `job_alerts` - Tracking of sent job alerts
- `notification_queue` - Pending notifications to be sent
- `notification_history` - Archive of all sent notifications
- `job_views` - Job view analytics
- `company_metrics` - Company trust signals

### Step 2: Verify Tables Created

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notification_preferences',
  'saved_searches', 
  'job_alerts',
  'notification_queue',
  'notification_history',
  'job_views',
  'company_metrics'
);
```

### Step 3: Set Up Row Level Security (RLS)

The schema includes RLS policies. Verify they're enabled:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notification_preferences', 'saved_searches', 'job_alerts');
```

---

## 📧 Email Service Setup

### Option 1: Resend (Recommended)

1. **Sign up for Resend**:
   - Go to [resend.com](https://resend.com)
   - Create account and verify your domain
   - Get your API key

2. **Configure environment variables**:

```bash
# Add to .env.local
REACT_APP_EMAIL_PROVIDER=resend
REACT_APP_RESEND_API_KEY=re_xxxxxxxxxxxxx
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=Swiss Startup Connect
REACT_APP_URL=https://your-app-url.com
```

### Option 2: SendGrid

1. **Sign up for SendGrid**:
   - Go to [sendgrid.com](https://sendgrid.com)
   - Create account and verify your sender
   - Get your API key

2. **Configure environment variables**:

```bash
# Add to .env.local
REACT_APP_EMAIL_PROVIDER=sendgrid
REACT_APP_SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_FROM_NAME=Swiss Startup Connect
REACT_APP_URL=https://your-app-url.com
```

### Option 3: Supabase Edge Functions

If you're deploying to Supabase, you can use Edge Functions to send emails.

```bash
# Add to Supabase Edge Function secrets
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Swiss Startup Connect
APP_URL=https://your-app-url.com
```

---

## 🎨 Frontend Integration

### Step 1: Import CSS

Add to your main `SwissStartupConnect.jsx` or `App.js`:

```javascript
import './components/Notifications.css';
```

### Step 2: Add Notification Center to Header

```javascript
import NotificationCenter from './components/NotificationCenter';

function AppHeader({ user, translate }) {
  return (
    <header>
      {/* ... other header content ... */}
      
      {user && (
        <NotificationCenter user={user} translate={translate} />
      )}
    </header>
  );
}
```

### Step 3: Add Notification Preferences Page

```javascript
import NotificationPreferences from './components/NotificationPreferences';

function SettingsPage({ user, translate, setFeedback }) {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="settings-page">
      <nav>
        <button onClick={() => setActiveTab('notifications')}>
          Notifications
        </button>
        {/* other tabs... */}
      </nav>

      {activeTab === 'notifications' && (
        <NotificationPreferences
          user={user}
          translate={translate}
          setFeedback={setFeedback}
        />
      )}
    </div>
  );
}
```

### Step 4: Add Saved Searches Feature

```javascript
import SavedSearches from './components/SavedSearches';

function JobsPage({ user, translate, setFeedback, currentFilters, applyFilters }) {
  return (
    <div className="jobs-page">
      <SavedSearches
        user={user}
        translate={translate}
        setFeedback={setFeedback}
        currentFilters={currentFilters}
        onApplySearch={applyFilters}
      />
      
      {/* ... job listings ... */}
    </div>
  );
}
```

### Step 5: Add Application Status Notifications

```javascript
import { useNotifications } from './hooks/useNotifications';

function ApplicationManager({ user }) {
  const { notifyApplicationStatusChange } = useNotifications(user);

  const handleStatusUpdate = async (applicationId, newStatus, message) => {
    // Update the application in database
    const { data: application, error } = await supabase
      .from('applications')
      .update({ status: newStatus, status_message: message })
      .eq('id', applicationId)
      .select('*, jobs(*)')
      .single();

    if (!error && application) {
      // Send notification
      await notifyApplicationStatusChange(application, newStatus, message);
    }
  };

  return (
    // ... your application UI
  );
}
```

---

## ⏰ Scheduled Processing

### Set Up Supabase Edge Function

1. **Install Supabase CLI**:

```bash
npm install -g supabase
```

2. **Initialize Supabase**:

```bash
supabase init
```

3. **Deploy the Edge Function**:

```bash
# Deploy the process-job-alerts function
supabase functions deploy process-job-alerts

# Set environment variables
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FROM_NAME="Swiss Startup Connect"
supabase secrets set APP_URL=https://your-app.com
```

4. **Set Up Cron Job** (using pg_cron):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job alert processing every hour
SELECT cron.schedule(
  'process-job-alerts-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/process-job-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule daily digest at 9 AM
SELECT cron.schedule(
  'daily-job-digest',
  '0 9 * * *', -- 9 AM daily
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/process-job-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"frequency": "daily"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule weekly digest on Mondays at 9 AM
SELECT cron.schedule(
  'weekly-job-digest',
  '0 9 * * 1', -- 9 AM on Mondays
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/process-job-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"frequency": "weekly"}'::jsonb
    ) AS request_id;
  $$
);
```

### Alternative: Manual Trigger

You can also manually trigger job alert processing:

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/process-job-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

---

## 🧪 Testing

### Test 1: Create Saved Search

```javascript
// In browser console
import { createSavedSearch } from './services/supabaseNotifications';

await createSavedSearch('your-user-id', {
  name: 'Test Search',
  description: 'Testing saved searches',
  filters: {
    searchTerm: 'React',
    locations: ['Zurich'],
  },
  alert_enabled: true,
  alert_frequency: 'instant',
});
```

### Test 2: Queue a Test Notification

```javascript
import { queueNotification } from './services/supabaseNotifications';

await queueNotification(
  'your-user-id',
  'job_alert',
  {
    subject: 'Test Notification',
    savedSearchName: 'React Developer',
    jobs: [
      {
        id: 'test-123',
        title: 'Senior React Developer',
        company_name: 'Test Company',
        location: 'Zurich',
      },
    ],
  },
  {
    priority: 1,
  }
);
```

### Test 3: Send Test Email

```javascript
import { sendJobAlertEmail } from './services/emailService';

await sendJobAlertEmail(
  'your-email@example.com',
  [
    {
      id: '1',
      title: 'Test Job',
      company_name: 'Test Company',
      location: 'Zurich',
      description: 'This is a test job description.',
    },
  ],
  'Test Search'
);
```

### Test 4: Process Pending Notifications

```bash
# Manually trigger the Edge Function
curl -X POST \
  'https://your-project.supabase.co/functions/v1/process-job-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Database schema deployed to production
- [ ] Email service API keys configured
- [ ] Environment variables set in production
- [ ] Edge Functions deployed
- [ ] Cron jobs scheduled
- [ ] RLS policies verified
- [ ] Test emails sent successfully

### Environment Variables Needed

```bash
# Production .env
REACT_APP_EMAIL_PROVIDER=resend
REACT_APP_RESEND_API_KEY=re_xxxxx_production_key
REACT_APP_FROM_EMAIL=noreply@swissstartupconnect.com
REACT_APP_FROM_NAME=Swiss Startup Connect
REACT_APP_URL=https://swissstartupconnect.com
REACT_APP_SUPABASE_URL=https://yourproject.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxxx...
```

### Supabase Secrets

```bash
# Set production secrets
supabase secrets set RESEND_API_KEY=re_xxxxx --project-ref your-project-ref
supabase secrets set FROM_EMAIL=noreply@swissstartupconnect.com --project-ref your-project-ref
supabase secrets set FROM_NAME="Swiss Startup Connect" --project-ref your-project-ref
supabase secrets set APP_URL=https://swissstartupconnect.com --project-ref your-project-ref
```

---

## 📊 Monitoring & Analytics

### View Notification Stats

```sql
-- Total notifications sent
SELECT COUNT(*) as total_sent
FROM notification_history
WHERE sent_at >= NOW() - INTERVAL '7 days';

-- Notifications by type
SELECT 
  notification_type,
  COUNT(*) as count,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened
FROM notification_history
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY notification_type;

-- Top saved searches by match count
SELECT 
  name,
  match_count,
  alert_frequency
FROM saved_searches
WHERE is_active = true
ORDER BY match_count DESC
LIMIT 10;
```

### View Job Alert Engagement

```sql
-- Job alert click-through rates
SELECT 
  j.title,
  j.company_name,
  COUNT(DISTINCT ja.user_id) as alerts_sent,
  COUNT(DISTINCT ja.clicked_at) as clicks,
  ROUND(COUNT(DISTINCT ja.clicked_at)::numeric / COUNT(DISTINCT ja.user_id) * 100, 2) as ctr
FROM job_alerts ja
JOIN jobs j ON j.id = ja.job_id
WHERE ja.sent_at >= NOW() - INTERVAL '7 days'
GROUP BY j.id, j.title, j.company_name
ORDER BY ctr DESC;
```

---

## 🔧 Troubleshooting

### Emails Not Sending

1. Check email service API key:
   ```bash
   echo $REACT_APP_RESEND_API_KEY
   ```

2. Verify FROM_EMAIL is verified in your email service

3. Check notification queue for errors:
   ```sql
   SELECT * FROM notification_queue
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Saved Searches Not Working

1. Check if tables exist:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'saved_searches'
   );
   ```

2. Verify RLS policies are set up

3. Check browser console for errors

### Cron Jobs Not Running

1. Verify pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check cron job status:
   ```sql
   SELECT * FROM cron.job;
   ```

3. View cron job run history:
   ```sql
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC
   LIMIT 10;
   ```

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---

## 🎉 You're All Set!

Your notification system is now fully configured. Users can:
- Save job searches with custom alerts
- Get email notifications for matching jobs
- Manage their notification preferences
- View in-app notifications
- Track their applications

Happy coding! 🚀

