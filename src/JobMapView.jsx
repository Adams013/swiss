import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SwitzerlandMap, { resolveCityKeyForJob, SWISS_CITIES } from './SwitzerlandMap';
import CityJobPanel from './CityJobPanel';

const JobMapView = ({
  jobs = [],
  events = [],
  onJobClick,
  translate = (key, fallback) => fallback,
  focusJobId = null,
  onFocusHandled,
}) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityJobs, setCityJobs] = useState([]);
  const [showJobPanel, setShowJobPanel] = useState(false);
  const [mapLayer, setMapLayer] = useState('jobs');

  const showJobs = mapLayer === 'jobs' || mapLayer === 'both';
  const showEvents = mapLayer === 'events' || mapLayer === 'both';

  const mapLayerOptions = useMemo(
    () => [
      { value: 'jobs', label: translate('map.toggle.jobs', 'Job opportunities') },
      { value: 'events', label: translate('map.toggle.events', 'Events') },
      { value: 'both', label: translate('map.toggle.both', 'Both') },
    ],
    [translate]
  );

  const jobsByCity = useMemo(() => {
    if (!showJobs) {
      return {};
    }
    const grouped = {};
    jobs.forEach((job) => {
      const cityKey = resolveCityKeyForJob(job);
      if (!cityKey) {
        return;
      }
      if (!grouped[cityKey]) {
        grouped[cityKey] = [];
      }
      grouped[cityKey].push(job);
    });
    return grouped;
  }, [jobs, showJobs]);

  const handleCityClick = useCallback(
    (cityName, jobsInCity) => {
      if (!showJobs) {
        return;
      }
      setSelectedCity(cityName);
      setCityJobs(jobsInCity);
      setShowJobPanel(true);
    },
    [showJobs]
  );

  const handleClosePanel = useCallback(() => {
    setShowJobPanel(false);
    setSelectedCity(null);
    setCityJobs([]);
  }, []);

  const handleJobClick = useCallback((job) => {
    if (onJobClick) {
      onJobClick(job);
    }
  }, [onJobClick]);

  useEffect(() => {
    if (!selectedCity || !showJobs) {
      setCityJobs([]);
      return;
    }

    const nextJobs = jobsByCity[selectedCity] || [];
    setCityJobs((previous) => {
      if (
        previous.length === nextJobs.length &&
        previous.every((entry, index) => entry.id === nextJobs[index]?.id)
      ) {
        return previous;
      }
      return nextJobs;
    });
  }, [jobsByCity, selectedCity, showJobs]);

  useEffect(() => {
    if (!focusJobId) {
      return;
    }

    if (!showJobs) {
      setMapLayer('jobs');
      return;
    }

    const targetJob = jobs.find((job) => job.id === focusJobId);
    if (!targetJob) {
      if (onFocusHandled) {
        onFocusHandled();
      }
      return;
    }

    const cityKey = resolveCityKeyForJob(targetJob);
    if (!cityKey) {
      setShowJobPanel(false);
      setSelectedCity(null);
      setCityJobs([]);
      if (onFocusHandled) {
        onFocusHandled();
      }
      return;
    }

    const jobsInCity = jobsByCity[cityKey] || [];
    setSelectedCity(cityKey);
    setCityJobs(jobsInCity);
    setShowJobPanel(true);

    if (onFocusHandled) {
      onFocusHandled();
    }
  }, [focusJobId, jobs, jobsByCity, onFocusHandled, showJobs]);

  const selectedCityLabel = useMemo(() => {
    if (!selectedCity) {
      return '';
    }
    return SWISS_CITIES[selectedCity]?.name || selectedCity;
  }, [selectedCity]);

  useEffect(() => {
    if (mapLayer === 'events' && showJobPanel) {
      setShowJobPanel(false);
      setSelectedCity(null);
      setCityJobs([]);
    }
  }, [mapLayer, showJobPanel]);

  const mapTitle = useMemo(() => {
    if (mapLayer === 'events') {
      return translate('map.title.events', 'Events across Switzerland');
    }
    if (mapLayer === 'both') {
      return translate('map.title.both', 'Jobs and events across Switzerland');
    }
    return translate('map.title.jobs', translate('map.title', 'Job Locations in Switzerland'));
  }, [mapLayer, translate]);

  const mapDescription = useMemo(() => {
    if (mapLayer === 'events') {
      return translate(
        'map.description.events',
        'Browse upcoming startup community events in Swiss cities.'
      );
    }
    if (mapLayer === 'both') {
      return translate(
        'map.description.both',
        'See where opportunities and events overlap to plan your next visit.'
      );
    }
    return translate(
      'map.description.jobs',
      translate('map.description', 'Click on a city to see available jobs')
    );
  }, [mapLayer, translate]);

  return (
    <div className="ssc__map-view">
      <div className="ssc__map-header">
        <div>
          <h2 className="ssc__map-title">{mapTitle}</h2>
          <p className="ssc__map-description">{mapDescription}</p>
        </div>
        <div className="ssc__map-controls" role="group" aria-label={translate('map.toggle.label', 'Show on map')}>
          {mapLayerOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`ssc__map-toggle ${mapLayer === option.value ? 'is-active' : ''}`}
              onClick={() => setMapLayer(option.value)}
              aria-pressed={mapLayer === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ssc__map-container">
        <SwitzerlandMap
          jobs={jobs}
          events={events}
          onCityClick={handleCityClick}
          selectedCity={selectedCity}
          showJobPanel={showJobPanel && showJobs}
          visibleLayer={mapLayer}
        />

        {showJobPanel && showJobs && (
          <CityJobPanel
            selectedCity={selectedCity}
            selectedCityLabel={selectedCityLabel}
            cityJobs={cityJobs}
            onClose={handleClosePanel}
            onJobClick={handleJobClick}
            translate={translate}
          />
        )}
      </div>

      {/* Legend */}
      <div className="ssc__map-legend">
        <h4 className="ssc__map-legend-title">
          {translate('map.legend', 'Legend')}
        </h4>
        <div className="ssc__map-legend-items">
          <div className="ssc__map-legend-item">
            <div
              className="ssc__map-legend-marker ssc__map-legend-marker--jobs"
              aria-hidden="true"
            >
              12
            </div>
            <span>{translate('map.legend.jobs', 'Jobs')}</span>
          </div>
          {showEvents && (
            <div className="ssc__map-legend-item">
              <div
                className="ssc__map-legend-marker ssc__map-legend-marker--events"
                aria-hidden="true"
              >
                3
              </div>
              <span>{translate('map.legend.events', 'Events')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMapView;
