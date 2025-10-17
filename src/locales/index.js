const translationLoaders = {
  fr: () => import('./fr.json'),
  de: () => import('./de.json'),
};

const readTranslationModule = (mod) => {
  if (mod && typeof mod === 'object') {
    if (mod.default && typeof mod.default === 'object') {
      return mod.default;
    }
    return mod;
  }
  return null;
};

export const loadTranslations = async (locale) => {
  const loader = translationLoaders[locale];
  if (!loader) {
    return null;
  }
  try {
    const mod = await loader();
    return readTranslationModule(mod);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}`, error);
    return null;
  }
};

export const availableTranslationLocales = Object.freeze(Object.keys(translationLoaders));
export const translationLoadersRegistry = Object.freeze({ ...translationLoaders });
