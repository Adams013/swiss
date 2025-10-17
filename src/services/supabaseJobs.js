import { supabase } from '../supabaseClient';

const normalizeJob = (job) => ({
  ...job,
  applicants: job.applicants ?? 0,
  tags: job.tags ?? [],
  requirements: job.requirements ?? [],
  benefits: job.benefits ?? [],
  posted: job.posted || 'Recently posted',
  motivational_letter_required: job.motivational_letter_required ?? false,
});

export const fetchJobs = async ({ fallbackJobs = [] } = {}) => {
  try {
    const { data, error } = await supabase.from('jobs').select('*');

    if (error) {
      return {
        jobs: fallbackJobs,
        error,
        fallbackUsed: true,
        columnPresenceData: fallbackJobs,
      };
    }

    if (data && data.length > 0) {
      const normalized = data.map(normalizeJob);
      const supabaseIds = new Set(normalized.map((job) => job.id));
      const mergedJobs = [
        ...normalized,
        ...fallbackJobs.filter((job) => !supabaseIds.has(job.id)),
      ];

      return {
        jobs: mergedJobs,
        error: null,
        fallbackUsed: false,
        columnPresenceData: data,
      };
    }

    return {
      jobs: fallbackJobs,
      error: null,
      fallbackUsed: true,
      columnPresenceData: fallbackJobs,
    };
  } catch (error) {
    return {
      jobs: fallbackJobs,
      error,
      fallbackUsed: true,
      columnPresenceData: fallbackJobs,
    };
  }
};
