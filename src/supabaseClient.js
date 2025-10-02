import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://nckakckmzphgkchnxppr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ja2FrY2ttenBoZ2tjaG54cHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjQyNTQsImV4cCI6MjA3NDMwMDI1NH0.dVXER-h2u5zK0PA-YXRu1jemUf9fM5KitD2UN0h8gnA';

const resolveConfigValue = (value, fallback) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const supabaseUrl = resolveConfigValue(process.env.REACT_APP_SUPABASE_URL, DEFAULT_SUPABASE_URL);
const supabaseAnonKey = resolveConfigValue(process.env.REACT_APP_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
