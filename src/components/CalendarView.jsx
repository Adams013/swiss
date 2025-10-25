import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Briefcase,
  Users,
  ExternalLink,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { formatEventTime, normalizeEventTimeRange } from '../services/calendarService';
import AddToCalendarMenu from './AddToCalendarMenu';
import { getUserCalendarEvents, deleteCalendarEvent } from '../services/supabaseCalendar';

/**
 * CalendarView Component
 * Shows user's calendar events and interviews
 */
const CalendarView = ({ user, translate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserEvents();
    }
  }, [user?.id]);

  const loadUserEvents = async () => {
    setLoading(true);
    
    try {
      const { events: userEvents, error } = await getUserCalendarEvents(user.id);
      
      if (error) {
        console.error('Failed to load events:', error);
        // Show mock data as fallback
        const mockEvents = [
          {
            id: 'mock-1',
            type: 'interview',
            title: 'Technical Interview at SwissTech',
            job_title: 'Software Engineer',
            company_name: 'SwissTech',
            location: 'Zürich',
            start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            interviewer: 'John Doe',
            meeting_url: 'https://zoom.us/j/123456789',
            notes: 'Prepare coding challenges and system design questions',
          },
          {
            id: 'mock-2',
            type: 'event',
            title: 'Job Fair Zürich 2025',
            description: 'Annual job fair with 50+ startups and tech companies',
            location: 'ETH Zürich Main Building',
            start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
            organizer: 'ETH Career Center',
            url: 'https://jobfair.ethz.ch',
          },
        ];
        setEvents(mockEvents);
      } else {
        // Map database fields to component fields
        const mappedEvents = userEvents
          .map((event) => {
            const { start, end } = normalizeEventTimeRange({
              ...event,
              startTime: event.start_time,
              endTime: event.end_time,
            });

            if (!start) {
              return null;
            }

            return {
              ...event,
              startTime: start.toISOString(),
              endTime: end ? end.toISOString() : null,
              jobTitle: event.job_title,
              companyName: event.company_name,
              meetingUrl: event.meeting_url,
            };
          })
          .filter(Boolean);
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!eventId || !user?.id) {
      return;
    }

    setDeleting(true);
    
    try {
      const { success, error } = await deleteCalendarEvent(eventId, user.id);
      
      if (error) {
        console.error('Failed to delete event:', error);
        alert(translate('calendar.deleteError', 'Failed to delete event. Please try again.'));
        return;
      }

      if (success) {
        // Remove from local state
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Exception deleting event:', error);
      alert(translate('calendar.deleteError', 'Failed to delete event. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  const buildCalendarEventPayload = (event) => {
    const { start, end } = normalizeEventTimeRange(event);

    if (!start || !end) {
      return null;
    }

    return {
      title: event.title,
      description: event.description || event.notes || '',
      location: event.location,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      url: event.meetingUrl || event.url || '',
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return translate('calendar.today', 'Today');
    if (diffDays === 1) return translate('calendar.tomorrow', 'Tomorrow');
    if (diffDays < 7) return `${translate('calendar.in', 'In')} ${diffDays} ${translate('calendar.days', 'days')}`;

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'interview':
        return <Briefcase size={20} />;
      case 'event':
        return <Users size={20} />;
      default:
        return <Calendar size={20} />;
    }
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  const getPastEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startTime) <= now)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  };

  if (loading) {
    return (
      <div className="ssc__calendar-view ssc__calendar-view--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('calendar.loading', 'Loading your calendar...')}</p>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <div className="ssc__calendar-view">
      {/* Header */}
      <div className="ssc__calendar-view__header">
        <div>
          <h2>
            <Calendar size={24} />
            {translate('calendar.title', 'My Calendar')}
          </h2>
          <p className="ssc__calendar-view__subtitle">
            {translate('calendar.subtitle', 'Manage your interviews and events')}
          </p>
        </div>
      </div>

      {/* No Events State */}
      {events.length === 0 && (
        <div className="ssc__calendar-view__empty">
          <Calendar size={64} className="ssc__icon--muted" />
          <h3>{translate('calendar.noEvents.title', 'No Events Yet')}</h3>
          <p>
            {translate(
              'calendar.noEvents.description',
              'Your interviews and saved events will appear here'
            )}
          </p>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="ssc__calendar-section">
          <h3 className="ssc__calendar-section__title">
            {translate('calendar.upcoming', 'Upcoming Events')} ({upcomingEvents.length})
          </h3>
          <div className="ssc__calendar-events">
            {upcomingEvents.map((event) => {
              const timeInfo = formatEventTime(event.startTime, event.endTime);
              
              return (
                <div key={event.id} className="ssc__calendar-event">
                  <div className="ssc__calendar-event__icon">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="ssc__calendar-event__content">
                    <h4>{event.title}</h4>
                    
                    <div className="ssc__calendar-event__details">
                      <div className="ssc__calendar-event__detail">
                        <Clock size={14} />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      
                      <div className="ssc__calendar-event__detail">
                        <Clock size={14} />
                        <span>{timeInfo.time}</span>
                      </div>

                      {event.location && (
                        <div className="ssc__calendar-event__detail">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.meetingUrl && (
                        <div className="ssc__calendar-event__detail">
                          <Video size={14} />
                          <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                            {translate('calendar.joinMeeting', 'Join Meeting')}
                          </a>
                        </div>
                      )}
                    </div>

                    {event.type === 'interview' && (
                      <div className="ssc__calendar-event__meta">
                        <strong>{event.companyName}</strong>
                        {event.interviewer && <span> • {event.interviewer}</span>}
                      </div>
                    )}

                    {event.notes && (
                      <p className="ssc__calendar-event__notes">
                        {event.notes}
                      </p>
                    )}

                    {/* Add to Calendar Options */}
                    <div className="ssc__calendar-event__actions">
                      <AddToCalendarMenu
                        calendarEvent={buildCalendarEventPayload(event)}
                        translate={translate}
                        size="small"
                      />

                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ssc__btn ssc__btn--small ssc__btn--ghost"
                        >
                          <ExternalLink size={14} />
                          {translate('calendar.viewDetails', 'Details')}
                        </a>
                      )}

                      {/* Delete Button */}
                      {deleteConfirm === event.id ? (
                        <div className="ssc__calendar-event__delete-confirm">
                          <span>{translate('calendar.confirmDelete', 'Delete this event?')}</span>
                          <button
                            type="button"
                            className="ssc__btn ssc__btn--small ssc__btn--danger"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleting}
                          >
                            {deleting ? translate('calendar.deleting', 'Deleting...') : translate('calendar.yes', 'Yes')}
                          </button>
                          <button
                            type="button"
                            className="ssc__btn ssc__btn--small ssc__btn--ghost"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                          >
                            {translate('calendar.cancel', 'Cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ssc__btn ssc__btn--small ssc__btn--ghost ssc__btn--delete"
                          onClick={() => setDeleteConfirm(event.id)}
                          title={translate('calendar.delete', 'Delete event')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section className="ssc__calendar-section ssc__calendar-section--past">
          <h3 className="ssc__calendar-section__title">
            {translate('calendar.past', 'Past Events')} ({pastEvents.length})
          </h3>
          <div className="ssc__calendar-events">
            {pastEvents.map((event) => {
              const timeInfo = formatEventTime(event.startTime, event.endTime);
              
              return (
                <div key={event.id} className="ssc__calendar-event ssc__calendar-event--past">
                  <div className="ssc__calendar-event__icon">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="ssc__calendar-event__content">
                    <h4>{event.title}</h4>
                    
                    <div className="ssc__calendar-event__details">
                      <div className="ssc__calendar-event__detail">
                        <Clock size={14} />
                        <span>{timeInfo.date}</span>
                      </div>
                    </div>

                    {/* Delete Button for Past Events */}
                    <div className="ssc__calendar-event__actions">
                      {deleteConfirm === event.id ? (
                        <div className="ssc__calendar-event__delete-confirm">
                          <span>{translate('calendar.confirmDelete', 'Delete this event?')}</span>
                          <button
                            type="button"
                            className="ssc__btn ssc__btn--small ssc__btn--danger"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleting}
                          >
                            {deleting ? translate('calendar.deleting', 'Deleting...') : translate('calendar.yes', 'Yes')}
                          </button>
                          <button
                            type="button"
                            className="ssc__btn ssc__btn--small ssc__btn--ghost"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                          >
                            {translate('calendar.cancel', 'Cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ssc__btn ssc__btn--small ssc__btn--ghost ssc__btn--delete"
                          onClick={() => setDeleteConfirm(event.id)}
                          title={translate('calendar.delete', 'Delete event')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default CalendarView;

