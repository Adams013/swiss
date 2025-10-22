/**
 * Job Recommendations Service
 * Provides personalized job recommendations based on user behavior and preferences
 */

import { supabase } from '../supabaseClient';

/**
 * Calculate recommendation score for a job based on user data
 * @param {object} job - Job to score
 * @param {object} userProfile - User profile and preferences
 * @returns {number} - Score from 0-100
 */
export const calculateJobScore = (job, userProfile) => {
  let score = 0;
  const weights = {
    savedJobs: 25,
    appliedJobs: 20,
    viewHistory: 15,
    profileMatch: 20,
    locationMatch: 10,
    salaryMatch: 10,
  };

  // 1. Match based on saved jobs (25 points)
  if (userProfile.savedJobs && userProfile.savedJobs.length > 0) {
    const savedJobsScore = calculateSavedJobsScore(job, userProfile.savedJobs);
    score += savedJobsScore * weights.savedJobs;
  }

  // 2. Match based on applied jobs (20 points)
  if (userProfile.appliedJobs && userProfile.appliedJobs.length > 0) {
    const appliedJobsScore = calculateAppliedJobsScore(job, userProfile.appliedJobs);
    score += appliedJobsScore * weights.appliedJobs;
  }

  // 3. Match based on view history (15 points)
  if (userProfile.viewedJobs && userProfile.viewedJobs.length > 0) {
    const viewHistoryScore = calculateViewHistoryScore(job, userProfile.viewedJobs);
    score += viewHistoryScore * weights.viewHistory;
  }

  // 4. Match based on profile skills/interests (20 points)
  if (userProfile.profile) {
    const profileScore = calculateProfileMatchScore(job, userProfile.profile);
    score += profileScore * weights.profileMatch;
  }

  // 5. Location preference match (10 points)
  if (userProfile.preferredLocations) {
    const locationScore = calculateLocationScore(job, userProfile.preferredLocations);
    score += locationScore * weights.locationMatch;
  }

  // 6. Salary expectation match (10 points)
  if (userProfile.salaryExpectation) {
    const salaryScore = calculateSalaryScore(job, userProfile.salaryExpectation);
    score += salaryScore * weights.salaryMatch;
  }

  return Math.min(100, Math.round(score));
};

/**
 * Score based on similarity to saved jobs
 */
const calculateSavedJobsScore = (job, savedJobs) => {
  let matchScore = 0;
  const factors = {
    sameCompany: 0.3,
    similarTitle: 0.4,
    similarTags: 0.3,
  };

  savedJobs.forEach((savedJob) => {
    // Same company
    if (job.company_name === savedJob.company_name) {
      matchScore += factors.sameCompany;
    }

    // Similar job title
    const titleSimilarity = calculateTitleSimilarity(job.title, savedJob.title);
    matchScore += titleSimilarity * factors.similarTitle;

    // Similar tags
    const tagSimilarity = calculateTagSimilarity(job.tags || [], savedJob.tags || []);
    matchScore += tagSimilarity * factors.similarTags;
  });

  // Normalize by number of saved jobs
  return Math.min(1, matchScore / savedJobs.length);
};

/**
 * Score based on similarity to applied jobs
 */
const calculateAppliedJobsScore = (job, appliedJobs) => {
  // Similar to saved jobs but with slightly different weights
  return calculateSavedJobsScore(job, appliedJobs) * 0.9; // Slightly lower weight
};

/**
 * Score based on viewed jobs
 */
const calculateViewHistoryScore = (job, viewedJobs) => {
  let matchScore = 0;

  // Recent views count more
  const recentViews = viewedJobs.slice(0, 10);
  
  recentViews.forEach((viewedJob, index) => {
    const recencyWeight = 1 - (index / recentViews.length) * 0.5; // Decay by recency
    
    if (job.company_name === viewedJob.company_name) {
      matchScore += 0.2 * recencyWeight;
    }

    const titleSimilarity = calculateTitleSimilarity(job.title, viewedJob.title);
    matchScore += titleSimilarity * 0.5 * recencyWeight;

    const tagSimilarity = calculateTagSimilarity(job.tags || [], viewedJob.tags || []);
    matchScore += tagSimilarity * 0.3 * recencyWeight;
  });

  return Math.min(1, matchScore);
};

/**
 * Score based on user profile match
 */
