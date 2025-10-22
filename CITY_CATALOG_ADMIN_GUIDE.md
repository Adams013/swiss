# Swiss Cities Catalog - Administration Guide

## Overview

The city catalog has been made extensible. Cities are now loaded from Supabase instead of being hard-coded, allowing administrators to add, update, or remove cities without deploying new code.

## Key Benefits

✅ **No Code Deploys**: Add new cities instantly via database  
✅ **Live Updates**: Map automatically reflects changes  
✅ **Smart Matching**: Configurable aliases and regex patterns  
✅ **Fallback Support**: Graceful degradation if Supabase unavailable  
✅ **Priority System**: Control which cities match first  
✅ **Future-Proof**: Extensible metadata field for future features  

---

## Database Schema

### Table: `swiss_cities`

```sql
CREATE TABLE swiss_cities (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields
  city_key VARCHAR(100) UNIQUE NOT NULL,     -- e.g., 'Zurich'
  display_name VARCHAR(255) NOT NULL,         -- e.g., 'Zürich'
  latitude DECIMAL(10, 7) NOT NULL,           -- 47.3769
  longitude DECIMAL(10, 7) NOT NULL,          -- 8.5417
  
  -- Matching configuration
  aliases TEXT[] DEFAULT '{}',                -- ['Zürich', 'Zuerich']
  match_patterns TEXT[] DEFAULT '{}',         -- ['^zurich.*', '.*zürich.*']
  
  -- Metadata
  canton VARCHAR(100),
  postal_codes TEXT[] DEFAULT '{}',
  is_remote BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- Flexible extension
  metadata JSONB DEFAULT '{}'::jsonb
);
```

---

## Adding a New City

### Option 1: SQL Insert (Recommended for Bulk)

```sql
INSERT INTO swiss_cities (
  city_key,
  display_name,
  latitude,
  longitude,
  aliases,
  canton,
  is_active,
  priority
) VALUES (
  'Winterthur',                                      -- Unique key
  'Winterthur',                                      -- Display name
  47.4984,                                           -- Latitude
  8.7243,                                            -- Longitude
  ARRAY['Wintertur', 'Winti'],                      -- Aliases
  'Canton of Zurich',                                -- Canton
  TRUE,                                              -- Active
  60                                                 -- Priority
);
```

### Option 2: Supabase Dashboard

1. Navigate to your Supabase project
2. Go to **Table Editor** → `swiss_cities`
3. Click **Insert row**
4. Fill in the fields:
   - **city_key**: `Winterthur` (must be unique)
   - **display_name**: `Winterthur`
   - **latitude**: `47.4984`
   - **longitude**: `8.7243`
   - **aliases**: `{"Wintertur", "Winti"}` (use JSON array format)
   - **priority**: `60`
   - **is_active**: `true`
5. Click **Save**

### Option 3: API (For Programmatic Access)

```javascript
import { supabase } from './supabaseClient';

async function addCity() {
  const { data, error } = await supabase
    .from('swiss_cities')
    .insert({
      city_key: 'Winterthur',
      display_name: 'Winterthur',
      latitude: 47.4984,
      longitude: 8.7243,
      aliases: ['Wintertur', 'Winti'],
      canton: 'Canton of Zurich',
      is_active: true,
      priority: 60,
    })
    .select();

  if (error) {
    console.error('Error adding city:', error);
  } else {
    console.log('City added:', data);
  }
}
```

---

## Field Descriptions

### city_key
- **Type**: String (unique identifier)
- **Purpose**: Used in code and URLs
- **Format**: PascalCase or kebab-case
- **Examples**: `Zurich`, `St. Gallen`, `La Chaux-de-Fonds`
- **Important**: Must be URL-safe, no special characters

### display_name
- **Type**: String
- **Purpose**: Human-readable name shown on map
- **Format**: Any Unicode characters
- **Examples**: `Zürich`, `Genève`, `Neuchâtel`

