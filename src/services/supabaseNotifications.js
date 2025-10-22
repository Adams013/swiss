import { supabase } from '../supabaseClient';

/**
 * Notification Preferences Service
 * Manages user notification settings
 */

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email_enabled: true,
  job_alerts_enabled: true,
  job_alert_frequency: 'daily',
  application_status_updates: true,
  application_messages: true,
  followed_company_jobs: true,
  newsletter_enabled: false,
  product_updates: true,
};

/**
 * Fetch notification preferences for a user
 * @param {string} userId - User ID
 * @returns {Promise<{preferences: object, error: object}>}
 */
export const fetchNotificationPreferences = async (userId) => {
  if (!userId) {
    return {
      preferences: null,
      error: { message: 'User ID is required' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist yet, return defaults
      if (error.code === 'PGRST116') {
        return {
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          error: null,
        };
      }
      return { preferences: null, error };
    }

    return { preferences: data, error: null };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return {
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      error,
    };
  }
};

/**
 * Update or create notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Preference updates
 * @returns {Promise<{preferences: object, error: object}>}
 */
export const upsertNotificationPreferences = async (userId, preferences) => {
  if (!userId) {
    return {
      preferences: null,
      error: { message: 'User ID is required' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      return { preferences: null, error };
    }

    return { preferences: data, error: null };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { preferences: null, error };
  }
};

/**
 * Saved Searches Service
 * Manages user's saved job searches with alerts
 */

/**
 * Fetch all saved searches for a user
 * @param {string} userId - User ID
 * @returns {Promise<{searches: array, error: object}>}
 */
export const fetchSavedSearches = async (userId) => {
  if (!userId) {
    return { searches: [], error: { message: 'User ID is required' } };
  }

  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { searches: [], error };
    }

    return { searches: data || [], error: null };
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return { searches: [], error };
  }
};

/**
 * Create a new saved search
 * @param {string} userId - User ID
 * @param {object} searchData - Search configuration
 * @returns {Promise<{search: object, error: object}>}
 */
export const createSavedSearch = async (userId, searchData) => {
  if (!userId) {
    return { search: null, error: { message: 'User ID is required' } };
  }

  const { name, description, filters, alert_enabled, alert_frequency } = searchData;

  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name,
        description,
        filters: filters || {},
        alert_enabled: alert_enabled !== undefined ? alert_enabled : true,
        alert_frequency: alert_frequency || 'daily',
      })
      .select()
      .single();

    if (error) {
      return { search: null, error };
    }

    return { search: data, error: null };
  } catch (error) {
    console.error('Error creating saved search:', error);
    return { search: null, error };
  }
};

/**
 * Update a saved search
 * @param {string} searchId - Search ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{search: object, error: object}>}
 */
export const updateSavedSearch = async (searchId, updates) => {
  if (!searchId) {
    return { search: null, error: { message: 'Search ID is required' } };
  }

  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', searchId)
      .select()
      .single();

    if (error) {
      return { search: null, error };
    }

    return { search: data, error: null };
  } catch (error) {
    console.error('Error updating saved search:', error);
    return { search: null, error };
  }
};

/**
 * Delete a saved search (soft delete)
 * @param {string} searchId - Search ID
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const deleteSavedSearch = async (searchId) => {
  if (!searchId) {
    return { success: false, error: { message: 'Search ID is required' } };
  }

  try {
    const { error } = await supabase
      .from('saved_searches')
      .update({ is_active: false })
      .eq('id', searchId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return { success: false, error };
  }
};

/**
 * Job Alerts Service
 * Manages job alert tracking
 */

/**
 * Track that a job alert was sent to a user
 * @param {string} userId - User ID
 * @param {string} jobId - Job ID
 * @param {string} alertType - Type of alert ('saved_search', 'followed_company', 'recommendation')
 * @param {string} savedSearchId - Optional saved search ID
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const trackJobAlert = async (userId, jobId, alertType, savedSearchId = null) => {
  try {
    const { error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: userId,
        job_id: jobId,
        alert_type: alertType,
        saved_search_id: savedSearchId,
      });

    if (error) {
      // Ignore duplicate errors (already sent)
      if (error.code === '23505') {
        return { success: true, error: null };
      }
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error tracking job alert:', error);
    return { success: false, error };
  }
};

/**
 * Get jobs that have already been sent to a user
 * @param {string} userId - User ID
 * @param {string} savedSearchId - Optional saved search ID to filter by
 * @returns {Promise<{jobIds: array, error: object}>}
 */
