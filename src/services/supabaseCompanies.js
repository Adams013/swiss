import { supabase } from '../supabaseClient';

export const DEFAULT_COMPANY_PAGE_SIZE = 50;

const COMPANY_COLUMN_CONFIG = [
  { key: 'id' },
  { key: 'name', fallbacks: ['company_name'] },
  { key: 'tagline', optional: true, fallbacks: ['short_description'] },
  { key: 'description', optional: true },
  { key: 'location', optional: true, fallbacks: ['city', 'region'] },
  { key: 'industry', optional: true, fallbacks: ['vertical', 'sector'] },
  {
    key: 'team',
    optional: true,
    fallbacks: ['team_size', 'employees', 'headcount', 'team_label'],
  },
  {
    key: 'fundraising',
    optional: true,
    fallbacks: ['total_funding', 'total_raised', 'funding'],
  },
  { key: 'culture', optional: true, fallbacks: ['values', 'mission'] },
  { key: 'website', optional: true, fallbacks: ['company_website', 'site_url', 'url'] },
  { key: 'logo_url', optional: true, fallbacks: ['logo', 'logoUrl'] },
  {
    key: 'info_link',
    optional: true,
    fallbacks: ['profile_link', 'external_profile', 'external_profile_url'],
  },
  { key: 'created_at', optional: true },
  { key: 'verification_status', optional: true, fallbacks: ['status'] },
  { key: 'verification_note', optional: true, fallbacks: ['status_note'] },
  { key: 'translations', optional: true },
  { key: 'profile', optional: true },
];

const escapeIlikeValue = (value) =>
  typeof value === 'string'
    ? value
        .trim()
        .replace(/[%_]/g, (match) => `\\${match}`)
    : '';

const buildIlikeConditions = (columns, values) => {
  const conditions = new Set();

  values
    .filter((value) => typeof value === 'string' && value.trim())
    .forEach((value) => {
      const escaped = escapeIlikeValue(value);
      columns.forEach((column) => {
        conditions.add(`${column}.ilike.%${escaped}%`);
      });
    });

  return Array.from(conditions);
};

const detectMissingColumn = (message, table) => {
  if (!message) {
    return null;
  }

  const normalizedTable = table ? String(table).trim() : '';
  const tableSpecificPatterns = normalizedTable
    ? [
        new RegExp(`column "([^"\\s]+)" of relation "${normalizedTable}" does not exist`, 'i'),
        new RegExp(`could not find the '([^']+)' column of '${normalizedTable}'`, 'i'),
        new RegExp(`'([^']+)' column of '${normalizedTable}'`, 'i'),
        new RegExp(`column "([^"\\s]+)" of table "${normalizedTable}" does not exist`, 'i'),
      ]
    : [];

  const genericPatterns = [
    /missing column "?([^\s"']+)"?/i,
    /unknown column "?([^\s"']+)"?/i,
  ];

  for (const pattern of [...tableSpecificPatterns, ...genericPatterns]) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const buildColumnSelection = (config) => {
  const seen = new Set();
  return config.reduce((columns, entry) => {
    if (!entry.selected) {
      return columns;
    }
    if (seen.has(entry.selected)) {
      return columns;
    }
    seen.add(entry.selected);
    columns.push(entry.selected);
    return columns;
  }, []);
};

const handleMissingColumn = (config, missingColumn) => {
  if (!missingColumn) {
    return false;
  }

  for (const entry of config) {
    if (!entry) {
      continue;
    }

    if (!entry.availableFallbacks) {
      entry.availableFallbacks = entry.fallbacks ? [...entry.fallbacks] : [];
    }

    if (entry.selected === missingColumn) {
      entry.availableFallbacks = entry.availableFallbacks.filter((candidate) => candidate !== missingColumn);

      while (entry.availableFallbacks.length > 0) {
        const candidate = entry.availableFallbacks.shift();
        if (!candidate) {
          continue;
        }

        const candidateInUse = config.some(
          (other) => other !== entry && other.selected === candidate
        );

        if (!candidateInUse) {
          entry.selected = candidate;
          return true;
        }
      }

      if (entry.optional) {
        entry.selected = null;
        return true;
      }

      return false;
    }

    if (entry.availableFallbacks.includes(missingColumn)) {
      entry.availableFallbacks = entry.availableFallbacks.filter((candidate) => candidate !== missingColumn);
    }
  }

  return false;
};

const applyCompanyFilters = (query, filters = {}) => {
  if (!filters || typeof filters !== 'object') {
    return query;
  }

  const { searchTerm, locations, verificationStatuses } = filters;

  const locationConditions = Array.isArray(locations)
    ? buildIlikeConditions(['location'], locations)
    : [];

  const searchConditions = typeof searchTerm === 'string' && searchTerm.trim()
    ? buildIlikeConditions(['name', 'company_name', 'tagline', 'description', 'location'], [searchTerm])
    : [];

  const orConditions = [];

  if (locationConditions.length > 0 && searchConditions.length > 0) {
    locationConditions.forEach((locationCondition) => {
      searchConditions.forEach((searchCondition) => {
        orConditions.push(`and(${locationCondition},${searchCondition})`);
      });
    });
  } else if (locationConditions.length > 0) {
    orConditions.push(...locationConditions);
  } else if (searchConditions.length > 0) {
    orConditions.push(...searchConditions);
  }

  if (orConditions.length > 0) {
    query = query.or(Array.from(new Set(orConditions)).join(','));
  }

  if (Array.isArray(verificationStatuses) && verificationStatuses.length > 0) {
    query = query.in('verification_status', verificationStatuses);
  }

  return query;
};

const normalizeCompany = (company, mapStartupToCompany) => {
  if (typeof mapStartupToCompany === 'function') {
    const mapped = mapStartupToCompany(company);
    return mapped || null;
  }

  return company || null;
};

const hasActiveFilters = (filters = {}) => {
  if (!filters || typeof filters !== 'object') {
    return false;
  }

  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return Boolean(value);
  });
};

