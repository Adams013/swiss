export const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  const rawType = supabaseUser.user_metadata?.type;
  const normalizedType =
    typeof rawType === 'string' && rawType.trim()
      ? rawType.trim().toLowerCase()
      : '';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'Member',
    type: normalizedType === 'startup' ? 'startup' : 'student',
    avatar_url: supabaseUser.user_metadata?.avatar_url || '',
  };
};
