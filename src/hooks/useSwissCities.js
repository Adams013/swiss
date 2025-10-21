import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSwissCities, buildCityLookup } from '../services/supabaseCities';

// Fallback cities (matches the hard-coded SWISS_CITIES from SwitzerlandMap)
const FALLBACK_CITIES = [
  { key: 'Zurich', name: 'Zurich', lat: 47.3769, lng: 8.5417, aliases: ['Zürich', 'Zuerich'], isRemote: false, priority: 100 },
  { key: 'Geneva', name: 'Geneva', lat: 46.2044, lng: 6.1432, aliases: ['Genève', 'Geneve'], isRemote: false, priority: 100 },
  { key: 'Basel', name: 'Basel', lat: 47.5596, lng: 7.5886, aliases: ['Bâle'], isRemote: false, priority: 90 },
  { key: 'Bern', name: 'Bern', lat: 46.9481, lng: 7.4474, aliases: ['Berne'], isRemote: false, priority: 90 },
  { key: 'Lausanne', name: 'Lausanne', lat: 46.5197, lng: 6.6323, aliases: [], isRemote: false, priority: 80 },
  { key: 'St. Gallen', name: 'St. Gallen', lat: 47.4245, lng: 9.3767, aliases: ['St Gallen', 'Sankt Gallen'], isRemote: false, priority: 70 },
  { key: 'Lucerne', name: 'Lucerne', lat: 47.0502, lng: 8.3093, aliases: ['Luzern'], isRemote: false, priority: 70 },
  { key: 'Lugano', name: 'Lugano', lat: 46.0037, lng: 8.9511, aliases: [], isRemote: false, priority: 70 },
  { key: 'Biel', name: 'Biel', lat: 47.1364, lng: 7.2472, aliases: ['Bienne', 'Biel/Bienne'], isRemote: false, priority: 60 },
  { key: 'Thun', name: 'Thun', lat: 46.7580, lng: 7.6280, aliases: [], isRemote: false, priority: 50 },
  { key: 'Köniz', name: 'Köniz', lat: 46.9244, lng: 7.4142, aliases: ['Koeniz'], isRemote: false, priority: 50 },
  { key: 'La Chaux-de-Fonds', name: 'La Chaux-de-Fonds', lat: 47.1036, lng: 6.8287, aliases: ['Chaux-de-Fonds'], isRemote: false, priority: 50 },
  { key: 'Fribourg', name: 'Fribourg', lat: 46.8065, lng: 7.1597, aliases: ['Freiburg'], isRemote: false, priority: 60 },
  { key: 'Schaffhausen', name: 'Schaffhausen', lat: 47.6969, lng: 8.6349, aliases: [], isRemote: false, priority: 50 },
  { key: 'Chur', name: 'Chur', lat: 46.8499, lng: 9.5329, aliases: ['Coira'], isRemote: false, priority: 50 },
  { key: 'Vernier', name: 'Vernier', lat: 46.2190, lng: 6.0849, aliases: [], isRemote: false, priority: 40 },
  { key: 'Neuchâtel', name: 'Neuchâtel', lat: 46.9928, lng: 6.9319, aliases: ['Neuchatel', 'Neuenburg'], isRemote: false, priority: 60 },
  { key: 'Uster', name: 'Uster', lat: 47.3478, lng: 8.7206, aliases: [], isRemote: false, priority: 40 },
  { key: 'Sion', name: 'Sion', lat: 46.2290, lng: 7.3590, aliases: ['Sitten'], isRemote: false, priority: 50 },
  { key: 'Lancy', name: 'Lancy', lat: 46.1898, lng: 6.1144, aliases: [], isRemote: false, priority: 40 },
  { key: 'Emmen', name: 'Emmen', lat: 47.0784, lng: 8.3041, aliases: [], isRemote: false, priority: 40 },
  { key: 'Kriens', name: 'Kriens', lat: 47.0364, lng: 8.2814, aliases: [], isRemote: false, priority: 40 },
  { key: 'Rapperswil-Jona', name: 'Rapperswil-Jona', lat: 47.2266, lng: 8.8220, aliases: ['Rapperswil'], isRemote: false, priority: 40 },
  { key: 'Dietikon', name: 'Dietikon', lat: 47.4040, lng: 8.4000, aliases: [], isRemote: false, priority: 40 },
  { key: 'Montreux', name: 'Montreux', lat: 46.4330, lng: 6.9114, aliases: [], isRemote: false, priority: 50 },
  { key: 'Frauenfeld', name: 'Frauenfeld', lat: 47.5564, lng: 8.8986, aliases: [], isRemote: false, priority: 40 },
  { key: 'Wetzikon', name: 'Wetzikon', lat: 47.3234, lng: 8.7977, aliases: [], isRemote: false, priority: 40 },
  { key: 'Baar', name: 'Baar', lat: 47.1960, lng: 8.5294, aliases: [], isRemote: false, priority: 40 },
  { key: 'Riehen', name: 'Riehen', lat: 47.5848, lng: 7.6514, aliases: [], isRemote: false, priority: 40 },
  { key: 'Carouge', name: 'Carouge', lat: 46.1833, lng: 6.1333, aliases: [], isRemote: false, priority: 40 },
  { key: 'Remote', name: 'Remote (Switzerland)', lat: 46.8182, lng: 8.2275, aliases: ['Home Office', 'Work from Home'], isRemote: true, priority: 10 },
];

const REMOTE_MATCHER = /remote|home\s*office|work\s*from\s*home/i;

/**
 * Custom hook to manage Swiss cities data
 * Fetches cities from Supabase with fallback to hard-coded data
 * 
 * @returns {Object} Cities state and utilities
 */
export const useSwissCities = () => {
  const [cities, setCities] = useState(FALLBACK_CITIES);
  const [loading, setLoading] = useState(true);
  const [fallbackActive, setFallbackActive] = useState(true);
  const [error, setError] = useState(null);

  // Build city lookup for efficient matching
  const cityLookup = useMemo(() => buildCityLookup(cities), [cities]);

  // Build legacy format for backward compatibility
  const citiesByKey = useMemo(() => {
    const result = {};
    cities.forEach(city => {
      result[city.key] = {
        lat: city.lat,
        lng: city.lng,
        name: city.name,
      };
    });
    return result;
  }, [cities]);

  // Load cities from Supabase
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadCities = async () => {
      setLoading(true);

      const result = await fetchSwissCities({
        fallbackCities: FALLBACK_CITIES,
        signal: controller.signal,
      });

      if (cancelled) {
        return;
      }

      if (result.fallbackUsed) {
        setCities(FALLBACK_CITIES);
        setFallbackActive(true);
        setError(result.error);
      } else {
        setCities(result.cities);
        setFallbackActive(false);
        setError(null);
      }

      setLoading(false);
    };

    loadCities();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Reload cities (for manual refresh)
  const reload = useCallback(async () => {
    setLoading(true);

    const result = await fetchSwissCities({
      fallbackCities: FALLBACK_CITIES,
    });

    if (result.fallbackUsed) {
      setCities(FALLBACK_CITIES);
      setFallbackActive(true);
      setError(result.error);
    } else {
      setCities(result.cities);
      setFallbackActive(false);
      setError(null);
    }

    setLoading(false);
  }, []);

  return {
    cities,
    citiesByKey,
    cityLookup,
    loading,
    fallbackActive,
    error,
    reload,
  };
};

