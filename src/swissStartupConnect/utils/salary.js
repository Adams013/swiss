export const SALARY_MIN_FIELDS = [
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
];

export const SALARY_MAX_FIELDS = [
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
];

export const INTERNSHIP_DURATION_FIELDS = ['internship_duration_months', 'duration_months'];
export const WEEKLY_HOURS_VALUE_FIELDS = ['weekly_hours_value', 'hours_per_week', 'hoursWeekly'];
export const WEEKLY_HOURS_LABEL_FIELDS = ['weekly_hours', 'weekly_hours_label', 'hours_week', 'work_hours', 'weeklyHours'];

export const EQUITY_MIN_FIELDS = [
  'equity_min',
  'equity_min_percentage',
  'equity_percentage',
  'equity_value',
  'equity_floor',
  'equity_low',
];
export const EQUITY_MAX_FIELDS = [
  'equity_max',
  'equity_max_percentage',
  'equity_percentage',
  'equity_value',
  'equity_ceiling',
  'equity_high',
];
export const WEEKLY_HOURS_FIELDS = [
  'weekly_hours_value',
  'weekly_hours',
  'weekly_hours_label',
  'hours_per_week',
  'work_hours',
  'hours_week',
  'hours',
  'hoursWeekly',
  'weeklyHours',
];

export const SALARY_PERIOD_FIELDS = [
  'salary_period',
  'salary_interval',
  'salary_frequency',
  'salary_unit',
  'salary_timeframe',
  'salary_basis',
  'pay_period',
  'salary_cadence',
];

export const SALARY_FALLBACK_RANGE = [2000, 12000];
export const SALARY_STEP = 1;
export const EQUITY_FALLBACK_RANGE = [0, 5];
export const EQUITY_STEP = 0.01;
export const FULL_TIME_WEEKLY_HOURS = 42;
export const FULL_TIME_WORKING_DAYS = 5;
const WEEKS_PER_MONTH = 4.345;
export const THIRTEENTH_MONTHS_PER_YEAR = 13;
export const SALARY_MINIMUMS_BY_CADENCE = {
  hour: 10,
  week: 100,
  month: 1000,
  year: 10000,
};
export const SALARY_PLACEHOLDER_BY_CADENCE = {
  hour: '10',
  week: '100',
  month: '1000',
  year: '10000',
};
export const SALARY_FILTER_HELPERS = {
  hour: 'CHF hourly',
  week: 'CHF weekly',
  month: 'CHF monthly (default)',
  year: 'CHF yearly / total',
};
export const SALARY_FILTER_CADENCE_OPTIONS = [
  { value: 'hour', label: 'Hourly' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly / total' },
];

export const SALARY_CADENCE_OPTIONS = SALARY_FILTER_CADENCE_OPTIONS;
export const SALARY_CALCULATOR_PANEL_ID = 'ssc-salary-calculator';
export const SALARY_CALCULATOR_TRANSITION_MS = 250;
const THIRTEENTH_SALARY_PATTERN = /\b(?:13(?:th)?|thirteenth)\b/i;

export const parseExplicitBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return null;
    }
    if (value > 0) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
  }

  return null;
};

export const textMentionsThirteenthSalary = (value) =>
  typeof value === 'string' && THIRTEENTH_SALARY_PATTERN.test(value);

export const listMentionsThirteenthSalary = (list) =>
  Array.isArray(list) && list.some((item) => textMentionsThirteenthSalary(item));

export const inferThirteenthSalary = (job) => {
  if (!job) {
    return false;
  }

  const explicitHasThirteenth = parseExplicitBoolean(job.has_thirteenth_salary);
  if (explicitHasThirteenth != null) {
    return explicitHasThirteenth;
  }

  const explicitIncludesThirteenth = parseExplicitBoolean(job.includes_thirteenth_salary);
  if (explicitIncludesThirteenth != null) {
    return explicitIncludesThirteenth;
  }

  const textSources = [
    job.salary,
    job.salary_note,
    job.compensation_note,
    job.compensation_details,
    job.description,
  ];

  if (textSources.some((value) => textMentionsThirteenthSalary(value))) {
    return true;
  }

  const listSources = [job.benefits, job.perks, job.compensation_breakdown];
  return listSources.some((value) => listMentionsThirteenthSalary(value));
};

