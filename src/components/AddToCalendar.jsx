import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Check,
  Clock,
  MapPin,
  Video,
  Download,
  X,
} from 'lucide-react';
import {
  addToCalendar,
  getCalendarOptions,
  formatEventTime,
} from '../services/calendarService';
import './AddToCalendar.css';

/**
 * AddToCalendar Component
 * Beautiful dropdown to add events to various calendar apps
 */
const AddToCalendar = ({ event, translate, buttonText, buttonStyle = 'primary' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const handleAddToCalendar = (provider) => {
    addToCalendar(event, provider);
    setSelectedProvider(provider);
    setTimeout(() => {
      setIsOpen(false);
      setSelectedProvider(null);
    }, 1000);
  };

  const calendarOptions = getCalendarOptions();
  const timeInfo = formatEventTime(event.startTime, event.endTime);

  return (
    <div className="ssc__add-to-calendar">
      <button
        type="button"
        className={`ssc__btn ssc__btn--${buttonStyle} ssc__add-to-calendar__trigger`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={18} />
        {buttonText || translate?.('calendar.addToCalendar', 'Add to Calendar')}
        <ChevronDown size={16} className={isOpen ? 'ssc__add-to-calendar__chevron--open' : ''} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="ssc__add-to-calendar__backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="ssc__add-to-calendar__dropdown">
            {/* Event Preview */}
            <div className="ssc__add-to-calendar__preview">
              <h4 className="ssc__add-to-calendar__title">{event.title}</h4>
              
              <div className="ssc__add-to-calendar__details">
                <div className="ssc__add-to-calendar__detail">
                  <Clock size={14} />
                  <span>{timeInfo.full}</span>
                </div>
                
                {event.location && (
                  <div className="ssc__add-to-calendar__detail">
                    {event.location.toLowerCase().includes('http') ||
                    event.location.toLowerCase().includes('zoom') ||
                    event.location.toLowerCase().includes('meet') ? (
                      <Video size={14} />
                    ) : (
                      <MapPin size={14} />
                    )}
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="ssc__add-to-calendar__divider" />

            {/* Calendar Options */}
            <div className="ssc__add-to-calendar__options">
              <p className="ssc__add-to-calendar__options-title">
                {translate?.('calendar.selectCalendar', 'Select your calendar:')}
              </p>
              
              {calendarOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="ssc__add-to-calendar__option"
                  onClick={() => handleAddToCalendar(option.value)}
                  disabled={selectedProvider === option.value}
                >
                  <span className="ssc__add-to-calendar__option-icon">
                    {option.icon}
                  </span>
                  <span className="ssc__add-to-calendar__option-label">
                    {option.label}
                  </span>
                  {selectedProvider === option.value && (
                    <Check size={16} className="ssc__add-to-calendar__check" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * CalendarEventCard Component
 * Display event with add to calendar button
 */
export const CalendarEventCard = ({ event, translate, onClose }) => {
  const timeInfo = formatEventTime(event.startTime, event.endTime);

  return (
    <div className="ssc__calendar-event-card">
      {onClose && (
        <button
          type="button"
          className="ssc__calendar-event-card__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}

      <div className="ssc__calendar-event-card__header">
        <Calendar size={32} color="#3b82f6" />
        <h3>{event.title}</h3>
      </div>

      <div className="ssc__calendar-event-card__body">
        {event.description && (
          <p className="ssc__calendar-event-card__description">
            {event.description}
          </p>
        )}

        <div className="ssc__calendar-event-card__details">
          <div className="ssc__calendar-event-card__detail">
            <Clock size={18} />
            <div>
              <strong>{translate?.('calendar.date', 'Date')}</strong>
              <p>{timeInfo.date}</p>
            </div>
          </div>

          <div className="ssc__calendar-event-card__detail">
            <Clock size={18} />
            <div>
              <strong>{translate?.('calendar.time', 'Time')}</strong>
              <p>{timeInfo.time}</p>
            </div>
          </div>

          {event.location && (
            <div className="ssc__calendar-event-card__detail">
              {event.location.toLowerCase().includes('http') ||
              event.location.toLowerCase().includes('zoom') ||
              event.location.toLowerCase().includes('meet') ? (
                <Video size={18} />
              ) : (
                <MapPin size={18} />
              )}
              <div>
                <strong>{translate?.('calendar.location', 'Location')}</strong>
                <p>{event.location}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ssc__calendar-event-card__footer">
        <AddToCalendar
          event={event}
          translate={translate}
          buttonStyle="primary"
        />
      </div>
    </div>
  );
};

/**
 * InterviewScheduler Component
 * Schedule interview with calendar integration
 */
export const InterviewScheduler = ({ interview, translate, onSchedule }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSchedule = () => {
    if (!date || !time) {
      alert(translate?.('calendar.error', 'Please select date and time'));
      return;
    }

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const event = {
      title: `Interview: ${interview.jobTitle} at ${interview.companyName}`,
      description: `Interview for ${interview.jobTitle} position\n\n` +
                   `Company: ${interview.companyName}\n` +
                   `Interviewer: ${interview.interviewer || 'TBD'}\n\n` +
                   `Notes: ${notes}`,
      location: location || 'TBD',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    onSchedule?.(event);
  };

  return (
    <div className="ssc__interview-scheduler">
      <h3>
        <Calendar size={20} />
        {translate?.('calendar.scheduleInterview', 'Schedule Interview')}
      </h3>

      <div className="ssc__interview-scheduler__form">
        <div className="ssc__interview-scheduler__row">
          <div className="ssc__interview-scheduler__field">
            <label>{translate?.('calendar.date', 'Date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="ssc__interview-scheduler__field">
            <label>{translate?.('calendar.time', 'Time')}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="ssc__interview-scheduler__field">
          <label>{translate?.('calendar.duration', 'Duration')}</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value={30}>30 {translate?.('calendar.minutes', 'minutes')}</option>
            <option value={45}>45 {translate?.('calendar.minutes', 'minutes')}</option>
            <option value={60}>1 {translate?.('calendar.hour', 'hour')}</option>
            <option value={90}>1.5 {translate?.('calendar.hours', 'hours')}</option>
            <option value={120}>2 {translate?.('calendar.hours', 'hours')}</option>
          </select>
        </div>

        <div className="ssc__interview-scheduler__field">
          <label>{translate?.('calendar.location', 'Location')}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={translate?.('calendar.locationPlaceholder', 'Office address or video link')}
          />
        </div>

        <div className="ssc__interview-scheduler__field">
          <label>{translate?.('calendar.notes', 'Notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={translate?.('calendar.notesPlaceholder', 'Preparation notes, topics to discuss, etc.')}
            rows={3}
          />
        </div>

        <button
          type="button"
          className="ssc__btn ssc__btn--primary"
          onClick={handleSchedule}
        >
          <Calendar size={16} />
          {translate?.('calendar.addToCalendar', 'Add to Calendar')}
        </button>
      </div>
    </div>
  );
};

export default AddToCalendar;

