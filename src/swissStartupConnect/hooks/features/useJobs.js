import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchJobs } from '../../../services/supabaseJobs';
import { loadMockJobs } from '../../../data/mockJobs';
import { getJobIdKey, sanitizeIdArray } from '../../utils/identifiers';
import { deriveColumnPresence } from '../../utils/salary';
import { JOBS_PAGE_SIZE, MAX_INITIAL_JOB_PAGES } from '../../constants/pagination';

/**
 * Custom hook for managing jobs data fetching, pagination, and saved jobs
 */
export const useJobs = ({ jobFilters, translate, setFeedback, user }) => {
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobColumnPresence, setJobColumnPresence] = useState({});
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsFallbackActive, setJobsFallbackActive] = useState(false);
  const [jobsVersion, setJobsVersion] = useState(0);
  
  // Job selection state
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapFocusJobId, setMapFocusJobId] = useState(null);
  
  // Pagination state
  const [supabaseJobPages, setSupabaseJobPages] = useState([]);
  const [jobPageRequest, setJobPageRequest] = useState(1);
  const [jobHasMorePages, setJobHasMorePages] = useState(false);
  
  // Refs
  const fallbackJobsRef = useRef([]);
  const supabaseJobPagesRef = useRef([]);
  
  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('ssc_saved_jobs');
      const parsed = stored ? JSON.parse(stored) : [];
      return sanitizeIdArray(parsed);
    } catch (error) {
      console.error('Failed to parse saved jobs', error);
      return [];
    }
  });

  // Applied jobs state
  const [appliedJobs, setAppliedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('ssc_applied_jobs');
      return sanitizeIdArray(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Failed to parse applied jobs', error);
      return [];
    }
  });

  // Job posting state
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [postJobError, setPostJobError] = useState('');
  const [jobForm, setJobForm] = useState({
    title: '',
    company_name: '',
    location: '',
    work_arrangement: '',
    type: 'full_time',
    description: '',
    requirements: '',
    benefits: '',
    salary: '',
    equity: '',
    motivational_letter_required: false,
  });

  // Sync refs with state
  useEffect(() => {
    supabaseJobPagesRef.current = supabaseJobPages;
  }, [supabaseJobPages]);

  // Persist saved jobs to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sanitised = sanitizeIdArray(savedJobs);
    window.localStorage.setItem('ssc_saved_jobs', JSON.stringify(sanitised));
  }, [savedJobs]);

  // Persist applied jobs to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_applied_jobs', JSON.stringify(sanitizeIdArray(appliedJobs)));
  }, [appliedJobs]);

  // Helper to set fallback state
  const setJobsFallbackState = useCallback((active) => {
    setJobsFallbackActive(active);
  }, []);

  // Load jobs effect
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadJobs = async () => {
      if (jobPageRequest <= supabaseJobPagesRef.current.length) {
        return;
      }

      setJobsLoading(true);

      try {
        let fallbackJobs =
          fallbackJobsRef.current.length > 0
            ? fallbackJobsRef.current
            : await loadMockJobs();

        if (!Array.isArray(fallbackJobs)) {
          fallbackJobs = [];
        }

        if (!cancelled && fallbackJobsRef.current.length === 0) {
          fallbackJobsRef.current = fallbackJobs;
        }

        while (!cancelled && supabaseJobPagesRef.current.length < jobPageRequest) {
          const pageNumber = supabaseJobPagesRef.current.length + 1;
          const response = await fetchJobs({
            fallbackJobs,
            page: pageNumber,
            pageSize: JOBS_PAGE_SIZE,
            filters: jobFilters,
            signal: controller.signal,
          });

          if (cancelled) {
            return;
          }

          if (response.error) {
            console.error('Job load error', response.error);
            setJobsFallbackState(true);
          } else if (response.fallbackUsed) {
            console.info('Using fallback jobs dataset');
            setJobsFallbackState(true);
          } else {
            setJobsFallbackState(false);
          }

          if (response.fallbackUsed) {
            const fallbackResult = Array.isArray(response.jobs) ? response.jobs : [];
            setJobs(fallbackResult);
            setJobColumnPresence(deriveColumnPresence(response.columnPresenceData));
            supabaseJobPagesRef.current = [];
            setSupabaseJobPages([]);
            setJobHasMorePages(false);
            break;
          }

          const pageData = Array.isArray(response.jobs) ? response.jobs : [];
          const nextPages = [...supabaseJobPagesRef.current, pageData];
          supabaseJobPagesRef.current = nextPages;
          setSupabaseJobPages(nextPages);
          setJobHasMorePages(response.hasMore);

          if (Array.isArray(response.columnPresenceData) && response.columnPresenceData.length > 0) {
            setJobColumnPresence((previous) => ({
              ...previous,
              ...deriveColumnPresence(response.columnPresenceData),
            }));
          }

          const supabaseFlattened = nextPages.flat();
          const supabaseIdSet = new Set(
            supabaseFlattened
              .map((job) => getJobIdKey(job?.id))
              .filter(Boolean)
          );
          const fallbackUnique = fallbackJobs.filter(
            (job) => !supabaseIdSet.has(getJobIdKey(job?.id))
          );
          setJobs([...supabaseFlattened, ...fallbackUnique]);

          if (response.hasMore && pageNumber < MAX_INITIAL_JOB_PAGES) {
            setJobPageRequest((previous) =>
              previous < pageNumber + 1 ? pageNumber + 1 : previous
            );
          }

          if (!response.hasMore) {
            break;
          }
        }
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        console.error('Job load error', error);
        setJobsFallbackState(true);

        let fallbackJobs =
          fallbackJobsRef.current.length > 0
            ? fallbackJobsRef.current
            : [];

        if (fallbackJobs.length === 0) {
          try {
            const loaded = await loadMockJobs();
            fallbackJobs = Array.isArray(loaded) ? loaded : [];
            fallbackJobsRef.current = fallbackJobs;
          } catch (fallbackError) {
            console.error('Fallback jobs load error', fallbackError);
            fallbackJobs = [];
          }
        }

        setJobs(fallbackJobs);
        setJobColumnPresence(deriveColumnPresence(fallbackJobs));
        supabaseJobPagesRef.current = [];
        setSupabaseJobPages([]);
        setJobHasMorePages(false);
      } finally {
        if (!cancelled) {
          setJobsLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [jobPageRequest, jobFilters, jobsVersion, setJobsFallbackState]);

  // Toggle saved job
  const toggleSavedJob = useCallback((jobId) => {
    if (!user) {
      setFeedback({
        type: 'info',
        message: translate('jobs.savedLogin', 'Log in to save roles for later.'),
      });
      return;
    }

    if (user.type !== 'student') {
      setFeedback({
        type: 'info',
        message: translate('jobs.savedSwitch', 'Switch to a student account to save roles.'),
      });
      return;
    }

    setSavedJobs((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        setFeedback({
          type: 'info',
          message: translate('jobs.feedbackRemoved', 'Removed from saved roles.'),
        });
        return prev.filter((id) => id !== jobId);
      }
      setFeedback({
        type: 'success',
        message: translate('jobs.feedbackAdded', 'Added to your saved roles.'),
      });
      return [...prev, jobId];
    });
  }, [user, translate, setFeedback]);

  // Refresh jobs
  const refreshJobs = useCallback(() => {
    setJobsVersion((prev) => prev + 1);
    setJobPageRequest(1);
    supabaseJobPagesRef.current = [];
    setSupabaseJobPages([]);
  }, []);

  return {
    // Jobs data
    jobs,
    setJobs,
    jobColumnPresence,
    setJobColumnPresence,
    jobsLoading,
    jobsFallbackActive,
    setJobsFallbackActive,
    jobsVersion,
    setJobsVersion,

    // Job selection
    selectedJob,
    setSelectedJob,
    mapFocusJobId,
    setMapFocusJobId,

    // Pagination
    supabaseJobPages,
    setSupabaseJobPages,
    jobPageRequest,
    setJobPageRequest,
    jobHasMorePages,
    setJobHasMorePages,

    // Saved jobs
    savedJobs,
    setSavedJobs,
    toggleSavedJob,

    // Applied jobs
    appliedJobs,
    setAppliedJobs,

    // Job posting
    postJobModalOpen,
    setPostJobModalOpen,
    postingJob,
    setPostingJob,
    postJobError,
    setPostJobError,
    jobForm,
    setJobForm,

    // Functions
    refreshJobs,

    // Refs
    fallbackJobsRef,
    supabaseJobPagesRef,
  };
};