export const SALARY_CADENCE_LABELS = {
  hour: 'hourly',
  hourly: 'hourly',
  week: 'weekly',
  weekly: 'weekly',
  month: 'monthly',
  monthly: 'monthly',
  year: 'yearly',
  yearly: 'yearly',
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getStepFactor = (step) => {
  if (!Number.isFinite(step) || step <= 0) {
    return 1;
  }
  return Math.pow(10, Math.max(0, Math.ceil(-Math.log10(step))));
};

const alignToStep = (value, step, strategy) => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return value;
  }
  const factor = getStepFactor(step);
  const scaled = strategy(value / step);
  const rounded = Math.round(scaled * step * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

export const roundToStep = (value, step) => alignToStep(value, step, Math.round);
export const roundDownToStep = (value, step) => alignToStep(value, step, Math.floor);
export const roundUpToStep = (value, step) => alignToStep(value, step, Math.ceil);

export const formatSalaryDisplayValue = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (value >= 1000) {
    const shortened = value / 1000;
    const precision = shortened >= 10 ? 0 : shortened >= 1 ? 1 : 2;
    const formatted = shortened.toFixed(precision).replace(/\.0+$/, '');
    return `${formatted}k`;
  }

  return String(Math.round(value));
};

export const formatEquityValue = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d+?)0+$/, '$1');
};

export const formatEquityDisplay = (min, max) => {
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    if (Number.isFinite(min) || Number.isFinite(max)) {
      const value = formatEquityValue(min ?? max ?? 0);
      return value ? `${value}% equity` : 'Equity available';
    }
    return 'No equity disclosed';
  }

  const formattedMin = hasMin ? formatEquityValue(min) : null;
  const formattedMax = hasMax ? formatEquityValue(max) : null;

  if (formattedMin && formattedMax) {
    if (formattedMin === formattedMax) {
      return `${formattedMin}% equity`;
    }
    return `${formattedMin}% – ${formattedMax}% equity`;
  }

  const single = formattedMin || formattedMax;
  return single ? `${single}% equity` : 'Equity available';
};

export const sanitizeDecimalInput = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value.replace(/[^0-9.,]/g, '');
  const separatorIndex = cleaned.search(/[.,]/);

  if (separatorIndex === -1) {
    return cleaned;
  }

  const before = cleaned.slice(0, separatorIndex + 1);
  const after = cleaned
    .slice(separatorIndex + 1)
    .replace(/[.,]/g, '');

  return `${before}${after}`;
};

export const parseDurationMonths = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

export const formatDurationLabel = (months) => {
  if (!Number.isFinite(months) || months <= 0) {
    return '';
  }
  const rounded = Math.round(months);
  const unit = rounded === 1 ? 'month' : 'months';
  return `${rounded} ${unit}`;
};

export const buildTimingText = (job) => {
  if (!job) {
    return '';
  }

  const segments = [
    job.employment_type,
    job.internship_duration_label || job.duration_label,
    job.weekly_hours_label,
  ].filter(Boolean);

  const withPosted = [...segments, job.posted].filter(Boolean);
  return withPosted.join(' • ');
};

export const formatCalculatorCurrency = (value, cadence) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (cadence === 'hour') {
    const rounded = Math.round(value * 100) / 100;
    return rounded
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1');
  }

  return formatSalaryDisplayValue(value) ?? `${Math.round(value)}`;
};

export const parseNumericValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }

  let numeric = Number.parseFloat(match[0].replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (trimmed.includes('m')) {
    numeric *= 1_000_000;
  } else if (trimmed.includes('k')) {
    numeric *= 1_000;
  }

  return numeric;
};

export const parsePercentageValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

