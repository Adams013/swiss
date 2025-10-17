let cachedEvents = null;

const loadDataModule = async () => {
  const module = await import('./mockEvents.data.js');
  return Array.isArray(module.mockEvents) ? module.mockEvents : [];
};

export const loadMockEvents = async () => {
  if (!cachedEvents) {
    cachedEvents = await loadDataModule();
  }
  return cachedEvents;
};
