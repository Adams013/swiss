import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { tableExists } from '../../../services/supabaseMetadata';
import { loadMockEvents } from '../../../data/mockEvents';

/**
 * Custom hook for managing events data and event creation
 */
export const useEvents = ({ user, startupProfile, translate, setFeedback }) => {
  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsFallbackActive, setEventsFallbackActive] = useState(false);
  
  // Event modal state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventFormSaving, setEventFormSaving] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    street_address: '',
    city: '',
    postal_code: '',
    event_date: '',
    event_time: '',
    poster_url: '',
    poster_file: null,
  });

  // Refs
  const fallbackEventsRef = useRef([]);

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const eventsTableAvailable = await tableExists('events');

        if (!eventsTableAvailable) {
          const mockEvents = await loadMockEvents();
          setEvents(Array.isArray(mockEvents) ? mockEvents : []);
          setEventsFallbackActive(true);
          fallbackEventsRef.current = mockEvents;
          return;
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) {
          console.error('Events load error', error);
          const mockEvents = await loadMockEvents();
          setEvents(Array.isArray(mockEvents) ? mockEvents : []);
          setEventsFallbackActive(true);
          fallbackEventsRef.current = mockEvents;
          return;
        }

        const mockEvents = await loadMockEvents();
        const combined = [...(Array.isArray(data) ? data : []), ...(Array.isArray(mockEvents) ? mockEvents : [])];
        setEvents(combined);
        setEventsFallbackActive(false);
      } catch (error) {
        console.error('Events load error', error);
        const mockEvents = await loadMockEvents();
        setEvents(Array.isArray(mockEvents) ? mockEvents : []);
        setEventsFallbackActive(true);
        fallbackEventsRef.current = mockEvents;
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Submit event handler
  const handleEventSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!user || user.type !== 'startup' || !startupProfile) return;

    setEventFormSaving(true);
    try {
      const payload = {
        startup_id: startupProfile.id,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        street_address: eventForm.street_address.trim() || null,
        city: eventForm.city.trim() || null,
        postal_code: eventForm.postal_code.trim() || null,
        event_date: eventForm.event_date || null,
        event_time: eventForm.event_time || null,
        poster_url: eventForm.poster_url.trim() || null,
      };

      const { error } = await supabase.from('events').insert(payload);
      if (error) {
        setFeedback({ 
          type: 'error', 
          message: translate('events.feedback.error', 'Failed to create event. Please try again.') 
        });
        return;
      }

      setFeedback({ 
        type: 'success', 
        message: translate('events.feedback.success', 'Event created successfully!') 
      });

      setEventForm({
        title: '',
        description: '',
        location: '',
        street_address: '',
        city: '',
        postal_code: '',
        event_date: '',
        event_time: '',
        poster_url: '',
        poster_file: null,
      });
      setEventModalOpen(false);

      // Reload events
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (data) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Event creation error', error);
      setFeedback({ 
        type: 'error', 
        message: translate('events.feedback.error', 'Failed to create event. Please try again.') 
      });
    } finally {
      setEventFormSaving(false);
    }
  }, [user, startupProfile, eventForm, translate, setFeedback]);

  return {
    // State
    events,
    setEvents,
    eventsLoading,
    eventsFallbackActive,
    setEventsFallbackActive,
    eventModalOpen,
    setEventModalOpen,
    eventForm,
    setEventForm,
    eventFormSaving,

    // Refs
    fallbackEventsRef,

    // Functions
    handleEventSubmit,
  };
};

