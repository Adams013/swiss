import React from 'react';
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const formatSalary = (job) => {
    if (!job.salary_min && !job.salary_max) return '';
    
    const min = job.salary_min ? `CHF ${job.salary_min.toLocaleString()}` : '';
    const max = job.salary_max ? `CHF ${job.salary_max.toLocaleString()}` : '';
    
    if (min && max) {
      return `${min} - ${max}`;
    }
    return min || max;
  };

  return (
    <div 
      className="w-1/2 h-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col"
      role="region"
      aria-label={`Jobs in ${displayCity}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900" id="city-panel-title">
            Jobs in {displayCity}
          </h3>
          <span className="ml-2 text-sm text-gray-500">
            ({cityJobs.length} job{cityJobs.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          aria-label={`Close jobs panel for ${displayCity}`}
        >
          <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
        </button>
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto" role="list">
        {cityJobs.map((job) => {
          const companyName = job.company_name || job.startup_name || 'Company Name';
          const salary = formatSalary(job);
          const jobAriaLabel = `${job.title || 'Job Title'} at ${companyName}${salary ? `, ${salary}` : ''}. Click to view details.`;
          
          return (
            <button
              key={job.id}
              className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors text-left"
              onClick={() => onJobClick(job)}
              role="listitem"
              aria-label={jobAriaLabel}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Job Title */}
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {job.title || 'Job Title'}
                  </h4>
                  
                  {/* Company */}
                  <div className="flex items-center mb-2">
                    <Building2 className="w-4 h-4 text-gray-400 mr-1" aria-hidden="true" />
                    <span className="text-sm text-gray-600">
                      {companyName}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.work_arrangement && (
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>{job.work_arrangement}</span>
                      </div>
                    )}
                    {job.created_at && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                        <span>{formatDate(job.created_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Salary */}
                  {salary && (
                    <div className="text-sm font-medium text-green-600 mb-2">
                      {salary}
                    </div>
                  )}

                  {/* Description Preview */}
                  {job.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {job.description.substring(0, 150)}
                      {job.description.length > 150 && '...'}
                    </p>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="ml-4 flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Click on a job to view details
        </p>
      </div>
    </div>
  );
};

export default CityJobPanel;
