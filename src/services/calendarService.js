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

/**
 * Get calendar options for dropdown
 */
export const getCalendarOptions = () => {
  return [
    { value: 'google', label: 'Google Calendar', icon: '📅' },
    { value: 'apple', label: 'Apple Calendar', icon: '🍎' },
    { value: 'outlook', label: 'Outlook Calendar', icon: '📧' },
    { value: 'office365', label: 'Office 365 Calendar', icon: '💼' },
    { value: 'yahoo', label: 'Yahoo Calendar', icon: '📮' },
    { value: 'ical', label: 'Download iCal file', icon: '📥' },
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
  getCalendarOptions,
  formatEventTime,
  detectPreferredCalendar,
};

