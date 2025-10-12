import React, { useMemo } from 'react';
import { X, MapPin, Briefcase, Clock, Building2, ArrowRight } from 'lucide-react';

const CityJobPanel = ({
  selectedCity,
  selectedCityLabel,
  cityJobs = [],
  onClose,
  onJobClick,
  translate = (key, fallback) => fallback,
}) => {
  if (!selectedCity || cityJobs.length === 0) {
    return null;
  }

  const displayCity = selectedCityLabel || selectedCity;

  const arrangementLabels = useMemo(
    () => ({
      on_site: translate('jobs.arrangements.onSite', 'On-site'),
      hybrid: translate('jobs.arrangements.hybrid', 'Hybrid'),
      remote: translate('jobs.arrangements.remote', 'Remote'),
    }),
    [translate]
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const value = new Date(dateString);
      if (Number.isNaN(value.getTime())) {
        return '';
      }
      return value.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatSalary = (job) => {
    if (!job.salary_min && !job.salary_max) return '';

    const formatValue = (value) => {
      if (!Number.isFinite(Number(value))) {
        return '';
      }
      return Number(value).toLocaleString(undefined, {
        style: 'currency',
        currency: 'CHF',
        maximumFractionDigits: 0,
      });
    };

    const min = job.salary_min ? formatValue(job.salary_min) : '';
    const max = job.salary_max ? formatValue(job.salary_max) : '';

    if (min && max) {
      return `${min} – ${max}`;
    }
    return min || max;
  };

  const jobsCountLabel = translate(
    'map.panel.jobsCount',
    `${cityJobs.length} job${cityJobs.length === 1 ? '' : 's'}`
  );

  return (
    <aside
      className="ssc__map-side-panel ssc__map-side-panel--jobs"
      aria-label={translate('map.panel.jobsAriaLabel', 'Jobs in selected city')}
      aria-live="polite"
    >
      <header className="ssc__map-side-panel-header">
        <div className="ssc__map-side-panel-heading">
          <span className="ssc__map-side-panel-icon ssc__map-side-panel-icon--jobs">
            <MapPin className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <p className="ssc__map-side-panel-overline">
              {translate('map.panel.jobsOverline', 'Opportunities spotlight')}
            </p>
            <h3 className="ssc__map-side-panel-title">
              {translate('map.panel.jobsIn', 'Roles in')}{' '}
              <span className="ssc__map-side-panel-title-highlight">{displayCity}</span>
            </h3>
          </div>
        </div>
        <div className="ssc__map-side-panel-meta">
          <span className="ssc__map-side-panel-count">{jobsCountLabel}</span>
          <button
            type="button"
            onClick={onClose}
            className="ssc__map-side-panel-close"
            aria-label={translate('map.panel.close', 'Close panel')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="ssc__map-side-panel-body">
        {cityJobs.map((job) => {
          const arrangementLabel = job.work_arrangement
            ? arrangementLabels[job.work_arrangement] || job.work_arrangement
            : '';
          const postedAt = formatDate(job.created_at);
          const salaryRange = formatSalary(job);

          return (
            <button
              key={job.id || job.title}
              type="button"
              className="ssc__map-job-card"
              onClick={() => onJobClick(job)}
            >
              <div className="ssc__map-card-heading">
                <div>
                  <h4 className="ssc__map-job-title">{job.title || translate('map.panel.jobFallbackTitle', 'Job opportunity')}</h4>
                  <div className="ssc__map-job-company">
                    <Building2 className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {job.company_name || job.startup_name || translate('map.panel.jobFallbackCompany', 'Startup company')}
                    </span>
                  </div>
                </div>
                <ArrowRight className="ssc__map-card-arrow" aria-hidden="true" />
              </div>

              <div className="ssc__map-chip-row">
                {job.location && (
                  <span className="ssc__map-chip ssc__map-chip--jobs">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    <span>{job.location}</span>
                  </span>
                )}
                {arrangementLabel && (
                  <span className="ssc__map-chip ssc__map-chip--jobs">
                    <Briefcase className="w-3 h-3" aria-hidden="true" />
                    <span>{arrangementLabel}</span>
                  </span>
                )}
                {postedAt && (
                  <span className="ssc__map-chip ssc__map-chip--jobs">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>{postedAt}</span>
                  </span>
                )}
              </div>

              {salaryRange && <div className="ssc__map-job-salary">{salaryRange}</div>}

              {job.description && (
                <p className="ssc__map-job-description">
                  {job.description.length > 180
                    ? `${job.description.slice(0, 177)}...`
                    : job.description}
                </p>
              )}

              <span className="ssc__map-job-cta">
                {translate('map.panel.viewJob', 'View role details')}
              </span>
            </button>
          );
        })}
      </div>

      <footer className="ssc__map-side-panel-footer">
        <p className="ssc__map-side-panel-footer-text">
          {translate('map.panel.jobsFooter', 'Select a role to open the full job description.')}
        </p>
      </footer>
    </aside>
  );
};

export default CityJobPanel;
