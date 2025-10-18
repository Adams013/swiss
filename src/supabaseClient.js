import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV_VARS = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];

const readEnv = (key) => {
  const rawValue = process.env[key];
  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
  return trimmed.length > 0 ? trimmed : undefined;
};

const envValues = REQUIRED_ENV_VARS.reduce((accumulator, key) => {
  const value = readEnv(key);
  if (value) {
    accumulator[key] = value;
  }
  return accumulator;
}, {});

const missingVars = REQUIRED_ENV_VARS.filter((key) => !envValues[key]);

const createSupabaseConfigError = (message) => ({
  message,
  code: 'SUPABASE_CONFIG_MISSING',
  details: null,
  hint:
    'Provide REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY via your environment. See the README for instructions or copy .env.local.example to .env.local to reuse the hosted credentials.',
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
          missingEnvironment: missingVars,
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

const supabase = missingVars.length === 0
  ? createClient(envValues.REACT_APP_SUPABASE_URL, envValues.REACT_APP_SUPABASE_ANON_KEY)
  : createDisabledSupabaseClient(
      `Missing Supabase configuration. Set the following environment variables: ${missingVars.join(', ')}.`,
    );

if (missingVars.length > 0 && typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[supabaseClient] Supabase client is running in a disabled mode because required environment variables are missing.',
    { missingEnvironment: missingVars },
  );
}

export { supabase };
export const isSupabaseConfigured = missingVars.length === 0;
export default supabase;
