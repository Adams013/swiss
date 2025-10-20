import { supabase } from '../supabaseClient';
import { getTableMetadata } from './supabaseMetadata';

export const DEFAULT_JOB_PAGE_SIZE = 50;

const JOB_COLUMN_CONFIG = [
  { key: 'id' },
  { key: 'title' },
  { key: 'company_name', fallbacks: ['company'] },
  { key: 'startup_id' },
  { key: 'location', fallbacks: ['city_label', 'city'] },
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
        new RegExp(`column ${normalizedTable}\\.([^\\s]+) does not exist`, 'i'),
        new RegExp(`column ['\"]?${normalizedTable}\\.([^'"\\s]+)['\"]? does not exist`, 'i'),
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

const createColumnMap = (config) =>
  config.reduce((accumulator, entry) => {
    if (entry && entry.selected) {
      accumulator[entry.key] = entry.selected;
    }
    return accumulator;
  }, {});

const gatherColumnCandidates = (columnMap, keys = []) => {
  const values = new Set();

  keys
    .filter((key) => typeof key === 'string' && key.trim())
    .forEach((key) => {
      const resolved = columnMap[key];
      if (resolved) {
        values.add(resolved);
      }
    });

  return Array.from(values);
};

const augmentJobRecord = (job, config) => {
  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return job;
  }

  return config.reduce((accumulator, entry) => {
    if (!entry || !entry.selected) {
      return accumulator;
    }

    if (entry.selected !== entry.key && !Object.prototype.hasOwnProperty.call(accumulator, entry.key)) {
      const value = job[entry.selected];
      if (value !== undefined) {
        accumulator[entry.key] = value;
      }
    }

    return accumulator;
  }, { ...job });
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

const escapeIlikeValue = (value) => value.replace(/[%_]/g, (match) => `\\${match}`);

const applyJobFilters = (query, filters = {}, columnMap = {}) => {
  if (!filters || typeof filters !== 'object') {
    return query;
  }

  const { searchTerm, locations, workArrangements, employmentTypes } = filters;

  const locationColumns = gatherColumnCandidates(columnMap, ['location', 'location_city']);

  if (Array.isArray(locations) && locations.length > 0 && locationColumns.length > 0) {
    const orConditions = [];

    locations
      .filter((location) => typeof location === 'string' && location.trim())
      .forEach((location) => {
        const escaped = escapeIlikeValue(location.trim());
        locationColumns.forEach((column) => {
          orConditions.push(`${column}.ilike.%${escaped}%`);
        });
      });

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','));
    }
  }

  const workArrangementColumn = columnMap.work_arrangement;
  if (workArrangementColumn && Array.isArray(workArrangements) && workArrangements.length > 0) {
    query = query.in(workArrangementColumn, workArrangements);
  }

  const employmentTypeColumn = columnMap.employment_type;
  if (employmentTypeColumn && Array.isArray(employmentTypes) && employmentTypes.length > 0) {
    query = query.in(employmentTypeColumn, employmentTypes);
  }

  if (typeof searchTerm === 'string' && searchTerm.trim()) {
    const escaped = escapeIlikeValue(searchTerm.trim());
    const searchColumns = gatherColumnCandidates(columnMap, ['title', 'company_name', 'location', 'location_city']);

    if (searchColumns.length > 0) {
      const orConditions = searchColumns.map((column) => `${column}.ilike.%${escaped}%`);
      query = query.or(orConditions.join(','));
    }
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

  const metadata = await getTableMetadata('jobs');

  if (metadata.exists === false) {
    return {
      jobs: fallbackJobs.map(normalizeJob),
      error:
        metadata.error ||
        {
          message: 'Supabase jobs table is not available. Falling back to bundled dataset.',
          code: 'TABLE_NOT_FOUND',
          details: { table: 'jobs' },
          hint: 'Run the provided Supabase migrations to create the jobs table or disable Supabase integration.',
        },
      fallbackUsed: true,
      columnPresenceData: fallbackJobs,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
      totalCount: null,
    };
  }

  if (Array.isArray(metadata.columns) && metadata.columns.length > 0) {
    const columnLookup = metadata.columns.reduce((accumulator, column) => {
      if (typeof column === 'string') {
        accumulator.set(column.toLowerCase(), column);
      }
      return accumulator;
    }, new Map());

    config.forEach((entry) => {
      if (!entry) {
        return;
      }

      const candidates = [entry.key, ...(entry.fallbacks || [])].filter((candidate) => typeof candidate === 'string');
      const resolved = candidates
        .map((candidate) => columnLookup.get(candidate.toLowerCase()) || null)
        .filter(Boolean);

      if (resolved.length > 0) {
        entry.selected = resolved[0];
        entry.availableFallbacks = resolved.slice(1);
      } else if (entry.optional) {
        entry.selected = null;
        entry.availableFallbacks = [];
      } else {
        entry.selected = null;
        entry.availableFallbacks = [];
      }
    });
  }

  const missingRequiredColumns = config
    .filter((entry) => !entry.optional && !entry.selected)
    .map((entry) => entry.key);

  if (missingRequiredColumns.length > 0) {
    return {
      jobs: fallbackJobs.map(normalizeJob),
      error:
        metadata.error ||
        {
          message: `Supabase jobs table is missing required columns: ${missingRequiredColumns.join(', ')}`,
          code: 'MISSING_COLUMNS',
          details: { table: 'jobs', missingColumns: missingRequiredColumns },
          hint: 'Apply the latest database migrations or adjust the frontend column configuration.',
        },
      fallbackUsed: true,
      columnPresenceData: fallbackJobs,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
      totalCount: null,
    };
  }

  const attemptSelect = async () => {
    // Attempt to fetch data while swapping out missing columns.
    while (true) {
      const selectedColumns = buildColumnSelection(config);

      if (selectedColumns.length === 0) {
        return { data: [], count: null, error: null };
      }

      const columnMap = createColumnMap(config);

      let query = supabase
        .from('jobs')
        .select(selectedColumns.join(', '), { count: 'exact' });

      query = applyJobFilters(query, filters, columnMap);

      if (columnMap.created_at) {
        query = query.order(columnMap.created_at, { ascending: false });
      } else if (columnMap.posted) {
        query = query.order(columnMap.posted, { ascending: false });
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

    const supabaseData = Array.isArray(data) ? data : [];

    if (supabaseData.length === 0) {
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

    const augmentedData = supabaseData.map((job) => augmentJobRecord(job, config));
    const normalized = augmentedData.map(normalizeJob);
    const hasMore = count != null ? rangeEnd + 1 < count : supabaseData.length === safePageSize;

    return {
      jobs: normalized,
      error: null,
      fallbackUsed: false,
      columnPresenceData: supabaseData,
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
