import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SwitzerlandMap, {
  resolveCityKeyForJob,
  resolveCityKeyForEvent,
  SWISS_CITIES,
} from './SwitzerlandMap';
import CityJobPanel from './CityJobPanel';
import CityEventPanel from './CityEventPanel';

const JobMapView = ({
  jobs = [],
  events = [],
  onJobClick,
  translate = (key, fallback) => fallback,
  focusJobId = null,
  onFocusHandled,
}) => {
  const [mapLayer, setMapLayer] = useState('jobs');
  const [selectedJobCity, setSelectedJobCity] = useState(null);
  const [jobCityEntries, setJobCityEntries] = useState([]);
  const [selectedEventCity, setSelectedEventCity] = useState(null);
  const [eventCityEntries, setEventCityEntries] = useState([]);
  const [activePanel, setActivePanel] = useState(null); // 'jobs' | 'events' | null

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

  const eventsByCity = useMemo(() => {
    if (!showEvents) {
      return {};
    }
    const grouped = {};
    events.forEach((event) => {
      const cityKey = resolveCityKeyForEvent(event);
      if (!cityKey) {
        return;
      }
      if (!grouped[cityKey]) {
        grouped[cityKey] = [];
      }
      grouped[cityKey].push(event);
    });
    return grouped;
  }, [events, showEvents]);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setSelectedJobCity(null);
    setSelectedEventCity(null);
    setJobCityEntries([]);
    setEventCityEntries([]);
  }, []);

  const openJobPanel = useCallback(
    (cityName, jobsInCity) => {
      if (!showJobs) {
        return;
      }
      setSelectedJobCity(cityName);
      setJobCityEntries(jobsInCity);
      setActivePanel('jobs');
      setSelectedEventCity(null);
      setEventCityEntries([]);
    },
    [showJobs]
  );

  const openEventPanel = useCallback(
    (cityName, eventsInCity) => {
      if (!showEvents) {
        return;
      }
      setSelectedEventCity(cityName);
      setEventCityEntries(eventsInCity);
      setActivePanel('events');
      setSelectedJobCity(null);
      setJobCityEntries([]);
    },
    [showEvents]
  );

  const handleJobClick = useCallback(
    (job) => {
      if (onJobClick) {
        onJobClick(job);
      }
    },
    [onJobClick]
  );

  useEffect(() => {
    if (activePanel !== 'jobs') {
      return;
    }
    if (!selectedJobCity || !showJobs) {
      setJobCityEntries([]);
      if (!showJobs) {
        setActivePanel(null);
        setSelectedJobCity(null);
      }
      return;
    }
    const nextJobs = jobsByCity[selectedJobCity] || [];
    if (nextJobs.length === 0) {
      setActivePanel(null);
      setSelectedJobCity(null);
      setJobCityEntries([]);
      return;
    }
    setJobCityEntries((previous) => {
      if (
        previous.length === nextJobs.length &&
        previous.every((entry, index) => entry.id === nextJobs[index]?.id)
      ) {
        return previous;
      }
      return nextJobs;
    });
  }, [activePanel, jobsByCity, selectedJobCity, showJobs]);

  useEffect(() => {
    if (activePanel !== 'events') {
      return;
    }
    if (!selectedEventCity || !showEvents) {
      setEventCityEntries([]);
      if (!showEvents) {
        setActivePanel(null);
        setSelectedEventCity(null);
      }
      return;
    }
    const nextEvents = eventsByCity[selectedEventCity] || [];
    if (nextEvents.length === 0) {
      setActivePanel(null);
      setSelectedEventCity(null);
      setEventCityEntries([]);
      return;
    }
    setEventCityEntries((previous) => {
      if (
        previous.length === nextEvents.length &&
        previous.every((entry, index) => entry.id === nextEvents[index]?.id)
      ) {
        return previous;
      }
      return nextEvents;
    });
  }, [activePanel, eventsByCity, selectedEventCity, showEvents]);

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
      closePanel();
      if (onFocusHandled) {
        onFocusHandled();
      }
      return;
    }

    const jobsInCity = jobsByCity[cityKey] || [];
    setSelectedJobCity(cityKey);
    setJobCityEntries(jobsInCity);
    setActivePanel('jobs');
    setSelectedEventCity(null);
    setEventCityEntries([]);

    if (onFocusHandled) {
      onFocusHandled();
    }
  }, [
    closePanel,
    focusJobId,
    jobs,
    jobsByCity,
    onFocusHandled,
    showJobs,
  ]);

  useEffect(() => {
    if (!showJobs && activePanel === 'jobs') {
      closePanel();
    }
    if (!showEvents && activePanel === 'events') {
      closePanel();
    }
  }, [activePanel, closePanel, showEvents, showJobs]);

  useEffect(() => {
    if (mapLayer === 'events' && activePanel === 'jobs') {
      closePanel();
    }
  }, [activePanel, closePanel, mapLayer]);

  const selectedJobCityLabel = useMemo(() => {
    if (!selectedJobCity) {
      return '';
    }
    return SWISS_CITIES[selectedJobCity]?.name || selectedJobCity;
  }, [selectedJobCity]);

  const selectedEventCityLabel = useMemo(() => {
    if (!selectedEventCity) {
      return '';
    }
    return SWISS_CITIES[selectedEventCity]?.name || selectedEventCity;
  }, [selectedEventCity]);

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

  const shouldShowJobPanel =
    activePanel === 'jobs' && showJobs && selectedJobCity && jobCityEntries.length > 0;
  const shouldShowEventPanel =
    activePanel === 'events' && showEvents && selectedEventCity && eventCityEntries.length > 0;
  const isPanelOpen = shouldShowJobPanel || shouldShowEventPanel;

  return (
    <div className="ssc__map-view">
      <div className="ssc__map-header">
        <div>
          <h2 className="ssc__map-title">{mapTitle}</h2>
          <p className="ssc__map-description">{mapDescription}</p>
        </div>
        <div
          className="ssc__map-controls"
          role="group"
          aria-label={translate('map.toggle.label', 'Show on map')}
        >
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
          onJobCityClick={openJobPanel}
          onEventCityClick={openEventPanel}
          selectedJobCity={selectedJobCity}
          selectedEventCity={selectedEventCity}
          panelOpen={isPanelOpen}
          visibleLayer={mapLayer}
        />

        {shouldShowJobPanel && (
          <CityJobPanel
            selectedCity={selectedJobCity}
            selectedCityLabel={selectedJobCityLabel}
            cityJobs={jobCityEntries}
            onClose={closePanel}
            onJobClick={handleJobClick}
            translate={translate}
          />
        )}

        {shouldShowEventPanel && (
          <CityEventPanel
            selectedCity={selectedEventCity}
            selectedCityLabel={selectedEventCityLabel}
            cityEvents={eventCityEntries}
            onClose={closePanel}
            translate={translate}
          />
        )}
      </div>

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
