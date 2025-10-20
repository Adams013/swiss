import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyReplacements,
  getCachedTranslations,
  getInitialLanguage,
  loadTranslationsForLanguage,
} from '../utils/i18n';
import { resolveJobLanguageLabels } from '../utils/language';

export const useI18n = () => {
  const translationsCache = useMemo(() => getCachedTranslations(), []);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [loadedTranslations, setLoadedTranslations] = useState(() => {
    const initial = {};
    translationsCache.forEach((value, key) => {
      initial[key] = value;
    });
    return initial;
  });

  useEffect(() => {
    let cancelled = false;

    if (language === 'en') {
      return () => {
        cancelled = true;
      };
    }

    const cached = translationsCache.get(language);
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

    loadTranslationsForLanguage(language)
      .then((dictionary) => {
        if (cancelled || !dictionary) {
          return;
        }
        setLoadedTranslations((previous) => ({ ...previous, [language]: dictionary }));
      })
      .catch((error) => {
        console.error(`Failed to resolve ${language} translations`, error);
      });

    return () => {
      cancelled = true;
    };
  }, [language, translationsCache]);

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
      if (!dictionary) {
        return apply(fallback);
      }

      const segments = key.split('.');
      let current = dictionary;
      for (const segment of segments) {
        if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
          current = current[segment];
        } else {
          current = null;
          break;
        }
      }

      if (typeof current === 'string') {
        return apply(current);
      }

      if (Array.isArray(current)) {
        return current.map((item) => apply(typeof item === 'string' ? item : ''));
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('ssc_language', language);
  }, [language]);

  const acknowledgeMessage = useMemo(
    () =>
      translate(
        'applications.acknowledge',
        'By applying you agree that the startup will see your profile information, uploaded CV, motivational letter, and profile photo.'
      ),
    [translate]
  );

  const buildPluralSuffix = useCallback(
    (count, overrides = {}) => {
      const defaults = {
        en: ['', 's'],
        fr: ['', 's'],
        de: ['', 'n'],
      };
      const mapping = { ...defaults, ...overrides };
      const [singular, plural] = mapping[language] || mapping.en;
      return count === 1 ? singular : plural;
    },
    [language]
  );

  return {
    language,
    setLanguage,
    translate,
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
    getLocalizedJobText,
    getLocalizedJobList,
    getLocalizedCompanyText,
    getJobLanguages,
    acknowledgeMessage,
    buildPluralSuffix,
  };
};

export default useI18n;
