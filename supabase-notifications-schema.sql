-- =====================================================
-- Swiss Startup Connect - Notifications & Alerts Schema
-- =====================================================
-- This schema supports:
-- - Email notifications for job alerts
-- - Saved searches with customizable alerts
-- - Notification preferences management
-- - Application status notifications
-- - Company follow notifications
-- =====================================================

-- =====================================================
-- 1. NOTIFICATION PREFERENCES
-- =====================================================
-- Stores user preferences for notifications

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notification settings
  email_enabled BOOLEAN DEFAULT true,
  email_address VARCHAR(255),
  
  -- Job alert settings
  job_alerts_enabled BOOLEAN DEFAULT true,
  job_alert_frequency VARCHAR(50) DEFAULT 'daily' CHECK (job_alert_frequency IN ('instant', 'daily', 'weekly', 'never')),
  
  -- Application notifications
  application_status_updates BOOLEAN DEFAULT true,
  application_messages BOOLEAN DEFAULT true,
  
  -- Company notifications
  followed_company_jobs BOOLEAN DEFAULT true,
  
  -- Marketing preferences
  newsletter_enabled BOOLEAN DEFAULT false,
  product_updates BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can create own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. SAVED SEARCHES
-- =====================================================
-- Stores user's saved job search filters with alert settings

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Filter configuration (stored as JSON)
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example filters structure:
  -- {
  --   "searchTerm": "React Developer",
  --   "locations": ["Zurich", "Geneva"],
  --   "workArrangements": ["remote", "hybrid"],
  --   "employmentTypes": ["full-time"],
  --   "salaryMin": 80000,
  --   "salaryMax": 120000,
  --   "tags": ["react", "typescript"],
  --   "companyStages": ["series-a", "series-b"]
  -- }
  
  -- Alert configuration
  alert_enabled BOOLEAN DEFAULT true,
  alert_frequency VARCHAR(50) DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  
  -- Tracking
  last_notification_sent_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_count INT DEFAULT 0, -- Number of current matches
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alert_enabled ON saved_searches(alert_enabled) WHERE alert_enabled = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;

-- RLS Policies for saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved searches
CREATE POLICY "Users can view own saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own saved searches
CREATE POLICY "Users can create own saved searches"
  ON saved_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
  ON saved_searches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. JOB ALERTS
-- =====================================================
-- Tracks which jobs have been sent to users via alerts

CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE SET NULL,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('saved_search', 'followed_company', 'recommendation')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Engagement tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate sends
  UNIQUE(user_id, job_id, saved_search_id)
);

-- Indexes for tracking and analytics
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_job_id ON job_alerts(job_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_sent_at ON job_alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_job_alerts_saved_search_id ON job_alerts(saved_search_id);

-- RLS Policies for job_alerts
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own job alerts
CREATE POLICY "Users can view own job alerts"
  ON job_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. NOTIFICATION QUEUE
-- =====================================================
-- Queue for pending notifications to be sent

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(100) NOT NULL CHECK (notification_type IN (
    'job_alert',
    'application_status_update',
    'application_message',
    'company_new_job',
    'saved_search_matches',
    'weekly_digest',
    'daily_digest'
  )),
  
  -- Priority (1 = highest, 5 = lowest)
  priority INT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  
  -- Notification content (stored as JSON)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example payload:
  -- {
  --   "subject": "New jobs matching your search",
  --   "jobs": [...],
  --   "savedSearchName": "React Developer in Zurich"
  -- }
  
  -- Delivery settings
  delivery_channel VARCHAR(50) DEFAULT 'email' CHECK (delivery_channel IN ('email', 'push', 'sms')),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(notification_type);

-- RLS Policies for notification_queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications in queue
CREATE POLICY "Users can view own notification queue"
  ON notification_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. NOTIFICATION HISTORY
-- =====================================================
-- Archive of all sent notifications for analytics

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(100) NOT NULL,
  subject VARCHAR(500),
  
  -- Delivery info
  delivery_channel VARCHAR(50),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Engagement tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  conversion_at TIMESTAMP WITH TIME ZONE, -- e.g., applied to job
  
  -- Related entities
  related_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  related_application_id UUID, -- Could reference applications table
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_opened ON notification_history(opened_at) WHERE opened_at IS NOT NULL;

-- RLS Policies for notification_history
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification history
CREATE POLICY "Users can view own notification history"
  ON notification_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. JOB VIEWS TRACKING (for analytics)
-- =====================================================
-- Track when users view jobs for better recommendations

CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- View details
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  referrer_source VARCHAR(100), -- 'search', 'email_alert', 'company_page', 'recommended'
  
  -- Engagement metrics
  time_spent_seconds INT,
  scrolled_to_bottom BOOLEAN DEFAULT false,
  clicked_apply BOOLEAN DEFAULT false
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_job_views_referrer ON job_views(referrer_source);

-- RLS Policies for job_views
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Anyone can track anonymous views
CREATE POLICY "Anyone can create job views"
  ON job_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own history
CREATE POLICY "Users can view own job views"
  ON job_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. COMPANY METRICS (for trust signals)
-- =====================================================
-- Aggregate metrics shown to candidates

CREATE TABLE IF NOT EXISTS company_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE, -- References companies/startups table
  company_name VARCHAR(255) NOT NULL,
  
  -- Job posting metrics
  total_jobs_posted INT DEFAULT 0,
  active_jobs_count INT DEFAULT 0,
  
  -- Application metrics
  total_applications_received INT DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2),
  response_rate DECIMAL(5,2), -- Percentage
  
  -- Candidate success metrics
  interview_rate DECIMAL(5,2), -- % of applications that get interviews
  hire_rate DECIMAL(5,2), -- % of applications that result in hires
  
  -- Trust signals
  verified_employer BOOLEAN DEFAULT false,
  fast_responder BOOLEAN DEFAULT false, -- Response < 48 hours
  high_interview_rate BOOLEAN DEFAULT false, -- > 30% interview rate
  
  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_company_metrics_company_id ON company_metrics(company_id);

-- RLS Policies for company_metrics
ALTER TABLE company_metrics ENABLE ROW LEVEL SECURITY;

-- Everyone can read company metrics (public trust signals)
CREATE POLICY "Anyone can view company metrics"
  ON company_metrics
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to initialize notification preferences for new users
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, email_address)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences when user signs up
DROP TRIGGER IF EXISTS on_user_created_init_preferences ON auth.users;
CREATE TRIGGER on_user_created_init_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_preferences();

-- Function to update timestamp on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at to relevant tables
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. SAMPLE DATA & TESTING
-- =====================================================

-- Insert some example notification frequencies for reference
COMMENT ON COLUMN notification_preferences.job_alert_frequency IS 
'Frequency of job alerts: instant (real-time), daily (once per day), weekly (once per week), never (disabled)';

COMMENT ON COLUMN saved_searches.alert_frequency IS 
'How often to check this search for new jobs: instant, daily, or weekly';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Set up email service (Resend, SendGrid, or Supabase Edge Functions)
-- 2. Create email templates
-- 3. Build UI for notification preferences
-- 4. Build UI for saved searches
-- 5. Implement job matching logic
-- 6. Set up cron jobs for scheduled notifications
-- =====================================================