const calculateProfileMatchScore = (job, profile) => {
  let matchScore = 0;

  // Match skills from profile to job tags
  const userSkills = profile.skills || [];
  const jobTags = job.tags || [];
  
  if (userSkills.length > 0 && jobTags.length > 0) {
    const skillMatches = userSkills.filter((skill) =>
      jobTags.some((tag) => tag.toLowerCase().includes(skill.toLowerCase()))
    );
    matchScore += (skillMatches.length / userSkills.length) * 0.6;
  }

  // Match education level
  if (profile.education && job.requirements) {
    const educationMatch = job.requirements.some((req) =>
      req.toLowerCase().includes(profile.education.toLowerCase())
    );
    if (educationMatch) matchScore += 0.2;
  }

  // Match experience level
  if (profile.experience_years !== undefined && job.employment_type) {
    const jobLevel = job.employment_type.toLowerCase();
    const userExp = profile.experience_years;

    if (
      (userExp < 2 && jobLevel.includes('junior')) ||
      (userExp >= 2 && userExp < 5 && jobLevel.includes('mid')) ||
      (userExp >= 5 && jobLevel.includes('senior'))
    ) {
      matchScore += 0.2;
    }
  }

  return Math.min(1, matchScore);
};

/**
 * Score based on location preference
 */
const calculateLocationScore = (job, preferredLocations) => {
  if (!job.location) return 0.5; // Neutral score for remote/unspecified

  const jobLocation = job.location.toLowerCase();
  
  // Check if job location matches any preferred location
  const locationMatch = preferredLocations.some((pref) =>
    jobLocation.includes(pref.toLowerCase())
  );

  if (locationMatch) return 1;

  // Partial match for remote
  if (jobLocation.includes('remote') && preferredLocations.includes('Remote')) {
    return 0.8;
  }

  return 0.3; // Low score for non-matching locations
};

/**
 * Score based on salary expectations
 */
const calculateSalaryScore = (job, salaryExpectation) => {
  const { min: expectedMin, max: expectedMax } = salaryExpectation;
  const jobMin = job.salary_min_value;
  const jobMax = job.salary_max_value;

  // No salary info available
  if (!jobMin && !jobMax) return 0.5;

  // Calculate overlap
  const effectiveJobMin = jobMin || jobMax || 0;
  const effectiveJobMax = jobMax || jobMin || Infinity;

  // Check if there's overlap
  if (effectiveJobMax < expectedMin) {
    return 0.2; // Too low
  }

  if (effectiveJobMin > expectedMax) {
    return 0.5; // Too high, but might be negotiable
  }

  // Perfect match if job salary is within expected range
  if (effectiveJobMin >= expectedMin && effectiveJobMax <= expectedMax) {
    return 1;
  }

  // Partial match
  return 0.7;
};

/**
 * Calculate title similarity using simple word matching
 */
const calculateTitleSimilarity = (title1, title2) => {
  if (!title1 || !title2) return 0;

  const words1 = title1.toLowerCase().split(/\s+/);
  const words2 = title2.toLowerCase().split(/\s+/);

  // Remove common words
  const commonWords = ['and', 'or', 'the', 'a', 'an', 'in', 'at', 'for'];
  const filteredWords1 = words1.filter((w) => !commonWords.includes(w));
  const filteredWords2 = words2.filter((w) => !commonWords.includes(w));

  // Count matching words
  const matches = filteredWords1.filter((w) => filteredWords2.includes(w)).length;
  const totalWords = Math.max(filteredWords1.length, filteredWords2.length);

  return totalWords > 0 ? matches / totalWords : 0;
};

/**
 * Calculate tag similarity (Jaccard similarity)
 */
const calculateTagSimilarity = (tags1, tags2) => {
  if (tags1.length === 0 && tags2.length === 0) return 0;
  if (tags1.length === 0 || tags2.length === 0) return 0;

  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
};

/**
 * Get personalized job recommendations for a user
 * @param {string} userId - User ID
 * @param {array} allJobs - All available jobs
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<{recommendations: array, error: object}>}
 */
export const getJobRecommendations = async (userId, allJobs, limit = 10) => {
  try {
    // 1. Fetch user profile and preferences
    const userProfile = await fetchUserProfile(userId);

    // 2. Filter out jobs already applied to
    const appliedJobIds = new Set(userProfile.appliedJobs?.map((j) => j.id) || []);
    const candidateJobs = allJobs.filter((job) => !appliedJobIds.has(job.id));

    // 3. Score each job
    const scoredJobs = candidateJobs.map((job) => ({
      ...job,
      recommendationScore: calculateJobScore(job, userProfile),
    }));

    // 4. Sort by score and return top N
    const recommendations = scoredJobs
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    return { recommendations, error: null };
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return { recommendations: [], error };
  }
};

/**
 * Fetch user profile and behavior data
 */
