import { useCallback, useState } from 'react';
import { saveEventToSiteCalendar } from '../services/calendarService';

const buildMessage = (translate, key, fallback) => {
  if (typeof translate === 'function') {
    return translate(key, fallback);
  }
  return fallback;
};

const useSiteCalendarSave = ({ translate } = {}) => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const saveToSiteCalendar = useCallback(async (event) => {
    if (!event) {
      setStatus('error');
      setMessage(
        buildMessage(
          translate,
          'calendar.siteCalendar.error',
          'We could not save this event. Please try again.'
        )
      );
      return { success: false, code: 'invalid_event' };
    }

    setStatus('loading');
    setMessage('');

    const result = await saveEventToSiteCalendar(event);

    if (result.success) {
      setStatus('success');
      setMessage(
        buildMessage(
          translate,
          'calendar.siteCalendar.success',
          'Event saved to your Swiss Startup Connect calendar.'
        )
      );
      return result;
    }

    const translatedMessage =
      result.code === 'auth_required'
        ? buildMessage(
            translate,
            'calendar.siteCalendar.authRequired',
            'Sign in to save events to your Swiss Startup Connect calendar.'
          )
        : buildMessage(
            translate,
            'calendar.siteCalendar.error',
            'We could not save this event. Please try again.'
          );

    setStatus('error');
    setMessage(translatedMessage);

    return result;
  }, [translate]);

  const resetSiteCalendarStatus = useCallback(() => {
    setStatus('idle');
    setMessage('');
  }, []);

  return {
    status,
    message,
    saveToSiteCalendar,
    resetSiteCalendarStatus,
  };
};

export default useSiteCalendarSave;
