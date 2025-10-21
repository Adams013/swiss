import { supabase } from '../supabaseClient';

/**
 * Fetch Swiss cities configuration from Supabase
 * Falls back to provided fallback data if Supabase is unavailable
 * 
 * @param {Object} options - Fetch options
 * @param {Array} options.fallbackCities - Fallback city data if Supabase fails
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<Object>} Result object with cities data
 */
export const fetchSwissCities = async ({ fallbackCities = [], signal } = {}) => {
  try {
    const { data, error } = await supabase
      .from('swiss_cities')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.warn('Failed to fetch cities from Supabase:', error.message);
      return {
        cities: fallbackCities,
        fallbackUsed: true,
        error,
      };
    }

    if (!data || data.length === 0) {
      console.info('No cities found in Supabase, using fallback');
      return {
        cities: fallbackCities,
        fallbackUsed: true,
        error: null,
      };
    }

    // Transform Supabase data to the format expected by the app
    const cities = data.map(city => ({
      key: city.city_key,
      name: city.display_name,
      lat: parseFloat(city.latitude),
      lng: parseFloat(city.longitude),
      aliases: city.aliases || [],
      matchPatterns: city.match_patterns || [],
      isRemote: city.is_remote || false,
      priority: city.priority || 0,
      canton: city.canton,
      postalCodes: city.postal_codes || [],
      metadata: city.metadata || {},
    }));

    return {
      cities,
      fallbackUsed: false,
      error: null,
    };
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') {
      return {
        cities: [],
        fallbackUsed: false,
        error: new Error('Request aborted'),
      };
    }

    console.error('Error fetching Swiss cities:', error);
    return {
      cities: fallbackCities,
      fallbackUsed: true,
      error,
    };
  }
};

/**
 * Build a city lookup object for fast matching
 * Creates multiple indexes for efficient city resolution
 * 
 * @param {Array} cities - Array of city objects
 * @returns {Object} Lookup object with various indexes
 */
export const buildCityLookup = (cities) => {
  const byKey = {};
  const byLowerKey = {};
  const byAlias = {};
  const patterns = [];
  const excludingRemote = [];

  cities.forEach(city => {
    const key = city.key;
    byKey[key] = city;
    byLowerKey[key.toLowerCase()] = city;

    if (!city.isRemote) {
      excludingRemote.push(city);
    }

    // Index by aliases
    if (city.aliases && Array.isArray(city.aliases)) {
      city.aliases.forEach(alias => {
        if (alias && typeof alias === 'string') {
          byAlias[alias.toLowerCase()] = city;
        }
      });
    }

    // Compile regex patterns
    if (city.matchPatterns && Array.isArray(city.matchPatterns)) {
      city.matchPatterns.forEach(pattern => {
        try {
          patterns.push({
            regex: new RegExp(pattern, 'i'),
            city,
          });
        } catch (error) {
          console.warn(`Invalid regex pattern for ${city.key}:`, pattern);
        }
      });
    }
  });

  return {
    byKey,
    byLowerKey,
    byAlias,
    patterns,
    excludingRemote,
    all: cities,
  };
};

/**
 * Resolve city from location candidates using lookup
 * 
 * @param {Array<string>} candidates - Array of location strings to check
 * @param {Object} lookup - City lookup object from buildCityLookup
 * @param {RegExp} remotePattern - Pattern to match remote locations
 * @returns {Object|null} Matched city object or null
 */
export const resolveCityFromCandidates = (candidates, lookup, remotePattern) => {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // 1. Try exact match by key (case-insensitive)
  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase();
    const city = lookup.byLowerKey[lowered];
    if (city) {
      return city;
    }
  }

  // 2. Try exact match by alias
  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase();
    const city = lookup.byAlias[lowered];
    if (city) {
      return city;
    }
  }

  // 3. Try substring match (excluding remote)
  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase();
    const match = lookup.excludingRemote.find(city =>
      lowered.includes(city.key.toLowerCase())
    );
    if (match) {
      return match;
    }
  }

  // 4. Try alias substring match
  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase();
    for (const [alias, city] of Object.entries(lookup.byAlias)) {
      if (lowered.includes(alias) && !city.isRemote) {
        return city;
      }
    }
  }

  // 5. Try regex patterns (sorted by priority)
  for (const candidate of candidates) {
    for (const { regex, city } of lookup.patterns) {
      if (regex.test(candidate)) {
        return city;
      }
    }
  }

  // 6. Check for remote hints
  if (remotePattern) {
    const hasRemoteHint = candidates.some(candidate => remotePattern.test(candidate));
    if (hasRemoteHint) {
      const remoteCity = lookup.all.find(city => city.isRemote);
      if (remoteCity) {
        return remoteCity;
      }
    }
  }

  return null;
};

