import { firstNonEmpty } from './utils';

export const mapStartupToCompany = (startup) => {
  if (!startup || typeof startup !== 'object') {
    return null;
  }

  const name = firstNonEmpty(startup.name, startup.company_name, '');
  const teamLabel = firstNonEmpty(
    startup.team,
    startup.team_size,
    startup.employees,
    startup.headcount,
    startup.team_label
  );
  const fundraisingLabel = firstNonEmpty(
    startup.fundraising,
    startup.total_funding,
    startup.total_raised,
    startup.funding
  );
  const cultureLabel = firstNonEmpty(startup.culture, startup.values, startup.mission);
  const infoLink = firstNonEmpty(
    startup.info_link,
    startup.profile_link,
    startup.external_profile,
    startup.external_profile_url
  );

  return {
    id: startup.id,
    name: name || 'Verified startup',
    tagline: firstNonEmpty(startup.tagline, startup.short_description, startup.description),
    location: firstNonEmpty(startup.location, startup.city, startup.region),
    industry: firstNonEmpty(startup.industry, startup.vertical, startup.sector),
    team: teamLabel,
    fundraising: fundraisingLabel,
    culture: cultureLabel,
    website: firstNonEmpty(startup.website, startup.site_url, startup.url),
    info_link: infoLink,
    verification_status: startup.verification_status || 'unverified',
    created_at: startup.created_at,
  };
};

export const detectMissingColumn = (message, tableName = '') => {
  if (typeof message !== 'string') {
    return null;
  }

  const normalizedTable = tableName ? tableName.replace(/["'`]/g, '') : '';

  const tableSpecificPatterns = normalizedTable
    ? [
        new RegExp(`column "([^"\\s]+)" of relation "${normalizedTable}" does not exist`, 'i'),
        new RegExp(`could not find the '([^']+)' column of '${normalizedTable}'`, 'i'),
        new RegExp(`'([^']+)' column of '${normalizedTable}'`, 'i'),
        new RegExp(`column "([^"\\s]+)" of table "${normalizedTable}" does not exist`, 'i'),
      ]
    : [];

  const genericPatterns = [
    /missing column "?([^\s"']+)"?/i,
    /unknown column "?([^\s"']+)"?/i,
  ];

  for (const pattern of [...tableSpecificPatterns, ...genericPatterns]) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const deriveColumnPresence = (records) => {
  if (!Array.isArray(records)) {
    return {};
  }

  return records.reduce((accumulator, record) => {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach((key) => {
        accumulator[key] = true;
      });
    }
    return accumulator;
  }, {});
};

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
