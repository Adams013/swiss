/**
 * Calendar Service
 * Add interviews and events to Google Calendar, Apple Calendar, etc.
 */

/**
 * Format date for iCal format (YYYYMMDDTHHMMSSZ)
 */
const formatICalDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate iCal file content
 */
const generateICalContent = (event) => {
  const { title, description, location, startTime, endTime, url } = event;

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Swiss Startup Connect//Events//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@swissstartupconnect.ch`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(new Date(startTime))}`,
    `DTEND:${formatICalDate(new Date(endTime))}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    location ? `LOCATION:${location}` : '',
    url ? `URL:${url}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return icalContent;
};

/**
 * Download iCal file
 */
export const downloadICalFile = (event) => {
  const content = generateICalContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Add to Google Calendar
 */
export const addToGoogleCalendar = (event) => {
  const { title, description, location, startTime, endTime } = event;

  const start = new Date(startTime).toISOString().replace(/[-:]/g, '').split('.')[0];
  const end = new Date(endTime).toISOString().replace(/[-:]/g, '').split('.')[0];

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description || '',
    location: location || '',
  });

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(url, '_blank');
};

/**
 * Add to Outlook Calendar
 */
export const addToOutlookCalendar = (event) => {
  const { title, description, location, startTime, endTime } = event;

  const start = new Date(startTime).toISOString();
  const end = new Date(endTime).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description || '',
    location: location || '',
    startdt: start,
    enddt: end,
  });

  const url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  window.open(url, '_blank');
};

/**
 * Add to Office 365 Calendar
 */
export const addToOffice365Calendar = (event) => {
  const { title, description, location, startTime, endTime } = event;

  const start = new Date(startTime).toISOString();
  const end = new Date(endTime).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description || '',
    location: location || '',
    startdt: start,
    enddt: end,
  });

  const url = `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
  window.open(url, '_blank');
};

/**
 * Add to Yahoo Calendar
 */
export const addToYahooCalendar = (event) => {
  const { title, description, location, startTime, endTime } = event;

  const start = formatICalDate(new Date(startTime));
  const end = formatICalDate(new Date(endTime));

  const params = new URLSearchParams({
    v: '60',
    title: title,
    st: start,
    et: end,
    desc: description || '',
    in_loc: location || '',
  });

  const url = `https://calendar.yahoo.com/?${params.toString()}`;
  window.open(url, '_blank');
};

/**
 * Detect user's preferred calendar (based on user agent or preference)
 */
export const detectPreferredCalendar = () => {
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'apple';
  } else if (/android/.test(ua)) {
    return 'google';
  } else if (/windows/.test(ua)) {
    return 'outlook';
  }

  return 'google'; // Default
};

/**
 * Smart add to calendar - tries to detect best option
 */
export const addToCalendar = (event, provider = null) => {
  const calendarProvider = provider || detectPreferredCalendar();

  switch (calendarProvider) {
    case 'google':
      addToGoogleCalendar(event);
      break;
    case 'outlook':
      addToOutlookCalendar(event);
      break;
    case 'office365':
      addToOffice365Calendar(event);
      break;
    case 'yahoo':
      addToYahooCalendar(event);
      break;
    case 'apple':
    case 'ical':
    default:
      downloadICalFile(event);
      break;
  }
};

/**
 * Create event from interview details
 */
export const createInterviewEvent = (interview) => {
  return {
    title: `Interview: ${interview.jobTitle} at ${interview.companyName}`,
    description: `Interview for ${interview.jobTitle} position\n\n` +
                 `Company: ${interview.companyName}\n` +
                 `Interviewer: ${interview.interviewer || 'TBD'}\n` +
                 `Type: ${interview.type || 'In-person'}\n\n` +
                 `Preparation notes:\n${interview.notes || 'Good luck!'}`,
    location: interview.location || 'Online',
    startTime: interview.startTime,
    endTime: interview.endTime,
    url: interview.meetingUrl || '',
  };
};

/**
 * Create event from job fair/networking event
 */
export const createJobEventEvent = (jobEvent) => {
  return {
    title: jobEvent.title,
    description: `${jobEvent.description}\n\n` +
                 `${jobEvent.organizer ? `Organizer: ${jobEvent.organizer}\n` : ''}` +
                 `${jobEvent.registrationUrl ? `Register: ${jobEvent.registrationUrl}` : ''}`,
    location: jobEvent.location || 'TBD',
    startTime: jobEvent.startTime,
    endTime: jobEvent.endTime,
    url: jobEvent.url || '',
  };
};

