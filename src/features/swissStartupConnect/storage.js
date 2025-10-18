import { getJobIdKey } from './utils';

export const LOCAL_PROFILE_CACHE_KEY = 'ssc_profile_cache_v1';
export const LOCAL_APPLICATION_STORAGE_KEY = 'ssc_local_applications_v1';
export const THEME_STORAGE_KEY = 'ssc_theme_preference';
export const APPLICATION_THREAD_STORAGE_KEY = 'ssc_applicationThreads';

export const readCachedProfile = (userId) => {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const cached = parsed[userId];
    if (!cached || typeof cached !== 'object') {
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Failed to read cached profile', error);
    return null;
  }
};

export const writeCachedProfile = (userId, profile) => {
  if (typeof window === 'undefined' || !userId || !profile) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const next = parsed && typeof parsed === 'object' ? { ...parsed } : {};
    next[userId] = { ...profile };
    window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to cache profile', error);
  }
};

export const removeCachedProfile = (userId) => {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed[userId]) {
      return;
    }

    const next = { ...parsed };
    delete next[userId];

    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(LOCAL_PROFILE_CACHE_KEY);
    } else {
      window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(next));
    }
  } catch (error) {
    console.error('Failed to remove cached profile', error);
  }
};

const readLocalApplications = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_APPLICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read local applications', error);
    return [];
  }
};

const writeLocalApplications = (entries) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_APPLICATION_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to write local applications', error);
  }
};

export const normalizeApplicationKey = (jobId, profileId) => {
  const jobKey = getJobIdKey(jobId);
  const profileKey = getJobIdKey(profileId);
  return `${jobKey}::${profileKey}`;
};

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

export const upsertLocalApplication = (entry) => {
  if (!entry) {
    return null;
  }

  const stored = readLocalApplications();
  const targetKey = normalizeApplicationKey(entry.job_id, entry.profile_id);
  const filtered = stored.filter((existing) => {
    const existingKey = normalizeApplicationKey(existing.job_id, existing.profile_id);
    return existingKey !== targetKey;
  });
  const nextEntries = [...filtered, entry];
  writeLocalApplications(nextEntries);
  return entry;
};

export const loadLocalApplicationsForStartup = (startupId, remoteApplications = []) => {
  const stored = readLocalApplications();
  const remoteKeys = new Set(
    Array.isArray(remoteApplications)
      ? remoteApplications.map((application) => normalizeApplicationKey(application.job_id, application.profile_id))
      : []
  );

  let changed = false;
  const filtered = stored.filter((entry) => {
    const key = normalizeApplicationKey(entry.job_id, entry.profile_id);
    if (remoteKeys.has(key)) {
      changed = true;
      return false;
    }
    return true;
  });

  if (changed) {
    writeLocalApplications(filtered);
  }

  const normalizedStartupId = getJobIdKey(startupId);

  return filtered
    .filter((entry) => {
      if (!normalizedStartupId) {
        return true;
      }
      return getJobIdKey(entry.startup_id) === normalizedStartupId;
    })
    .map((entry) => ({ ...entry, isLocal: true }));
};

export const updateStoredLocalApplication = (applicationId, updater) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = readLocalApplications();
    let changed = false;
    const updated = stored
      .map((entry) => {
        if (entry.id !== applicationId) {
          return entry;
        }

        const next = updater ? updater(entry) : entry;
        if (next === entry) {
          return entry;
        }

        changed = true;
        return next;
      })
      .filter(Boolean);

    if (changed) {
      writeLocalApplications(updated);
    }

    return updated.find((entry) => entry.id === applicationId) || null;
  } catch (error) {
    console.error('Failed to update local application', error);
    return null;
  }
};

export const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};
