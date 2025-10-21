import supabase from '../supabaseClient';
import { resilientUpsert, deriveColumnPresence } from './supabaseService';

/**
 * Maps a startup record to company format
 * @param {Object} startup - Startup record
 * @returns {Object|null} - Mapped company object
 */
export const mapStartupToCompany = (startup) => {
  if (!startup || !startup.name) {
    return null;
  }

  return {
    id: startup.id,
    name: startup.name,
    description: startup.description || '',
    website: startup.website || '',
    logo: startup.logo_url || '',
    industry: startup.industry || '',
    team_size: startup.team_size || startup.team || startup.employees || '',
    funding: startup.funding_stage || startup.funding || startup.fundraising || '',
    location: startup.location || startup.city || startup.headquarters || '',
    verified: startup.verification_status === 'verified',
  };
};

/**
 * Fetches all companies/startups from Supabase
 * @param {Array} mockCompanies - Fallback mock companies
 * @returns {Promise<{companies: Array, columnPresence: Object}>}
 */
export const fetchCompanies = async (mockCompanies = []) => {
  try {
    const { data, error } = await supabase.from('startups').select('*');

    if (error) {
      console.info('Falling back to mock companies', error.message);
      return {
        companies: mockCompanies,
        columnPresence: deriveColumnPresence(mockCompanies),
      };
    }

    if (data && data.length > 0) {
      const mapped = data.map((company) => mapStartupToCompany(company)).filter(Boolean);
      
      // Merge with mock companies (prioritize Supabase data)
      const supabaseIds = new Set(
        mapped
          .map((company) => (company.id != null ? String(company.id) : ''))
          .filter(Boolean)
      );
      
      const merged = [
        ...mapped,
        ...mockCompanies.filter((company) => {
          const idKey = company.id != null ? String(company.id) : '';
          return idKey ? !supabaseIds.has(idKey) : true;
        }),
      ];

      return {
        companies: merged,
        columnPresence: deriveColumnPresence(data),
      };
    }

    return {
      companies: mockCompanies,
      columnPresence: deriveColumnPresence(mockCompanies),
    };
  } catch (error) {
    console.error('Companies load error', error);
    return {
      companies: mockCompanies,
      columnPresence: deriveColumnPresence(mockCompanies),
    };
  }
};

/**
 * Fetches a startup profile by owner ID
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const fetchStartupByOwner = async (ownerId) => {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    // PGRST116 means no rows returned (not an error)
    if (error && error.code !== 'PGRST116') {
      console.error('Startup fetch error', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Startup fetch error', error);
    return { data: null, error };
  }
};

/**
 * Creates a new startup record
 * @param {Object} startupData - Startup data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createStartup = async (startupData) => {
  try {
    const { data, error } = await supabase
      .from('startups')
      .insert(startupData)
      .select('*')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Startup insert error', error);
    return { data: null, error };
  }
};

/**
 * Updates a startup profile with resilient column handling
 * @param {Object} startupData - Startup data to update
 * @param {Object} options - Options including columnPresence
 * @returns {Promise<{data: Object|null, error: Error|null, finalPayload: Object}>}
 */
export const updateStartup = async (startupData, { columnPresence = {}, onColumnMissing, onColumnPresenceUpdate }) => {
  return resilientUpsert({
    table: 'startups',
    payload: startupData,
    columnPresence,
    onColumnMissing,
    onColumnPresenceUpdate,
    onConflict: 'owner_id',
  });
};

/**
 * Deletes a startup
 * @param {string|number} startupId - Startup ID
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const deleteStartup = async (startupId) => {
  try {
    const { data, error } = await supabase
      .from('startups')
      .delete()
      .eq('id', startupId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Startup delete error', error);
    return { data: null, error };
  }
};