const normalizeDateInput = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const europeanMatch = trimmed.match(/^([0-3]?\d)[./-]([0-1]?\d)[./-](\d{4})$/);
  if (europeanMatch) {
    const [, day, month, year] = europeanMatch;
    const isoLike = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const parsed = new Date(isoLike);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const parseTimeComponents = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return {
      hours: value.getHours(),
      minutes: value.getMinutes(),
    };
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const normalized = raw
    .replace(/[hH]/g, ':')
    .replace(/\s+/g, '')
    .replace(/[^0-9:]/g, '');

  const timeMatch = normalized.match(/^([0-2]?\d)(?::?([0-5]?\d))?(?::?([0-5]?\d))?$/);
  if (!timeMatch) {
    return null;
  }

  const [, hoursPart, minutesPart] = timeMatch;
  const hours = parseInt(hoursPart, 10);
  const minutes = minutesPart ? parseInt(minutesPart, 10) : 0;

  if (!Number.isFinite(hours) || hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
};

const ensureDate = (value) => normalizeDateInput(value);

const coerceEventDateTime = (event) => {
  const {
    event_date: eventDate,
    event_time: eventTime,
    end_time: endTime,
    start_time: alternativeStart,
    endTime: camelEndTime,
  } = event || {};

  const startDate = ensureDate(eventDate);
  if (!startDate) {
    return {};
  }

  const startTimeParts =
    parseTimeComponents(eventTime) || parseTimeComponents(alternativeStart) || parseTimeComponents(event?.startTime);
  if (startTimeParts) {
    startDate.setHours(startTimeParts.hours, startTimeParts.minutes, 0, 0);
  } else {
    startDate.setHours(9, 0, 0, 0);
  }

  const resolveEndFromParts = (baseDate, timeValue) => {
    const endParts = parseTimeComponents(timeValue);
    if (baseDate && endParts) {
      const endDate = new Date(baseDate.getTime());
      endDate.setHours(endParts.hours, endParts.minutes, 0, 0);
      return endDate;
    }
    return null;
  };

  let resolvedEnd = null;
  resolvedEnd =
    resolveEndFromParts(startDate, endTime) ||
    resolveEndFromParts(startDate, camelEndTime) ||
    resolveEndFromParts(startDate, event?.endTime);

  if (!resolvedEnd) {
    const absoluteEnd = ensureDate(endTime) || ensureDate(camelEndTime) || ensureDate(event?.endTime);
    if (absoluteEnd && absoluteEnd > startDate) {
      resolvedEnd = absoluteEnd;
    }
  }

  if (!resolvedEnd && typeof endTime === 'string') {
    const safeEnd = ensureDate(`${eventDate}T${String(endTime).trim()}`);
    if (safeEnd && safeEnd > startDate) {
      resolvedEnd = safeEnd;
    }
  }

  if (!resolvedEnd) {
    resolvedEnd = new Date(startDate.getTime() + 90 * 60 * 1000);
  }

  return {
    start: startDate,
    end: resolvedEnd,
  };
};

export const createCommunityCalendarEvent = (event) => {
  if (!event) {
    return null;
  }

  const { start, end } = coerceEventDateTime(event);
  if (!start || !end) {
    return null;
  }

  const addressSegments = [
    event.location,
    event.street_address,
    [event.postal_code, event.city].filter(Boolean).join(' '),
  ]
    .filter((segment) => typeof segment === 'string' && segment.trim())
    .map((segment) => segment.trim());

  const registrationUrl = event.registration_url || event.registrationUrl || event.url;

  const descriptionParts = [];
  if (event.description) {
    descriptionParts.push(event.description);
  }
  if (event.organizer) {
    descriptionParts.push(`Organizer: ${event.organizer}`);
  }
  if (registrationUrl) {
    descriptionParts.push(`Register: ${registrationUrl}`);
  }

  return {
    title: event.title,
    description: descriptionParts.join('\n\n'),
    location: addressSegments.join(', '),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    url: registrationUrl || '',
  };
};

/**
 * Get calendar options for dropdown
 */
const FALLBACK_TRANSLATE = (_key, fallback) => fallback;

export const getCalendarOptions = (translate = FALLBACK_TRANSLATE) => {
  return [
    {
      value: 'google',
      label: translate('calendar.providers.google', 'Google Calendar'),
      icon: '📅',
    },
    {
      value: 'apple',
      label: translate('calendar.providers.apple', 'Apple Calendar'),
      icon: '🍎',
    },
    {
      value: 'outlook',
      label: translate('calendar.providers.outlook', 'Outlook Calendar'),
      icon: '📧',
    },
    {
      value: 'office365',
      label: translate('calendar.providers.office365', 'Office 365 Calendar'),
      icon: '💼',
    },
    {
      value: 'yahoo',
      label: translate('calendar.providers.yahoo', 'Yahoo Calendar'),
      icon: '📮',
    },
    {
      value: 'ical',
      label: translate('calendar.providers.ical', 'Download iCal file'),
      icon: '📥',
    },
  ];
};

/**
 * Format time for display
 */
export const formatEventTime = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit' 
  };

  const dateStr = start.toLocaleDateString('en-US', dateOptions);
  const startTimeStr = start.toLocaleTimeString('en-US', timeOptions);
  const endTimeStr = end.toLocaleTimeString('en-US', timeOptions);

  return {
    date: dateStr,
    time: `${startTimeStr} - ${endTimeStr}`,
    full: `${dateStr}, ${startTimeStr} - ${endTimeStr}`,
  };
};

export default {
  addToCalendar,
  addToGoogleCalendar,
  addToOutlookCalendar,
  addToOffice365Calendar,
  addToYahooCalendar,
  downloadICalFile,
  createInterviewEvent,
  createJobEventEvent,
  createCommunityCalendarEvent,
  getCalendarOptions,
  formatEventTime,
  detectPreferredCalendar,
};

