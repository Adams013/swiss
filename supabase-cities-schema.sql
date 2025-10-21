-- Swiss Cities Configuration Table
-- This table stores city metadata for the Switzerland map visualization
-- Allows administrators to add/update cities without code deploys

CREATE TABLE IF NOT EXISTS swiss_cities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- City identification
  city_key VARCHAR(100) UNIQUE NOT NULL,  -- Unique identifier (e.g., 'Zurich', 'Geneva')
  display_name VARCHAR(255) NOT NULL,      -- Display name (e.g., 'Zürich', 'Genève')
  
  -- Coordinates for map markers
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  
  -- Matching configuration
  aliases TEXT[] DEFAULT '{}',             -- Alternative names/spellings (e.g., ['Zürich', 'Zuerich'])
  match_patterns TEXT[] DEFAULT '{}',      -- Regex patterns for matching (e.g., ['zurich.*', '.*zürich.*'])
  
  -- Metadata
  canton VARCHAR(100),                      -- Canton name
  postal_codes TEXT[] DEFAULT '{}',        -- Postal codes for this city
  is_remote BOOLEAN DEFAULT FALSE,         -- Whether this is a "remote" location
  is_active BOOLEAN DEFAULT TRUE,          -- Whether to show on map
  priority INTEGER DEFAULT 0,               -- Matching priority (higher = checked first)
  
  -- Optional metadata
  population INTEGER,
  timezone VARCHAR(50) DEFAULT 'Europe/Zurich',
  metadata JSONB DEFAULT '{}'::jsonb       -- Flexible field for future extensions
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_swiss_cities_city_key ON swiss_cities(city_key);
CREATE INDEX IF NOT EXISTS idx_swiss_cities_active ON swiss_cities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_swiss_cities_priority ON swiss_cities(priority DESC);
CREATE INDEX IF NOT EXISTS idx_swiss_cities_is_remote ON swiss_cities(is_remote);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_swiss_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER swiss_cities_updated_at
  BEFORE UPDATE ON swiss_cities
  FOR EACH ROW
  EXECUTE FUNCTION update_swiss_cities_updated_at();

-- RLS Policies (read-only for public, write for authenticated admins)
ALTER TABLE swiss_cities ENABLE ROW LEVEL SECURITY;

-- Public can read active cities
CREATE POLICY "Public can read active cities"
  ON swiss_cities
  FOR SELECT
  USING (is_active = TRUE);

-- Authenticated users can read all cities
CREATE POLICY "Authenticated users can read all cities"
  ON swiss_cities
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only service role can insert/update/delete
-- (In production, you'd create an admin role)
CREATE POLICY "Service role can manage cities"
  ON swiss_cities
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Seed data with existing cities from SwitzerlandMap
INSERT INTO swiss_cities (city_key, display_name, latitude, longitude, aliases, is_remote, priority) VALUES
  ('Zurich', 'Zurich', 47.3769, 8.5417, ARRAY['Zürich', 'Zuerich'], FALSE, 100),
  ('Geneva', 'Geneva', 46.2044, 6.1432, ARRAY['Genève', 'Geneve'], FALSE, 100),
  ('Basel', 'Basel', 47.5596, 7.5886, ARRAY['Bâle'], FALSE, 90),
  ('Bern', 'Bern', 46.9481, 7.4474, ARRAY['Berne'], FALSE, 90),
  ('Lausanne', 'Lausanne', 46.5197, 6.6323, ARRAY[], FALSE, 80),
  ('St. Gallen', 'St. Gallen', 47.4245, 9.3767, ARRAY['St Gallen', 'Sankt Gallen', 'Saint Gallen'], FALSE, 70),
  ('Lucerne', 'Lucerne', 47.0502, 8.3093, ARRAY['Luzern', 'Lucerna'], FALSE, 70),
  ('Lugano', 'Lugano', 46.0037, 8.9511, ARRAY[], FALSE, 70),
  ('Biel', 'Biel', 47.1364, 7.2472, ARRAY['Bienne', 'Biel/Bienne'], FALSE, 60),
  ('Thun', 'Thun', 46.7580, 7.6280, ARRAY[], FALSE, 50),
  ('Köniz', 'Köniz', 46.9244, 7.4142, ARRAY['Koeniz'], FALSE, 50),
  ('La Chaux-de-Fonds', 'La Chaux-de-Fonds', 47.1036, 6.8287, ARRAY['Chaux-de-Fonds'], FALSE, 50),
  ('Fribourg', 'Fribourg', 46.8065, 7.1597, ARRAY['Freiburg'], FALSE, 60),
  ('Schaffhausen', 'Schaffhausen', 47.6969, 8.6349, ARRAY[], FALSE, 50),
  ('Chur', 'Chur', 46.8499, 9.5329, ARRAY['Coira', 'Coire'], FALSE, 50),
  ('Vernier', 'Vernier', 46.2190, 6.0849, ARRAY[], FALSE, 40),
  ('Neuchâtel', 'Neuchâtel', 46.9928, 6.9319, ARRAY['Neuchatel', 'Neuenburg'], FALSE, 60),
  ('Uster', 'Uster', 47.3478, 8.7206, ARRAY[], FALSE, 40),
  ('Sion', 'Sion', 46.2290, 7.3590, ARRAY['Sitten'], FALSE, 50),
  ('Lancy', 'Lancy', 46.1898, 6.1144, ARRAY[], FALSE, 40),
  ('Emmen', 'Emmen', 47.0784, 8.3041, ARRAY[], FALSE, 40),
  ('Kriens', 'Kriens', 47.0364, 8.2814, ARRAY[], FALSE, 40),
  ('Rapperswil-Jona', 'Rapperswil-Jona', 47.2266, 8.8220, ARRAY['Rapperswil'], FALSE, 40),
  ('Dietikon', 'Dietikon', 47.4040, 8.4000, ARRAY[], FALSE, 40),
  ('Montreux', 'Montreux', 46.4330, 6.9114, ARRAY[], FALSE, 50),
  ('Frauenfeld', 'Frauenfeld', 47.5564, 8.8986, ARRAY[], FALSE, 40),
  ('Wetzikon', 'Wetzikon', 47.3234, 8.7977, ARRAY[], FALSE, 40),
  ('Baar', 'Baar', 47.1960, 8.5294, ARRAY[], FALSE, 40),
  ('Riehen', 'Riehen', 47.5848, 7.6514, ARRAY[], FALSE, 40),
  ('Carouge', 'Carouge', 46.1833, 6.1333, ARRAY[], FALSE, 40),
  ('Remote', 'Remote (Switzerland)', 46.8182, 8.2275, ARRAY['Home Office', 'Work from Home', 'Remote work'], TRUE, 10)
ON CONFLICT (city_key) DO NOTHING;

COMMENT ON TABLE swiss_cities IS 'Configuration table for Swiss cities used in map visualization';
COMMENT ON COLUMN swiss_cities.city_key IS 'Unique identifier used in code (should be URL-safe)';
COMMENT ON COLUMN swiss_cities.display_name IS 'Human-readable name shown on the map';
COMMENT ON COLUMN swiss_cities.aliases IS 'Alternative names/spellings for fuzzy matching';
COMMENT ON COLUMN swiss_cities.match_patterns IS 'Regular expression patterns for advanced matching';
COMMENT ON COLUMN swiss_cities.priority IS 'Higher priority cities are matched first (useful for disambiguation)';
COMMENT ON COLUMN swiss_cities.is_remote IS 'Special flag for remote/work-from-home locations';
COMMENT ON COLUMN swiss_cities.metadata IS 'Flexible JSON field for storing additional city data';

