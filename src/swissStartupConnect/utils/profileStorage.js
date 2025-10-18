const LOCAL_PROFILE_CACHE_KEY = 'ssc_profile_cache_v1';

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
