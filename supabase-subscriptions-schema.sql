-- =====================================================
-- Premium Subscription System Schema
-- =====================================================
-- Manages premium subscriptions with Stripe integration
-- Features: No ads, profile views, enhanced visibility
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan identification
  plan_id VARCHAR(50) UNIQUE NOT NULL, -- 'premium_monthly', 'premium_quarterly', 'premium_yearly'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing (in CHF, stored as cents to avoid floating point issues)
  price_cents INT NOT NULL, -- 790 for monthly, 2000 for quarterly, 7500 for yearly
  currency VARCHAR(3) DEFAULT 'CHF',
  billing_period VARCHAR(20) NOT NULL, -- 'month', 'quarter', 'year'
  billing_interval INT DEFAULT 1, -- How many periods (e.g., 1 month, 3 months, 12 months)
  
  -- Stripe integration
  stripe_price_id VARCHAR(255), -- Stripe Price ID
  stripe_product_id VARCHAR(255), -- Stripe Product ID
  
  -- Features
  features JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "no_ads": true,
  --   "profile_views": true,
  --   "enhanced_visibility": true,
  --   "featured_jobs": true,
  --   "advanced_analytics": true
  -- }
  
  -- Plan status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_id ON subscription_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- =====================================================
-- 2. USER SUBSCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'canceled',
    'past_due',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'unpaid'
  )),
  
  -- Billing information
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Trial period
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  
  -- Stripe integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  
  -- Payment method
  payment_method_brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  payment_method_last4 VARCHAR(4),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One active subscription per user
  UNIQUE(user_id, status) WHERE status = 'active'
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id, status) WHERE status = 'active';

-- =====================================================
-- 3. PROFILE VIEWS (Premium Feature)
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who viewed whom
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for anonymous
  viewed_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- View details
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  referrer_source VARCHAR(100), -- 'search', 'recommendation', 'company_page', etc.
  
  -- Viewer information (captured at time of view)
  viewer_type VARCHAR(50), -- 'student', 'startup', 'anonymous'
  viewer_company_name VARCHAR(255), -- If startup viewer
  
  -- Engagement
  time_spent_seconds INT,
  clicked_contact BOOLEAN DEFAULT false,
  
  -- Prevent duplicate tracking in same session
  UNIQUE(viewer_id, viewed_profile_id, session_id)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_profile ON profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- =====================================================
-- 4. PROFILE SEARCHES (Premium Feature)
-- =====================================================
-- Track when a profile appears in search results

CREATE TABLE IF NOT EXISTS profile_search_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profile that appeared in search
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Who searched
  searcher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Search details
  search_query TEXT,
  search_filters JSONB DEFAULT '{}'::jsonb,
  search_position INT, -- Position in search results (1-indexed)
  
  -- Engagement
  was_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  appeared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_searches_profile ON profile_search_appearances(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_searches_searcher ON profile_search_appearances(searcher_id);
CREATE INDEX IF NOT EXISTS idx_profile_searches_appeared_at ON profile_search_appearances(appeared_at);

-- =====================================================
-- 5. FEATURED JOBS (Premium Feature)
-- =====================================================
-- Track which jobs are featured/promoted

CREATE TABLE IF NOT EXISTS featured_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  
  -- Featured period
  featured_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  featured_until TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Placement
  feature_type VARCHAR(50) DEFAULT 'premium' CHECK (feature_type IN (
    'premium',      -- Premium placement (top of search)
    'highlighted',  -- Highlighted in lists
    'homepage'      -- Featured on homepage
  )),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metrics
  extra_views INT DEFAULT 0,
  extra_applications INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Only one active feature per job at a time
  UNIQUE(job_id, is_active) WHERE is_active = true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_jobs_job_id ON featured_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_featured_jobs_active ON featured_jobs(is_active, featured_until) WHERE is_active = true;

-- =====================================================
-- 6. PAYMENT TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Transaction details
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'CHF',
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'canceled'
  )),
  
  -- Stripe details
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Payment method
  payment_method_type VARCHAR(50), -- 'card', 'sepa_debit', etc.
  payment_method_brand VARCHAR(50),
  payment_method_last4 VARCHAR(4),
  
  -- Failure information
  failure_code VARCHAR(100),
  failure_message TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment ON payment_transactions(stripe_payment_intent_id);

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Subscription Plans (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- User Subscriptions (users can only see their own)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Profile Views (viewed user can see who viewed them if premium)
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewed_profile_id);