### latitude / longitude
- **Type**: Decimal
- **Purpose**: GPS coordinates for map marker
- **Format**: Decimal degrees
- **Precision**: 7 decimal places recommended
- **Example**: `47.3769, 8.5417`
- **Tool**: Use [Google Maps](https://www.google.com/maps) (right-click → coordinates)

### aliases
- **Type**: Text array
- **Purpose**: Alternative names for fuzzy matching
- **Examples**:
  - `['Zürich', 'Zuerich']` for Zurich
  - `['Genève', 'Geneve']` for Geneva
  - `['Bâle']` for Basel
  - `['St Gallen', 'Sankt Gallen', 'Saint Gallen']` for St. Gallen

### match_patterns
- **Type**: Text array (regex patterns)
- **Purpose**: Advanced matching using regular expressions
- **Format**: Valid JavaScript regex (without delimiters)
- **Examples**:
  - `['^zurich.*']` - Matches anything starting with "zurich"
  - `['.*zürich.*']` - Matches "zürich" anywhere in string
  - `['z[üu]rich']` - Matches both "zürich" and "zurich"
- **Use With Caution**: Invalid regex will be logged and skipped

### priority
- **Type**: Integer
- **Purpose**: Higher priority cities are matched first
- **Recommended Values**:
  - `100` - Major cities (Zurich, Geneva, Basel, Bern)
  - `80-90` - Large cities (Lausanne, St. Gallen, Lucerne)
  - `60-70` - Medium cities
  - `40-50` - Small cities
  - `10` - Remote/Special locations

### is_remote
- **Type**: Boolean
- **Purpose**: Marks this as a "remote work" location
- **Special Behavior**: Remote cities are matched differently
- **Usually**: Only one remote city per dataset
- **Example**: `Remote (Switzerland)`

### is_active
- **Type**: Boolean
- **Purpose**: Control visibility without deleting
- **Default**: `true`
- **Use Case**: Temporarily hide a city from the map

### canton
- **Type**: String (optional)
- **Purpose**: Swiss canton name
- **Examples**: `Canton of Zurich`, `Canton of Geneva`

### postal_codes
- **Type**: Text array (optional)
- **Purpose**: Postal codes associated with this city
- **Example**: `['8000', '8001', '8002']` for Zurich

### metadata
- **Type**: JSONB (optional)
- **Purpose**: Flexible field for future extensions
- **Examples**:
  ```json
  {
    "population": 400000,
    "languages": ["German"],
    "timezone": "Europe/Zurich",
    "external_ids": {
      "wikipedia": "Zurich",
      "geonames": 2657896
    }
  }
  ```

---

## Matching Algorithm

When a job or event has a location like "Zurich, Switzerland", the system:

1. **Exact Match**: Checks if `cityLookup.byLowerKey['zurich']` exists
2. **Alias Match**: Checks if any alias matches exactly
3. **Substring Match**: Checks if location contains city key
4. **Alias Substring**: Checks if location contains any alias
5. **Regex Patterns**: Tests each regex pattern (sorted by priority)
6. **Remote Detection**: If contains "remote", "home office", etc.

Example flow for "Jobs in Zürich":
```
Input: "Zürich"
Step 1: Try exact match on "zürich" → Not found (key is "Zurich")
Step 2: Try alias match on "zürich" → MATCH! (alias: "Zürich")
Result: City key "Zurich" returned
```

---

## Common Tasks

### Update City Display Name

```sql
UPDATE swiss_cities 
SET display_name = 'Zürich'
WHERE city_key = 'Zurich';
```

### Add Aliases

```sql
UPDATE swiss_cities 
SET aliases = aliases || ARRAY['New Alias']
WHERE city_key = 'Zurich';
```

### Change Priority

```sql
UPDATE swiss_cities 
SET priority = 100
WHERE city_key = 'Zurich';
```

### Deactivate City (Hide from Map)

```sql
UPDATE swiss_cities 
SET is_active = FALSE
WHERE city_key = 'SmallTown';
```

### Bulk Import from CSV

```sql
COPY swiss_cities(city_key, display_name, latitude, longitude, priority)
FROM '/path/to/cities.csv'
DELIMITER ','
CSV HEADER;
```

---

## Debugging

### Check Which Cities Are Active

```sql
SELECT city_key, display_name, priority, is_active
FROM swiss_cities
WHERE is_active = TRUE
ORDER BY priority DESC;
```

### Find Unmatched Jobs

Run this query to see jobs that don't match any city:

```javascript
// In browser console:
const jobs = /* your jobs array */;
const { cityLookup } = useSwissCities();

const unmatched = jobs.filter(job => {
  const cityKey = resolveCityKeyForJob(job, cityLookup);
  return !cityKey;
});

console.log('Unmatched jobs:', unmatched);
unmatched.forEach(job => {
  console.log('Location fields:', {
    city: job.city,
    location: job.location,
    location_city: job.location_city,
  });
});
```

### Test Pattern Matching

```sql
-- Test a specific pattern
SELECT city_key, display_name 
FROM swiss_cities
WHERE 'Zürich, Switzerland' ILIKE '%' || city_key || '%';
```

---

## Performance Considerations

### Indexing

The table already has indexes on:
- `city_key` (unique)
- `is_active` (partial index)
- `priority` (descending)
- `is_remote`

### Caching

Cities are loaded once when the map component mounts and cached in React state. Changes require:
1. Database update
2. Page refresh **OR**
3. Manual refresh via `reload()` function

To force refresh programmatically:
```javascript
const { reload } = useSwissCities();
await reload();
```

### Fallback Behavior

If Supabase is unavailable, the app uses hard-coded fallback data (31 cities). This ensures:
- App continues to work during outages
- No user-facing errors
- Console warning logged

---

## Migration from Hard-Coded

The old hard-coded `SWISS_CITIES` object has been replaced with dynamic data. Backward compatibility is maintained:

**Before:**
```javascript
const coords = SWISS_CITIES['Zurich'];
// { lat: 47.3769, lng: 8.5417, name: 'Zurich' }
```

**After:**
```javascript
const { citiesByKey } = useSwissCities();
const coords = citiesByKey['Zurich'];
// { lat: 47.3769, lng: 8.5417, name: 'Zurich' }
```

The format is identical for backward compatibility.

---

## Security

### Row-Level Security (RLS)

- **Public users**: Can read active cities only
- **Authenticated users**: Can read all cities
- **Service role**: Full CRUD access

To grant admin access, update RLS policies or use service role key.

### Adding Admin User

```sql
-- Create admin role (example)
CREATE ROLE city_admin;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON swiss_cities TO city_admin;

-- Create policy
CREATE POLICY "Admins can manage cities"
  ON swiss_cities
  FOR ALL
  TO city_admin
  USING (TRUE)
  WITH CHECK (TRUE);
```

---

## Monitoring

### Track City Usage

```sql
-- Count jobs per city
SELECT 
  c.city_key,
  c.display_name,
  COUNT(j.id) as job_count
FROM swiss_cities c
LEFT JOIN jobs j ON j.city = c.city_key
WHERE c.is_active = TRUE
GROUP BY c.city_key, c.display_name
ORDER BY job_count DESC;
```

### Find Popular Unmatched Locations

```sql
-- Find common location strings that don't match any city
SELECT 
  location, 
  COUNT(*) as frequency
FROM jobs
WHERE location IS NOT NULL
  AND location NOT IN (SELECT city_key FROM swiss_cities)
GROUP BY location
ORDER BY frequency DESC
LIMIT 20;
```

---

## Best Practices

### Naming Conventions

- **city_key**: Use English names, consistent capitalization
- **display_name**: Use native language with proper accents
- **aliases**: Include common misspellings and variants

### Priority Guidelines

- Set higher priority for ambiguous names
- Example: "Basel" vs "Basel-Stadt" - give "Basel" higher priority

### Alias Strategy

- Include:
  - Native language spellings
  - ASCII alternatives (Zürich → Zuerich)
  - Common abbreviations (St. Gallen → St Gallen)
  - Historical names

### Pattern Strategy

- Use patterns sparingly
- Test thoroughly before deploying
- Document complex patterns in metadata

---

## Troubleshooting

### City Not Appearing on Map

**Check:**
1. `is_active = TRUE`
2. Coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
3. Jobs actually exist for that city
4. Browser console for any errors

### Jobs Not Matching City

**Check:**
1. Job location fields (city, location, location_city, etc.)
2. City aliases include common variations
3. Priority is set appropriately
4. Use browser console to debug matching

### Performance Issues

**Check:**
1. Number of active cities (should be <1000)
2. Database query performance
3. Number of regex patterns (limit to necessary ones)

---

## Future Enhancements

Potential features that can be added via the metadata field:

```json
{
  "timezone": "Europe/Zurich",
  "languages": ["German", "English"],
  "cost_of_living_index": 122,
  "startup_ecosystem_score": 85,
  "universities": ["ETH Zurich", "University of Zurich"],
  "transport_zones": ["110", "111"],
  "weather": {
    "avg_temp_summer": 24,
    "avg_temp_winter": 2
  }
}
```

---

## Support

For issues or questions:
1. Check console warnings/errors
2. Review database logs
3. Test with fallback data disabled
4. Contact development team

---

*Last updated: October 2025*

