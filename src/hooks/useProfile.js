import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchProfile, 
  updateProfile, 
  uploadFile, 
  deleteFile,
  fetchStudentApplications,
  fetchSavedJobs,
  saveJob,
  unsaveJob,
} from '../services/profileService';
import { useState, useCallback } from 'react';

/**
 * Hook for fetching user profile
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result
 */
export const useProfile = (userId, options = {}) => {
  const [columnPresence, setColumnPresence] = useState({});

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const result = await fetchProfile(userId);
      if (result.data) {
        setColumnPresence((prev) => ({
          ...prev,
          ...Object.keys(result.data).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {}),
        }));
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    columnPresence,
  };
};

/**
 * Hook for updating profile with column presence tracking
 * @param {Object} options - Options including columnPresence
 * @returns {Object} - Mutation object with columnPresence
 */
export const useUpdateProfile = ({ columnPresence: initialColumnPresence = {} } = {}) => {
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
    mutationFn: (profileData) =>
      updateProfile(profileData, {
        columnPresence,
        onColumnMissing: handleColumnMissing,
        onColumnPresenceUpdate: handleColumnPresenceUpdate,
      }),
    onSuccess: (result, variables) => {
      // Update the cache directly with the returned data
      if (result.data) {
        queryClient.setQueryData(['profile', variables.user_id], result.data);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile', variables.user_id] });
    },
  });

  return {
    ...mutation,
    columnPresence,
  };
};

/**
 * Hook for uploading files
 * @returns {Object} - Mutation object
 */
export const useFileUpload = () => {
  return useMutation({
    mutationFn: ({ bucket, path, file }) => uploadFile(bucket, path, file),
  });
};

/**
 * Hook for deleting files
 * @returns {Object} - Mutation object
 */
export const useFileDelete = () => {
  return useMutation({
    mutationFn: ({ bucket, path }) => deleteFile(bucket, path),
  });
};

/**
 * Hook for fetching student applications
 * @param {string} profileId - Profile ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result
 */
export const useStudentApplications = (profileId, options = {}) => {
  return useQuery({
    queryKey: ['applications', 'student', profileId],
    queryFn: async () => {
      const result = await fetchStudentApplications(profileId);
      return result.data;
    },
    enabled: !!profileId,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching saved jobs
 * @param {string} profileId - Profile ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result
 */
export const useSavedJobs = (profileId, options = {}) => {
  return useQuery({
    queryKey: ['savedJobs', profileId],
    queryFn: async () => {
      const result = await fetchSavedJobs(profileId);
      return result.data;
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for saving/unsaving jobs
 * @returns {Object} - Mutation objects for save and unsave
 */
export const useSaveJob = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: ({ profileId, jobId }) => saveJob(profileId, jobId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs', variables.profileId] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: ({ profileId, jobId }) => unsaveJob(profileId, jobId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs', variables.profileId] });
    },
  });

  return {
    save: saveMutation,
    unsave: unsaveMutation,
  };
};

