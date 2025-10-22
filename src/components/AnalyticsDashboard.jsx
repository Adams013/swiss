import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getJobViewStats, getCompanyMetrics } from '../services/supabaseNotifications';

/**
 * AnalyticsDashboard Component
 * Shows job posting analytics for startup/employer accounts
 */
const AnalyticsDashboard = ({ user, startup, translate }) => {
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // '7d', '30d', '90d', 'all'

  useEffect(() => {
    if (startup?.id) {
      loadAnalytics();
    }
  }, [startup?.id, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // Fetch jobs for this startup
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('startup_id', startup.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      setJobs(jobsData || []);

      // Fetch analytics for each job
      const analyticsData = {};
      for (const job of jobsData || []) {
        const { stats } = await getJobViewStats(job.id);
        
        // Fetch application count
        const { count: applicationCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        analyticsData[job.id] = {
          ...stats,
          applications: applicationCount || 0,
        };
      }

      setAnalytics(analyticsData);

      // Fetch company metrics
      const { metrics } = await getCompanyMetrics(startup.id);
      if (metrics) {
        setCompanyMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }

    setLoading(false);
  };

  const [companyMetrics, setCompanyMetrics] = useState(null);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalViews = Object.values(analytics).reduce((sum, stats) => sum + (stats.total_views || 0), 0);
    const totalApplications = Object.values(analytics).reduce((sum, stats) => sum + (stats.applications || 0), 0);
    const totalUniqueViewers = Object.values(analytics).reduce((sum, stats) => sum + (stats.unique_viewers || 0), 0);
    const avgTimeSpent = Object.values(analytics).reduce((sum, stats) => sum + (stats.avg_time_spent || 0), 0) / Object.keys(analytics).length || 0;

    const conversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

    return {
      totalViews,
      totalApplications,
      totalUniqueViewers,
      avgTimeSpent: Math.round(avgTimeSpent),
      conversionRate: conversionRate.toFixed(2),
    };
  }, [analytics]);

  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.good) return '#10b981';
    if (value >= thresholds.fair) return '#f59e0b';
    return '#ef4444';
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="ssc__analytics-dashboard ssc__analytics-dashboard--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('analytics.loading', 'Loading analytics...')}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="ssc__analytics-dashboard ssc__analytics-dashboard--empty">
        <BarChart3 size={48} className="ssc__icon--muted" />
        <h3>{translate('analytics.empty.title', 'No jobs posted yet')}</h3>
        <p>{translate('analytics.empty.description', 'Post your first job to see analytics here.')}</p>
      </div>
    );
  }

  return (
    <div className="ssc__analytics-dashboard">
      {/* Header */}
      <div className="ssc__analytics-dashboard__header">
        <div>
          <h2>
            <BarChart3 className="ssc__icon" size={24} />
            {translate('analytics.title', 'Analytics Dashboard')}
          </h2>
          <p className="ssc__analytics-dashboard__subtitle">
            {translate('analytics.subtitle', 'Track performance of your job postings')}
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="ssc__analytics-time-range">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="ssc__select"
          >
            <option value="7d">{translate('analytics.timeRange.7d', 'Last 7 days')}</option>
            <option value="30d">{translate('analytics.timeRange.30d', 'Last 30 days')}</option>
            <option value="90d">{translate('analytics.timeRange.90d', 'Last 90 days')}</option>
            <option value="all">{translate('analytics.timeRange.all', 'All time')}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="ssc__analytics-metrics">
        <div className="ssc__analytics-metric-card">
          <div className="ssc__analytics-metric-card__icon" style={{ background: '#dbeafe' }}>
            <Eye size={24} color="#3b82f6" />
          </div>
          <div className="ssc__analytics-metric-card__content">
            <span className="ssc__analytics-metric-card__label">
              {translate('analytics.metrics.totalViews', 'Total Views')}
            </span>
            <strong className="ssc__analytics-metric-card__value">
              {aggregateMetrics.totalViews.toLocaleString()}
            </strong>
            <span className="ssc__analytics-metric-card__change ssc__analytics-metric-card__change--positive">
              <ArrowUp size={14} /> 12% vs last period
            </span>
          </div>
        </div>

        <div className="ssc__analytics-metric-card">
          <div className="ssc__analytics-metric-card__icon" style={{ background: '#d1fae5' }}>
            <Users size={24} color="#10b981" />
          </div>
          <div className="ssc__analytics-metric-card__content">
            <span className="ssc__analytics-metric-card__label">
              {translate('analytics.metrics.applications', 'Applications')}
            </span>
            <strong className="ssc__analytics-metric-card__value">
              {aggregateMetrics.totalApplications.toLocaleString()}
            </strong>
            <span className="ssc__analytics-metric-card__change ssc__analytics-metric-card__change--positive">
              <ArrowUp size={14} /> 8% vs last period
            </span>
          </div>
        </div>

        <div className="ssc__analytics-metric-card">
          <div className="ssc__analytics-metric-card__icon" style={{ background: '#fef3c7' }}>
            <Target size={24} color="#f59e0b" />
          </div>
          <div className="ssc__analytics-metric-card__content">
            <span className="ssc__analytics-metric-card__label">
              {translate('analytics.metrics.conversionRate', 'Conversion Rate')}
            </span>
            <strong className="ssc__analytics-metric-card__value">
              {aggregateMetrics.conversionRate}%
            </strong>
            <span className="ssc__analytics-metric-card__change ssc__analytics-metric-card__change--negative">
              <ArrowDown size={14} /> 2% vs last period
            </span>
          </div>
        </div>

        <div className="ssc__analytics-metric-card">
          <div className="ssc__analytics-metric-card__icon" style={{ background: '#e0e7ff' }}>
            <Clock size={24} color="#6366f1" />
          </div>
          <div className="ssc__analytics-metric-card__content">
            <span className="ssc__analytics-metric-card__label">
              {translate('analytics.metrics.avgTimeSpent', 'Avg. Time on Page')}
            </span>
            <strong className="ssc__analytics-metric-card__value">
              {formatDuration(aggregateMetrics.avgTimeSpent)}
            </strong>
            <span className="ssc__analytics-metric-card__change ssc__analytics-metric-card__change--positive">
              <ArrowUp size={14} /> 15s vs last period
            </span>
          </div>
        </div>
      </div>

      {/* Company Trust Signals */}
      {companyMetrics && (
        <div className="ssc__analytics-trust-signals">
          <h3>{translate('analytics.trustSignals.title', 'Your Trust Signals')}</h3>
          <div className="ssc__analytics-trust-signals__grid">
            {companyMetrics.verified_employer && (
              <div className="ssc__trust-badge">
                <CheckCircle size={16} color="#10b981" />
                {translate('analytics.trustSignals.verified', 'Verified Employer')}
              </div>
            )}
            {companyMetrics.fast_responder && (
              <div className="ssc__trust-badge">
                <Clock size={16} color="#3b82f6" />
                {translate('analytics.trustSignals.fastResponder', 'Fast Responder')}
              </div>
            )}
            {companyMetrics.high_interview_rate && (
              <div className="ssc__trust-badge">
                <TrendingUp size={16} color="#f59e0b" />
                {translate('analytics.trustSignals.highInterviewRate', 'High Interview Rate')}
              </div>
            )}
            {companyMetrics.response_rate && (
              <div className="ssc__trust-metric">
                <span>{translate('analytics.trustSignals.responseRate', 'Response Rate:')}</span>
                <strong>{companyMetrics.response_rate.toFixed(0)}%</strong>
              </div>
            )}
            {companyMetrics.avg_response_time_hours && (
              <div className="ssc__trust-metric">
                <span>{translate('analytics.trustSignals.avgResponseTime', 'Avg. Response Time:')}</span>
                <strong>{Math.round(companyMetrics.avg_response_time_hours)}h</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Performance Table */}
      <div className="ssc__analytics-jobs-table">
        <div className="ssc__analytics-jobs-table__header">
          <h3>{translate('analytics.jobsTable.title', 'Job Performance')}</h3>
          <button type="button" className="ssc__btn ssc__btn--secondary ssc__btn--small">
            <Download size={16} />
            {translate('analytics.export', 'Export CSV')}
          </button>
        </div>

        <div className="ssc__analytics-jobs-table__content">
          <table className="ssc__table">
            <thead>
              <tr>
                <th>{translate('analytics.jobsTable.jobTitle', 'Job Title')}</th>
                <th>{translate('analytics.jobsTable.posted', 'Posted')}</th>
                <th>{translate('analytics.jobsTable.views', 'Views')}</th>
                <th>{translate('analytics.jobsTable.applications', 'Applications')}</th>
                <th>{translate('analytics.jobsTable.conversionRate', 'CVR')}</th>
                <th>{translate('analytics.jobsTable.avgTime', 'Avg. Time')}</th>
                <th>{translate('analytics.jobsTable.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const stats = analytics[job.id] || {};
                const cvr = stats.total_views > 0 
                  ? ((stats.applications / stats.total_views) * 100).toFixed(1) 
                  : 0;
                
                return (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="ssc__table-row--clickable"
                  >
                    <td>
                      <strong>{job.title}</strong>
                    </td>
                    <td>
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="ssc__analytics-stat">
                        <Eye size={14} />
                        {stats.total_views || 0}
                      </span>
                    </td>
                    <td>
                      <span className="ssc__analytics-stat">
                        <Users size={14} />
                        {stats.applications || 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className="ssc__analytics-cvr"
                        style={{
                          color: getPerformanceColor(cvr, { good: 5, fair: 2 }),
                        }}
                      >
                        {cvr}%
                      </span>
                    </td>
                    <td>{formatDuration(stats.avg_time_spent || 0)}</td>
                    <td>
                      <span className="ssc__status-badge ssc__status-badge--active">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="ssc__analytics-insights">
        <h3>
          <TrendingUp size={20} />
          {translate('analytics.insights.title', 'Insights & Recommendations')}
        </h3>
        <div className="ssc__analytics-insights__list">
          {aggregateMetrics.conversionRate < 3 && (
            <div className="ssc__analytics-insight ssc__analytics-insight--warning">
              <AlertCircle size={20} />
              <div>
                <strong>{translate('analytics.insights.lowCVR', 'Low conversion rate detected')}</strong>
                <p>{translate('analytics.insights.lowCVRDesc', 'Try improving your job descriptions or adjusting salary ranges to attract more applicants.')}</p>
              </div>
            </div>
          )}

          {aggregateMetrics.avgTimeSpent < 30 && (
            <div className="ssc__analytics-insight ssc__analytics-insight--info">
              <AlertCircle size={20} />
              <div>
                <strong>{translate('analytics.insights.lowEngagement', 'Candidates are leaving quickly')}</strong>
                <p>{translate('analytics.insights.lowEngagementDesc', 'Add more details about your company culture, benefits, and growth opportunities.')}</p>
              </div>
            </div>
          )}

          {aggregateMetrics.totalViews > 100 && aggregateMetrics.totalApplications > 20 && (
            <div className="ssc__analytics-insight ssc__analytics-insight--success">
              <CheckCircle size={20} />
              <div>
                <strong>{translate('analytics.insights.goodPerformance', 'Great performance!')}</strong>
                <p>{translate('analytics.insights.goodPerformanceDesc', 'Your jobs are getting good traction. Keep up the detailed descriptions and competitive offers.')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