export const parseWeeklyHoursValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const formatWeeklyHoursLabel = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${rounded}h/week`;
};

export const resolveWeeklyHours = (value) => {
  return Number.isFinite(value) && value > 0 ? value : FULL_TIME_WEEKLY_HOURS;
};

export const getWeeklyHoursMeta = (job) => {
  if (!job) {
    return { value: null, label: '' };
  }

  if (Number.isFinite(job.weekly_hours_value) && job.weekly_hours_value > 0) {
    return {
      value: job.weekly_hours_value,
      label: formatWeeklyHoursLabel(job.weekly_hours_value),
    };
  }

  for (const field of WEEKLY_HOURS_FIELDS) {
    const raw = job?.[field];
    if (raw == null) {
      continue;
    }

    const parsed = parseWeeklyHoursValue(raw);
    if (Number.isFinite(parsed)) {
      return {
        value: parsed,
        label: formatWeeklyHoursLabel(parsed),
      };
    }

    if (typeof raw === 'string' && raw.trim()) {
      return {
        value: null,
        label: raw.trim(),
      };
    }
  }

  return { value: null, label: '' };
};

export const detectSalaryPeriod = (job, salaryText) => {
  const baseText = [
    salaryText ?? '',
    ...SALARY_PERIOD_FIELDS.map((field) => job?.[field] ?? ''),
  ]
    .join(' ')
    .toLowerCase();

  if (baseText.includes('monthly')) return 'month';
  if (baseText.includes('weekly')) return 'week';
  if (baseText.includes('yearly')) return 'year';
  if (baseText.includes('hourly')) return 'hour';
  if (baseText.includes('month')) return 'month';
  if (baseText.includes('week')) return 'week';
  if (baseText.includes('day')) return 'day';
  if (baseText.includes('hour')) return 'hour';
  if (baseText.includes('year') || baseText.includes('annual') || baseText.includes('annum')) return 'year';
  return null;
};

export const normalizeSalaryCadence = (value) => {
  if (!value) {
    return null;
  }

  const lowered = String(value).toLowerCase();

  if (lowered.includes('hour')) return 'hour';
  if (lowered.includes('week')) return 'week';
  if (lowered.includes('month')) return 'month';
  if (lowered.includes('year') || lowered.includes('annual')) return 'year';
  return null;
};

export const convertCadenceValueToMonthly = (value, cadence, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = normalizeSalaryCadence(cadence);
  const lowered = cadence ? String(cadence).toLowerCase() : '';
  const hoursPerWeek = resolveWeeklyHours(weeklyHours);

  if (!normalized && lowered.includes('day')) {
    return value * FULL_TIME_WORKING_DAYS * WEEKS_PER_MONTH;
  }

  switch (normalized) {
    case 'hour':
      return value * hoursPerWeek * WEEKS_PER_MONTH;
    case 'week':
      return value * WEEKS_PER_MONTH;
    case 'year':
      return value / THIRTEENTH_MONTHS_PER_YEAR;
    case 'month':
    default:
      return value;
  }
};

export const convertMonthlyValueToCadence = (value, cadence, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = normalizeSalaryCadence(cadence);
  const lowered = cadence ? String(cadence).toLowerCase() : '';
  const hoursPerWeek = resolveWeeklyHours(weeklyHours);

  if (!normalized && lowered.includes('day')) {
    return value / (FULL_TIME_WORKING_DAYS * WEEKS_PER_MONTH);
  }

  switch (normalized) {
    case 'hour':
      return value / (hoursPerWeek * WEEKS_PER_MONTH);
    case 'week':
      return value / WEEKS_PER_MONTH;
    case 'year':
      return value * THIRTEENTH_MONTHS_PER_YEAR;
    case 'month':
    default:
      return value;
  }
};

export const formatSalaryValue = (value, cadence = 'month', weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const converted = convertMonthlyValueToCadence(value, cadence, weeklyHours);

  if (!Number.isFinite(converted)) {
    return '';
  }

  const decimals = normalizeSalaryCadence(cadence) === 'hour' ? 2 : 0;
  const formatted = converted.toFixed(decimals);
  return formatted.replace(/\.00$/, '').replace(/(\.\d*?)0+$/, '$1');
};

export const formatSalaryDisplay = (min, max, cadence, fallbackText = '') => {
  const formattedMin = formatSalaryDisplayValue(min);
  const formattedMax = formatSalaryDisplayValue(max);
  const cadenceKey = normalizeSalaryCadence(cadence);
  const cadenceLabel = cadenceKey ? SALARY_CADENCE_LABELS[cadenceKey] : null;

  if (!formattedMin && !formattedMax) {
    const fallback = fallbackText.trim();
    return fallback || 'Compensation undisclosed';
  }

  let range = formattedMin || formattedMax || '';

  if (formattedMin && formattedMax) {
    range = formattedMin === formattedMax ? formattedMin : `${formattedMin} – ${formattedMax}`;
  }

  const cadenceSuffix = cadenceLabel ? ` · ${cadenceLabel}` : '';
  return `${range} CHF${cadenceSuffix}`.trim();
};

export const formatRangeLabel = (min, max, suffix) => {
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (!hasMin && !hasMax) {
    return '';
  }

  const formattedMin = hasMin ? formatSalaryDisplayValue(min) : null;
  const formattedMax = hasMax ? formatSalaryDisplayValue(max) : null;

  if (formattedMin && formattedMax) {
    const range = formattedMin === formattedMax ? formattedMin : `${formattedMin} – ${formattedMax}`;
    return `${range} ${suffix}`;
  }

  const single = formattedMin || formattedMax;
  return single ? `${single} ${suffix}` : '';
};

export const formatSalaryDetailRange = ({ min, max, suffix = '', fallbackText = '' }) => {
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (!hasMin && !hasMax) {
    const fallback = fallbackText?.trim();
    return fallback || 'Compensation undisclosed';
  }

  const formatPlainValue = (value) => {
    if (!Number.isFinite(value)) {
      return null;
    }

    const rounded = Math.round(value);
    return `${rounded}`;
  };

  const formattedMin = hasMin ? formatPlainValue(min) : null;
  const formattedMax = hasMax ? formatPlainValue(max) : null;

  let range = formattedMin || formattedMax || '';

  if (formattedMin && formattedMax) {
    range = formattedMin === formattedMax ? formattedMin : `${formattedMin} – ${formattedMax}`;
  }

  return suffix ? `${range} ${suffix}`.trim() : range;
};

export const composeSalaryDisplay = ({ baseMin, baseMax, cadence, fallbackText = '' }) => {
  const cadenceKey = normalizeSalaryCadence(cadence);
  const hasBase = Number.isFinite(baseMin) || Number.isFinite(baseMax);

  if (!hasBase) {
    const fallback = fallbackText?.trim();
    return fallback || 'Compensation undisclosed';
  }

  return formatSalaryDisplay(baseMin, baseMax, cadenceKey, fallbackText);
};

export const convertToMonthly = (value, period, salaryText, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  let resolvedPeriod = period;
  if (!resolvedPeriod) {
    const reference = salaryText?.toLowerCase() ?? '';
    if (reference.includes('per month') || reference.includes('/ month')) {
      resolvedPeriod = 'month';
    } else if (reference.includes('per week') || reference.includes('/ week')) {
      resolvedPeriod = 'week';
    } else if (reference.includes('per day') || reference.includes('/ day')) {
      resolvedPeriod = 'day';
    } else if (reference.includes('per hour') || reference.includes('/ hour')) {
      resolvedPeriod = 'hour';
    } else if (value > 20000) {
      resolvedPeriod = 'year';
    } else {
      resolvedPeriod = 'month';
    }
  }

  const converted = convertCadenceValueToMonthly(value, resolvedPeriod, weeklyHours);
  return Number.isFinite(converted) ? converted : value;
};

export const computeSalaryRange = (job) => {
  const salaryText = job?.salary ?? '';
  const period = detectSalaryPeriod(job, salaryText);
  const { value: weeklyHoursValue } = getWeeklyHoursMeta(job);
  const hoursForConversion = resolveWeeklyHours(weeklyHoursValue);

  const minCandidate = SALARY_MIN_FIELDS.map((field) => parseNumericValue(job?.[field]))
    .find((value) => value != null);
  const maxCandidate = SALARY_MAX_FIELDS.map((field) => parseNumericValue(job?.[field]))
    .find((value) => value != null);

  const directValues = [minCandidate, maxCandidate]
    .filter((value) => value != null)
    .map((value) => convertToMonthly(value, period, salaryText, hoursForConversion))
    .filter((value) => Number.isFinite(value));

  const parsedFromString = Array.from(
    String(salaryText)
      .toLowerCase()
      .matchAll(/(\d+(?:[.,]\d+)?)\s*(k|m)?/g),
  )
    .map((match) => {
      let numeric = Number.parseFloat(match[1].replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        return null;
      }
      if (match[2] === 'm') numeric *= 1_000_000;
      if (match[2] === 'k') numeric *= 1_000;
      return convertToMonthly(numeric, period, salaryText, hoursForConversion);
    })
    .filter((value) => Number.isFinite(value));

  const values = [...directValues, ...parsedFromString].filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return [null, null];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [Math.round(min), Math.round(max)];
};

export const detectMissingColumn = (message, tableName = '') => {
  if (typeof message !== 'string') {
    return null;
  }

  const normalizedTable = tableName ? tableName.replace(/["'`]/g, '') : '';

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

