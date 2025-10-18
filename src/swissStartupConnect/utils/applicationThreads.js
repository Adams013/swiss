export const APPLICATION_THREAD_TYPES = ['message', 'interview', 'note'];
export const APPLICATION_THREAD_STORAGE_KEY = 'ssc_applicationThreads';

export const normalizeThreadStateValue = (value) => {
  if (Array.isArray(value)) {
    return { entries: value, meta: null };
  }

  if (value && typeof value === 'object') {
    const entries = Array.isArray(value.entries) ? value.entries : [];
    const meta = value.meta && typeof value.meta === 'object' ? value.meta : null;
    return { entries, meta };
  }

  return { entries: [], meta: null };
};

export const pickThreadValue = (store, primaryKey, fallbackKey) => {
  if (!store || typeof store !== 'object') {
    return undefined;
  }

  if (primaryKey && Object.prototype.hasOwnProperty.call(store, primaryKey)) {
    return store[primaryKey];
  }

  if (fallbackKey && Object.prototype.hasOwnProperty.call(store, fallbackKey)) {
    return store[fallbackKey];
  }

  return undefined;
};

export const removeThreadKeys = (store, keys = []) => {
  if (!store || typeof store !== 'object' || !Array.isArray(keys) || keys.length === 0) {
    return store;
  }

  let next = store;
  let mutated = false;

  keys.forEach((key) => {
    if (!key) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(next, key)) {
      if (!mutated) {
        next = { ...next };
        mutated = true;
      }
      delete next[key];
    }
  });

  return mutated ? next : store;
};

export const parseThreadKey = (key) => {
  if (typeof key !== 'string') {
    return { jobId: '', profileId: '' };
  }

  const [jobId = '', profileId = ''] = key.split('::');
  return { jobId: jobId || '', profileId: profileId || '' };
};
