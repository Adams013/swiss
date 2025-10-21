import React, { useMemo } from 'react';
import { MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { resolveCityKeyForJob, SWISS_CITIES } from './SwitzerlandMap';

const CityListView = ({ 
  jobs = [], 
  onCityClick,
  selectedCity,
  translate = (key, fallback) => fallback,
}) => {
  // Group jobs by city
  const jobsByCity = useMemo(() => {
    const grouped = {};

    jobs.forEach((job) => {
      const cityKey = resolveCityKeyForJob(job);
      if (!cityKey || !SWISS_CITIES[cityKey]) {
        return;
      }

      if (!grouped[cityKey]) {
        grouped[cityKey] = {
          cityKey,
          cityName: SWISS_CITIES[cityKey].name,
          jobs: [],
        };
      }
      grouped[cityKey].jobs.push(job);
    });

    // Convert to array and sort by job count (descending)
    return Object.values(grouped).sort((a, b) => b.jobs.length - a.jobs.length);
  }, [jobs]);

  const getColorClass = (count) => {
    if (count >= 20) return 'ssc__city-list-item--lots';
    if (count >= 10) return 'ssc__city-list-item--many';
    if (count >= 5) return 'ssc__city-list-item--some';
    return 'ssc__city-list-item--few';
  };

  const getJobCountLabel = (count) => {
    if (count >= 20) return 'Many jobs available';
    if (count >= 10) return 'Several jobs available';
    if (count >= 5) return 'Some jobs available';
    return 'Few jobs available';
  };

  if (jobsByCity.length === 0) {
    return (
      <div className="ssc__city-list-empty" role="status">
        <MapPin className="w-12 h-12 text-gray-400 mb-4" aria-hidden="true" />
        <p className="text-gray-600">
          {translate('map.listView.noJobs', 'No jobs available in any cities')}
        </p>
      </div>
    );
  }

  return (
    <div className="ssc__city-list-container">
      <div className="ssc__city-list-header">
        <h3 className="ssc__city-list-title">
          {translate('map.listView.title', 'Jobs by City')}
        </h3>
        <p className="ssc__city-list-subtitle">
          {translate('map.listView.subtitle', `${jobsByCity.length} cities with available positions`)}
        </p>
      </div>

      <ul className="ssc__city-list" role="list">
        {jobsByCity.map(({ cityKey, cityName, jobs: cityJobs }) => {
          const jobCount = cityJobs.length;
          const isSelected = cityKey === selectedCity;
          const colorClass = getColorClass(jobCount);

          return (
            <li key={cityKey} className="ssc__city-list-item-wrapper">
              <button
                className={`ssc__city-list-item ${colorClass} ${isSelected ? 'ssc__city-list-item--selected' : ''}`}
                onClick={() => onCityClick(cityKey, cityJobs)}
                aria-label={`${cityName}: ${jobCount} job${jobCount !== 1 ? 's' : ''} available. ${isSelected ? 'Currently selected.' : 'Click to view jobs.'}`}
                aria-pressed={isSelected}
              >
                <div className="ssc__city-list-item-main">
                  <div className="ssc__city-list-item-header">
                    <MapPin 
                      className="ssc__city-list-item-icon" 
                      aria-hidden="true"
                    />
                    <h4 className="ssc__city-list-item-name">
                      {cityName}
                    </h4>
                  </div>
                  
                  <div className="ssc__city-list-item-meta">
                    <div className="ssc__city-list-item-count">
                      <Briefcase 
                        className="ssc__city-list-item-count-icon" 
                        aria-hidden="true"
                      />
                      <span className="ssc__city-list-item-count-text">
                        {jobCount} job{jobCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="ssc__city-list-item-label" aria-hidden="true">
                      {getJobCountLabel(jobCount)}
                    </span>
                  </div>
                </div>

                <ChevronRight 
                  className="ssc__city-list-item-arrow" 
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Legend for color coding */}
      <div className="ssc__city-list-legend" role="complementary" aria-label="Job count color legend">
        <h4 className="ssc__city-list-legend-title">
          {translate('map.listView.legend', 'Color Legend')}
        </h4>
        <div className="ssc__city-list-legend-items">
          <div className="ssc__city-list-legend-item">
            <span className="ssc__city-list-legend-indicator ssc__city-list-legend-indicator--few" aria-hidden="true"></span>
            <span>{translate('map.legend.few', '1-4 jobs')}</span>
          </div>
          <div className="ssc__city-list-legend-item">
            <span className="ssc__city-list-legend-indicator ssc__city-list-legend-indicator--some" aria-hidden="true"></span>
            <span>{translate('map.legend.some', '5-9 jobs')}</span>
          </div>
          <div className="ssc__city-list-legend-item">
            <span className="ssc__city-list-legend-indicator ssc__city-list-legend-indicator--many" aria-hidden="true"></span>
            <span>{translate('map.legend.many', '10-19 jobs')}</span>
          </div>
          <div className="ssc__city-list-legend-item">
            <span className="ssc__city-list-legend-indicator ssc__city-list-legend-indicator--lots" aria-hidden="true"></span>
            <span>{translate('map.legend.lots', '20+ jobs')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityListView;