export const deriveColumnPresence = (records) => {
  if (!Array.isArray(records)) {
    return {};
  }

  return records.reduce((accumulator, record) => {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach((key) => {
        accumulator[key] = true;
      });
    }
    return accumulator;
  }, {});
};

export const deriveSalaryBoundsFromJobs = (jobs) => {
  let min = Infinity;
  let max = 0;

  jobs.forEach((job) => {
    const baseMin = Number.isFinite(job.salary_min_value) ? job.salary_min_value : null;
    const baseMax = Number.isFinite(job.salary_max_value) ? job.salary_max_value : null;
    let jobMin = baseMin;
    let jobMax = baseMax;

    if (jobMin == null || jobMax == null) {
      const [derivedMin, derivedMax] = computeSalaryRange(job);
      if (jobMin == null) jobMin = derivedMin;
      if (jobMax == null) jobMax = derivedMax;
    }

    if (Number.isFinite(jobMin)) {
      min = Math.min(min, jobMin);
    }
    if (Number.isFinite(jobMax)) {
      max = Math.max(max, jobMax);
    }
  });

  if (!Number.isFinite(min) || !Number.isFinite(max) || min === Infinity || max === 0) {
    return [...SALARY_FALLBACK_RANGE];
  }

  if (min === max) {
    const buffer = Math.max(min * 0.2, 500);
    return [Math.max(0, Math.floor(min - buffer)), Math.ceil(max + buffer)];
  }

  return [Math.floor(min), Math.ceil(max)];
};

