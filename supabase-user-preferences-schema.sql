-- =====================================================
-- User Preferences Table for Job Recommendations
-- =====================================================
-- This table stores user preferences learned from their behavior
-- Used to power personalized job recommendations

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Location preferences (learned from viewed/applied jobs)
  preferred_locations TEXT[] DEFAULT '{}',
  
  -- Role/skill preferences (learned from tags of interest)
  preferred_roles TEXT[] DEFAULT '{}',
  
  -- Salary expectations
  salary_expectation JSONB DEFAULT '{}'::jsonb,
  -- Example: {"min": 80000, "max": 120000, "currency": "CHF", "period": "yearly"}
  
  -- Work arrangement preferences
  preferred_work_arrangements TEXT[] DEFAULT '{}', -- ['remote', 'hybrid', 'onsite']
  
  -- Employment type preferences
  preferred_employment_types TEXT[] DEFAULT '{}', -- ['full-time', 'part-time', 'internship']
  
  -- Company stage preferences
  preferred_company_stages TEXT[] DEFAULT '{}', -- ['seed', 'series-a', 'series-b', 'growth']
  
  -- Industry preferences
  preferred_industries TEXT[] DEFAULT '{}',
  
  -- Notification preferences (synced with notification_preferences table)
  job_alert_enabled BOOLEAN DEFAULT true,
  job_alert_frequency VARCHAR(50) DEFAULT 'daily',
  
  -- Learning weights (how much to trust each signal)
  weights JSONB DEFAULT '{
    "saved_jobs": 0.25,
    "applied_jobs": 0.30,
    "viewed_jobs": 0.15,
    "profile_match": 0.20,
    "location": 0.05,
    "salary": 0.05
  }'::jsonb,
  
  -- Metadata
  last_updated_from_behavior_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can create own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to initialize user preferences when user signs up
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS on_user_created_init_user_preferences ON auth.users;
CREATE TRIGGER on_user_created_init_user_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_preferences();

-- Function to update timestamp on changes
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get user preferences
COMMENT ON TABLE user_preferences IS 
'Stores user preferences learned from behavior for personalized job recommendations';

-- Example: Get preferences for a user
-- SELECT * FROM user_preferences WHERE user_id = 'user-uuid-here';

-- Example: Update salary expectation
-- UPDATE user_preferences 
-- SET salary_expectation = '{"min": 90000, "max": 130000}'::jsonb
-- WHERE user_id = 'user-uuid-here';

-- Example: Add a preferred location
-- UPDATE user_preferences 
-- SET preferred_locations = array_append(preferred_locations, 'Zurich')
-- WHERE user_id = 'user-uuid-here'
-- AND NOT ('Zurich' = ANY(preferred_locations));

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

