const mockDataLoaders = {
  jobs: () => import('./mockJobs.js'),
  companies: () => import('./mockCompanies.js'),
  events: () => import('./mockEvents.js'),
};

const readModuleValue = (mod, key) => {
  if (mod && typeof mod === 'object') {
    if (Object.prototype.hasOwnProperty.call(mod, key)) {
      return mod[key];
    }
    if ('default' in mod) {
      const value = mod.default;
      if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
        return value[key];
      }
      if (key === 'default') {
        return value;
      }
    }
  }
  return undefined;
};

const createLoader = (key) => {
  return async () => {
    const loader = mockDataLoaders[key];
    if (!loader) {
      return [];
    }
    try {
      const mod = await loader();
      const value = readModuleValue(mod, `mock${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      if (Array.isArray(value)) {
        return value;
      }
      if (Array.isArray(mod?.default)) {
        return mod.default;
      }
      return [];
    } catch (error) {
      console.error(`Failed to load mock ${key}`, error);
      return [];
    }
  };
};

export const loadMockJobs = createLoader('jobs');
export const loadMockCompanies = createLoader('companies');
export const loadMockEvents = createLoader('events');

export const mockDataLoadersRegistry = {
  jobs: loadMockJobs,
  companies: loadMockCompanies,
  events: loadMockEvents,
};