export const computeEquityRange = (job) => {
  const equityText = job?.equity ?? '';

  const minCandidate = EQUITY_MIN_FIELDS.map((field) => parsePercentageValue(job?.[field]))
    .find((value) => value != null);
  const maxCandidate = EQUITY_MAX_FIELDS.map((field) => parsePercentageValue(job?.[field]))
    .find((value) => value != null);

  const parsedFromString = Array.from(String(equityText).toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*%?/g))
    .map((match) => Number.parseFloat(match[1].replace(',', '.')))
    .filter((value) => Number.isFinite(value));

  const values = [minCandidate, maxCandidate, ...parsedFromString]
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (values.length === 0) {
    return [null, null];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [roundToStep(min, EQUITY_STEP), roundToStep(max, EQUITY_STEP)];
};

export const deriveEquityBoundsFromJobs = (jobs) => {
  let min = Infinity;
  let max = 0;

  jobs.forEach((job) => {
    const baseMin = Number.isFinite(job.equity_min_value) ? job.equity_min_value : null;
    const baseMax = Number.isFinite(job.equity_max_value) ? job.equity_max_value : null;
    let jobMin = baseMin;
    let jobMax = baseMax;

    if (jobMin == null || jobMax == null) {
      const [derivedMin, derivedMax] = computeEquityRange(job);
      if (jobMin == null) jobMin = derivedMin;
      if (jobMax == null) jobMax = derivedMax;
    }

    if (Number.isFinite(jobMin)) {
      min = Math.min(min, jobMin);
    }
    if (Number.isFinite(jobMax)) {
      max = Math.max(max, jobMax);
    }
  });

  if (!Number.isFinite(min) || !Number.isFinite(max) || min === Infinity) {
    return [...EQUITY_FALLBACK_RANGE];
  }

  const lowerBound = Math.max(0, Math.min(min, 0));
  const upperBound = Math.max(max, lowerBound);

  if (lowerBound === upperBound) {
    const buffer = Math.max(upperBound * 0.4, 0.2);
    const lower = Math.max(0, upperBound - buffer);
    const upper = upperBound + buffer;
    return [roundDownToStep(lower, EQUITY_STEP), roundUpToStep(upper, EQUITY_STEP)];
  }

  return [roundDownToStep(lowerBound, EQUITY_STEP), roundUpToStep(upperBound, EQUITY_STEP)];
};
