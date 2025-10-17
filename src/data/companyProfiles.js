let cachedProfiles = null;
let cachedMockCompanies = null;
let cachedProfilesById = null;

const loadDataModule = async () => {
  const module = await import('./companyProfiles.data.js');
  return Array.isArray(module.companyProfiles) ? module.companyProfiles : [];
};

const buildMockCompanies = (profiles) =>
  profiles.map(({ profile, ...summary }) => summary);

const buildProfilesById = (profiles) => {
  return profiles.reduce((accumulator, entry) => {
    if (entry && entry.id != null) {
      accumulator[String(entry.id)] = entry;
    }
    return accumulator;
  }, {});
};

export const loadCompanyProfiles = async () => {
  if (!cachedProfiles) {
    cachedProfiles = await loadDataModule();
  }
  return cachedProfiles;
};

export const loadMockCompanies = async () => {
  if (cachedMockCompanies) {
    return cachedMockCompanies;
  }

  const profiles = await loadCompanyProfiles();
  cachedMockCompanies = buildMockCompanies(profiles);
  return cachedMockCompanies;
};

export const loadCompanyProfilesById = async () => {
  if (cachedProfilesById) {
    return cachedProfilesById;
  }

  const profiles = await loadCompanyProfiles();
  cachedProfilesById = buildProfilesById(profiles);
  return cachedProfilesById;
};
