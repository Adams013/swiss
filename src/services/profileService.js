import supabase from '../supabaseClient';
import { resilientUpsert, deriveColumnPresence } from './supabaseService';

/**
 * Fetches a user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // PGRST116 means no rows returned (not an error for our use case)
    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Profile fetch error', error);
    return { data: null, error };
  }
};

/**
 * Updates a user profile with resilient column handling
 * @param {Object} profileData - Profile data to update (must include user_id)
 * @param {Object} options - Options including columnPresence
 * @returns {Promise<{data: Object|null, error: Error|null, finalPayload: Object}>}
 */
export const updateProfile = async (profileData, { columnPresence = {}, onColumnMissing, onColumnPresenceUpdate }) => {
  // Ensure user_id is included
  if (!profileData.user_id) {
    return {
      data: null,
      error: new Error('user_id is required for profile update'),
      finalPayload: profileData,
    };
  }

  const result = await resilientUpsert({
    table: 'profiles',
    payload: profileData,
    columnPresence,
    onColumnMissing,
    onColumnPresenceUpdate,
    onConflict: 'user_id',
  });

  // Check for row-level security errors and handle gracefully
  if (result.error) {
    const message = result.error.message?.toLowerCase?.() || '';
    if (message.includes('row-level security')) {
      // Return a cached fallback profile
      return {
        data: {
          ...profileData,
          id: profileData.id || profileData.user_id,
        },
        error: null,
        finalPayload: result.finalPayload,
        cached: true,
      };
    }
  }

  return result;
};

/**
 * Uploads a file to Supabase storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {File} file - File to upload
 * @returns {Promise<{data: {path: string}|null, error: Error|null}>}
 */
export const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('File upload error', error);
    return { data: null, error };
  }
};

/**
 * Gets public URL for a file in storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {string|null} - Public URL or null
 */
export const getPublicUrl = (bucket, path) => {
  if (!bucket || !path) return null;

  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data?.publicUrl || null;
  } catch (error) {
    console.error('Get public URL error', error);
    return null;
  }
};

/**
 * Deletes a file from storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('File delete error', error);
    return { data: null, error };
  }
};

/**
 * Fetches job applications for a student
 * @param {string} profileId - Profile ID of the student
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const fetchStudentApplications = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, jobs ( id, title, company_name, startup_id, location )')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Fetch student applications error', error);
    return { data: [], error };
  }
};

/**
 * Fetches saved jobs for a student
 * @param {string} profileId - Profile ID of the student
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const fetchSavedJobs = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*, jobs ( * )')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Fetch saved jobs error', error);
    return { data: [], error };
  }
};

/**
 * Saves a job for a student
 * @param {string} profileId - Profile ID
 * @param {string|number} jobId - Job ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const saveJob = async (profileId, jobId) => {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({ profile_id: profileId, job_id: jobId })
      .select('*');

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Save job error', error);
    return { data: null, error };
  }
};

/**
 * Unsaves a job for a student
 * @param {string} profileId - Profile ID
 * @param {string|number} jobId - Job ID
 * @returns {Promise<{data: any, error: Error|null}>}
 */
export const unsaveJob = async (profileId, jobId) => {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('profile_id', profileId)
      .eq('job_id', jobId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Unsave job error', error);
    return { data: null, error };
  }
};

