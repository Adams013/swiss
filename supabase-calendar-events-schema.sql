-- Calendar Events Table
-- Stores user calendar events, interviews, and job fair events

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event type: 'interview', 'event', 'reminder'
  type TEXT NOT NULL DEFAULT 'event',
  
  -- Basic event information
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Interview-specific fields
  job_title TEXT,
  company_name TEXT,
  interviewer TEXT,
  meeting_url TEXT,
  notes TEXT,
  
  -- Event-specific fields
  organizer TEXT,
  url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON calendar_events(user_id, start_time);

-- Row Level Security (RLS) Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calendar events
CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own calendar events
CREATE POLICY "Users can create own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar events
CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own calendar events
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS calendar_events_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- Comments for documentation
COMMENT ON TABLE calendar_events IS 'User calendar events including interviews and job fair events';
COMMENT ON COLUMN calendar_events.type IS 'Event type: interview, event, reminder';
COMMENT ON COLUMN calendar_events.title IS 'Event title or name';
COMMENT ON COLUMN calendar_events.description IS 'Detailed event description';
COMMENT ON COLUMN calendar_events.location IS 'Event location (physical or virtual)';
COMMENT ON COLUMN calendar_events.start_time IS 'Event start date and time';
COMMENT ON COLUMN calendar_events.end_time IS 'Event end date and time';
COMMENT ON COLUMN calendar_events.job_title IS 'Job title (for interviews)';
COMMENT ON COLUMN calendar_events.company_name IS 'Company name (for interviews)';
COMMENT ON COLUMN calendar_events.interviewer IS 'Interviewer name (for interviews)';
COMMENT ON COLUMN calendar_events.meeting_url IS 'Virtual meeting URL (for online interviews)';
COMMENT ON COLUMN calendar_events.notes IS 'Personal notes or preparation reminders';
COMMENT ON COLUMN calendar_events.organizer IS 'Event organizer (for job fairs, networking events)';
COMMENT ON COLUMN calendar_events.url IS 'Event website or registration URL';

