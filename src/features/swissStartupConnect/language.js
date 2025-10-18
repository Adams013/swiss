export const TRANSLATION_LOADERS = {
  fr: () => import('../../locales/fr.json'),
  de: () => import('../../locales/de.json'),
};

export const translationCache = new Map();
export const translationPromiseCache = new Map();

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'fr', label: 'Français', shortLabel: 'FR' },
  { value: 'de', label: 'Deutsch', shortLabel: 'DE' },
];

export const LANGUAGE_TAG_PREFIX = '__lang:';

export const LANGUAGE_VALUE_TO_CANONICAL = {
  en: 'english',
  fr: 'french',
  de: 'german',
};

export const JOB_LANGUAGE_LABELS = {
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

export const JOB_LANGUAGE_ALIASES = {
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

export const loadTranslationsForLanguage = async (language) => {
  if (!language || language === 'en') {
    return null;
  }

  if (translationCache.has(language)) {
    return translationCache.get(language);
  }

  if (translationPromiseCache.has(language)) {
    return translationPromiseCache.get(language);
  }

  const loader = TRANSLATION_LOADERS[language];
  if (!loader) {
    const resolved = Promise.resolve(null);
    translationPromiseCache.set(language, resolved);
    return resolved;
  }

  const promise = loader()
    .then((module) => {
      const dictionary = module?.default ?? module;
      if (dictionary) {
        translationCache.set(language, dictionary);
      }
      return dictionary || null;
    })
    .catch((error) => {
      console.error(`Failed to load ${language} translations`, error);
      return null;
    })
    .finally(() => {
      translationPromiseCache.delete(language);
    });

  translationPromiseCache.set(language, promise);
  return promise;
};

export const applyReplacements = (value, replacements) => {
  if (!replacements) {
    return value;
  }

  return value.replace(/\{\{(.*?)\}\}/g, (_, token) => {
    const trimmed = token.trim();
    return Object.prototype.hasOwnProperty.call(replacements, trimmed)
      ? String(replacements[trimmed])
      : '';
  });
};

export const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem('ssc_language');
  if (stored && LANGUAGE_OPTIONS.some((option) => option.value === stored)) {
    return stored;
  }
  return 'en';
};

export const collectLanguageKeys = (value, accumulator) => {
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
        return;
      }

      labels[locale] = normalizedKeys.map((key) => mapping[key] || key);
    });
    return { labels, keys: normalizedKeys };
  }

  const tags = Array.isArray(job?.tags) ? job.tags : [];
  const languages = tags
    .map((tag) => {
      if (typeof tag !== 'string' || !tag.toLowerCase().startsWith(LANGUAGE_TAG_PREFIX)) {
        return null;
      }
      return mapLanguageValueToCanonical(tag.slice(LANGUAGE_TAG_PREFIX.length));
    })
    .filter(Boolean);

  if (languages.length === 0) {
    return {
      labels: { ...JOB_LANGUAGE_LABELS },
      keys: ['english'],
    };
  }

  const keys = Array.from(new Set(languages));
  const labels = {};
  Object.entries(JOB_LANGUAGE_LABELS).forEach(([locale, mapping]) => {
    labels[locale] = keys.map((key) => mapping[key] || key);
  });
  return { labels, keys };
};
