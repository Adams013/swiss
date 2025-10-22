import React from 'react';
import { X, MapPin, Calendar, Clock, Building2, ExternalLink } from 'lucide-react';
import AddToCalendarMenu from './components/AddToCalendarMenu';

const CityEventPanel = ({
  selectedCity,
  selectedCityLabel,
  cityEvents = [],
  onClose,
  translate = (key, fallback) => fallback,
}) => {
  if (!selectedCity || cityEvents.length === 0) {
    return null;
  }

  const displayCity = selectedCityLabel || selectedCity;

  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }
    try {
      const value = new Date(dateString);
      if (Number.isNaN(value.getTime())) {
        return '';
      }
      return value.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return '';
    }
    const safeValue = String(timeValue).slice(0, 5);
    try {
      const [hours, minutes] = safeValue.split(':').map((part) => parseInt(part, 10));
      if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return safeValue;
      }
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return safeValue;
    }
  };

  return (
    <aside
      className="ssc__map-side-panel ssc__map-side-panel--events"
      aria-label={translate('map.panel.eventsAriaLabel', 'Events in selected city')}
      aria-live="polite"
    >
      <header className="ssc__map-side-panel-header">
        <div className="ssc__map-side-panel-heading">
          <span className="ssc__map-side-panel-icon ssc__map-side-panel-icon--events">
            <Calendar className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <p className="ssc__map-side-panel-overline">
              {translate('map.panel.eventsOverline', 'Community meetups')}
            </p>
            <h3 className="ssc__map-side-panel-title">
              {translate('map.panel.eventsIn', 'Events in')}{' '}
              <span className="ssc__map-side-panel-title-highlight">{displayCity}</span>
            </h3>
          </div>
        </div>
        <div className="ssc__map-side-panel-meta">
          <span className="ssc__map-side-panel-count">
            {translate(
              'map.panel.eventsCount',
              cityEvents.length === 1
                ? '1 event'
                : `${cityEvents.length} events`,
              { count: cityEvents.length }
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ssc__map-side-panel-close"
            aria-label={translate('map.panel.close', 'Close panel')}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="ssc__map-side-panel-body">
        {cityEvents.map((event) => {
          const eventDate = formatDate(event.event_date);
          const eventTime = formatTime(event.event_time);
          const venueName = event.location || event.location_name || '';
          const streetLine = [event.street_address, event.postal_code]
            .filter(Boolean)
            .join(', ');
          const registrationUrl = event.registration_url || event.registrationUrl || event.url;

          return (
            <article key={event.id || event.title} className="ssc__map-event-card">
              <div className="ssc__map-card-heading">
                <div>
                  <h4 className="ssc__map-event-title">
                    {event.title || translate('map.panel.eventFallbackTitle', 'Startup gathering')}
                  </h4>
                  {venueName && (
                    <div className="ssc__map-event-venue">
                      <Building2 className="w-4 h-4" aria-hidden="true" />
                      <span>{venueName}</span>
                    </div>
                  )}
                </div>
                <div className="ssc__map-event-schedule">
                  {eventDate && (
                    <span className="ssc__map-chip ssc__map-chip--events">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <span>{eventDate}</span>
                    </span>
                  )}
                  {eventTime && (
                    <span className="ssc__map-chip ssc__map-chip--events">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{eventTime}</span>
                    </span>
                  )}
                </div>
              </div>

              {streetLine && (
                <div className="ssc__map-event-location">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{streetLine}</span>
                </div>
              )}

              {event.description && (
                <p className="ssc__map-event-description">
                  {event.description.length > 220
                    ? `${event.description.slice(0, 217)}...`
                    : event.description}
                </p>
              )}

              <div className="ssc__map-event-actions">
                <AddToCalendarMenu
                  communityEvent={event}
                  translate={translate}
                  size="small"
                />

                {registrationUrl && (
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ssc__map-event-link"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    <span>{translate('events.viewDetails', 'View details')}</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <footer className="ssc__map-side-panel-footer">
        <p className="ssc__map-side-panel-footer-text">
          {translate('map.panel.eventsFooter', 'Browse events to discover where the community meets next.')}
        </p>
      </footer>
    </aside>
  );
};

export default CityEventPanel;
