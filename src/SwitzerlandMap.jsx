import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Briefcase, Calendar } from 'lucide-react';
import { useSwissCities } from './hooks/useSwissCities';
import { resolveCityFromCandidates } from './services/supabaseCities';

// Fix for default markers in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const REMOTE_MATCHER = /remote|home\s*office|work\s*from\s*home/i;

const DEFAULT_MAP_CENTER = Object.freeze([46.8182, 8.2275]);
const DEFAULT_MAP_ZOOM = 8;
const FALLBACK_TRANSLATE = (_key, fallback) => fallback;

/**
 * Collect location candidates from a job object
 * @param {Object} job - Job object with location fields
 * @returns {Array<string>} Array of location candidates
 */
const collectLocationCandidates = (job) => {
  const values = new Set();
  const addValue = (value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    values.add(trimmed);

    trimmed
      .split(/[,/|•()-]/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => values.add(segment));
  };

  [
    job?.city,
    job?.location_city,
    job?.location,
    job?.location_display,
    job?.location_name,
    job?.address_city,
    job?.headquarters_city,
    job?.primary_city,
    job?.primary_location,
  ].forEach(addValue);

  return Array.from(values);
};

/**
 * Resolve city key for a job using dynamic city lookup
 * @param {Object} job - Job object
 * @param {Object} cityLookup - City lookup object from useSwissCities
 * @returns {string|null} City key or null
 */
export const resolveCityKeyForJob = (job, cityLookup) => {
  if (!cityLookup) {
    return null;
  }

  const candidates = collectLocationCandidates(job);
  if (candidates.length === 0) {
    return null;
  }

  const city = resolveCityFromCandidates(candidates, cityLookup, REMOTE_MATCHER);
  return city ? city.key : null;
};

const MARKER_SIZE = 44;

const buildMarkerIcon = (count, variant, isSelected = false) => {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  const classes = ['ssc__map-marker', `ssc__map-marker--${variant}`];

  if (isSelected) {
    classes.push('ssc__map-marker--selected');
  }

  return L.divIcon({
    html: `<div class="${classes.join(' ')}"><span>${safeCount}</span></div>`,
    className: 'ssc__map-marker-container',
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -(MARKER_SIZE / 2) + 6],
  });
};

/**
 * Resolve city key for an event using dynamic city lookup
 * @param {Object} event - Event object
 * @param {Object} cityLookup - City lookup object from useSwissCities
 * @returns {string|null} City key or null
 */
export const resolveCityKeyForEvent = (event, cityLookup) => {
  if (!event || !cityLookup) {
    return null;
  }

  const candidates = new Set();
  const addCandidate = (value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    candidates.add(trimmed);
    trimmed
      .split(/[,/|•()-]/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => candidates.add(segment));
  };

  [
    event.city,
    event.location,
    event.street_address,
    event.location_name,
  ].forEach(addCandidate);

  const city = resolveCityFromCandidates(Array.from(candidates), cityLookup, null);
  return city ? city.key : null;
};

