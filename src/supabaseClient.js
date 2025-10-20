import { createClient } from '@supabase/supabase-js';

const ENVIRONMENT_SOURCES = {
  REACT_APP_SUPABASE_URL: ['REACT_APP_SUPABASE_URL', 'SUPABASE_URL'],
  REACT_APP_SUPABASE_ANON_KEY: [
    'REACT_APP_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_KEY',
  ],
};

const findEnvValue = (keys) => {
  for (const key of keys) {
    const rawValue = process.env[key];
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed.length > 0) {
        return { key, value: trimmed };
      }
    }
  }
  return undefined;
};

const { envValues, envSources, missing } = Object.entries(ENVIRONMENT_SOURCES).reduce(
  (accumulator, [canonicalKey, envKeys]) => {
    const resolved = findEnvValue(envKeys);
    if (resolved) {
      accumulator.envValues[canonicalKey] = resolved.value;
      accumulator.envSources[canonicalKey] = resolved.key;
    } else {
      accumulator.missing.push({ canonicalKey, envKeys });
    }
    return accumulator;
  },
  { envValues: {}, envSources: {}, missing: [] },
);

const formatEnvChoices = (keys) => keys.join(' or ');

const missingEnvDescriptions = missing.map(({ envKeys }) => formatEnvChoices(envKeys));

const createSupabaseConfigError = (message) => ({
  message,
  code: 'SUPABASE_CONFIG_MISSING',
  details: null,
  hint:
    'Provide Supabase credentials via your environment. Accepted variables for the URL are ' +
    formatEnvChoices(ENVIRONMENT_SOURCES.REACT_APP_SUPABASE_URL) +
    ', and for the anon key use ' +
    formatEnvChoices(ENVIRONMENT_SOURCES.REACT_APP_SUPABASE_ANON_KEY) +
    '. See the README for instructions or copy .env.local.example to .env.local to reuse the hosted credentials.',
});

const createDisabledQuery = (errorMessage) => {
  const result = { data: null, error: createSupabaseConfigError(errorMessage) };

  const handler = {
    get: (_, prop) => {
      if (prop === 'then') {
        return (resolve, reject) => {
          const promise = Promise.resolve(result);
          return promise.then(resolve, reject);
        };
      }

      if (prop === 'catch') {
        return (reject) => {
          if (typeof reject === 'function') {
            reject(result.error);
          }
          return Promise.resolve(result);
        };
      }

      if (prop === 'finally') {
        return (callback) => {
          if (typeof callback === 'function') {
            callback();
          }
          return Promise.resolve(result);
        };
      }

      if (prop === 'maybeSingle' || prop === 'single') {
        return async () => result;
      }

      if (prop === Symbol.toStringTag) {
        return 'DisabledSupabaseQuery';
      }

      return () => createDisabledQuery(errorMessage);
    },
    apply: () => createDisabledQuery(errorMessage),
  };

  return new Proxy(() => {}, handler);
};

const createDisabledSupabaseClient = (errorMessage) => {
  const reportMissingConfig = (methodName) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[supabaseClient] ${methodName} is unavailable because Supabase credentials are missing.`,
        {
          missingEnvironment: missingEnvDescriptions,
          missingEnvironmentDetails: missing,
          resolvedEnvironment: envSources,
        },
      );
    }
  };

  const asyncAuthMethod = (methodName) => async () => {
    reportMissingConfig(methodName);
    return { data: null, error: createSupabaseConfigError(errorMessage) };
  };

  return {
    auth: new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'onAuthStateChange') {
            return (callback) => {
              reportMissingConfig(`supabase.auth.${String(prop)}`);
              if (typeof callback === 'function') {
                callback('INITIAL_SESSION', null);
              }
              return {
                data: { subscription: { unsubscribe() {} } },
                error: createSupabaseConfigError(errorMessage),
              };
            };
          }

          return asyncAuthMethod(`supabase.auth.${String(prop)}`);
        },
      },
    ),
    storage: {
      from: () => ({
        upload: async () => {
          reportMissingConfig('supabase.storage.upload');
          return { data: null, error: createSupabaseConfigError(errorMessage) };
        },
        getPublicUrl: () => {
          reportMissingConfig('supabase.storage.getPublicUrl');
          return {
            data: { publicUrl: null },
            error: createSupabaseConfigError(errorMessage),
          };
        },
      }),
    },
    from: () => createDisabledQuery(errorMessage),
  };
};

const supabase = missing.length === 0
  ? createClient(envValues.REACT_APP_SUPABASE_URL, envValues.REACT_APP_SUPABASE_ANON_KEY)
  : createDisabledSupabaseClient(
      `Missing Supabase configuration. Set the following environment variables: ${missingEnvDescriptions.join(
        ', ',
      )}.`,
    );

if (missing.length > 0 && typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[supabaseClient] Supabase client is running in a disabled mode because required environment variables are missing.',
    {
      missingEnvironment: missingEnvDescriptions,
      missingEnvironmentDetails: missing,
      resolvedEnvironment: envSources,
    },
  );
}

export { supabase };
export const isSupabaseConfigured = missing.length === 0;
export default supabase;