export const getSentJobAlerts = async (userId, savedSearchId = null) => {
  try {
    let query = supabase
      .from('job_alerts')
      .select('job_id')
      .eq('user_id', userId);

    if (savedSearchId) {
      query = query.eq('saved_search_id', savedSearchId);
    }

    const { data, error } = await query;

    if (error) {
      return { jobIds: [], error };
    }

    return {
      jobIds: (data || []).map((alert) => alert.job_id),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching sent job alerts:', error);
    return { jobIds: [], error };
  }
};

/**
 * Job Views Tracking Service
 * Track job view analytics
 */

/**
 * Track a job view
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID (optional for anonymous)
 * @param {object} viewData - Additional view data
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const trackJobView = async (jobId, userId = null, viewData = {}) => {
  try {
    const { error } = await supabase.from('job_views').insert({
      job_id: jobId,
      user_id: userId,
      session_id: viewData.sessionId || null,
      referrer_source: viewData.source || 'search',
      time_spent_seconds: viewData.timeSpent || null,
      scrolled_to_bottom: viewData.scrolledToBottom || false,
      clicked_apply: viewData.clickedApply || false,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error tracking job view:', error);
    return { success: false, error };
  }
};

/**
 * Get job view statistics
 * @param {string} jobId - Job ID
 * @returns {Promise<{stats: object, error: object}>}
 */
export const getJobViewStats = async (jobId) => {
  try {
    const { data, error, count } = await supabase
      .from('job_views')
      .select('*', { count: 'exact', head: false })
      .eq('job_id', jobId);

    if (error) {
      return { stats: null, error };
    }

    const stats = {
      total_views: count || 0,
      unique_viewers: new Set(data.filter((v) => v.user_id).map((v) => v.user_id)).size,
      apply_clicks: data.filter((v) => v.clicked_apply).length,
      avg_time_spent: data.length > 0
        ? data.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0) / data.length
        : 0,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching job view stats:', error);
    return { stats: null, error };
  }
};

/**
 * Notification Queue Service
 * Manage the notification queue
 */

/**
 * Add notification to queue
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @param {object} payload - Notification content
 * @param {object} options - Additional options
 * @returns {Promise<{notification: object, error: object}>}
 */
export const queueNotification = async (userId, notificationType, payload, options = {}) => {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        payload,
        priority: options.priority || 3,
        delivery_channel: options.channel || 'email',
        scheduled_for: options.scheduledFor || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { notification: null, error };
    }

    return { notification: data, error: null };
  } catch (error) {
    console.error('Error queueing notification:', error);
    return { notification: null, error };
  }
};

/**
 * Get pending notifications from queue
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Promise<{notifications: array, error: object}>}
 */
export const getPendingNotifications = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      return { notifications: [], error };
    }

    return { notifications: data || [], error: null };
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    return { notifications: [], error };
  }
};

/**
 * Update notification status
 * @param {string} notificationId - Notification ID
 * @param {string} status - New status
 * @param {object} additionalData - Additional data to update
 * @returns {Promise<{success: boolean, error: object}>}
 */
export const updateNotificationStatus = async (notificationId, status, additionalData = {}) => {
  try {
    const updates = {
      status,
      ...additionalData,
    };

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    } else if (status === 'failed') {
      updates.failed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('notification_queue')
      .update(updates)
      .eq('id', notificationId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating notification status:', error);
    return { success: false, error };
  }
};

/**
 * Company Metrics Service
 * Fetch and display company trust signals
 */

/**
 * Get company metrics
 * @param {string} companyId - Company ID
 * @returns {Promise<{metrics: object, error: object}>}
 */
export const getCompanyMetrics = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('company_metrics')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No metrics yet
        return { metrics: null, error: null };
      }
      return { metrics: null, error };
    }

    return { metrics: data, error: null };
  } catch (error) {
    console.error('Error fetching company metrics:', error);
    return { metrics: null, error };
  }
};

/**
 * Helper function to check if table exists
 */
export const checkNotificationTablesExist = async () => {
  try {
    // Try to query each table
    const tables = [
      'notification_preferences',
      'saved_searches',
      'job_alerts',
      'notification_queue',
      'job_views',
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('id').limit(1);
        return { table, exists: !error };
      })
    );

    const allExist = results.every((r) => r.exists);
    const missing = results.filter((r) => !r.exists).map((r) => r.table);

    return {
      allExist,
      missing,
      results,
    };
  } catch (error) {
    console.error('Error checking notification tables:', error);
    return {
      allExist: false,
      missing: [],
      error,
    };
  }
};

