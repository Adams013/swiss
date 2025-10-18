import { getJobIdKey } from './identifiers';

const LOCAL_APPLICATION_STORAGE_KEY = 'ssc_local_applications_v1';

export const readLocalApplications = () => {
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

export const writeLocalApplications = (entries) => {
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
      : [],
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
