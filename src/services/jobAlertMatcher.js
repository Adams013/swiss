/**
 * Job Alert Matcher
 * Matches jobs against saved searches and queues notifications
 */

import {
  fetchSavedSearches,
  getSentJobAlerts,
  trackJobAlert,
  queueNotification,
} from './supabaseNotifications';
import { fetchJobs } from './supabaseJobs';

/**
 * Check if a job matches the filter criteria
 * @param {object} job - Job to check
 * @param {object} filters - Filter criteria from saved search
 * @returns {boolean} - Whether job matches
 */
export const jobMatchesFilters = (job, filters) => {
  if (!job || !filters) {
    return false;
  }

  // Search term match (title, company, description)
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    const searchableText = [
      job.title,
      job.company_name,
      job.description,
      job.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!searchableText.includes(searchLower)) {
      return false;
    }
  }

  // Location match
  if (filters.locations && filters.locations.length > 0) {
    const jobLocation = (job.location || '').toLowerCase();
    const locationMatch = filters.locations.some((location) =>
      jobLocation.includes(location.toLowerCase())
    );

    if (!locationMatch) {
      return false;
    }
  }

  // Work arrangement match (remote, hybrid, on-site)
  if (filters.workArrangements && filters.workArrangements.length > 0) {
    const jobArrangement = (job.work_arrangement || '').toLowerCase();
    const arrangementMatch = filters.workArrangements.some((arrangement) =>
      jobArrangement.includes(arrangement.toLowerCase())
    );

    if (!arrangementMatch) {
      return false;
    }
  }

  // Employment type match (full-time, part-time, internship)
  if (filters.employmentTypes && filters.employmentTypes.length > 0) {
    const jobType = (job.employment_type || '').toLowerCase();
    const typeMatch = filters.employmentTypes.some((type) =>
      jobType.includes(type.toLowerCase())
    );

    if (!typeMatch) {
      return false;
    }
  }

  // Salary range match
  if (filters.salaryMin !== undefined || filters.salaryMax !== undefined) {
    const jobMinSalary = job.salary_min_value;
    const jobMaxSalary = job.salary_max_value;

    // If job has no salary info, still include it
    if (jobMinSalary !== null || jobMaxSalary !== null) {
      const filterMin = filters.salaryMin || 0;
      const filterMax = filters.salaryMax || Infinity;

      // Check if there's any overlap between job salary range and filter range
      const effectiveJobMin = jobMinSalary ?? jobMaxSalary ?? 0;
      const effectiveJobMax = jobMaxSalary ?? jobMinSalary ?? Infinity;

      if (effectiveJobMax < filterMin || effectiveJobMin > filterMax) {
        return false;
      }
    }
  }

  // Tags/skills match
  if (filters.tags && filters.tags.length > 0) {
    const jobTags = (job.tags || []).map((tag) => tag.toLowerCase());
    const tagMatch = filters.tags.some((filterTag) =>
      jobTags.some((jobTag) => jobTag.includes(filterTag.toLowerCase()))
    );

    if (!tagMatch) {
      return false;
    }
  }

  // Company stage match
  if (filters.companyStages && filters.companyStages.length > 0) {
    const jobStage = (job.stage || '').toLowerCase();
    const stageMatch = filters.companyStages.some((stage) =>
      jobStage.includes(stage.toLowerCase())
    );

    if (!stageMatch) {
      return false;
    }
  }

  // All filters passed
  return true;
};

/**
 * Find jobs that match a saved search
 * @param {object} savedSearch - Saved search configuration
 * @param {array} jobs - Jobs to check against
 * @returns {array} - Matching jobs
 */
export const findMatchingJobs = (savedSearch, jobs) => {
  if (!savedSearch || !savedSearch.filters || !Array.isArray(jobs)) {
    return [];
  }

  return jobs.filter((job) => jobMatchesFilters(job, savedSearch.filters));
};

/**
 * Get new jobs for a user's saved searches
 * @param {string} userId - User ID
 * @param {object} options - Options for fetching jobs
 * @returns {Promise<{searchMatches: array, error: object}>}
 */
export const getNewJobsForSavedSearches = async (userId, options = {}) => {
  try {
    // 1. Fetch user's saved searches with alerts enabled
    const { searches, error: searchError } = await fetchSavedSearches(userId);

    if (searchError) {
      return { searchMatches: [], error: searchError };
    }

    const activeSearches = searches.filter((search) => search.alert_enabled);

    if (activeSearches.length === 0) {
      return { searchMatches: [], error: null };
    }

    // 2. Fetch recent jobs (last 7 days by default)
    const { jobs, error: jobsError } = await fetchJobs({
      pageSize: options.pageSize || 100,
      fallbackJobs: [],
    });

    if (jobsError) {
      return { searchMatches: [], error: jobsError };
    }

    // Filter to only recent jobs (posted in last N days)
    const daysBack = options.daysBack || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentJobs = jobs.filter((job) => {
      const createdAt = job.created_at ? new Date(job.created_at) : null;
      return createdAt && createdAt >= cutoffDate;
    });

    // 3. For each saved search, find matching jobs
    const searchMatches = await Promise.all(
      activeSearches.map(async (search) => {
        // Get jobs already sent for this search
        const { jobIds: sentJobIds } = await getSentJobAlerts(userId, search.id);

        // Find matching jobs that haven't been sent yet
        const matchingJobs = findMatchingJobs(search, recentJobs);
        const newJobs = matchingJobs.filter((job) => !sentJobIds.includes(job.id));

        return {
          search,
          matchingJobs: newJobs,
          totalMatches: newJobs.length,
        };
      })
    );

    // Filter out searches with no new matches
    const withMatches = searchMatches.filter((match) => match.totalMatches > 0);

    return { searchMatches: withMatches, error: null };
  } catch (error) {
    console.error('Error getting new jobs for saved searches:', error);
    return { searchMatches: [], error };
  }
};

