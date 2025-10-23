import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Calendar,
  ChevronDown,
  Check,
  Clock,
  MapPin,
  Video,
  X,
} from 'lucide-react';
import {
  addToCalendar,
  getCalendarOptions,
  formatEventTime,
} from '../services/calendarService';
import useSiteCalendarSave from '../hooks/useSiteCalendarSave';
import './AddToCalendar.css';

/**
 * AddToCalendar Component
 * Beautiful dropdown to add events to various calendar apps
 */
const AddToCalendar = ({ event, translate, buttonText, buttonStyle = 'primary' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [dropdownStyles, setDropdownStyles] = useState(null);
  const [dropdownPlacement, setDropdownPlacement] = useState('bottom');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    status: siteCalendarStatus,
    message: siteCalendarMessage,
    saveToSiteCalendar,
    resetSiteCalendarStatus,
  } = useSiteCalendarSave({ translate });
  const siteCloseTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProvider(null);
      setDropdownStyles(null);
      setDropdownPlacement('bottom');
      resetSiteCalendarStatus();
    }
  }, [isOpen, resetSiteCalendarStatus]);

  useEffect(() => () => {
    if (siteCloseTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(siteCloseTimeoutRef.current);
      siteCloseTimeoutRef.current = null;
    }
  }, []);

  const closeDropdown = useCallback(() => {
    if (siteCloseTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(siteCloseTimeoutRef.current);
      siteCloseTimeoutRef.current = null;
    }
    setIsOpen(false);
    setSelectedProvider(null);
    setDropdownStyles(null);
    resetSiteCalendarStatus();
  }, [resetSiteCalendarStatus]);

  const handleAddToCalendar = async (provider) => {
    if (provider === 'site') {
      const result = await saveToSiteCalendar(event);
      if (result.success) {
        setSelectedProvider(provider);

        if (typeof window !== 'undefined') {
          if (siteCloseTimeoutRef.current) {
            window.clearTimeout(siteCloseTimeoutRef.current);
          }
          siteCloseTimeoutRef.current = window.setTimeout(() => {
            closeDropdown();
            siteCloseTimeoutRef.current = null;
          }, 1200);
        }
      }

      return;
    }

    addToCalendar(event, provider);
    setSelectedProvider(provider);
    setTimeout(() => {
      closeDropdown();
    }, 1000);
  };

  const calendarOptions = getCalendarOptions(translate);
  const timeInfo = formatEventTime(event.startTime, event.endTime);
  const dropdownInlineStyles = dropdownStyles
    ? dropdownStyles
    : { visibility: 'hidden', opacity: 0, pointerEvents: 'none' };

  const updateDropdownPosition = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!triggerRef.current || !dropdownRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    const spacing = 12;
    const margin = 16;
    const viewportWidth = Math.max(window.innerWidth || 0, margin * 2 + 1);
    const viewportHeight = Math.max(window.innerHeight || 0, margin * 2 + 1);
    const dropdownWidth = Math.min(
      Math.max(triggerRect.width, 320),
      Math.max(viewportWidth - margin * 2, 240)
    );

    let left = triggerRect.right - dropdownWidth;
    if (left < margin) {
      left = Math.max(triggerRect.left, margin);
    }
    if (left + dropdownWidth > viewportWidth - margin) {
      left = Math.max(viewportWidth - dropdownWidth - margin, margin);
    }

    let top = triggerRect.bottom + spacing;
    let placement = 'bottom';
    const dropdownHeight = dropdownEl.offsetHeight;
    if (top + dropdownHeight > viewportHeight - margin) {
      const upwardTop = triggerRect.top - spacing - dropdownHeight;
      if (upwardTop >= margin) {
        top = upwardTop;
        placement = 'top';
      } else {
        top = Math.max(viewportHeight - dropdownHeight - margin, margin);
      }
    }

    setDropdownPlacement(placement);
    setDropdownStyles({
      top,
      left,
      width: dropdownWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    updateDropdownPosition();

    const handleWindowChange = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    updateDropdownPosition();

    const handleClickOutside = (event) => {
      const target = event.target;
      if (!containerRef.current) {
        return;
      }

      if (
        containerRef.current.contains(target) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }

      closeDropdown();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDropdown, isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, siteCalendarMessage, updateDropdownPosition]);

  return (
    <div className="ssc__add-to-calendar" ref={containerRef}>
      <button
        type="button"
        className={`ssc__btn ssc__btn--${buttonStyle} ssc__add-to-calendar__trigger`}
        onClick={() => setIsOpen((previous) => !previous)}
        ref={triggerRef}
      >
        <Calendar size={18} />
        {buttonText || translate?.('calendar.addToCalendar', 'Add to Calendar')}
        <ChevronDown size={16} className={isOpen ? 'ssc__add-to-calendar__chevron--open' : ''} />
      </button>

      {isOpen && (
        <div
          className={`ssc__add-to-calendar__dropdown ssc__add-to-calendar__dropdown--${dropdownPlacement}`}
          ref={dropdownRef}
          style={dropdownInlineStyles}
          role="menu"
        >
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

              {calendarOptions.map((option) => {
                const isSiteOption = option.value === 'site';
                const isSavingSite = isSiteOption && siteCalendarStatus === 'loading';
                const isSiteSuccess = isSiteOption && siteCalendarStatus === 'success';
                const isSiteError = isSiteOption && siteCalendarStatus === 'error';
                const isSelected = selectedProvider === option.value;
                const optionClasses = ['ssc__add-to-calendar__option'];

                if (
                  isSiteOption &&
                  (siteCalendarStatus === 'loading' ||
                    siteCalendarStatus === 'success' ||
                    siteCalendarStatus === 'error')
                ) {
                  optionClasses.push(`is-${siteCalendarStatus}`);
                }
                if (isSiteSuccess) {
                  optionClasses.push('is-success');
                }
                if (isSiteError) {
                  optionClasses.push('is-error');
                }

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={optionClasses.join(' ')}
                    onClick={() => handleAddToCalendar(option.value)}
                    disabled={(isSelected && !isSiteOption) || isSavingSite}
                  >
                    <span className="ssc__add-to-calendar__option-icon">
                      {option.icon}
                    </span>
                    <span className="ssc__add-to-calendar__option-label">
                      {option.label}
                    </span>
                    {isSelected && !isSiteOption && (
                      <Check size={16} className="ssc__add-to-calendar__check" />
                    )}
                    {isSiteSuccess && (
                      <Check size={16} className="ssc__add-to-calendar__check" />
                    )}
                  </button>
                );
              })}
              {siteCalendarMessage && (
                <p
                  className={`ssc__add-to-calendar__status ssc__add-to-calendar__status--${siteCalendarStatus}`}
                  role="status"
                  aria-live="polite"
                >
                  {siteCalendarMessage}
                </p>
              )}
            </div>
          </div>
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

