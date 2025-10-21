import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCompanies, upsertCompanyProfile } from '../services/supabaseCompanies';

/**
 * React Query hook for fetching companies with automatic caching
 * Wraps the existing supabaseCompanies service
 * 
 * @param {Object} options - Query options
 * @param {Array} options.mockCompanies - Fallback mock companies
 * @returns {Object} Query result with companies, loading state, and refetch function
 */
export const useCompanies = ({ mockCompanies = [] } = {}) => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const result = await fetchCompanies({ mockCompanies });
      return result.companies || mockCompanies;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * React Query mutation hook for upserting company profiles
 * Wraps the existing upsertCompanyProfile service
 * 
 * @returns {Object} Mutation object
 */
export const useUpsertCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyData) => upsertCompanyProfile(companyData),
    onSuccess: () => {
      // Invalidate and refetch companies after successful upsert
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    retry: 1,
  });
};

/**
 * React Query hook for fetching a specific company by ID
 * 
 * @param {string|number} companyId - Company ID
 * @param {Object} options - Query options
 * @returns {Object} Query result
 */
export const useCompany = (companyId, options = {}) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      // This would need a specific fetchCompanyById service function
      // For now, we'll fetch all and filter
      const result = await fetchCompanies({ mockCompanies: [] });
      const companies = result.companies || [];
      return companies.find(c => c.id === companyId) || null;
    },
    enabled: !!companyId && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

