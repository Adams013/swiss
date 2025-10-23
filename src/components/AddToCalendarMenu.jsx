import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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
  const [menuLayout, setMenuLayout] = useState(null);
  const [menuPlacement, setMenuPlacement] = useState('bottom');
  const [canRenderPortal, setCanRenderPortal] = useState(false);
  const isOpenRef = useRef(false);

  const {
    status: siteCalendarStatus,
    message: siteCalendarMessage,
    saveToSiteCalendar,
    resetSiteCalendarStatus,
  } = useSiteCalendarSave({ translate });

  useEffect(() => {
    setCanRenderPortal(typeof document !== 'undefined');
  }, []);

  const closeMenu = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
    setMenuLayout(null);
    setMenuPlacement('bottom');
    resetSiteCalendarStatus();
  }, [resetSiteCalendarStatus]);

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
    closeMenu();
  };

  const menuId = useRef(`ssc-add-to-calendar-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!isOpen) {
      setMenuLayout(null);
      resetSiteCalendarStatus();
    }
  }, [isOpen, resetSiteCalendarStatus]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (siteCalendarStatus === 'success' && typeof window !== 'undefined') {
      const timeout = window.setTimeout(() => {
        closeMenu();
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
      if (typeof window !== 'undefined' && isOpenRef.current) {
        window.requestAnimationFrame(() => {
          updateMenuPosition();
        });
      }
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
    setMenuLayout({
      top,
      left,
      width: Math.max(minWidth, Math.min(menuWidth, viewportWidth - margin * 2)),
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

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  const handleToggleMenu = () => {
    if (disabled || !resolvedCalendarEvent) {
      return;
    }

    if (isOpenRef.current) {
      closeMenu();
      return;
    }

    isOpenRef.current = true;
    setIsOpen(true);
  };

  const overlay =
    isOpen && canRenderPortal
      ? createPortal(
          <div className="ssc__add-to-calendar__portal" aria-hidden={!isOpen}>
            <button
              type="button"
              className="ssc__add-to-calendar__backdrop"
              onClick={closeMenu}
              aria-label={translate('calendar.closeAddToCalendar', 'Close add to calendar menu')}
            />
            <div
              id={menuId}
              className={`ssc__add-to-calendar__menu ${menuLayout ? 'is-ready' : ''}`}
              role="menu"
              ref={menuRef}
              data-placement={menuPlacement}
              style={
                menuLayout
                  ? {
                      top: `${menuLayout.top}px`,
                      left: `${menuLayout.left}px`,
                      width: `${menuLayout.width}px`,
                    }
                  : { visibility: 'hidden', pointerEvents: 'none' }
              }
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
                    className={`ssc__add-to-calendar__option${
                      isLoading ? ' is-loading' : ''
                    }${isSuccessful ? ' is-success' : ''}`}
                    disabled={isLoading}
                  >
                    <span aria-hidden="true" className="ssc__add-to-calendar__emoji">
                      {option.icon}
                    </span>
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
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className={`ssc__add-to-calendar ssc__add-to-calendar--${size}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`ssc__add-to-calendar__trigger ssc__btn ssc__btn--${variant} ssc__btn--${size}`}
        onClick={handleToggleMenu}
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
      {overlay}
    </div>
  );
};

export default AddToCalendarMenu;