CREATE POLICY "Anyone can create profile views"
  ON profile_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Profile Search Appearances
ALTER TABLE profile_search_appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search appearances"
  ON profile_search_appearances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create search appearances"
  ON profile_search_appearances
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Featured Jobs (public read for active)
ALTER TABLE featured_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured jobs"
  ON featured_jobs
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Payment Transactions (users can only see their own)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Check if user has active premium subscription
CREATE OR REPLACE FUNCTION is_premium_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = check_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(check_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name VARCHAR,
  status VARCHAR,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    sp.name,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = check_user_id
  AND us.status = 'active'
  ORDER BY us.current_period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update subscription timestamp
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- =====================================================
-- 9. SEED DATA - Subscription Plans
-- =====================================================

-- For Students: Keep simple premium plans
INSERT INTO subscription_plans (plan_id, name, description, price_cents, billing_period, billing_interval, features, sort_order, metadata)
VALUES 
  (
    'student_premium_monthly',
    'Student Premium',
    'Ad-free experience, see who viewed your profile, enhanced visibility',
    790, -- 7.90 CHF/month
    'month',
    1,
    '{
      "no_ads": true,
      "profile_views": true,
      "profile_searches": true,
      "enhanced_visibility": true,
      "priority_support": false
    }'::jsonb,
    1,
    '{"user_type": "student"}'::jsonb
  ),
  (
    'student_premium_quarterly',
    'Student Premium (Quarterly)',
    'Save 16% with quarterly billing',
    2000, -- 20.00 CHF for 3 months (6.66/month)
    'month',
    3,
    '{
      "no_ads": true,
      "profile_views": true,
      "profile_searches": true,
      "enhanced_visibility": true,
      "priority_support": true
    }'::jsonb,
    2,
    '{"user_type": "student"}'::jsonb
  ),
  (
    'student_premium_yearly',
    'Student Premium (Yearly)',
    'Save 26% with yearly billing',
    7500, -- 75.00 CHF for 12 months (6.25/month)
    'month',
    12,
    '{
      "no_ads": true,
      "profile_views": true,
      "profile_searches": true,
      "enhanced_visibility": true,
      "priority_support": true,
      "exclusive_events": true
    }'::jsonb,
    3,
    '{"user_type": "student"}'::jsonb
  ),
  
  -- For Employers: À la carte features
  (
    'employer_analytics',
    'Analytics Dashboard',
    'Track job performance, applicant funnels, and hiring metrics',
    4900, -- 49 CHF/month
    'month',
    1,
    '{
      "analytics_dashboard": true,
      "application_tracking": true,
      "performance_metrics": true,
      "export_reports": true
    }'::jsonb,
    10,
    '{"user_type": "employer", "feature": "analytics"}'::jsonb
  ),
  (
    'employer_talent_search',
    'Talent Search Access',
    'Search and view detailed student profiles, unlimited access',
    9900, -- 99 CHF/month
    'month',
    1,
    '{
      "talent_search": true,
      "detailed_profiles": true,
      "contact_students": true,
      "unlimited_searches": true,
      "save_candidates": true
    }'::jsonb,
    11,
    '{"user_type": "employer", "feature": "talent_search"}'::jsonb
  ),
  (
    'employer_featured_job',
    'Featured Job in Alerts',
    'One-time payment to feature a job posting in email alerts and homepage',
    11900, -- 119 CHF per posting
    'one_time',
    1,
    '{
      "featured_in_alerts": true,
      "featured_on_homepage": true,
      "priority_placement": true,
      "duration_days": 30
    }'::jsonb,
    12,
    '{"user_type": "employer", "feature": "featured_job", "is_one_time": true}'::jsonb
  )
ON CONFLICT (plan_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Set up Stripe account and get API keys
-- 2. Create Stripe Products and Prices
-- 3. Implement Stripe webhook handler
-- 4. Build subscription UI components
-- 5. Add premium features to the app
-- =====================================================

COMMENT ON TABLE subscription_plans IS 'Available subscription plans with pricing and features';
COMMENT ON TABLE user_subscriptions IS 'Active and historical user subscriptions';
COMMENT ON TABLE profile_views IS 'Track who viewed which profiles (premium feature)';
COMMENT ON TABLE profile_search_appearances IS 'Track when profiles appear in searches (premium feature)';
COMMENT ON TABLE featured_jobs IS 'Jobs with premium promotion';
COMMENT ON TABLE payment_transactions IS 'Payment history and transaction records';

