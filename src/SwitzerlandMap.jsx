import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Briefcase } from 'lucide-react';

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

// Swiss cities with coordinates and job data
export const SWISS_CITIES = {
  'Zurich': { lat: 47.3769, lng: 8.5417, name: 'Zurich' },
  'Geneva': { lat: 46.2044, lng: 6.1432, name: 'Geneva' },
  'Basel': { lat: 47.5596, lng: 7.5886, name: 'Basel' },
  'Bern': { lat: 46.9481, lng: 7.4474, name: 'Bern' },
  'Lausanne': { lat: 46.5197, lng: 6.6323, name: 'Lausanne' },
  'St. Gallen': { lat: 47.4245, lng: 9.3767, name: 'St. Gallen' },
  'Lucerne': { lat: 47.0502, lng: 8.3093, name: 'Lucerne' },
  'Lugano': { lat: 46.0037, lng: 8.9511, name: 'Lugano' },
  'Biel': { lat: 47.1364, lng: 7.2472, name: 'Biel' },
  'Thun': { lat: 46.7580, lng: 7.6280, name: 'Thun' },
  'Köniz': { lat: 46.9244, lng: 7.4142, name: 'Köniz' },
  'La Chaux-de-Fonds': { lat: 47.1036, lng: 6.8287, name: 'La Chaux-de-Fonds' },
  'Fribourg': { lat: 46.8065, lng: 7.1597, name: 'Fribourg' },
  'Schaffhausen': { lat: 47.6969, lng: 8.6349, name: 'Schaffhausen' },
  'Chur': { lat: 46.8499, lng: 9.5329, name: 'Chur' },
  'Vernier': { lat: 46.2190, lng: 6.0849, name: 'Vernier' },
  'Neuchâtel': { lat: 46.9928, lng: 6.9319, name: 'Neuchâtel' },
  'Uster': { lat: 47.3478, lng: 8.7206, name: 'Uster' },
  'Sion': { lat: 46.2290, lng: 7.3590, name: 'Sion' },
  'Lancy': { lat: 46.1898, lng: 6.1144, name: 'Lancy' },
  'Emmen': { lat: 47.0784, lng: 8.3041, name: 'Emmen' },
  'Kriens': { lat: 47.0364, lng: 8.2814, name: 'Kriens' },
  'Rapperswil-Jona': { lat: 47.2266, lng: 8.8220, name: 'Rapperswil-Jona' },
  'Dietikon': { lat: 47.4040, lng: 8.4000, name: 'Dietikon' },
  'Montreux': { lat: 46.4330, lng: 6.9114, name: 'Montreux' },
  'Frauenfeld': { lat: 47.5564, lng: 8.8986, name: 'Frauenfeld' },
  'Wetzikon': { lat: 47.3234, lng: 8.7977, name: 'Wetzikon' },
  'Baar': { lat: 47.1960, lng: 8.5294, name: 'Baar' },
  'Riehen': { lat: 47.5848, lng: 7.6514, name: 'Riehen' },
  'Carouge': { lat: 46.1833, lng: 6.1333, name: 'Carouge' },
  Remote: { lat: 46.8182, lng: 8.2275, name: 'Remote (Switzerland)' },
};

const REMOTE_CITY_KEY = 'Remote';
const CITY_KEYS = Object.keys(SWISS_CITIES);
const CITY_KEYS_EXCLUDING_REMOTE = CITY_KEYS.filter((key) => key !== REMOTE_CITY_KEY);
const CITY_LOOKUP_BY_LOWER = CITY_KEYS.reduce((accumulator, city) => {
  accumulator[city.toLowerCase()] = city;
  return accumulator;
}, {});
const REMOTE_MATCHER = /remote|home\s*office/i;

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

export const resolveCityKeyForJob = (job) => {
  const candidates = collectLocationCandidates(job);
  if (candidates.length === 0) {
    return null;
  }

  for (const candidate of candidates) {
    const lookup = CITY_LOOKUP_BY_LOWER[candidate.toLowerCase()];
    if (lookup) {
      return lookup;
    }
  }

  for (const candidate of candidates) {
    const loweredCandidate = candidate.toLowerCase();
    const match = CITY_KEYS_EXCLUDING_REMOTE.find((city) =>
      loweredCandidate.includes(city.toLowerCase())
    );
    if (match) {
      return match;
    }
  }

  const hasRemoteHint = candidates.some((candidate) => REMOTE_MATCHER.test(candidate));
  if (hasRemoteHint) {
    return REMOTE_CITY_KEY;
  }

  return null;
};

const SwitzerlandMap = ({ jobs = [], onCityClick, selectedCity, showJobPanel }) => {
  const [mapCenter] = useState([46.8182, 8.2275]); // Center of Switzerland
  const [mapZoom] = useState(8);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // Set map as loaded immediately since CSS is imported statically
    setMapLoaded(true);
  }, []);

  // Group jobs by city
  const jobsByCity = useMemo(() => {
    const grouped = {};

    jobs.forEach((job) => {
      const cityKey = resolveCityKeyForJob(job);
      if (!cityKey || !SWISS_CITIES[cityKey]) {
        return;
      }

      if (!grouped[cityKey]) {
        grouped[cityKey] = [];
      }
      grouped[cityKey].push(job);
    });

    return grouped;
  }, [jobs]);

  // Create city markers with job counts
  const cityMarkers = useMemo(() => {
    const getColor = (count) => {
      if (count >= 20) return '#ef4444'; // red
      if (count >= 10) return '#f97316'; // orange
      if (count >= 5) return '#eab308'; // yellow
      return '#22c55e'; // green
    };

    return Object.entries(SWISS_CITIES)
      .map(([cityName, coords]) => {
        const cityJobs = jobsByCity[cityName] || [];
        const jobCount = cityJobs.length;

        if (jobCount === 0) return null;

        // Calculate circle size based on job count
        const baseRadius = 8;
        const maxRadius = 25;
        const radius = Math.min(baseRadius + jobCount * 2, maxRadius);
        const isSelected = cityName === selectedCity;
        const color = isSelected ? '#2563eb' : getColor(jobCount);
        const fill = isSelected ? '#3b82f6' : getColor(jobCount);

        return (
          <CircleMarker
            key={cityName}
            center={[coords.lat, coords.lng]}
            radius={radius}
            color={color}
            fillColor={fill}
            fillOpacity={0.7}
            weight={isSelected ? 4 : 2}
            eventHandlers={{
              click: () => onCityClick(cityName, cityJobs),
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{cityName}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {jobCount} job{jobCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })
      .filter(Boolean);
  }, [jobsByCity, onCityClick, selectedCity]);

  useEffect(() => {
    if (!selectedCity || !mapRef.current) {
      return;
    }
    const cityMeta = SWISS_CITIES[selectedCity];
    if (!cityMeta) {
      return;
    }
    const targetZoom = Math.max(mapRef.current.getZoom(), 9);
    mapRef.current.flyTo([cityMeta.lat, cityMeta.lng], targetZoom, { duration: 0.6 });
  }, [selectedCity]);

  if (!mapLoaded) {
    return (
      <div className={`ssc__map-wrapper ${showJobPanel ? 'ssc__map-wrapper--panel-open' : ''}`}>
        <div className="ssc__map-loading">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`ssc__map-wrapper ${showJobPanel ? 'ssc__map-wrapper--panel-open' : ''}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="ssc__map"
        whenCreated={(map) => {
          mapRef.current = map;
          // Ensure map is properly initialized
          setTimeout(() => {
            map.invalidateSize();
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cityMarkers}
      </MapContainer>
    </div>
  );
};

export default SwitzerlandMap;
