import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJobs, createJob, updateJob, deleteJob, fetchJobsByStartup } from '../services/jobService';
import { useState, useCallback } from 'react';

/**
 * Hook for fetching and caching jobs data
 * @param {Array} mockJobs - Fallback mock jobs
 * @returns {Object} - Query result with jobs, loading state, and column presence
 */
export const useJobs = (mockJobs = []) => {
  const [columnPresence, setColumnPresence] = useState({});

  const query = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const result = await fetchJobs(mockJobs);
      setColumnPresence(result.columnPresence);
      return result.jobs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    jobs: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    columnPresence,
  };
};

/**
 * Hook for creating a new job with column presence tracking
 * @param {Object} options - Options including columnPresence
 * @returns {Object} - Mutation object
 */
export const useCreateJob = ({ columnPresence: initialColumnPresence = {} } = {}) => {
  const queryClient = useQueryClient();
  const [columnPresence, setColumnPresence] = useState(initialColumnPresence);

  const handleColumnMissing = useCallback((column) => {
    setColumnPresence((prev) => ({ ...prev, [column]: false }));
  }, []);

  const handleColumnPresenceUpdate = useCallback((columns) => {
    setColumnPresence((prev) => {
      const next = { ...prev };
      columns.forEach((col) => {
        next[col] = true;
      });
      return next;
    });
  }, []);

  const mutation = useMutation({
    mutationFn: (jobData) =>
      createJob(jobData, {
        columnPresence,
        onColumnMissing: handleColumnMissing,
        onColumnPresenceUpdate: handleColumnPresenceUpdate,
      }),
    onSuccess: () => {
      // Invalidate and refetch jobs
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    ...mutation,
    columnPresence,
  };
};

/**
 * Hook for updating a job
 * @returns {Object} - Mutation object
 */
export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, updates }) => updateJob(jobId, updates),
    onSuccess: (data, variables) => {
      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Invalidate specific job query if it exists
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
    },
  });
};

/**
 * Hook for deleting a job
 * @returns {Object} - Mutation object
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId) => deleteJob(jobId),
    onSuccess: (data, jobId) => {
      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Remove specific job from cache
      queryClient.removeQueries({ queryKey: ['job', jobId] });
    },
  });
};

/**
 * Hook for fetching jobs by startup
 * @param {string|number} startupId - Startup ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result
 */
export const useJobsByStartup = (startupId, options = {}) => {
  return useQuery({
    queryKey: ['jobs', 'startup', startupId],
    queryFn: () => fetchJobsByStartup(startupId),
    enabled: !!startupId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

