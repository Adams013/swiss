import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import {
  addToCalendar,
  createCommunityCalendarEvent,
  getCalendarOptions,
} from '../services/calendarService';
import './AddToCalendarMenu.css';

const noopTranslate = (_key, fallback) => fallback;

const AddToCalendarMenu = ({
  calendarEvent,
  communityEvent,
  translate = noopTranslate,
  size = 'medium',
  variant = 'secondary',
  disabled = false,
  analyticsEvent = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const resolvedCalendarEvent = useMemo(() => {
    if (calendarEvent) {
      return calendarEvent;
    }
    if (communityEvent) {
      return createCommunityCalendarEvent(communityEvent);
    }
    return null;
  }, [calendarEvent, communityEvent]);

  const handleSelectOption = (provider) => {
    if (!resolvedCalendarEvent) {
      return;
    }

    addToCalendar(resolvedCalendarEvent, provider);
    if (typeof analyticsEvent === 'function') {
      analyticsEvent(provider, resolvedCalendarEvent);
    }
    setIsOpen(false);
  };

  const menuId = useRef(`ssc-add-to-calendar-${Math.random().toString(36).slice(2)}`).current;

  return (
    <div
      className={`ssc__add-to-calendar ssc__add-to-calendar--${size}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`ssc__add-to-calendar__trigger ssc__btn ssc__btn--${variant} ssc__btn--${size}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={isOpen}
        disabled={disabled || !resolvedCalendarEvent}
      >
        <CalendarPlus size={16} aria-hidden="true" />
        <span>{translate('calendar.addToCalendar', 'Add to calendar')}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      <div
        id={menuId}
        className={`ssc__add-to-calendar__menu ${isOpen ? 'is-open' : ''}`}
        role="menu"
      >
        {getCalendarOptions(translate).map((option) => (
          <button
            key={option.value}
            type="button"
            role="menuitem"
            onClick={() => handleSelectOption(option.value)}
            className="ssc__add-to-calendar__option"
          >
            <span aria-hidden="true" className="ssc__add-to-calendar__emoji">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddToCalendarMenu;
