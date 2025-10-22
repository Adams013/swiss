import { supabase } from '../supabaseClient';

/**
 * Supabase Calendar Service
 * Manage user calendar events and interviews
 */

/**
 * Fetch user's calendar events
 * @param {string} userId - User ID
 * @param {number} limit - Number of events to fetch
 * @returns {Promise<{events: Array, error: string|null}>}
 */
export const getUserCalendarEvents = async (userId, limit = 50) => {
  try {
    if (!userId) {
      return { events: [], error: 'User ID is required' };
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching calendar events:', error);
      return { events: [], error: error.message };
    }

    return { events: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching calendar events:', error);
    return { events: [], error: error.message };
  }
};

/**
 * Fetch upcoming calendar events
 * @param {string} userId - User ID
 * @param {number} limit - Number of events to fetch
 * @returns {Promise<{events: Array, error: string|null}>}
 */
export const getUpcomingCalendarEvents = async (userId, limit = 20) => {
  try {
    if (!userId) {
      return { events: [], error: 'User ID is required' };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming events:', error);
      return { events: [], error: error.message };
    }

    return { events: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching upcoming events:', error);
    return { events: [], error: error.message };
  }
};

/**
 * Fetch past calendar events
 * @param {string} userId - User ID
 * @param {number} limit - Number of events to fetch
 * @returns {Promise<{events: Array, error: string|null}>}
 */
export const getPastCalendarEvents = async (userId, limit = 20) => {
  try {
    if (!userId) {
      return { events: [], error: 'User ID is required' };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .lt('start_time', now)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past events:', error);
      return { events: [], error: error.message };
    }

    return { events: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching past events:', error);
    return { events: [], error: error.message };
  }
};

/**
 * Create a new calendar event
 * @param {string} userId - User ID
 * @param {Object} eventData - Event data
 * @returns {Promise<{event: Object|null, error: string|null}>}
 */
export const createCalendarEvent = async (userId, eventData) => {
  try {
    if (!userId) {
      return { event: null, error: 'User ID is required' };
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([
        {
          user_id: userId,
          type: eventData.type || 'event',
          title: eventData.title,
          description: eventData.description || null,
          location: eventData.location || null,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          job_title: eventData.jobTitle || null,
          company_name: eventData.companyName || null,
          interviewer: eventData.interviewer || null,
          meeting_url: eventData.meetingUrl || null,
          notes: eventData.notes || null,
          organizer: eventData.organizer || null,
          url: eventData.url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return { event: null, error: error.message };
    }

    return { event: data, error: null };
  } catch (error) {
    console.error('Exception creating calendar event:', error);
    return { event: null, error: error.message };
  }
};

/**
 * Update a calendar event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} updates - Event updates
 * @returns {Promise<{event: Object|null, error: string|null}>}
 */
export const updateCalendarEvent = async (eventId, userId, updates) => {
  try {
    if (!eventId || !userId) {
      return { event: null, error: 'Event ID and User ID are required' };
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return { event: null, error: error.message };
    }

    return { event: data, error: null };
  } catch (error) {
    console.error('Exception updating calendar event:', error);
    return { event: null, error: error.message };
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteCalendarEvent = async (eventId, userId) => {
  try {
    if (!eventId || !userId) {
      return { success: false, error: 'Event ID and User ID are required' };
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Exception deleting calendar event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create an interview event from job application
 * @param {string} userId - User ID
 * @param {Object} interviewData - Interview data
 * @returns {Promise<{event: Object|null, error: string|null}>}
 */
export const createInterviewEvent = async (userId, interviewData) => {
  return createCalendarEvent(userId, {
    type: 'interview',
    title: `Interview: ${interviewData.jobTitle} at ${interviewData.companyName}`,
    jobTitle: interviewData.jobTitle,
    companyName: interviewData.companyName,
    location: interviewData.location || 'Online',
    startTime: interviewData.startTime,
    endTime: interviewData.endTime,
    interviewer: interviewData.interviewer || null,
    meetingUrl: interviewData.meetingUrl || null,
    notes: interviewData.notes || null,
  });
};

/**
 * Create a job event (fair, networking, etc.)
 * @param {string} userId - User ID
 * @param {Object} jobEventData - Job event data
 * @returns {Promise<{event: Object|null, error: string|null}>}
 */
export const createJobEvent = async (userId, jobEventData) => {
  return createCalendarEvent(userId, {
    type: 'event',
    title: jobEventData.title,
    description: jobEventData.description || null,
    location: jobEventData.location || 'TBD',
    startTime: jobEventData.startTime,
    endTime: jobEventData.endTime,
    organizer: jobEventData.organizer || null,
    url: jobEventData.url || null,
  });
};

/**
 * Get events count for a user
 * @param {string} userId - User ID
 * @returns {Promise<{count: number, error: string|null}>}
 */
export const getCalendarEventsCount = async (userId) => {
  try {
    if (!userId) {
      return { count: 0, error: 'User ID is required' };
    }

    const { count, error } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting events count:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Exception getting events count:', error);
    return { count: 0, error: error.message };
  }
};

export default {
  getUserCalendarEvents,
  getUpcomingCalendarEvents,
  getPastCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createInterviewEvent,
  createJobEvent,
  getCalendarEventsCount,
};