export const fetchCompanies = async ({
  fallbackCompanies = [],
  mapStartupToCompany = (startup) => startup,
  page = 1,
  pageSize = DEFAULT_COMPANY_PAGE_SIZE,
  filters = {},
  signal,
} = {}) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_COMPANY_PAGE_SIZE;
  const rangeStart = (safePage - 1) * safePageSize;
  const rangeEnd = rangeStart + safePageSize - 1;

  const config = COMPANY_COLUMN_CONFIG.map((entry) => ({
    ...entry,
    selected: entry.key,
    availableFallbacks: entry.fallbacks ? [...entry.fallbacks] : [],
  }));

  const attemptSelect = async () => {
    while (true) {
      const selectedColumns = buildColumnSelection(config);

      if (selectedColumns.length === 0) {
        return { data: [], count: null, error: null };
      }

      let query = supabase
        .from('startups')
        .select(selectedColumns.join(', '), { count: 'exact' });

      query = applyCompanyFilters(query, filters);

      if (selectedColumns.includes('created_at')) {
        query = query.order('created_at', { ascending: false });
      }

      if (typeof query.range === 'function') {
        query = query.range(rangeStart, rangeEnd);
      } else if (typeof query.limit === 'function') {
        query = query.limit(safePageSize);
      }

      if (signal && typeof query.abortSignal === 'function') {
        query = query.abortSignal(signal);
      }

      const response = await query;

      if (!response.error) {
        return response;
      }

      const missingColumn = detectMissingColumn(response.error.message, 'startups');
      const resolved = handleMissingColumn(config, missingColumn);

      if (!resolved) {
        return response;
      }
    }
  };

  try {
    const { data, error, count } = await attemptSelect();

    if (error) {
      return {
        companies: fallbackCompanies,
        error,
        fallbackUsed: true,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: count ?? null,
      };
    }

    if (!data || data.length === 0) {
      if (hasActiveFilters(filters)) {
        return {
          companies: [],
          error: null,
          fallbackUsed: false,
          page: safePage,
          pageSize: safePageSize,
          hasMore: false,
          totalCount: count ?? null,
        };
      }

      return {
        companies: fallbackCompanies,
        error: null,
        fallbackUsed: true,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: count ?? null,
      };
    }

    const mapped = data
      .map((startup) => normalizeCompany(startup, mapStartupToCompany))
      .filter(Boolean);

    const hasMore = count != null ? rangeEnd + 1 < count : data.length === safePageSize;

    return {
      companies: mapped,
      error: null,
      fallbackUsed: false,
      page: safePage,
      pageSize: safePageSize,
      hasMore,
      totalCount: count ?? null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        companies: [],
        error,
        fallbackUsed: false,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: null,
      };
    }

    return {
      companies: fallbackCompanies,
      error,
      fallbackUsed: true,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
      totalCount: null,
    };
  }
};
