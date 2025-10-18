export const activeCityFilters = [
  {
    id: 'city-zurich',
    label: 'Zurich',
    labelKey: 'filters.activeCityOptions.zurich',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('zurich'),
  },
  {
    id: 'city-geneva',
    label: 'Geneva',
    labelKey: 'filters.activeCityOptions.geneva',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('geneva'),
  },
  {
    id: 'city-lausanne',
    label: 'Lausanne',
    labelKey: 'filters.activeCityOptions.lausanne',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('lausanne'),
  },
];

export const roleFocusFilters = [
  {
    id: 'focus-engineering',
    label: 'Engineering',
    labelKey: 'filters.roleFocusOptions.engineering',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['react', 'ai/ml', 'python', 'backend'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-product',
    label: 'Product',
    labelKey: 'filters.roleFocusOptions.product',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['product', 'ux', 'research'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-growth',
    label: 'Growth',
    labelKey: 'filters.roleFocusOptions.growth',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['growth', 'marketing'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-climate',
    label: 'Climate',
    labelKey: 'filters.roleFocusOptions.climate',
    category: 'Role focus',
    test: (job) => job.stage?.toLowerCase().includes('climate') || job.tags?.some((tag) => tag.toLowerCase().includes('climate')),
  },
];

export const quickFilters = [...activeCityFilters, ...roleFocusFilters];

export const filterPredicates = quickFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.test;
  return acc;
}, {});
