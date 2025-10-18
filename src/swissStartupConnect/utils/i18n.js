import { LANGUAGE_OPTIONS } from './language';

const TRANSLATION_LOADERS = {
  fr: () => import('../../locales/fr.json'),
  de: () => import('../../locales/de.json'),
};

const translationCache = new Map();
const translationPromiseCache = new Map();

export const getCachedTranslations = () => translationCache;

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
