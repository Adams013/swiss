import { supabase } from '../supabaseClient';

export const fetchCompanies = async ({
  fallbackCompanies = [],
  mapStartupToCompany = (startup) => startup,
} = {}) => {
  try {
    const { data, error } = await supabase.from('startups').select('*');

    if (error) {
      return {
        companies: fallbackCompanies,
        error,
        fallbackUsed: true,
      };
    }

    if (data && data.length > 0) {
      const mapped = data.map((startup) => mapStartupToCompany(startup)).filter(Boolean);
      const supabaseIds = new Set(
        mapped
          .map((company) => (company.id != null ? String(company.id) : ''))
          .filter(Boolean)
      );
      const merged = [
        ...mapped,
        ...fallbackCompanies.filter((company) => {
          const idKey = company.id != null ? String(company.id) : '';
          return idKey ? !supabaseIds.has(idKey) : true;
        }),
      ];

      return {
        companies: merged,
        error: null,
        fallbackUsed: false,
      };
    }

    return {
      companies: fallbackCompanies,
      error: null,
      fallbackUsed: true,
    };
  } catch (error) {
    return {
      companies: fallbackCompanies,
      error,
      fallbackUsed: true,
    };
  }
};
