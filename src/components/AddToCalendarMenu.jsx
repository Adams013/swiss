import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import {
  addToCalendar,
  createCommunityCalendarEvent,
  getCalendarOptions,
} from '../services/calendarService';
import useSiteCalendarSave from '../hooks/useSiteCalendarSave';
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
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyles, setMenuStyles] = useState(null);
  const [menuPlacement, setMenuPlacement] = useState('bottom');

  const {
    status: siteCalendarStatus,
    message: siteCalendarMessage,
    saveToSiteCalendar,
    resetSiteCalendarStatus,
  } = useSiteCalendarSave({ translate });

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

  const handleSelectOption = async (provider) => {
    if (!resolvedCalendarEvent) {
      return;
    }

    if (provider === 'site') {
      const result = await saveToSiteCalendar(resolvedCalendarEvent);
      if (result.success && typeof analyticsEvent === 'function') {
        analyticsEvent(provider, resolvedCalendarEvent);
      }
      return;
    }

    addToCalendar(resolvedCalendarEvent, provider);
    if (typeof analyticsEvent === 'function') {
      analyticsEvent(provider, resolvedCalendarEvent);
    }
    setIsOpen(false);
  };

  const menuId = useRef(`ssc-add-to-calendar-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!isOpen) {
      setMenuStyles(null);
      resetSiteCalendarStatus();
    }
  }, [isOpen, resetSiteCalendarStatus]);

  useEffect(() => {
    if (siteCalendarStatus === 'success' && typeof window !== 'undefined') {
      const timeout = window.setTimeout(() => {
        setIsOpen(false);
      }, 1400);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    return undefined;
  }, [siteCalendarStatus]);

  const updateMenuPosition = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!triggerRef.current || !menuRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const spacing = 8;
    const margin = 16;
    const viewportWidth = Math.max(window.innerWidth || 0, margin * 2 + 1);
    const viewportHeight = Math.max(window.innerHeight || 0, margin * 2 + 1);
    const menuWidth = menuEl.offsetWidth;
    const menuHeight = menuEl.offsetHeight;

    let left = triggerRect.right - menuWidth;
    if (left < margin) {
      left = Math.max(triggerRect.left, margin);
    }
    if (left + menuWidth > viewportWidth - margin) {
      left = Math.max(viewportWidth - menuWidth - margin, margin);
    }

    let top = triggerRect.bottom + spacing;
    let placement = 'bottom';
    if (top + menuHeight > viewportHeight - margin) {
      const upwardTop = triggerRect.top - spacing - menuHeight;
      if (upwardTop >= margin) {
        top = upwardTop;
        placement = 'top';
      } else {
        top = Math.max(viewportHeight - menuHeight - margin, margin);
      }
    }

    const availableWidth = viewportWidth - margin * 2;
    const minWidth = Math.min(
      Math.max(triggerRect.width, 208),
      Math.max(availableWidth, 208)
    );

    setMenuPlacement(placement);
    setMenuStyles({
      top,
      left,
      minWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    updateMenuPosition();

    const handleReposition = () => {
      updateMenuPosition();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);

      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }

    return undefined;
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, siteCalendarMessage, updateMenuPosition]);

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
        ref={triggerRef}
      >
        <CalendarPlus size={16} aria-hidden="true" />
        <span>{translate('calendar.addToCalendar', 'Add to calendar')}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      <div
        id={menuId}
        className={`ssc__add-to-calendar__menu ${isOpen ? 'is-open' : ''}`}
        role="menu"
        ref={menuRef}
        data-placement={menuPlacement}
        style={menuStyles || undefined}
      >
        {getCalendarOptions(translate).map((option) => {
          const isSiteOption = option.value === 'site';
          const isLoading = isSiteOption && siteCalendarStatus === 'loading';
          const isSuccessful = isSiteOption && siteCalendarStatus === 'success';

          return (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={() => handleSelectOption(option.value)}
              className={`ssc__add-to-calendar__option${isLoading ? ' is-loading' : ''}${isSuccessful ? ' is-success' : ''}`}
              disabled={isLoading}
            >
              <span aria-hidden="true" className="ssc__add-to-calendar__emoji">{option.icon}</span>
              <span>{option.label}</span>
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
  );
};

export default AddToCalendarMenu;
