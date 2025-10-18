import { supabase } from '../supabaseClient';

export const DEFAULT_JOB_PAGE_SIZE = 50;

const JOB_COLUMN_CONFIG = [
  { key: 'id' },
  { key: 'title' },
  { key: 'company_name', fallbacks: ['company'] },
  { key: 'startup_id' },
  { key: 'location', fallbacks: ['city_label'] },
  { key: 'location_city', fallbacks: ['city', 'city_name'] },
  { key: 'work_arrangement', fallbacks: ['arrangement'] },
  { key: 'employment_type', fallbacks: ['job_type', 'type'] },
  { key: 'salary', optional: true },
  {
    key: 'salary_min_value',
    optional: true,
    fallbacks: [
      'salary_min',
      'salary_min_chf',
      'salary_minimum',
      'salary_range_min',
      'salary_lower',
      'salary_floor',
      'salary_low',
      'salary_from',
      'compensation_min',
      'pay_min',
    ],
  },
  {
    key: 'salary_max_value',
    optional: true,
    fallbacks: [
      'salary_max',
      'salary_max_chf',
      'salary_maximum',
      'salary_range_max',
      'salary_upper',
      'salary_ceiling',
      'salary_high',
      'salary_to',
      'compensation_max',
      'pay_max',
    ],
  },
  {
    key: 'salary_cadence',
    optional: true,
    fallbacks: ['salary_period', 'salary_frequency', 'salary_interval', 'salary_cycle'],
  },
  { key: 'salary_is_bracket', optional: true },
  { key: 'equity', optional: true },
  {
    key: 'equity_min_value',
    optional: true,
    fallbacks: ['equity_min', 'equity_lower', 'equity_from', 'equity_floor'],
  },
  {
    key: 'equity_max_value',
    optional: true,
    fallbacks: ['equity_max', 'equity_upper', 'equity_to', 'equity_ceiling'],
  },
  { key: 'description', optional: true },
  { key: 'requirements', optional: true },
  { key: 'benefits', optional: true },
  { key: 'tags', optional: true },
  { key: 'stage', optional: true },
  { key: 'posted', optional: true },
  { key: 'created_at', optional: true },
  { key: 'applicants', optional: true },
  {
    key: 'motivational_letter_required',
    optional: true,
    fallbacks: ['motivation_required'],
  },
  {
    key: 'language_requirements',
    optional: true,
    fallbacks: ['languages'],
  },
  { key: 'language_labels', optional: true },
  { key: 'translations', optional: true },
  {
    key: 'company_team',
    optional: true,
    fallbacks: ['team', 'team_size', 'employees', 'headcount'],
  },
  {
    key: 'company_fundraising',
    optional: true,
    fallbacks: ['fundraising', 'total_funding', 'total_raised', 'funding'],
  },
  {
    key: 'company_website',
    optional: true,
    fallbacks: ['website', 'company_site', 'site', 'url'],
  },
  {
    key: 'company_info_link',
    optional: true,
    fallbacks: ['info_link', 'profile_link', 'external_profile', 'external_profile_url'],
  },
  {
    key: 'includes_thirteenth_salary',
    optional: true,
    fallbacks: ['has_thirteenth_salary'],
  },
  {
    key: 'weekly_hours_value',
    optional: true,
    fallbacks: ['weekly_hours', 'hours_per_week'],
  },
  {
    key: 'weekly_hours_label',
    optional: true,
    fallbacks: ['weekly_hours_display', 'weekly_hours_text'],
  },
  {
    key: 'internship_duration_months',
    optional: true,
    fallbacks: ['internship_duration', 'duration_months', 'internship_length'],
  },
  {
    key: 'internship_duration_label',
    optional: true,
    fallbacks: ['internship_duration_display', 'internship_duration_text'],
  },
];

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

const normalizeJob = (job) => ({
  ...job,
  applicants: job?.applicants ?? 0,
  tags: Array.isArray(job?.tags) ? job.tags : [],
  requirements: Array.isArray(job?.requirements) ? job.requirements : [],
  benefits: Array.isArray(job?.benefits) ? job.benefits : [],
  posted: job?.posted || 'Recently posted',
  motivational_letter_required: job?.motivational_letter_required ?? false,
});

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

const applyJobFilters = (query, filters = {}) => {
  if (!filters || typeof filters !== 'object') {
    return query;
  }

  const { searchTerm, locations, workArrangements, employmentTypes } = filters;

  const locationConditions = Array.isArray(locations)
    ? buildIlikeConditions(['location', 'location_city'], locations)
    : [];

  const searchConditions = typeof searchTerm === 'string' && searchTerm.trim()
    ? buildIlikeConditions(['title', 'company_name', 'location', 'location_city'], [searchTerm])
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

  if (Array.isArray(workArrangements) && workArrangements.length > 0) {
    query = query.in('work_arrangement', workArrangements);
  }

  if (Array.isArray(employmentTypes) && employmentTypes.length > 0) {
    query = query.in('employment_type', employmentTypes);
  }

  return query;
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

export const fetchJobs = async ({
  fallbackJobs = [],
  page = 1,
  pageSize = DEFAULT_JOB_PAGE_SIZE,
  filters = {},
  signal,
} = {}) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_JOB_PAGE_SIZE;
  const rangeStart = (safePage - 1) * safePageSize;
  const rangeEnd = rangeStart + safePageSize - 1;

  const config = JOB_COLUMN_CONFIG.map((entry) => ({
    ...entry,
    selected: entry.key,
    availableFallbacks: entry.fallbacks ? [...entry.fallbacks] : [],
  }));

  const attemptSelect = async () => {
    // Attempt to fetch data while swapping out missing columns.
    while (true) {
      const selectedColumns = buildColumnSelection(config);

      if (selectedColumns.length === 0) {
        return { data: [], count: null, error: null };
      }

      let query = supabase
        .from('jobs')
        .select(selectedColumns.join(', '), { count: 'exact' });

      query = applyJobFilters(query, filters);

      if (selectedColumns.includes('created_at')) {
        query = query.order('created_at', { ascending: false });
      } else if (selectedColumns.includes('posted')) {
        query = query.order('posted', { ascending: false });
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

      const missingColumn = detectMissingColumn(response.error.message, 'jobs');
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
        jobs: fallbackJobs.map(normalizeJob),
        error,
        fallbackUsed: true,
        columnPresenceData: fallbackJobs,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: count ?? null,
      };
    }

    if (!data || data.length === 0) {
      if (hasActiveFilters(filters)) {
        return {
          jobs: [],
          error: null,
          fallbackUsed: false,
          columnPresenceData: [],
          page: safePage,
          pageSize: safePageSize,
          hasMore: false,
          totalCount: count ?? null,
        };
      }

      return {
        jobs: fallbackJobs.map(normalizeJob),
        error: null,
        fallbackUsed: true,
        columnPresenceData: fallbackJobs,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: count ?? null,
      };
    }

    const normalized = data.map(normalizeJob);
    const hasMore = count != null ? rangeEnd + 1 < count : data.length === safePageSize;

    return {
      jobs: normalized,
      error: null,
      fallbackUsed: false,
      columnPresenceData: data,
      page: safePage,
      pageSize: safePageSize,
      hasMore,
      totalCount: count ?? null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        jobs: [],
        error,
        fallbackUsed: false,
        columnPresenceData: [],
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
        totalCount: null,
      };
    }

    return {
      jobs: fallbackJobs.map(normalizeJob),
      error,
      fallbackUsed: true,
      columnPresenceData: fallbackJobs,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
      totalCount: null,
    };
  }
};
