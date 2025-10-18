export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'fr', label: 'Français', shortLabel: 'FR' },
  { value: 'de', label: 'Deutsch', shortLabel: 'DE' },
];

export const LANGUAGE_TAG_PREFIX = '__lang:';

const LANGUAGE_VALUE_TO_CANONICAL = {
  en: 'english',
  fr: 'french',
  de: 'german',
};

export const mapLanguageValueToCanonical = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  return LANGUAGE_VALUE_TO_CANONICAL[normalized] || normalized;
};

export const filterLanguageTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag) => {
    if (typeof tag !== 'string') {
      return false;
    }

    return !tag.toLowerCase().startsWith(LANGUAGE_TAG_PREFIX);
  });
};

const JOB_LANGUAGE_LABELS = {
  en: {
    english: 'English',
    french: 'French',
    german: 'German',
    italian: 'Italian',
  },
  fr: {
    english: 'Anglais',
    french: 'Français',
    german: 'Allemand',
    italian: 'Italien',
  },
  de: {
    english: 'Englisch',
    french: 'Französisch',
    german: 'Deutsch',
    italian: 'Italienisch',
  },
};

const JOB_LANGUAGE_ALIASES = {
  english: 'english',
  anglais: 'english',
  anglaise: 'english',
  englisch: 'english',
  german: 'german',
  deutsch: 'german',
  germanophone: 'german',
  allemand: 'german',
  french: 'french',
  francais: 'french',
  français: 'french',
  franzoesisch: 'french',
  italien: 'italian',
  italian: 'italian',
  italiano: 'italian',
  italienisch: 'italian',
};

const collectLanguageKeys = (value, accumulator) => {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectLanguageKeys(entry, accumulator));
    return;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectLanguageKeys(entry, accumulator));
    return;
  }

  if (typeof value === 'string') {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
    let matched = false;

    tokens.forEach((token) => {
      const canonical = JOB_LANGUAGE_ALIASES[token];
      if (canonical && !accumulator.includes(canonical)) {
        accumulator.push(canonical);
        matched = true;
      }
    });

    if (!matched) {
      const trimmed = value.trim();
      if (trimmed && !accumulator.includes(trimmed)) {
        accumulator.push(trimmed);
      }
    }
  }
};

export const resolveJobLanguageLabels = (job) => {
  if (job?.language_labels && typeof job.language_labels === 'object') {
    const englishLabels = Array.isArray(job.language_labels.en) ? job.language_labels.en : [];
    const keys = [];
    englishLabels.forEach((label) => collectLanguageKeys(label, keys));
    const normalizedKeys = keys.length > 0 ? keys : ['english'];
    const labels = {};
    Object.entries(JOB_LANGUAGE_LABELS).forEach(([locale, mapping]) => {
      if (Array.isArray(job.language_labels[locale]) && job.language_labels[locale].length > 0) {
        labels[locale] = job.language_labels[locale];
      } else {
        labels[locale] = normalizedKeys.map((key) => mapping[key] || key);
      }
    });
    return { keys: normalizedKeys, labels };
  }

  const keys = [];
  const candidates = [
    job?.language_requirements,
    job?.languages_required,
    job?.languages,
    job?.language,
  ];

  candidates.forEach((value) => collectLanguageKeys(value, keys));

  if (Array.isArray(job?.tags)) {
    job.tags.forEach((tag) => {
      if (typeof tag !== 'string') {
        return;
      }

      if (!tag.toLowerCase().startsWith(LANGUAGE_TAG_PREFIX)) {
        return;
      }

      const canonical = tag.slice(LANGUAGE_TAG_PREFIX.length).trim().toLowerCase();
      if (canonical && !keys.includes(canonical)) {
        keys.push(canonical);
      }
    });
  }

  if (keys.length === 0 && job?.translations) {
    Object.values(job.translations).forEach((translation) => {
      if (translation && typeof translation === 'object') {
        collectLanguageKeys(translation.languages, keys);
      }
    });
  }

  if (keys.length === 0) {
    keys.push('english');
  }

  const labels = {};
  Object.entries(JOB_LANGUAGE_LABELS).forEach(([locale, mapping]) => {
    labels[locale] = keys.map((key) => mapping[key] || key);
  });

  return { keys, labels };
};
