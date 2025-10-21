import supabase from '../supabaseClient';
import { resilientInsert, deriveColumnPresence } from './supabaseService';

/**
 * Fetches all jobs from Supabase
 * @param {Object} mockJobs - Fallback mock jobs
 * @returns {Promise<{jobs: Array, columnPresence: Object}>}
 */
export const fetchJobs = async (mockJobs = []) => {
  try {
    const { data, error } = await supabase.from('jobs').select('*');

    if (error) {
      console.info('Falling back to mock jobs', error.message);
      return {
        jobs: mockJobs,
        columnPresence: deriveColumnPresence(mockJobs),
      };
    }

    if (data && data.length > 0) {
      const mapped = data.map((job) => ({
        ...job,
        applicants: job.applicants ?? 0,
        tags: job.tags ?? [],
        requirements: job.requirements ?? [],
        benefits: job.benefits ?? [],
        posted: job.posted || 'Recently posted',
        motivational_letter_required: job.motivational_letter_required ?? false,
      }));

      // Merge with mock jobs (prioritize Supabase data)
      const supabaseIds = new Set(mapped.map((job) => job.id));
      const mergedJobs = [...mapped, ...mockJobs.filter((job) => !supabaseIds.has(job.id))];

      return {
        jobs: mergedJobs,
        columnPresence: deriveColumnPresence(data),
      };
    }

    return {
      jobs: mockJobs,
      columnPresence: deriveColumnPresence(mockJobs),
    };
  } catch (error) {
    console.error('Job load error', error);
    return {
      jobs: mockJobs,
      columnPresence: deriveColumnPresence(mockJobs),
    };
  }
};

/**
 * Creates a new job posting with resilient column handling
 * @param {Object} jobData - Job data to create
 * @param {Object} options - Options including columnPresence
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createJob = async (jobData, { columnPresence = {}, onColumnMissing, onColumnPresenceUpdate }) => {
  return resilientInsert({
    table: 'jobs',
    payload: jobData,
    columnPresence,
    onColumnMissing,
    onColumnPresenceUpdate,
  });
};

/**
 * Updates an existing job
 * @param {string|number} jobId - Job ID
 * @param {Object} updates - Job updates
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateJob = async (jobId, updates) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Job update error', error);
    return { data: null, error };
  }
};

/**
 * Deletes a job
 * @param {string|number} jobId - Job ID
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const deleteJob = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Job delete error', error);
    return { data: null, error };
  }
};

/**
 * Fetches jobs for a specific startup
 * @param {string|number} startupId - Startup ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const fetchJobsByStartup = async (startupId) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Fetch jobs by startup error', error);
    return { data: [], error };
  }
};

