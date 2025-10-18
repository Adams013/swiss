import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobs, DEFAULT_JOB_PAGE_SIZE } from '../../../services/supabaseJobs';
import { loadMockJobs } from '../../../data/mockJobs';
import { getJobIdKey } from '../utils';
import { deriveColumnPresence } from '../supabase';

const MAX_INITIAL_JOB_PAGES = 3;

const buildJobIdSet = (jobs) =>
  new Set(
    jobs
      .map((job) => getJobIdKey(job?.id))
      .filter((identifier) => typeof identifier === 'string' && identifier.length > 0)
  );

export const useSupabaseJobs = ({
  filters,
  jobsVersion,
  pageSize = DEFAULT_JOB_PAGE_SIZE,
  maxInitialPages = MAX_INITIAL_JOB_PAGES,
} = {}) => {
  const [jobs, setJobs] = useState([]);
  const [jobColumnPresence, setJobColumnPresence] = useState({});
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobHasMorePages, setJobHasMorePages] = useState(false);
  const [supabaseJobPages, setSupabaseJobPages] = useState([]);
  const [jobPageRequest, setJobPageRequest] = useState(1);
  const fallbackJobsRef = useRef([]);
  const supabaseJobPagesRef = useRef([]);

  useEffect(() => {
    supabaseJobPagesRef.current = supabaseJobPages;
  }, [supabaseJobPages]);

  const resetJobs = useCallback(() => {
    setSupabaseJobPages([]);
    supabaseJobPagesRef.current = [];
    setJobHasMorePages(false);
    setJobPageRequest(1);
  }, []);

  useEffect(() => {
    resetJobs();
  }, [filters, jobsVersion, resetJobs]);

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
            pageSize,
            filters: filters || {},
            signal: controller.signal,
          });

          if (cancelled) {
            return;
          }

          if (response.error) {
            console.error('Job load error', response.error);
          } else if (response.fallbackUsed) {
            console.info('Using fallback jobs dataset');
          }

          if (response.fallbackUsed) {
            const fallbackResult = Array.isArray(response.jobs) ? response.jobs : fallbackJobs;
            setJobs(fallbackResult);
            setJobColumnPresence(deriveColumnPresence(response.columnPresenceData || fallbackResult));
            fallbackJobsRef.current = fallbackResult;
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

          const supabaseFlattened = nextPages.flat();
          const supabaseIdSet = buildJobIdSet(supabaseFlattened);
          const fallbackUnique = fallbackJobs.filter((job) => !supabaseIdSet.has(getJobIdKey(job?.id)));

          setJobs([...supabaseFlattened, ...fallbackUnique]);

          if (Array.isArray(response.columnPresenceData)) {
            setJobColumnPresence(deriveColumnPresence(response.columnPresenceData));
          } else {
            setJobColumnPresence((previous) => ({ ...previous, ...deriveColumnPresence(supabaseFlattened) }));
          }

          if (response.hasMore && pageNumber < maxInitialPages) {
            setJobPageRequest((previous) => (previous < pageNumber + 1 ? pageNumber + 1 : previous));
          }

          if (!response.hasMore) {
            break;
          }
        }
      } catch (error) {
        console.error('Job load error', error);

        let fallbackJobs =
          fallbackJobsRef.current.length > 0 ? fallbackJobsRef.current : [];

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
  }, [filters, jobPageRequest, jobsVersion, maxInitialPages, pageSize]);

  const requestNextJobPage = useCallback(() => {
    setJobPageRequest((previous) => previous + 1);
  }, []);

  return {
    jobs,
    setJobs,
    jobColumnPresence,
    setJobColumnPresence,
    jobsLoading,
    jobHasMorePages,
    requestNextJobPage,
    resetJobs,
  };
};

export default useSupabaseJobs;
