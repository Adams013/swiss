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