/**
 * Queue job alert notifications for a user
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<{queued: number, error: object}>}
 */
export const queueJobAlertsForUser = async (userId, options = {}) => {
  try {
    const { searchMatches, error } = await getNewJobsForSavedSearches(userId, options);

    if (error) {
      return { queued: 0, error };
    }

    if (searchMatches.length === 0) {
      return { queued: 0, error: null };
    }

    // Queue notifications based on frequency
    let queuedCount = 0;

    for (const match of searchMatches) {
      const { search, matchingJobs } = match;

      // Check if we should send based on frequency
      const shouldSend = shouldSendAlert(search);

      if (!shouldSend) {
        continue;
      }

      // Queue the notification
      const { error: queueError } = await queueNotification(
        userId,
        'job_alert',
        {
          subject: `${matchingJobs.length} new job${matchingJobs.length > 1 ? 's' : ''} matching "${search.name}"`,
          savedSearchId: search.id,
          savedSearchName: search.name,
          jobs: matchingJobs.map((job) => ({
            id: job.id,
            title: job.title,
            company_name: job.company_name,
            location: job.location,
            salary_min_value: job.salary_min_value,
            salary_max_value: job.salary_max_value,
            description: job.description,
          })),
        },
        {
          priority: search.alert_frequency === 'instant' ? 1 : 3,
          scheduledFor: new Date().toISOString(),
        }
      );

      if (!queueError) {
        queuedCount++;

        // Track that these jobs were sent
        for (const job of matchingJobs) {
          await trackJobAlert(userId, job.id, 'saved_search', search.id);
        }
      }
    }

    return { queued: queuedCount, error: null };
  } catch (error) {
    console.error('Error queueing job alerts:', error);
    return { queued: 0, error };
  }
};

/**
 * Check if alert should be sent based on frequency and last sent time
 * @param {object} search - Saved search
 * @returns {boolean}
 */
const shouldSendAlert = (search) => {
  if (!search.alert_enabled) {
    return false;
  }

  const now = new Date();
  const lastSent = search.last_notification_sent_at
    ? new Date(search.last_notification_sent_at)
    : null;

  switch (search.alert_frequency) {
    case 'instant':
      // Always send for instant
      return true;

    case 'daily':
      // Send if more than 24 hours since last send
      if (!lastSent) {
        return true;
      }
      const daysSinceLastSent = (now - lastSent) / (1000 * 60 * 60 * 24);
      return daysSinceLastSent >= 1;

    case 'weekly':
      // Send if more than 7 days since last send
      if (!lastSent) {
        return true;
      }
      const weeksSinceLastSent = (now - lastSent) / (1000 * 60 * 60 * 24 * 7);
      return weeksSinceLastSent >= 1;

    default:
      return false;
  }
};

/**
 * Process all pending job alerts
 * This should be called by a cron job or scheduled task
 * @returns {Promise<{processed: number, sent: number, failed: number}>}
 */
export const processPendingJobAlerts = async () => {
  // This would be implemented as a server-side function
  // For now, this is a placeholder for the client-side reference

  console.log('processPendingJobAlerts should run server-side (cron job or edge function)');

  return {
    processed: 0,
    sent: 0,
    failed: 0,
  };
};

/**
 * Get recommended frequency based on job market activity
 * @param {object} filters - Search filters
 * @returns {string} - Recommended frequency ('instant', 'daily', 'weekly')
 */
export const getRecommendedAlertFrequency = (filters) => {
  // Broad searches = daily or weekly
  // Specific searches = instant

  let specificity = 0;

  if (filters.searchTerm && filters.searchTerm.length > 3) specificity++;
  if (filters.locations && filters.locations.length > 0) specificity++;
  if (filters.tags && filters.tags.length > 0) specificity++;
  if (filters.employmentTypes && filters.employmentTypes.length > 0) specificity++;
  if (filters.salaryMin !== undefined) specificity++;

  if (specificity >= 3) {
    return 'instant'; // Very specific search
  } else if (specificity >= 1) {
    return 'daily'; // Moderately specific
  } else {
    return 'weekly'; // Broad search
  }
};

export default {
  jobMatchesFilters,
  findMatchingJobs,
  getNewJobsForSavedSearches,
  queueJobAlertsForUser,
  shouldSendAlert,
  getRecommendedAlertFrequency,
};

