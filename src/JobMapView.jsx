import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SwitzerlandMap, { resolveCityKeyForJob, SWISS_CITIES } from './SwitzerlandMap';
import CityJobPanel from './CityJobPanel';

const JobMapView = ({ 
  jobs = [], 
  onJobClick,
  translate = (key, fallback) => fallback,
  focusJobId = null,
  onFocusHandled,
}) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityJobs, setCityJobs] = useState([]);
  const [showJobPanel, setShowJobPanel] = useState(false);

  const jobsByCity = useMemo(() => {
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
  }, [jobs]);

  const handleCityClick = useCallback((cityName, jobsInCity) => {
    setSelectedCity(cityName);
    setCityJobs(jobsInCity);
    setShowJobPanel(true);
  }, []);

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
    if (!selectedCity) {
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
  }, [jobsByCity, selectedCity]);

  useEffect(() => {
    if (!focusJobId) {
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
  }, [focusJobId, jobs, jobsByCity, onFocusHandled]);

  const selectedCityLabel = useMemo(() => {
    if (!selectedCity) {
      return '';
    }
    return SWISS_CITIES[selectedCity]?.name || selectedCity;
  }, [selectedCity]);

  return (
    <div className="ssc__map-view">
      <div className="ssc__map-header">
        <h2 className="ssc__map-title">
          {translate('map.title', 'Job Locations in Switzerland')}
        </h2>
        <p className="ssc__map-description">
          {translate('map.description', 'Click on a city to see available jobs')}
        </p>
      </div>

      <div className="ssc__map-container">
        <SwitzerlandMap
          jobs={jobs}
          onCityClick={handleCityClick}
          selectedCity={selectedCity}
          showJobPanel={showJobPanel}
        />
        
        {showJobPanel && (
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
            <div className="ssc__map-legend-circle ssc__map-legend-circle--few"></div>
            <span>{translate('map.legend.few', '1-4 jobs')}</span>
          </div>
          <div className="ssc__map-legend-item">
            <div className="ssc__map-legend-circle ssc__map-legend-circle--some"></div>
            <span>{translate('map.legend.some', '5-9 jobs')}</span>
          </div>
          <div className="ssc__map-legend-item">
            <div className="ssc__map-legend-circle ssc__map-legend-circle--many"></div>
            <span>{translate('map.legend.many', '10-19 jobs')}</span>
          </div>
          <div className="ssc__map-legend-item">
            <div className="ssc__map-legend-circle ssc__map-legend-circle--lots"></div>
            <span>{translate('map.legend.lots', '20+ jobs')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobMapView;
