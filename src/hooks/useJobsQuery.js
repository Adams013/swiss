import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJobs, createJobPost } from '../services/supabaseJobs';

/**
 * React Query hook for fetching jobs with automatic caching and refetching
 * Wraps the existing supabaseJobs service
 * 
 * @param {Object} options - Query options
 * @param {number} options.pageSize - Number of jobs per page
 * @param {Array} options.mockJobs - Fallback mock jobs
 * @returns {Object} Query result with jobs, loading state, and refetch function
 */
export const useJobs = ({ pageSize, mockJobs = [] } = {}) => {
  return useQuery({
    queryKey: ['jobs', { pageSize }],
    queryFn: async () => {
      const result = await fetchJobs({ pageSize, mockJobs });
      return result.jobs || mockJobs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });
};

/**
 * React Query mutation hook for creating job posts
 * Wraps the existing createJobPost service
 * 
 * @returns {Object} Mutation object with mutate, mutateAsync, isLoading, etc.
 */
export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobData) => createJobPost(jobData),
    onSuccess: () => {
      // Invalidate and refetch jobs after successful creation
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    retry: 1,
  });
};

/**
 * React Query hook for fetching jobs with advanced filtering
 * Wraps the existing supabaseJobs service with filter support
 * 
 * @param {Object} filters - Job filters (location, type, etc.)
 * @param {Object} options - Query options
 * @returns {Object} Query result
 */
export const useFilteredJobs = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['jobs', 'filtered', filters],
    queryFn: async () => {
      const result = await fetchJobs({ 
        ...options,
        // Additional filter logic can be added here
      });
      
      let jobs = result.jobs || [];
      
      // Apply client-side filters if needed
      if (filters.location) {
        jobs = jobs.filter(job => 
          job.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      if (filters.type) {
        jobs = jobs.filter(job => job.employment_type === filters.type);
      }
      
      return jobs;
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

