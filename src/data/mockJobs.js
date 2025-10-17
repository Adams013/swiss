let cachedJobs = null;

const loadDataModule = async () => {
  const module = await import('./mockJobs.data.js');
  const jobs = Array.isArray(module.mockJobs) ? module.mockJobs : [];
  return jobs;
};

export const loadMockJobs = async () => {
  if (!cachedJobs) {
    cachedJobs = await loadDataModule();
  }
  return cachedJobs;
};
