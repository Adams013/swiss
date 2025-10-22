-- =====================================================
-- AI Chat & Calendar Integration Schema
-- =====================================================
-- Stores AI chat conversations and calendar events
-- =====================================================

-- =====================================================
-- 1. CHAT CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation data
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"role": "user", "content": "...", "timestamp": "..."}, ...]
  
  -- Topic/category
  topic VARCHAR(100), -- 'salary', 'tax', 'job_description', 'interview', 'general'
  
  -- Metadata
  is_resolved BOOLEAN DEFAULT false,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_topic ON chat_conversations(topic);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at);

-- =====================================================
-- 2. CALENDAR EVENTS (Interview tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  
  -- Type of event
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'interview',
    'job_fair',
    'networking',
    'company_visit',
    'career_event',
    'other'
  )),
  
  -- Related entities
  job_id UUID, -- If related to a specific job
  company_id UUID, -- If related to a specific company
  
  -- Time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Europe/Zurich',
  
  -- Meeting details
  meeting_url TEXT, -- Zoom/Meet link
  interviewer_name VARCHAR(255),
  interviewer_email VARCHAR(255),
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'canceled',
    'completed',
    'no_show'
  )),
  
  -- Notes
  preparation_notes TEXT,
  post_event_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Chat conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat conversations"
  ON chat_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Calendar events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_ai_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_timestamp();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_timestamp();

-- Get upcoming events for user
CREATE OR REPLACE FUNCTION get_upcoming_events(check_user_id UUID, days_ahead INT DEFAULT 7)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  start_time TIMESTAMP WITH TIME ZONE,
  event_type VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.title,
    ce.start_time,
    ce.event_type,
    ce.status
  FROM calendar_events ce
  WHERE ce.user_id = check_user_id
  AND ce.start_time >= NOW()
  AND ce.start_time <= NOW() + (days_ahead || ' days')::INTERVAL
  AND ce.status IN ('scheduled', 'confirmed')
  ORDER BY ce.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Full text search on chat messages (optional, for future search feature)
CREATE INDEX IF NOT EXISTS idx_chat_messages_fulltext 
  ON chat_conversations 
  USING GIN (messages jsonb_path_ops);

-- Upcoming events optimization
CREATE INDEX IF NOT EXISTS idx_calendar_events_upcoming 
  ON calendar_events(user_id, start_time) 
  WHERE status IN ('scheduled', 'confirmed');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Deploy AI Chat Edge Function
-- 2. Set OPENAI_API_KEY environment variable
-- 3. Integrate AIChat component into your app
-- 4. Add calendar integration to job/interview flows
-- =====================================================

COMMENT ON TABLE chat_conversations IS 'AI chat conversation history for users';
COMMENT ON TABLE calendar_events IS 'User calendar events (interviews, job fairs, etc.)';

