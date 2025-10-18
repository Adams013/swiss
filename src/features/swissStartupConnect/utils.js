export const sortEventsByScheduleStatic = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }
  return [...list].sort((a, b) => {
    const buildDateValue = (entry) => {
      if (!entry || !entry.event_date) {
        return 0;
      }
      const time = entry.event_time ? String(entry.event_time) : '00:00';
      const formattedTime = time.length > 5 ? time.slice(0, 8) : time;
      const composed = `${entry.event_date}T${formattedTime}`;
      const value = new Date(composed).getTime();
      return Number.isFinite(value) ? value : 0;
    };

    return buildDateValue(a) - buildDateValue(b);
  });
};

export const getJobIdKey = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  return String(value);
};

export const sanitizeIdArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set();
  value.forEach((entry) => {
    const key = getJobIdKey(entry);
    if (key) {
      unique.add(key);
    }
  });

  return Array.from(unique);
};

export const firstNonEmpty = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return '';
};

export const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'tex'];

export const getFileExtension = (fileName) => {
  if (typeof fileName !== 'string') {
    return '';
  }
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : '';
};

export const getFileNameFromUrl = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url, window.location?.origin ?? 'http://localhost');
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : '';
  } catch (error) {
    const match = url.match(/[^/]+$/);
    return match ? match[0] : '';
  }
};

export const isAllowedDocumentFile = (file) => {
  if (!file) {
    return false;
  }

  const extension = getFileExtension(file.name);
  if (extension && DOCUMENT_EXTENSIONS.includes(extension)) {
    return true;
  }

  const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  if (mime.includes('pdf')) {
    return true;
  }
  if (mime.includes('word')) {
    return true;
  }
  if (mime.includes('plain') && extension === 'tex') {
    return true;
  }
  return false;
};

export const sanitizeDecimalInput = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  const stringValue = String(value)
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.');

  if (!stringValue) {
    return '';
  }

  const normalized = stringValue
    .replace(/(?!^)-/g, '')
    .replace(/\.(?=.*\.)/g, '')
    .replace(/^(-?)0+(\d)/, '$1$2');

  return normalized;
};
