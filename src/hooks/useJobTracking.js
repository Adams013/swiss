import { useEffect, useRef, useCallback } from 'react';
import { trackJobView } from '../services/supabaseNotifications';
import { updateUserPreferencesFromInteraction } from '../services/jobRecommendations';

/**
 * useJobTracking Hook
 * Automatically tracks job views and user interactions for analytics and recommendations
 */
export const useJobTracking = (job, user, options = {}) => {
  const {
    source = 'search', // 'search', 'recommended', 'similar_jobs', 'email_alert', 'company_page'
    trackViews = true,
    trackScrollDepth = true,
    trackTimeSpent = true,
  } = options;

  const viewTrackedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const sessionIdRef = useRef(generateSessionId());

  useEffect(() => {
    if (!job || !trackViews) return;

    // Track initial view
    trackView();

    // Track scroll depth
    if (trackScrollDepth) {
      const handleScroll = () => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercentage);
      };

      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        
        // Track final metrics on unmount
        if (trackTimeSpent) {
          trackEngagement();
        }
      };
    }
  }, [job?.id, trackViews]);

  const trackView = async () => {
    if (viewTrackedRef.current || !job) return;

    viewTrackedRef.current = true;

    // Track the view
    await trackJobView(job.id, user?.id || null, {
      sessionId: sessionIdRef.current,
      source,
    });

    // Update user preferences if logged in
    if (user?.id) {
      await updateUserPreferencesFromInteraction(user.id, {
        type: 'view',
        job,
      });
    }
  };

  const trackEngagement = async () => {
    if (!job) return;

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const scrolledToBottom = maxScrollRef.current > 80;

    // Update the view record with engagement metrics
    await trackJobView(job.id, user?.id || null, {
      sessionId: sessionIdRef.current,
      source,
      timeSpent,
      scrolledToBottom,
    });
  };

  const trackApplyClick = useCallback(async () => {
    if (!job) return;

    await trackJobView(job.id, user?.id || null, {
      sessionId: sessionIdRef.current,
      source,
      clickedApply: true,
    });

    // Update preferences with stronger signal
    if (user?.id) {
      await updateUserPreferencesFromInteraction(user.id, {
        type: 'apply',
        job,
      });
    }
  }, [job, user, source]);

  const trackSave = useCallback(async () => {
    if (!job || !user?.id) return;

    // Update preferences
    await updateUserPreferencesFromInteraction(user.id, {
      type: 'save',
      job,
    });
  }, [job, user]);

  return {
    trackApplyClick,
    trackSave,
  };
};

/**
 * useJobListTracking Hook
 * Tracks which jobs are visible in a list (for impression tracking)
 */
export const useJobListTracking = (jobs, user, source = 'search') => {
  const trackedJobsRef = useRef(new Set());

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;

    // Set up Intersection Observer to track visible jobs
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const jobId = entry.target.getAttribute('data-job-id');
            
            // Only track each job once per session
            if (!trackedJobsRef.current.has(jobId)) {
              trackedJobsRef.current.add(jobId);

              // Find the job object
              const job = jobs.find(j => j.id === jobId);
              
              if (job) {
                // Track impression
                await trackJobView(jobId, user?.id || null, {
                  source: `${source}_impression`,
                  sessionId: generateSessionId(),
                });
              }
            }
          }
        });
      },
      {
        threshold: 0.5, // At least 50% visible
      }
    );

    // Observe all job cards
    const jobCards = document.querySelectorAll('[data-job-id]');
    jobCards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [jobs, user, source]);
};

/**
 * Generate a unique session ID for tracking
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Track job share
 */
export const trackJobShare = async (jobId, userId, platform) => {
  await trackJobView(jobId, userId, {
    sessionId: generateSessionId(),
    source: `share_${platform}`,
  });
};

/**
 * Track external link clicks (company website, application link, etc.)
 */
export const trackExternalClick = async (jobId, userId, linkType) => {
  await trackJobView(jobId, userId, {
    sessionId: generateSessionId(),
    source: `external_${linkType}`,
  });
};

export default {
  useJobTracking,
  useJobListTracking,
  trackJobShare,
  trackExternalClick,
};

