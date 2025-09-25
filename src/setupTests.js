// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('./supabaseClient', () => {
  const createQuery = (result = { data: null, error: { message: 'Mocked Supabase call' } }) => {
    const query = {};

    query.select = () => createQuery();
    query.insert = () => createQuery({ data: null, error: null });
    query.update = () => createQuery({ data: null, error: null });
    query.upsert = () => createQuery({ data: null, error: null });
    query.eq = () => query;
    query.order = () => query;
    query.maybeSingle = async () => ({ data: null, error: null });
    query.single = async () => ({ data: null, error: { code: 'PGRST116' } });
    query.then = (resolve) => resolve(result);
    query.catch = () => query;
    query.finally = (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return query;
    };

    return query;
  };

  const auth = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (callback) => {
      const subscription = { unsubscribe: () => {} };
      if (typeof callback === 'function') {
        callback('INITIAL_SESSION', null);
      }
      return { data: { subscription } };
    },
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    resend: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: null, error: null }),
  };

  const storage = {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/mock-file.pdf' } }),
    }),
  };

  return {
    supabase: {
      auth,
      storage,
      from: () => createQuery(),
    },
  };
});
