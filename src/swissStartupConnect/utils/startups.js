export const STARTUP_TEAM_FIELDS = ['team', 'team_size', 'employees', 'headcount'];
export const STARTUP_FUNDRAISING_FIELDS = ['fundraising', 'total_funding', 'total_raised', 'funding'];
export const STARTUP_INFO_FIELDS = ['info_link', 'profile_link', 'external_profile', 'external_profile_url'];

export const firstNonEmpty = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return '';
};

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
    startup.team_label,
  );
  const fundraisingLabel = firstNonEmpty(
    startup.fundraising,
    startup.total_funding,
    startup.total_raised,
    startup.funding,
  );
  const cultureLabel = firstNonEmpty(startup.culture, startup.values, startup.mission);
  const infoLink = firstNonEmpty(
    startup.info_link,
    startup.profile_link,
    startup.external_profile,
    startup.external_profile_url,
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
