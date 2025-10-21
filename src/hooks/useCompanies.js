import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCompanies, 
  fetchStartupByOwner, 
  createStartup, 
  updateStartup, 
  deleteStartup 
} from '../services/companyService';
import { useState, useCallback } from 'react';

/**
 * Hook for fetching and caching companies/startups data
 * @param {Array} mockCompanies - Fallback mock companies
 * @returns {Object} - Query result with companies, loading state, and column presence
 */
export const useCompanies = (mockCompanies = []) => {
  const [columnPresence, setColumnPresence] = useState({});

  const query = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const result = await fetchCompanies(mockCompanies);
      setColumnPresence(result.columnPresence);
      return result.companies;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    companies: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    columnPresence,
  };
};

/**
 * Hook for fetching startup profile by owner ID
 * @param {string} ownerId - Owner user ID
 * @param {Object} options - Query options
 * @returns {Object} - Query result
 */
export const useStartupProfile = (ownerId, options = {}) => {
  const [columnPresence, setColumnPresence] = useState({});

  const query = useQuery({
    queryKey: ['startup', 'owner', ownerId],
    queryFn: async () => {
      const result = await fetchStartupByOwner(ownerId);
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
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });

  return {
    startup: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    columnPresence,
  };
};

/**
 * Hook for creating a new startup
 * @returns {Object} - Mutation object
 */
export const useCreateStartup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (startupData) => createStartup(startupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['startup'] });
    },
  });
};

/**
 * Hook for updating a startup with column presence tracking
 * @param {Object} options - Options including columnPresence
 * @returns {Object} - Mutation object
 */
export const useUpdateStartup = ({ columnPresence: initialColumnPresence = {} } = {}) => {
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
    mutationFn: (startupData) =>
      updateStartup(startupData, {
        columnPresence,
        onColumnMissing: handleColumnMissing,
        onColumnPresenceUpdate: handleColumnPresenceUpdate,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['startup'] });
      
      // Update cache directly with the returned data
      if (result.data && result.data.owner_id) {
        queryClient.setQueryData(
          ['startup', 'owner', result.data.owner_id],
          result.data
        );
      }
    },
  });

  return {
    ...mutation,
    columnPresence,
  };
};

/**
 * Hook for deleting a startup
 * @returns {Object} - Mutation object
 */
export const useDeleteStartup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (startupId) => deleteStartup(startupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['startup'] });
    },
  });
};

