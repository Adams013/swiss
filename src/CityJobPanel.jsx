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
    <div className="w-1/2 h-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Jobs in {displayCity}
          </h3>
          <span className="ml-2 text-sm text-gray-500">
            ({cityJobs.length} job{cityJobs.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Job List */}
      <div className="flex-1 overflow-y-auto">
        {cityJobs.map((job) => (
          <div
            key={job.id}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onJobClick(job)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Job Title */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                  {job.title || 'Job Title'}
                </h4>
                
                {/* Company */}
                <div className="flex items-center mb-2">
                  <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600">
                    {job.company_name || job.startup_name || 'Company Name'}
                  </span>
                </div>

                {/* Job Details */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  {job.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.work_arrangement && (
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      <span>{job.work_arrangement}</span>
                    </div>
                  )}
                  {job.created_at && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Salary */}
                {formatSalary(job) && (
                  <div className="text-sm font-medium text-green-600 mb-2">
                    {formatSalary(job)}
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
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
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
