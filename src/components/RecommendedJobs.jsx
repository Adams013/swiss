import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, TrendingUp, MapPin, DollarSign, Building2, ArrowRight, Star } from 'lucide-react';
import { getJobRecommendations, getSimilarJobs } from '../services/jobRecommendations';
import { trackJobView } from '../services/supabaseNotifications';

/**
 * RecommendedJobs Component
 * Shows personalized job recommendations based on user behavior
 */
const RecommendedJobs = ({
  user,
  allJobs,
  translate,
  onJobClick,
  limit = 6,
  variant = 'personalized', // 'personalized' or 'similar'
  referenceJob = null, // Required for 'similar' variant
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (variant === 'personalized' && user?.id) {
      loadPersonalizedRecommendations();
    } else if (variant === 'similar' && referenceJob) {
      loadSimilarJobs();
    }
  }, [user?.id, allJobs, variant, referenceJob?.id]);

  const loadPersonalizedRecommendations = async () => {
    setLoading(true);
    const { recommendations: recs } = await getJobRecommendations(user.id, allJobs, limit);
    setRecommendations(recs);
    setLoading(false);
  };

  const loadSimilarJobs = () => {
    setLoading(true);
    const similarJobs = getSimilarJobs(referenceJob, allJobs, limit);
    setRecommendations(similarJobs);
    setLoading(false);
  };

  const handleJobClick = async (job) => {
    // Track the view
    if (user?.id) {
      await trackJobView(job.id, user.id, {
        source: variant === 'personalized' ? 'recommended' : 'similar_jobs',
      });
    }

    if (onJobClick) {
      onJobClick(job);
    }
  };

  const getMatchPercentage = (job) => {
    if (variant === 'personalized') {
      return job.recommendationScore || 0;
    } else {
      return job.similarityScore || 0;
    }
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return { text: translate('match.excellent', 'Excellent match'), color: '#10b981' };
    if (score >= 60) return { text: translate('match.good', 'Good match'), color: '#3b82f6' };
    if (score >= 40) return { text: translate('match.fair', 'Fair match'), color: '#f59e0b' };
    return { text: translate('match.possible', 'Possible match'), color: '#6b7280' };
  };

  const formatSalary = (job) => {
    if (job.salary_min_value && job.salary_max_value) {
      return `CHF ${job.salary_min_value.toLocaleString()} - ${job.salary_max_value.toLocaleString()}`;
    } else if (job.salary_min_value) {
      return `CHF ${job.salary_min_value.toLocaleString()}+`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="ssc__recommended-jobs ssc__recommended-jobs--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('recommendations.loading', 'Finding perfect jobs for you...')}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="ssc__recommended-jobs ssc__recommended-jobs--empty">
        <Sparkles size={48} className="ssc__icon--muted" />
        <h3>
          {variant === 'personalized'
            ? translate('recommendations.empty.title', 'No recommendations yet')
            : translate('recommendations.similar.empty', 'No similar jobs found')}
        </h3>
        <p>
          {variant === 'personalized'
            ? translate(
                'recommendations.empty.description',
                'Start saving and applying to jobs to get personalized recommendations!'
              )
            : translate(
                'recommendations.similar.description',
                'Try browsing other jobs in this category.'
              )}
        </p>
      </div>
    );
  }

  return (
    <div className="ssc__recommended-jobs">
      <div className="ssc__recommended-jobs__header">
        {variant === 'personalized' ? (
          <>
            <Sparkles className="ssc__icon" size={24} />
            <h2>{translate('recommendations.title', 'Recommended for You')}</h2>
          </>
        ) : (
          <>
            <TrendingUp className="ssc__icon" size={24} />
            <h2>{translate('recommendations.similar.title', 'Similar Jobs')}</h2>
          </>
        )}
      </div>

      <div className="ssc__recommended-jobs__grid">
        {recommendations.map((job) => {
          const matchScore = getMatchPercentage(job);
          const matchInfo = getMatchLabel(matchScore);
          const salary = formatSalary(job);

          return (
            <div
              key={job.id}
              className="ssc__recommended-job-card"
              onClick={() => handleJobClick(job)}
            >
              {/* Match Score Badge */}
              <div className="ssc__recommended-job-card__badge">
                <Star
                  size={14}
                  fill={matchInfo.color}
                  color={matchInfo.color}
                />
                <span style={{ color: matchInfo.color }}>
                  {matchScore}% {matchInfo.text}
                </span>
              </div>

              {/* Job Title */}
              <h3 className="ssc__recommended-job-card__title">{job.title}</h3>

              {/* Company */}
              <div className="ssc__recommended-job-card__company">
                <Building2 size={16} />
                <span>{job.company_name}</span>
              </div>

              {/* Location */}
              {job.location && (
                <div className="ssc__recommended-job-card__location">
                  <MapPin size={14} />
                  <span>{job.location}</span>
                </div>
              )}

              {/* Salary */}
              {salary && (
                <div className="ssc__recommended-job-card__salary">
                  <DollarSign size={14} />
                  <span>{salary}</span>
                </div>
              )}

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div className="ssc__recommended-job-card__tags">
                  {job.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="ssc__tag ssc__tag--small">
                      {tag}
                    </span>
                  ))}
                  {job.tags.length > 3 && (
                    <span className="ssc__tag ssc__tag--more">
                      +{job.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* View Button */}
              <button
                type="button"
                className="ssc__recommended-job-card__action"
              >
                {translate('recommendations.viewJob', 'View Job')}
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && variant === 'personalized' && (
        <div className="ssc__recommended-jobs__footer">
          <p className="ssc__recommended-jobs__hint">
            💡 {translate(
              'recommendations.hint',
              'The more you interact with jobs (save, apply, view), the better our recommendations become!'
            )}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Recommendation Widget
 * Smaller version for sidebar or inline display
 */
export const RecommendationWidget = ({
  user,
  allJobs,
  translate,
  onJobClick,
  limit = 3,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id, allJobs]);

  const loadRecommendations = async () => {
    setLoading(true);
    const { recommendations: recs } = await getJobRecommendations(user.id, allJobs, limit);
    setRecommendations(recs);
    setLoading(false);
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="ssc__recommendation-widget">
      <h3>
        <Sparkles size={18} />
        {translate('recommendations.widget.title', 'Perfect for You')}
      </h3>
      <div className="ssc__recommendation-widget__list">
        {recommendations.map((job) => (
          <div
            key={job.id}
            className="ssc__recommendation-widget__item"
            onClick={() => onJobClick(job)}
          >
            <div className="ssc__recommendation-widget__item-info">
              <strong>{job.title}</strong>
              <span>{job.company_name}</span>
            </div>
            <div className="ssc__recommendation-widget__item-score">
              {job.recommendationScore}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedJobs;