const fetchUserProfile = async (userId) => {
  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch saved jobs
    const savedJobsIds = JSON.parse(localStorage.getItem(`savedJobs_${userId}`) || '[]');
    const { data: savedJobs } = savedJobsIds.length > 0
      ? await supabase.from('jobs').select('*').in('id', savedJobsIds)
      : { data: [] };

    // Fetch applications
    const { data: applications } = await supabase
      .from('applications')
      .select('*, jobs(*)')
      .eq('profile_id', userId)
      .limit(20);

    const appliedJobs = applications?.map((app) => app.jobs).filter(Boolean) || [];

    // Fetch view history
    const { data: viewHistory } = await supabase
      .from('job_views')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(50);

    const viewedJobs = viewHistory?.map((view) => view.jobs).filter(Boolean) || [];

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      profile,
      savedJobs: savedJobs || [],
      appliedJobs,
      viewedJobs,
      preferredLocations: preferences?.preferred_locations || [],
      salaryExpectation: preferences?.salary_expectation || null,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      profile: null,
      savedJobs: [],
      appliedJobs: [],
      viewedJobs: [],
      preferredLocations: [],
      salaryExpectation: null,
    };
  }
};

/**
 * Get similar jobs to a given job
 * @param {object} referenceJob - Job to find similar jobs to
 * @param {array} allJobs - All available jobs
 * @param {number} limit - Number of similar jobs to return
 * @returns {array} - Similar jobs sorted by similarity
 */
export const getSimilarJobs = (referenceJob, allJobs, limit = 5) => {
  if (!referenceJob || !allJobs || allJobs.length === 0) {
    return [];
  }

  const scoredJobs = allJobs
    .filter((job) => job.id !== referenceJob.id) // Exclude the reference job itself
    .map((job) => {
      let similarityScore = 0;

      // Same company (high weight)
      if (job.company_name === referenceJob.company_name) {
        similarityScore += 30;
      }

      // Similar title
      const titleSimilarity = calculateTitleSimilarity(job.title, referenceJob.title);
      similarityScore += titleSimilarity * 25;

      // Similar tags
      const tagSimilarity = calculateTagSimilarity(job.tags || [], referenceJob.tags || []);
      similarityScore += tagSimilarity * 20;

      // Same location
      if (job.location === referenceJob.location) {
        similarityScore += 15;
      }

      // Similar salary range
      if (job.salary_min_value && referenceJob.salary_min_value) {
        const salaryDiff = Math.abs(job.salary_min_value - referenceJob.salary_min_value);
        const maxSalary = Math.max(job.salary_min_value, referenceJob.salary_min_value);
        const salarySimilarity = 1 - Math.min(1, salaryDiff / maxSalary);
        similarityScore += salarySimilarity * 10;
      }

      return {
        ...job,
        similarityScore: Math.round(similarityScore),
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return scoredJobs;
};

/**
 * Update user preferences based on interactions
 * @param {string} userId - User ID
 * @param {object} interaction - User interaction data
 */
export const updateUserPreferencesFromInteraction = async (userId, interaction) => {
  try {
    const { type, job } = interaction; // type: 'view', 'save', 'apply'

    // Fetch current preferences
    const { data: currentPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let updatedPrefs = currentPrefs || {
      user_id: userId,
      preferred_locations: [],
      preferred_roles: [],
      salary_expectation: null,
    };

    // Learn from location
    if (job.location && !updatedPrefs.preferred_locations.includes(job.location)) {
      updatedPrefs.preferred_locations = [
        ...updatedPrefs.preferred_locations,
        job.location,
      ].slice(-5); // Keep last 5
    }

    // Learn from tags/roles
    if (job.tags && job.tags.length > 0) {
      const newRoles = job.tags.filter(
        (tag) => !updatedPrefs.preferred_roles.includes(tag)
      );
      updatedPrefs.preferred_roles = [
        ...updatedPrefs.preferred_roles,
        ...newRoles,
      ].slice(-10); // Keep last 10
    }

    // Learn from salary (only on apply)
    if (type === 'apply' && job.salary_min_value) {
      updatedPrefs.salary_expectation = {
        min: job.salary_min_value,
        max: job.salary_max_value || job.salary_min_value * 1.2,
      };
    }

    // Upsert preferences
    await supabase
      .from('user_preferences')
      .upsert(updatedPrefs, { onConflict: 'user_id' });

    return { success: true };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return { success: false, error };
  }
};

export default {
  calculateJobScore,
  getJobRecommendations,
  getSimilarJobs,
  updateUserPreferencesFromInteraction,
};

