import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_TAG_PREFIX,
  LANGUAGE_VALUE_TO_CANONICAL,
  translationCache,
  translationPromiseCache,
  loadTranslationsForLanguage,
  applyReplacements,
  getInitialLanguage,
  collectLanguageKeys,
  mapLanguageValueToCanonical,
  filterLanguageTags,
  resolveJobLanguageLabels,
} from '../language';

const ACKNOWLEDGE_MESSAGE_KEY = 'applications.acknowledge';
const ACKNOWLEDGE_MESSAGE_FALLBACK =
  'By applying you agree that the startup will see your profile information, uploaded CV, motivational letter, and profile photo.';

const DEFAULT_PLURAL_SUFFIXES = {
  en: ['', 's'],
  fr: ['', 's'],
  de: ['', 'n'],
};

const buildInitialTranslationState = () => {
  const initial = {};
  translationCache.forEach((value, key) => {
    initial[key] = value;
  });
  return initial;
};

const resolveDictionaryValue = (dictionary, key) => {
  if (!dictionary) {
    return undefined;
  }

  const segments = key.split('.');
  let current = dictionary;
  for (const segment of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return current;
};

export const useTranslations = () => {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [loadedTranslations, setLoadedTranslations] = useState(
    buildInitialTranslationState
  );

  useEffect(() => {
    let cancelled = false;

    if (language === 'en') {
      return () => {
        cancelled = true;
      };
    }

    const cached = translationCache.get(language);
    if (cached) {
      setLoadedTranslations((previous) => {
        if (previous[language]) {
          return previous;
        }
        return { ...previous, [language]: cached };
      });
      return () => {
        cancelled = true;
      };
    }

    const existingPromise = translationPromiseCache.get(language);
    const promise = existingPromise || loadTranslationsForLanguage(language);

    if (!existingPromise) {
      translationPromiseCache.set(language, promise);
    }

    promise
      .then((dictionary) => {
        if (cancelled || !dictionary) {
          return;
        }
        translationCache.set(language, dictionary);
        setLoadedTranslations((previous) => ({ ...previous, [language]: dictionary }));
      })
      .catch((error) => {
        console.error(`Failed to resolve ${language} translations`, error);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('ssc_language', language);
  }, [language]);

  const translate = useCallback(
    (key, fallback = '', replacements) => {
      const apply = (template) => {
        const base = template || fallback || key;
        return applyReplacements(base, replacements);
      };

      if (language === 'en') {
        return apply(fallback);
      }

      const dictionary = loadedTranslations[language];
      const resolved = resolveDictionaryValue(dictionary, key);

      if (typeof resolved === 'string') {
        return apply(resolved);
      }

      if (Array.isArray(resolved)) {
        return resolved.map((item) => apply(typeof item === 'string' ? item : ''));
      }

      return apply(fallback);
    },
    [language, loadedTranslations]
  );

  const getLocalizedJobText = useCallback(
    (job, field) => {
      if (!job) {
        return '';
      }

      if (language !== 'en') {
        const localized = job?.translations?.[language]?.[field];
        if (typeof localized === 'string' && localized.trim()) {
          return localized;
        }
      }

      const original = job?.[field];
      return typeof original === 'string' ? original : '';
    },
    [language]
  );

  const getLocalizedJobList = useCallback(
    (job, field) => {
      if (!job) {
        return [];
      }

      if (language !== 'en') {
        const localized = job?.translations?.[language]?.[field];
        if (Array.isArray(localized) && localized.length > 0) {
          return localized;
        }
      }

      const original = job?.[field];
      if (Array.isArray(original)) {
        return original;
      }
      if (typeof original === 'string' && original.trim()) {
        return [original];
      }
      return [];
    },
    [language]
  );

  const getLocalizedCompanyText = useCallback(
    (company, field) => {
      if (!company) {
        return '';
      }

      if (language !== 'en') {
        const localized = company?.translations?.[language]?.[field];
        if (typeof localized === 'string' && localized.trim()) {
          return localized;
        }
      }

      const original = company?.[field];
      return typeof original === 'string' ? original : '';
    },
    [language]
  );

  const getJobLanguages = useCallback(
    (job) => {
      if (!job) {
        return [];
      }

      if (job.language_labels && typeof job.language_labels === 'object') {
        const localized = job.language_labels[language];
        if (Array.isArray(localized) && localized.length > 0) {
          return localized;
        }
        if (Array.isArray(job.language_labels.en) && job.language_labels.en.length > 0) {
          return job.language_labels.en;
        }
      }

      const resolved = resolveJobLanguageLabels(job);
      return resolved.labels[language] || resolved.labels.en || [];
    },
    [language]
  );

  const buildPluralSuffix = useCallback(
    (count, overrides = {}) => {
      const mapping = { ...DEFAULT_PLURAL_SUFFIXES, ...overrides };
      const [singular, plural] = mapping[language] || mapping.en;
      return count === 1 ? singular : plural;
    },
    [language]
  );

  const acknowledgeMessage = useMemo(
    () => translate(ACKNOWLEDGE_MESSAGE_KEY, ACKNOWLEDGE_MESSAGE_FALLBACK),
    [translate]
  );

  return {
    language,
    setLanguage,
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
    translate,
    getLocalizedJobText,
    getLocalizedJobList,
    getLocalizedCompanyText,
    getJobLanguages,
    buildPluralSuffix,
    acknowledgeMessage,
    LANGUAGE_OPTIONS,
    LANGUAGE_TAG_PREFIX,
    LANGUAGE_VALUE_TO_CANONICAL,
    collectLanguageKeys,
    filterLanguageTags,
    mapLanguageValueToCanonical,
    resolveJobLanguageLabels,
  };
};

export default useTranslations;