const SwitzerlandMap = ({
  jobs = [],
  events = [],
  onJobCityClick,
  onEventCityClick,
  selectedJobCity,
  selectedEventCity,
  panelOpen = false,
  visibleLayer = 'jobs',
  translate = FALLBACK_TRANSLATE,
}) => {
  // Load cities dynamically from Supabase
  const { citiesByKey, cityLookup, loading: citiesLoading, fallbackActive } = useSwissCities();

  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);
  const pendingFrameRef = useRef(null);
  const pendingTimeoutsRef = useRef(new Set());

  const ensureMapInteractions = useCallback(() => {
    if (!mapRef.current) {
      return;
    }

    const mapInstance = mapRef.current;
    if (mapInstance.scrollWheelZoom?.enabled()) {
      return;
    }

    mapInstance.scrollWheelZoom?.enable();
    mapInstance.doubleClickZoom?.enable();
    mapInstance.touchZoom?.enable();
    mapInstance.boxZoom?.enable();
    mapInstance.keyboard?.enable();
    mapInstance.dragging?.enable();
  }, []);

  const showJobs = visibleLayer === 'jobs';
  const showEvents = visibleLayer === 'events';

  // Log if using fallback data
  useEffect(() => {
    if (!citiesLoading && fallbackActive) {
      console.info('SwitzerlandMap: Using fallback city data (Supabase unavailable)');
    }
  }, [citiesLoading, fallbackActive]);

  const clearScheduledInvalidation = useCallback(() => {
    if (pendingFrameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(pendingFrameRef.current);
      pendingFrameRef.current = null;
    }
    if (pendingTimeoutsRef.current.size > 0) {
      pendingTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingTimeoutsRef.current.clear();
    }
  }, []);

  const scheduleInvalidateSize = useCallback(
    (options = true) => {
      if (!mapRef.current) {
        return;
      }

      const resolvedOptions =
        typeof options === 'boolean'
          ? { immediate: true, trailingDelays: options ? [160, 360, 720] : [] }
          : {
              immediate: true,
              trailingDelays: [160, 360, 720],
              ...options,
            };

      clearScheduledInvalidation();

      const invalidate = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ animate: false });
        }
      };

      if (resolvedOptions.immediate) {
        invalidate();
      }

      if (typeof requestAnimationFrame === 'function') {
        pendingFrameRef.current = requestAnimationFrame(() => {
          pendingFrameRef.current = null;
          invalidate();
        });
      } else {
        invalidate();
      }

      resolvedOptions.trailingDelays.forEach((delay) => {
        const timeoutId = setTimeout(() => {
          pendingTimeoutsRef.current.delete(timeoutId);
          invalidate();
        }, delay);
        pendingTimeoutsRef.current.add(timeoutId);
      });
    },
    [clearScheduledInvalidation]
  );

  useEffect(() => {
    // Set map as loaded immediately since CSS is imported statically
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (mapLoaded) {
      ensureMapInteractions();
    }
  }, [mapLoaded, ensureMapInteractions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      scheduleInvalidateSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (viewport) {
        viewport.removeEventListener('resize', handleResize);
      }
    };
  }, [scheduleInvalidateSize]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      scheduleInvalidateSize();
    });

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [scheduleInvalidateSize]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) {
        scheduleInvalidateSize();
      }
    });

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [scheduleInvalidateSize]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      return;
    }

    scheduleInvalidateSize();

    const timeoutId = setTimeout(() => {
      scheduleInvalidateSize(false);
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mapLoaded, panelOpen, scheduleInvalidateSize, visibleLayer]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleInvalidateSize();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scheduleInvalidateSize]);

  useEffect(() => {
    return () => {
      clearScheduledInvalidation();
    };
  }, [clearScheduledInvalidation]);

  // Group jobs by city using dynamic city lookup
  const jobsByCity = useMemo(() => {
    if (!showJobs || !cityLookup) {
      return {};
    }
    const grouped = {};

    jobs.forEach((job) => {
      const cityKey = resolveCityKeyForJob(job, cityLookup);
      if (!cityKey || !citiesByKey[cityKey]) {
        return;
      }

      if (!grouped[cityKey]) {
        grouped[cityKey] = [];
      }
      grouped[cityKey].push(job);
    });

    return grouped;
  }, [jobs, showJobs, cityLookup, citiesByKey]);

  const eventsByCity = useMemo(() => {
    if (!showEvents || !cityLookup) {
      return {};
    }
    const grouped = {};

    events.forEach((event) => {
      const cityKey = resolveCityKeyForEvent(event, cityLookup);
      if (!cityKey || !citiesByKey[cityKey]) {
        return;
      }

      if (!grouped[cityKey]) {
        grouped[cityKey] = [];
      }
      grouped[cityKey].push(event);
    });

    return grouped;
  }, [events, showEvents, cityLookup, citiesByKey]);

  // Create city markers with job counts using dynamic city data
  const cityMarkers = useMemo(() => {
    if (!showJobs || !citiesByKey) {
      return [];
    }

    return Object.entries(jobsByCity)
      .map(([cityName, cityJobs]) => {
        const coords = citiesByKey[cityName];
        if (!coords) {
          return null;
        }

        const jobCount = cityJobs.length;
        if (jobCount === 0) {
          return null;
        }

        return (
          <Marker
            key={`jobs-${cityName}`}
            position={[coords.lat, coords.lng]}
            icon={buildMarkerIcon(jobCount, 'jobs', cityName === selectedJobCity)}
            eventHandlers={{
              click: () => onJobCityClick && onJobCityClick(cityName, cityJobs),
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{citiesByKey[cityName]?.name || cityName}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {translate(
                      'map.popup.jobsCount',
                      jobCount === 1 ? '1 job' : `${jobCount} jobs`,
                      { count: jobCount }
                    )}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean);
    }, [jobsByCity, onJobCityClick, selectedJobCity, showJobs, citiesByKey]);

  const eventMarkers = useMemo(() => {
    if (!showEvents || !citiesByKey) {
      return [];
    }

    return Object.entries(eventsByCity)
      .map(([cityName, cityEvents]) => {
        const coords = citiesByKey[cityName];
        if (!coords) {
          return null;
        }

        const eventCount = cityEvents.length;
        if (eventCount === 0) {
          return null;
        }

        const previewEvents = cityEvents.slice(0, 3);
        const remainingCount = Math.max(eventCount - previewEvents.length, 0);

        return (
          <Marker
            key={`event-${cityName}`}
            position={[coords.lat, coords.lng]}
            icon={buildMarkerIcon(eventCount, 'events', cityName === selectedEventCity)}
            zIndexOffset={400}
            eventHandlers={{
              click: () => onEventCityClick && onEventCityClick(cityName, cityEvents),
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{citiesByKey[cityName]?.name || cityName}</span>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {translate(
                      'map.popup.eventsCount',
                      eventCount === 1 ? '1 event' : `${eventCount} events`,
                      { count: eventCount }
                    )}
                  </span>
                </div>
                <ul className="text-left text-sm space-y-1">
                  {previewEvents.map((event) => {
                    const timeValue = event.event_time ? String(event.event_time) : '';
                    const formattedTime = timeValue
                      ? timeValue.length > 5
                        ? timeValue.slice(0, 5)
                        : timeValue
                      : '';
                    return (
                      <li key={event.id} className="leading-snug">
                        <span className="font-medium">{event.title}</span>
                        {formattedTime && <span className="text-xs text-gray-500"> · {formattedTime}</span>}
                      </li>
                    );
                  })}
                  {remainingCount > 0 && (
                    <li className="text-xs text-gray-500">
                      {translate('map.popup.moreEvents', `+${remainingCount} more`, {
                        count: remainingCount,
                      })}
                    </li>
                  )}
                </ul>
              </div>
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean);
    }, [eventsByCity, onEventCityClick, selectedEventCity, showEvents, citiesByKey]);

  useEffect(() => {
    if (!showJobs || !selectedJobCity || !mapRef.current || !citiesByKey) {
      return;
    }
    const cityMeta = citiesByKey[selectedJobCity];
    if (!cityMeta) {
      return;
    }
    const targetZoom = Math.max(mapRef.current.getZoom(), 9);
    mapRef.current.flyTo([cityMeta.lat, cityMeta.lng], targetZoom, { duration: 0.6 });
  }, [selectedJobCity, showJobs, citiesByKey]);

  useEffect(() => {
    if (!showEvents || !selectedEventCity || !mapRef.current || !citiesByKey) {
      return;
    }
    const cityMeta = citiesByKey[selectedEventCity];
    if (!cityMeta) {
      return;
    }
    const targetZoom = Math.max(mapRef.current.getZoom(), 9);
    mapRef.current.flyTo([cityMeta.lat, cityMeta.lng], targetZoom, { duration: 0.6 });
  }, [selectedEventCity, showEvents, citiesByKey]);

  if (!mapLoaded || citiesLoading) {
    return (
      <div className={`ssc__map-wrapper ${panelOpen ? 'ssc__map-wrapper--panel-open' : ''}`}>
        <div className="ssc__map-loading">
          {citiesLoading 
            ? translate('map.loadingCities', 'Loading cities...') 
            : translate('map.loading', 'Loading map...')}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`ssc__map-wrapper ${panelOpen ? 'ssc__map-wrapper--panel-open' : ''}`}
    >
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="ssc__map"
        whenCreated={(map) => {
          mapRef.current = map;
          ensureMapInteractions();
          scheduleInvalidateSize();
          setTimeout(() => {
            ensureMapInteractions();
            scheduleInvalidateSize();
          }, 120);
        }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={false}
        minZoom={6}
        maxZoom={12}
        wheelDebounceTime={120}
        wheelPxPerZoomLevel={80}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        {cityMarkers}
        {eventMarkers}
      </MapContainer>
    </div>
  );
};

export default SwitzerlandMap;
