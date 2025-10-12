-- Events table for SwissStartup Connect
-- This table stores events posted by startups

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_startup_id ON events(startup_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Anyone can read events
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

-- Only startups can insert events
CREATE POLICY "Startups can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = events.startup_id 
      AND startups.id = auth.uid()
    )
  );

-- Only the event creator can update their events
CREATE POLICY "Startups can update their own events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = events.startup_id 
      AND startups.id = auth.uid()
    )
  );

-- Only the event creator can delete their events
CREATE POLICY "Startups can delete their own events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = events.startup_id 
      AND startups.id = auth.uid()
    )
  );

-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event posters
CREATE POLICY "Event posters are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-posters');

CREATE POLICY "Startups can upload event posters" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-posters' AND
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = auth.uid()
    )
  );

CREATE POLICY "Startups can update their event posters" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-posters' AND
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = auth.uid()
    )
  );

CREATE POLICY "Startups can delete their event posters" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-posters' AND
    EXISTS (
      SELECT 1 FROM startups 
      WHERE startups.id = auth.uid()
    )
  );
