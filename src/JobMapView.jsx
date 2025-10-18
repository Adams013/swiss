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
  const [selectedEventCity, setSelectedEventCity] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // 'jobs' | 'events' | null

  const showJobs = mapLayer === 'jobs';
  const showEvents = mapLayer === 'events';

  const mapLayerOptions = useMemo(
    () => [
      { value: 'jobs', label: translate('map.toggle.jobs', 'Job opportunities') },
      { value: 'events', label: translate('map.toggle.events', 'Events') },
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
  }, []);

  const openJobPanel = useCallback(
    (cityName) => {
      if (!showJobs) {
        return;
      }

      if (!cityName) {
        closePanel();
        return;
      }

      const entries = jobsByCity[cityName] || [];
      if (entries.length === 0) {
        closePanel();
        return;
      }

      setSelectedJobCity(cityName);
      setActivePanel('jobs');
      setSelectedEventCity(null);
    },
    [closePanel, jobsByCity, showJobs]
  );

  const openEventPanel = useCallback(
    (cityName) => {
      if (!showEvents) {
        return;
      }

      if (!cityName) {
        closePanel();
        return;
      }

      const entries = eventsByCity[cityName] || [];
      if (entries.length === 0) {
        closePanel();
        return;
      }

      setSelectedEventCity(cityName);
      setActivePanel('events');
      setSelectedJobCity(null);
    },
    [closePanel, eventsByCity, showEvents]
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
    if (jobsInCity.length === 0) {
      closePanel();
      if (onFocusHandled) {
        onFocusHandled();
      }
      return;
    }

    setSelectedJobCity(cityKey);
    setActivePanel('jobs');
    setSelectedEventCity(null);

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

  const jobPanelEntries = useMemo(() => {
    if (!showJobs || !selectedJobCity) {
      return [];
    }
    return jobsByCity[selectedJobCity] || [];
  }, [jobsByCity, selectedJobCity, showJobs]);

  const eventPanelEntries = useMemo(() => {
    if (!showEvents || !selectedEventCity) {
      return [];
    }
    return eventsByCity[selectedEventCity] || [];
  }, [eventsByCity, selectedEventCity, showEvents]);

  useEffect(() => {
    if (activePanel === 'jobs') {
      if (!showJobs || !selectedJobCity || jobPanelEntries.length === 0) {
        closePanel();
      }
    }
  }, [activePanel, closePanel, jobPanelEntries.length, selectedJobCity, showJobs]);

  useEffect(() => {
    if (activePanel === 'events') {
      if (!showEvents || !selectedEventCity || eventPanelEntries.length === 0) {
        closePanel();
      }
    }
  }, [activePanel, closePanel, eventPanelEntries.length, selectedEventCity, showEvents]);

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
    return translate('map.title.jobs', translate('map.title', 'Job Locations in Switzerland'));
  }, [mapLayer, translate]);

  const mapDescription = useMemo(() => {
    if (mapLayer === 'events') {
      return translate(
        'map.description.events',
        'Browse upcoming startup community events in Swiss cities.'
      );
    }
    return translate(
      'map.description.jobs',
      translate('map.description', 'Click on a city to see available jobs')
    );
  }, [mapLayer, translate]);

  const shouldShowJobPanel =
    activePanel === 'jobs' && showJobs && selectedJobCity && jobPanelEntries.length > 0;
  const shouldShowEventPanel =
    activePanel === 'events' && showEvents && selectedEventCity && eventPanelEntries.length > 0;
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
            cityJobs={jobPanelEntries}
            onClose={closePanel}
            onJobClick={handleJobClick}
            translate={translate}
          />
        )}

        {shouldShowEventPanel && (
          <CityEventPanel
            selectedCity={selectedEventCity}
            selectedCityLabel={selectedEventCityLabel}
            cityEvents={eventPanelEntries}
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
          {showJobs && (
            <div className="ssc__map-legend-item">
              <div
                className="ssc__map-legend-marker ssc__map-legend-marker--jobs"
                aria-hidden="true"
              >
                12
              </div>
              <span>{translate('map.legend.jobs', 'Jobs')}</span>
            </div>
          )}
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
