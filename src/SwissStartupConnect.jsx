import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  Clock,
  ClipboardList,
  GraduationCap,
  Handshake,
  Heart,
  Languages,
  Lightbulb,
  Moon,
  Layers,
  MapPin,
  Percent,
  Rocket,
  Search,
  Send,
  Sun,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
  MessageCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import './SwissStartupConnect.css';
import { supabase } from './supabaseClient';
import { fetchJobs } from './services/supabaseJobs';
import { fetchCompanies } from './services/supabaseCompanies';
import JobMapView from './JobMapView';
import CompanyProfilePage from './components/CompanyProfilePage';
import CvFootnote from './components/CvFootnote';
import Modal from './components/Modal';
import {
  loadCompanyProfiles,
  loadMockCompanies,
  loadCompanyProfilesById,
} from './data/companyProfiles';
import { loadMockJobs } from './data/mockJobs';
import { loadMockEvents } from './data/mockEvents';

const sortEventsByScheduleStatic = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }
  return [...list].sort((a, b) => {
    const buildDateValue = (entry) => {
      if (!entry || !entry.event_date) {
        return 0;
      }
      const time = entry.event_time ? String(entry.event_time) : '00:00';
      const formattedTime = time.length > 5 ? time.slice(0, 8) : time;
      const composed = `${entry.event_date}T${formattedTime}`;
      const value = new Date(composed).getTime();
      return Number.isFinite(value) ? value : 0;
    };

    return buildDateValue(a) - buildDateValue(b);
  });
};

const TRANSLATION_LOADERS = {
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
};

const translationCache = new Map();
const translationPromiseCache = new Map();

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'fr', label: 'Français', shortLabel: 'FR' },
  { value: 'de', label: 'Deutsch', shortLabel: 'DE' },
];

const LANGUAGE_TAG_PREFIX = '__lang:';

const LOCAL_PROFILE_CACHE_KEY = 'ssc_profile_cache_v1';
const LOCAL_APPLICATION_STORAGE_KEY = 'ssc_local_applications_v1';
const THEME_STORAGE_KEY = 'ssc_theme_preference';

const readCachedProfile = (userId) => {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const cached = parsed[userId];
    if (!cached || typeof cached !== 'object') {
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Failed to read cached profile', error);
    return null;
  }
};

const writeCachedProfile = (userId, profile) => {
  if (typeof window === 'undefined' || !userId || !profile) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const next = parsed && typeof parsed === 'object' ? { ...parsed } : {};
    next[userId] = { ...profile };
    window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to cache profile', error);
  }
};

const removeCachedProfile = (userId) => {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_CACHE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed[userId]) {
      return;
    }

    const next = { ...parsed };
    delete next[userId];

    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(LOCAL_PROFILE_CACHE_KEY);
    } else {
      window.localStorage.setItem(LOCAL_PROFILE_CACHE_KEY, JSON.stringify(next));
    }
  } catch (error) {
    console.error('Failed to remove cached profile', error);
  }
};

const LANGUAGE_VALUE_TO_CANONICAL = {
  en: 'english',
  fr: 'french',
  de: 'german',
};

const STARTUP_TEAM_FIELDS = ['team', 'team_size', 'employees', 'headcount'];
const STARTUP_FUNDRAISING_FIELDS = ['fundraising', 'total_funding', 'total_raised', 'funding'];
const STARTUP_INFO_FIELDS = ['info_link', 'profile_link', 'external_profile', 'external_profile_url'];

const MODAL_TITLE_IDS = {
  compensation: 'ssc-modal-compensation-title',
  cvTemplates: 'ssc-modal-cv-templates-title',
  reviews: 'ssc-modal-reviews-title',
  jobDetails: 'ssc-modal-job-details-title',
  postEvent: 'ssc-modal-post-event-title',
  application: 'ssc-modal-application-title',
  profile: 'ssc-modal-profile-title',
  startup: 'ssc-modal-startup-title',
  postJob: 'ssc-modal-post-job-title',
  auth: 'ssc-modal-auth-title',
  resetPassword: 'ssc-modal-reset-password-title',
  security: 'ssc-modal-security-title',
};

const getJobIdKey = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  return String(value);
};

const sanitizeIdArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set();
  value.forEach((entry) => {
    const key = getJobIdKey(entry);
    if (key) {
      unique.add(key);
    }
  });

  return Array.from(unique);
};

const readLocalApplications = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_APPLICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read local applications', error);
    return [];
  }
};

const writeLocalApplications = (entries) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_APPLICATION_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to write local applications', error);
  }
};

const normalizeApplicationKey = (jobId, profileId) => {
  const jobKey = getJobIdKey(jobId);
  const profileKey = getJobIdKey(profileId);
  return `${jobKey}::${profileKey}`;
};

const normalizeThreadStateValue = (value) => {
  if (Array.isArray(value)) {
    return { entries: value, meta: null };
  }

  if (value && typeof value === 'object') {
    const entries = Array.isArray(value.entries) ? value.entries : [];
    const meta = value.meta && typeof value.meta === 'object' ? value.meta : null;
    return { entries, meta };
  }

  return { entries: [], meta: null };
};

const pickThreadValue = (store, primaryKey, fallbackKey) => {
  if (!store || typeof store !== 'object') {
    return undefined;
  }

  if (primaryKey && Object.prototype.hasOwnProperty.call(store, primaryKey)) {
    return store[primaryKey];
  }

  if (fallbackKey && Object.prototype.hasOwnProperty.call(store, fallbackKey)) {
    return store[fallbackKey];
  }

  return undefined;
};

const removeThreadKeys = (store, keys = []) => {
  if (!store || typeof store !== 'object' || !Array.isArray(keys) || keys.length === 0) {
    return store;
  }

  let next = store;
  let mutated = false;

  keys.forEach((key) => {
    if (!key) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(next, key)) {
      if (!mutated) {
        next = { ...next };
        mutated = true;
      }
      delete next[key];
    }
  });

  return mutated ? next : store;
};

const parseThreadKey = (key) => {
  if (typeof key !== 'string') {
    return { jobId: '', profileId: '' };
  }

  const [jobId = '', profileId = ''] = key.split('::');
  return { jobId: jobId || '', profileId: profileId || '' };
};

const upsertLocalApplication = (entry) => {
  if (!entry) {
    return null;
  }

  const stored = readLocalApplications();
  const targetKey = normalizeApplicationKey(entry.job_id, entry.profile_id);
  const filtered = stored.filter((existing) => {
    const existingKey = normalizeApplicationKey(existing.job_id, existing.profile_id);
    return existingKey !== targetKey;
  });
  const nextEntries = [...filtered, entry];
  writeLocalApplications(nextEntries);
  return entry;
};

const loadLocalApplicationsForStartup = (startupId, remoteApplications = []) => {
  const stored = readLocalApplications();
  const remoteKeys = new Set(
    Array.isArray(remoteApplications)
      ? remoteApplications.map((application) => normalizeApplicationKey(application.job_id, application.profile_id))
      : []
  );

  let changed = false;
  const filtered = stored.filter((entry) => {
    const key = normalizeApplicationKey(entry.job_id, entry.profile_id);
    if (remoteKeys.has(key)) {
      changed = true;
      return false;
    }
    return true;
  });

  if (changed) {
    writeLocalApplications(filtered);
  }

  const normalizedStartupId = getJobIdKey(startupId);

  return filtered
    .filter((entry) => {
      if (!normalizedStartupId) {
        return true;
      }
      return getJobIdKey(entry.startup_id) === normalizedStartupId;
    })
    .map((entry) => ({ ...entry, isLocal: true }));
};

const updateStoredLocalApplication = (applicationId, updater) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = readLocalApplications();
    let changed = false;
    const updated = stored
      .map((entry) => {
        if (entry.id !== applicationId) {
          return entry;
        }

        const next = updater ? updater(entry) : entry;
        if (next === entry) {
          return entry;
        }

        changed = true;
        return next;
      })
      .filter(Boolean);

    if (changed) {
      writeLocalApplications(updated);
    }

    return updated.find((entry) => entry.id === applicationId) || null;
  } catch (error) {
    console.error('Failed to update local application', error);
    return null;
  }
};

const firstNonEmpty = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return '';
};

const mapLanguageValueToCanonical = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  return LANGUAGE_VALUE_TO_CANONICAL[normalized] || normalized;
};

const filterLanguageTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag) => {
    if (typeof tag !== 'string') {
      return false;
    }

    return !tag.toLowerCase().startsWith(LANGUAGE_TAG_PREFIX);
  });
};

const JOB_LANGUAGE_LABELS = {
  en: {
    english: 'English',
    french: 'French',
    german: 'German',
    italian: 'Italian',
  },
  fr: {
    english: 'Anglais',
    french: 'Français',
    german: 'Allemand',
    italian: 'Italien',
  },
  de: {
    english: 'Englisch',
    french: 'Französisch',
    german: 'Deutsch',
    italian: 'Italienisch',
  },
};

const JOB_LANGUAGE_ALIASES = {
  english: 'english',
  anglais: 'english',
  anglaise: 'english',
  englisch: 'english',
  german: 'german',
  deutsch: 'german',
  germanophone: 'german',
  allemand: 'german',
  french: 'french',
  francais: 'french',
  français: 'french',
  franzoesisch: 'french',
  italien: 'italian',
  italian: 'italian',
  italiano: 'italian',
  italienisch: 'italian',
};

const APPLICATION_THREAD_TYPES = ['message', 'interview', 'note'];
const APPLICATION_THREAD_STORAGE_KEY = 'ssc_applicationThreads';

const mapStartupToCompany = (startup) => {
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

const loadTranslationsForLanguage = async (language) => {
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



const applyReplacements = (value, replacements) => {
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

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem('ssc_language');
  if (stored && LANGUAGE_OPTIONS.some((option) => option.value === stored)) {
    return stored;
  }
  return 'en';
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};



const collectLanguageKeys = (value, accumulator) => {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectLanguageKeys(entry, accumulator));
    return;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectLanguageKeys(entry, accumulator));
    return;
  }

  if (typeof value === 'string') {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
    let matched = false;

    tokens.forEach((token) => {
      const canonical = JOB_LANGUAGE_ALIASES[token];
      if (canonical && !accumulator.includes(canonical)) {
        accumulator.push(canonical);
        matched = true;
      }
    });

    if (!matched) {
      const trimmed = value.trim();
      if (trimmed && !accumulator.includes(trimmed)) {
        accumulator.push(trimmed);
      }
    }
  }
};

const resolveJobLanguageLabels = (job) => {
  if (job?.language_labels && typeof job.language_labels === 'object') {
    const englishLabels = Array.isArray(job.language_labels.en) ? job.language_labels.en : [];
    const keys = [];
    englishLabels.forEach((label) => collectLanguageKeys(label, keys));
    const normalizedKeys = keys.length > 0 ? keys : ['english'];
    const labels = {};
    Object.entries(JOB_LANGUAGE_LABELS).forEach(([locale, mapping]) => {
      if (Array.isArray(job.language_labels[locale]) && job.language_labels[locale].length > 0) {
        labels[locale] = job.language_labels[locale];
      } else {
        labels[locale] = normalizedKeys.map((key) => mapping[key] || key);
      }
    });
    return { keys: normalizedKeys, labels };
  }

  const keys = [];
  const candidates = [
    job?.language_requirements,
    job?.languages_required,
    job?.languages,
    job?.language,
  ];

  candidates.forEach((value) => collectLanguageKeys(value, keys));

  if (Array.isArray(job?.tags)) {
    job.tags.forEach((tag) => {
      if (typeof tag !== 'string') {
        return;
      }

      if (!tag.toLowerCase().startsWith(LANGUAGE_TAG_PREFIX)) {
        return;
      }

      const canonical = tag.slice(LANGUAGE_TAG_PREFIX.length).trim().toLowerCase();
      if (canonical && !keys.includes(canonical)) {
        keys.push(canonical);
      }
    });
  }

  if (keys.length === 0 && job?.translations) {
    Object.values(job.translations).forEach((translation) => {
      if (translation && typeof translation === 'object') {
        collectLanguageKeys(translation.languages, keys);
      }
    });
  }

  if (keys.length === 0) {
    keys.push('english');
  }

  const labels = {};
  Object.entries(JOB_LANGUAGE_LABELS).forEach(([locale, mapping]) => {
    labels[locale] = keys.map((key) => mapping[key] || key);
  });

  return { keys, labels };
};

const SWISS_LOCATION_OPTIONS = [
  ['Zurich, Switzerland', 'Zurich', 'filters.locations.zurich'],
  ['Geneva, Switzerland', 'Geneva', 'filters.locations.geneva'],
  ['Basel, Switzerland', 'Basel', 'filters.locations.basel'],
  ['Bern, Switzerland', 'Bern', 'filters.locations.bern'],
  ['Lausanne, Switzerland', 'Lausanne', 'filters.locations.lausanne'],
  ['Lugano, Switzerland', 'Lugano', 'filters.locations.lugano'],
  ['Lucerne, Switzerland', 'Lucerne', 'filters.locations.lucerne'],
  ['St. Gallen, Switzerland', 'St. Gallen', 'filters.locations.stgallen'],
  ['Fribourg, Switzerland', 'Fribourg', 'filters.locations.fribourg'],
  ['Neuchâtel, Switzerland', 'Neuchâtel', 'filters.locations.neuchatel'],
  ['Winterthur, Switzerland', 'Winterthur', 'filters.locations.winterthur'],
  ['Zug, Switzerland', 'Zug', 'filters.locations.zug'],
  ['Sion, Switzerland', 'Sion', 'filters.locations.sion'],
  ['Chur, Switzerland', 'Chur', 'filters.locations.chur'],
  ['Biel/Bienne, Switzerland', 'Biel/Bienne', 'filters.locations.biel'],
  ['Schaffhausen, Switzerland', 'Schaffhausen', 'filters.locations.schaffhausen'],
  ['Thun, Switzerland', 'Thun', 'filters.locations.thun'],
  ['La Chaux-de-Fonds, Switzerland', 'La Chaux-de-Fonds', 'filters.locations.laChauxDeFonds'],
  ['Locarno, Switzerland', 'Locarno', 'filters.locations.locarno'],
  ['Bellinzona, Switzerland', 'Bellinzona', 'filters.locations.bellinzona'],
  ['Aarau, Switzerland', 'Aarau', 'filters.locations.aarau'],
  ['St. Moritz, Switzerland', 'St. Moritz', 'filters.locations.stMoritz'],
  ['Canton of Zurich', 'Canton of Zurich', 'filters.locations.cantonZurich'],
  ['Canton of Bern', 'Canton of Bern', 'filters.locations.cantonBern'],
  ['Canton of Lucerne', 'Canton of Lucerne', 'filters.locations.cantonLucerne'],
  ['Canton of Uri', 'Canton of Uri', 'filters.locations.cantonUri'],
  ['Canton of Schwyz', 'Canton of Schwyz', 'filters.locations.cantonSchwyz'],
  ['Canton of Obwalden', 'Canton of Obwalden', 'filters.locations.cantonObwalden'],
  ['Canton of Nidwalden', 'Canton of Nidwalden', 'filters.locations.cantonNidwalden'],
  ['Canton of Glarus', 'Canton of Glarus', 'filters.locations.cantonGlarus'],
  ['Canton of Zug', 'Canton of Zug', 'filters.locations.cantonZug'],
  ['Canton of Fribourg', 'Canton of Fribourg', 'filters.locations.cantonFribourg'],
  ['Canton of Solothurn', 'Canton of Solothurn', 'filters.locations.cantonSolothurn'],
  ['Canton of Basel-Stadt', 'Canton of Basel-Stadt', 'filters.locations.cantonBaselStadt'],
  ['Canton of Basel-Landschaft', 'Canton of Basel-Landschaft', 'filters.locations.cantonBaselLandschaft'],
  ['Canton of Schaffhausen', 'Canton of Schaffhausen', 'filters.locations.cantonSchaffhausen'],
  ['Canton of Appenzell Ausserrhoden', 'Canton of Appenzell Ausserrhoden', 'filters.locations.cantonAppenzellAusserrhoden'],
  ['Canton of Appenzell Innerrhoden', 'Canton of Appenzell Innerrhoden', 'filters.locations.cantonAppenzellInnerrhoden'],
  ['Canton of St. Gallen', 'Canton of St. Gallen', 'filters.locations.cantonStGallen'],
  ['Canton of Graubünden', 'Canton of Graubünden', 'filters.locations.cantonGraubunden'],
  ['Canton of Aargau', 'Canton of Aargau', 'filters.locations.cantonAargau'],
  ['Canton of Thurgau', 'Canton of Thurgau', 'filters.locations.cantonThurgau'],
  ['Canton of Ticino', 'Canton of Ticino', 'filters.locations.cantonTicino'],
  ['Canton of Vaud', 'Canton of Vaud', 'filters.locations.cantonVaud'],
  ['Canton of Valais', 'Canton of Valais', 'filters.locations.cantonValais'],
  ['Canton of Neuchâtel', 'Canton of Neuchâtel', 'filters.locations.cantonNeuchatel'],
  ['Canton of Geneva', 'Canton of Geneva', 'filters.locations.cantonGeneva'],
  ['Canton of Jura', 'Canton of Jura', 'filters.locations.cantonJura'],
  ['Remote within Switzerland', 'Remote within Switzerland', 'filters.locations.remoteSwitzerland'],
  ['Hybrid (Zurich)', 'Hybrid – Zurich', 'filters.locations.hybridZurich'],
  ['Hybrid (Geneva)', 'Hybrid – Geneva', 'filters.locations.hybridGeneva'],
  ['Hybrid (Lausanne)', 'Hybrid – Lausanne', 'filters.locations.hybridLausanne'],
  ['Hybrid (Basel)', 'Hybrid – Basel', 'filters.locations.hybridBasel'],
  ['Across Switzerland', 'Across Switzerland', 'filters.locations.acrossSwitzerland'],
].map(([value, label, translationKey]) => ({ value, label, translationKey }));

const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'on_site', label: 'On-site', translationKey: 'onSite' },
  { value: 'hybrid', label: 'Hybrid', translationKey: 'hybrid' },
  { value: 'remote', label: 'Remote', translationKey: 'remote' },
];

const WORK_ARRANGEMENT_VALUES = new Set(WORK_ARRANGEMENT_OPTIONS.map((option) => option.value));

const WORK_ARRANGEMENT_LABEL_MAP = WORK_ARRANGEMENT_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option;
  return accumulator;
}, {});

const ALLOWED_SWISS_LOCATIONS = new Set(
  SWISS_LOCATION_OPTIONS.map((option) =>
    option.value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  ),
);

const buildWorkArrangementLabel = (translate, arrangement) => {
  if (!arrangement || typeof arrangement !== 'string') {
    return '';
  }

  const normalized = arrangement.trim();
  const option = WORK_ARRANGEMENT_LABEL_MAP[normalized];
  if (!option) {
    return '';
  }

  return translate(`jobs.arrangements.${option.translationKey}`, option.label);
};

const steps = [
  {
    id: 1,
    title: 'Create a standout profile',
    description: 'Showcase your skills, projects, and what you want to learn next.',
    icon: GraduationCap,
  },
  {
    id: 2,
    title: 'Match with aligned startups',
    description: 'Get curated roles based on your focus, availability, and goals.',
    icon: Layers,
  },
  {
    id: 3,
    title: 'Connect with founders',
    description: 'Join tailored intros and learn what success looks like in the first 90 days.',
    icon: Handshake,
  },
  {
    id: 4,
    title: 'Plan your runway',
    description: 'Compare salary, equity, and contract details with our built-in calculator.',
    icon: ClipboardList,
  },
  {
    id: 5,
    title: 'Launch together',
    description: 'Go from first intro to signed offer in under three weeks on average.',
    icon: Rocket,
  },
  {
    id: 6,
    title: 'Celebrate the win',
    description: 'Join alumni sessions to swap tips and prepare for your first day.',
    icon: Trophy,
  },
];

const stats = [
  {
    id: 'startups',
    value: '2.3k',
    label: 'Swiss startups hiring',
    detail: 'Fintech, health, climate, deep tech, consumer, and more.',
  },
  {
    id: 'time-to-offer',
    value: '12 days',
    label: 'Average time to offer',
    detail: 'From first conversation to signed offer for student matches.',
  },
  {
    id: 'student-founders',
    value: '780+',
    label: 'Student founders onboard',
    detail: 'Students who launched ventures through our partner network.',
  },
];

const testimonials = [
  {
    id: 1,
    quote:
      'SwissStartup Connect made it effortless to discover startups that matched my values. I shipped production code in week two.',
    name: 'Lina H.',
    role: 'ETH Zürich, Software Engineering Student',
  },
  {
    id: 2,
    quote:
      'We filled two growth roles in record time. The candidates already understood the Swiss market and came ready to experiment.',
    name: 'Marco B.',
    role: 'Co-founder, Helvetia Mobility',
  },
];

const resourceLinks = [
  {
    id: 1,
    title: 'Swiss internship compensation guide',
    description: 'Median monthly pay and cost-of-living notes for every canton.',
    action: 'modal',
    modalId: 'compensation',
  },
  {
    id: 2,
    title: 'Founder-ready CV template',
    description: 'Three proven templates plus writing tips founders recommend.',
    action: 'modal',
    modalId: 'cvTemplates',
  },
  {
    id: 3,
    title: 'Visa & permit checklist',
    description: 'Official step-by-step guidance for studying and working in Switzerland.',
    action: 'external',
    href: 'https://www.ch.ch/en/entering-switzerland-visa/',
  },
];

const careerTips = [
  {
    id: 'equity',
    title: 'Equity Matters',
    description: 'Ask about equity packages—they can be worth more than salary!',
  },
  {
    id: 'growth',
    title: 'Growth Opportunity',
    description: 'Startups offer rapid career advancement and diverse experience.',
  },
  {
    id: 'learn',
    title: 'Learn Fast',
    description: 'Direct exposure to all aspects of business operations.',
  },
];

const cantonInternshipSalaries = [
  { canton: 'Zürich (ZH)', median: 'CHF 2,450', note: 'Finance, pharma, and big-tech hubs offer the highest stipends.' },
  { canton: 'Bern (BE)', median: 'CHF 2,150', note: 'Federal agencies and med-tech firms provide steady pay.' },
  { canton: 'Luzern (LU)', median: 'CHF 2,050', note: 'Tourism + health clusters; accommodation remains accessible.' },
  { canton: 'Uri (UR)', median: 'CHF 1,850', note: 'Engineering SMEs often bundle travel support.' },
  { canton: 'Schwyz (SZ)', median: 'CHF 2,050', note: 'Finance and industrial automation compete for talent.' },
  { canton: 'Obwalden (OW)', median: 'CHF 1,950', note: 'Smaller firms provide meal or housing allowances.' },
  { canton: 'Nidwalden (NW)', median: 'CHF 2,000', note: 'Aviation suppliers benchmark against national averages.' },
  { canton: 'Glarus (GL)', median: 'CHF 1,950', note: 'Manufacturing internships pair pay with housing support.' },
  { canton: 'Zug (ZG)', median: 'CHF 2,600', note: 'Crypto and commodity scale-ups raise the bar.' },
  { canton: 'Fribourg (FR)', median: 'CHF 2,000', note: 'Bilingual market; research internships co-funded by universities.' },
  { canton: 'Solothurn (SO)', median: 'CHF 2,000', note: 'Precision engineering with transport stipends.' },
  { canton: 'Basel-Stadt (BS)', median: 'CHF 2,450', note: 'Life sciences keep stipends close to junior salaries.' },
  { canton: 'Basel-Landschaft (BL)', median: 'CHF 2,150', note: 'Chemical industry and logistics follow city benchmarks.' },
  { canton: 'Schaffhausen (SH)', median: 'CHF 2,050', note: 'International manufacturing HQs top up with meal cards.' },
  { canton: 'Appenzell Ausserrhoden (AR)', median: 'CHF 1,900', note: 'Family-owned firms add transport or housing support.' },
  { canton: 'Appenzell Innerrhoden (AI)', median: 'CHF 1,850', note: 'Smaller cohort, lower living costs balance pay.' },
  { canton: 'St. Gallen (SG)', median: 'CHF 2,100', note: 'Fintech/textile innovation labs recruit from HSG & OST.' },
  { canton: 'Graubünden (GR)', median: 'CHF 1,850', note: 'Tourism and outdoor brands include seasonal benefits.' },
  { canton: 'Aargau (AG)', median: 'CHF 2,100', note: 'Energy and industrial automation pay competitive stipends.' },
  { canton: 'Thurgau (TG)', median: 'CHF 1,950', note: 'Agri-food & med-tech add commuting aid.' },
  { canton: 'Ticino (TI)', median: 'CHF 1,900', note: 'Cross-border firms blend Lombardy and Swiss benchmarks.' },
  { canton: 'Vaud (VD)', median: 'CHF 2,250', note: 'EPFL ecosystem and med-tech scale-ups drive demand.' },
  { canton: 'Valais (VS)', median: 'CHF 1,900', note: 'Energy & tourism include seasonal housing offers.' },
  { canton: 'Neuchâtel (NE)', median: 'CHF 2,000', note: 'Watchmaking and microtech provide steady pay.' },
  { canton: 'Geneva (GE)', median: 'CHF 2,350', note: 'International organisations add lunch/travel subsidies.' },
  { canton: 'Jura (JU)', median: 'CHF 1,850', note: 'Advanced manufacturing focuses on skill development bonuses.' },
];

const cvTemplates = [
  {
    id: 'europass',
    name: 'Europass Classic',
    url: 'https://europa.eu/europass/en/create-europass-cv',
    reason:
      'Standardised sections help recruiters compare profiles quickly; bilingual version ready for French/German submissions.',
  },
  {
    id: 'novoresume',
    name: 'Novorésumé Basic (Free)',
    url: 'https://novoresume.com/resume-templates',
    reason: 'Clean single-page layout praised by Swiss scale-ups for student and graduate applications.',
  },
  {
    id: 'google',
    name: 'Google Docs – Swiss Minimal',
    url: 'https://docs.google.com/document/d/1dxJ4SWI2Pa3uFY6uhAT0t5gE_zp0oGOPbsT_t-jSfo0/preview',
    reason: 'Recommended by ETH Career Center for tech roles; easy to copy and localise.',
  },
];

const cvWritingTips = [
  'Open with a three-line summary that states your target role, your strongest skills, and what you want to build next.',
  'Use bullet points that start with strong verbs and quantify results (e.g. “reduced onboarding time by 30%”).',
  'Keep a dedicated skills/tools block—founders and CTOs skim for stack alignment first.',
  'Add entrepreneurial signals: side projects, hackathons, venture labs, or leadership roles.',
  'Stick to one page until you have 3+ years experience; save the detail for the interview.',
];

const applicationStatuses = ['submitted', 'in_review', 'interviewing', 'offer', 'hired', 'rejected'];

const formatStatusKeyLabel = (statusKey) => {
  if (!statusKey || typeof statusKey !== 'string') {
    return '';
  }

  return statusKey
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const activeCityFilters = [
  {
    id: 'city-zurich',
    label: 'Zurich',
    labelKey: 'filters.activeCityOptions.zurich',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('zurich'),
  },
  {
    id: 'city-geneva',
    label: 'Geneva',
    labelKey: 'filters.activeCityOptions.geneva',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('geneva'),
  },
  {
    id: 'city-lausanne',
    label: 'Lausanne',
    labelKey: 'filters.activeCityOptions.lausanne',
    category: 'Active cities',
    test: (job) => job.location?.toLowerCase().includes('lausanne'),
  },
];

const roleFocusFilters = [
  {
    id: 'focus-engineering',
    label: 'Engineering',
    labelKey: 'filters.roleFocusOptions.engineering',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['react', 'ai/ml', 'python', 'backend'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-product',
    label: 'Product',
    labelKey: 'filters.roleFocusOptions.product',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['product', 'ux', 'research'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-growth',
    label: 'Growth',
    labelKey: 'filters.roleFocusOptions.growth',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['growth', 'marketing'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-climate',
    label: 'Climate',
    labelKey: 'filters.roleFocusOptions.climate',
    category: 'Role focus',
    test: (job) => job.stage?.toLowerCase().includes('climate') || job.tags?.some((tag) => tag.toLowerCase().includes('climate')),
  },
];

const quickFilters = [...activeCityFilters, ...roleFocusFilters];

const filterPredicates = quickFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.test;
  return acc;
}, {});

const normalizeLocationValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const isAllowedSwissLocation = (value) => {
  if (!value) {
    return false;
  }

  const normalized = normalizeLocationValue(value);
  if (ALLOWED_SWISS_LOCATIONS.has(normalized)) {
    return true;
  }

  // Allow values that include a known location keyword even if prefixed with descriptors (e.g., "Hybrid (Zurich)").
  return Array.from(ALLOWED_SWISS_LOCATIONS).some((candidate) => {
    return normalized.includes(candidate);
  });
};

const SALARY_MIN_FIELDS = [
  'salary_min',
  'salary_min_chf',
  'salary_minimum',
  'salary_range_min',
  'salary_lower',
  'salary_floor',
  'salary_low',
  'salary_from',
  'compensation_min',
  'pay_min',
];

const SALARY_MAX_FIELDS = [
  'salary_max',
  'salary_max_chf',
  'salary_maximum',
  'salary_range_max',
  'salary_upper',
  'salary_ceiling',
  'salary_high',
  'salary_to',
  'compensation_max',
  'pay_max',
];

const INTERNSHIP_DURATION_FIELDS = ['internship_duration_months', 'duration_months'];
const WEEKLY_HOURS_VALUE_FIELDS = ['weekly_hours_value', 'hours_per_week', 'hoursWeekly'];
const WEEKLY_HOURS_LABEL_FIELDS = ['weekly_hours', 'weekly_hours_label', 'hours_week', 'work_hours', 'weeklyHours'];

const EQUITY_MIN_FIELDS = [
  'equity_min',
  'equity_min_percentage',
  'equity_percentage',
  'equity_value',
  'equity_floor',
  'equity_low',
];
const EQUITY_MAX_FIELDS = [
  'equity_max',
  'equity_max_percentage',
  'equity_percentage',
  'equity_value',
  'equity_ceiling',
  'equity_high',
];
const WEEKLY_HOURS_FIELDS = [
  'weekly_hours_value',
  'weekly_hours',
  'weekly_hours_label',
  'hours_per_week',
  'work_hours',
  'hours_week',
  'hours',
  'hoursWeekly',
  'weeklyHours',
];

const SALARY_PERIOD_FIELDS = [
  'salary_period',
  'salary_interval',
  'salary_frequency',
  'salary_unit',
  'salary_timeframe',
  'salary_basis',
  'pay_period',
  'salary_cadence',
];

const SALARY_FALLBACK_RANGE = [2000, 12000];
const SALARY_STEP = 1;
const EQUITY_FALLBACK_RANGE = [0, 5];
const EQUITY_STEP = 0.01;
const FULL_TIME_WEEKLY_HOURS = 42;
const FULL_TIME_WORKING_DAYS = 5;
const WEEKS_PER_MONTH = 4.345;
const THIRTEENTH_MONTHS_PER_YEAR = 13;
const SALARY_MINIMUMS_BY_CADENCE = {
  hour: 10,
  week: 100,
  month: 1000,
  year: 10000,
};
const SALARY_PLACEHOLDER_BY_CADENCE = {
  hour: '10',
  week: '100',
  month: '1000',
  year: '10000',
};
const SALARY_FILTER_HELPERS = {
  hour: 'CHF hourly',
  week: 'CHF weekly',
  month: 'CHF monthly (default)',
  year: 'CHF yearly / total',
};
const SALARY_FILTER_CADENCE_OPTIONS = [
  { value: 'hour', label: 'Hourly' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly / total' },
];

const SALARY_CADENCE_OPTIONS = SALARY_FILTER_CADENCE_OPTIONS;

const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'tex'];

const SALARY_CALCULATOR_PANEL_ID = 'ssc-salary-calculator';
const SALARY_CALCULATOR_TRANSITION_MS = 250;

const THIRTEENTH_SALARY_PATTERN = /\b(?:13(?:th)?|thirteenth)\b/i;

const parseExplicitBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return null;
    }
    if (value > 0) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }
  }

  return null;
};

const textMentionsThirteenthSalary = (value) =>
  typeof value === 'string' && THIRTEENTH_SALARY_PATTERN.test(value);

const listMentionsThirteenthSalary = (list) =>
  Array.isArray(list) && list.some((item) => textMentionsThirteenthSalary(item));

const inferThirteenthSalary = (job) => {
  if (!job) {
    return false;
  }

  const explicitHasThirteenth = parseExplicitBoolean(job.has_thirteenth_salary);
  if (explicitHasThirteenth != null) {
    return explicitHasThirteenth;
  }

  const explicitIncludesThirteenth = parseExplicitBoolean(job.includes_thirteenth_salary);
  if (explicitIncludesThirteenth != null) {
    return explicitIncludesThirteenth;
  }

  const textSources = [
    job.salary,
    job.salary_note,
    job.compensation_note,
    job.compensation_details,
    job.description,
  ];

  if (textSources.some((value) => textMentionsThirteenthSalary(value))) {
    return true;
  }

  const listSources = [job.benefits, job.perks, job.compensation_breakdown];
  return listSources.some((value) => listMentionsThirteenthSalary(value));
};

const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
};

const getFileNameFromUrl = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    const withoutQuery = trimmed.split('?')[0];
    const segments = withoutQuery.split('/').filter(Boolean);
    if (!segments.length) {
      return '';
    }

    const lastSegment = segments[segments.length - 1];
    return decodeURIComponent(lastSegment);
  } catch (error) {
    console.error('Failed to derive file name from URL', error);
    return '';
  }
};

const isAllowedDocumentFile = (file) => {
  if (!file) return false;
  const extension = getFileExtension(file.name);
  return DOCUMENT_EXTENSIONS.includes(extension);
};

const SALARY_CADENCE_LABELS = {
  hour: 'hourly',
  hourly: 'hourly',
  week: 'weekly',
  weekly: 'weekly',
  month: 'monthly',
  monthly: 'monthly',
  year: 'yearly',
  yearly: 'yearly',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getStepFactor = (step) => {
  if (!Number.isFinite(step) || step <= 0) {
    return 1;
  }
  return Math.pow(10, Math.max(0, Math.ceil(-Math.log10(step))));
};

const alignToStep = (value, step, strategy) => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return value;
  }
  const factor = getStepFactor(step);
  const scaled = strategy(value / step);
  const rounded = Math.round(scaled * step * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const roundToStep = (value, step) => alignToStep(value, step, Math.round);

const roundDownToStep = (value, step) => alignToStep(value, step, Math.floor);

const roundUpToStep = (value, step) => alignToStep(value, step, Math.ceil);

const formatSalaryDisplayValue = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (value >= 1000) {
    const shortened = value / 1000;
    const precision = shortened >= 10 ? 0 : shortened >= 1 ? 1 : 2;
    const formatted = shortened.toFixed(precision).replace(/\.0+$/, '');
    return `${formatted}k`;
  }

  return String(Math.round(value));
};

const formatEquityValue = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d+?)0+$/, '$1');
};

const formatEquityDisplay = (min, max) => {
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    if (Number.isFinite(min) || Number.isFinite(max)) {
      const value = formatEquityValue(min ?? max ?? 0);
      return value ? `${value}% equity` : 'Equity available';
    }
    return 'No equity disclosed';
  }

  const formattedMin = hasMin ? formatEquityValue(min) : null;
  const formattedMax = hasMax ? formatEquityValue(max) : null;

  if (formattedMin && formattedMax) {
    if (formattedMin === formattedMax) {
      return `${formattedMin}% equity`;
    }
    return `${formattedMin}% – ${formattedMax}% equity`;
  }

  const single = formattedMin || formattedMax;
  return single ? `${single}% equity` : 'Equity available';
};

const sanitizeDecimalInput = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const cleaned = value.replace(/[^0-9.,]/g, '');
  const separatorIndex = cleaned.search(/[.,]/);

  if (separatorIndex === -1) {
    return cleaned;
  }

  const before = cleaned.slice(0, separatorIndex + 1);
  const after = cleaned
    .slice(separatorIndex + 1)
    .replace(/[.,]/g, '');

  return `${before}${after}`;
};

const parseDurationMonths = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }

  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (!match) {
      return null;
    }
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

const formatDurationLabel = (months) => {
  if (!Number.isFinite(months) || months <= 0) {
    return '';
  }
  const rounded = Math.round(months);
  const unit = rounded === 1 ? 'month' : 'months';
  return `${rounded} ${unit}`;
};

const buildTimingText = (job) => {
  if (!job) {
    return '';
  }

  const segments = [
    job.employment_type,
    job.internship_duration_label || job.duration_label,
    job.weekly_hours_label,
  ].filter(Boolean);

  const withPosted = [...segments, job.posted].filter(Boolean);
  return withPosted.join(' • ');
};

const formatCalculatorCurrency = (value, cadence) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (cadence === 'hour') {
    const rounded = Math.round(value * 100) / 100;
    return rounded
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1');
  }

  return formatSalaryDisplayValue(value) ?? `${Math.round(value)}`;
};

const parseNumericValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }

  let numeric = Number.parseFloat(match[0].replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (trimmed.includes('m')) {
    numeric *= 1_000_000;
  } else if (trimmed.includes('k')) {
    numeric *= 1_000;
  }

  return numeric;
};

const parsePercentageValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

const parseWeeklyHoursValue = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const formatWeeklyHoursLabel = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${rounded}h/week`;
};

const resolveWeeklyHours = (value) => {
  return Number.isFinite(value) && value > 0 ? value : FULL_TIME_WEEKLY_HOURS;
};

const getWeeklyHoursMeta = (job) => {
  if (!job) {
    return { value: null, label: '' };
  }

  if (Number.isFinite(job.weekly_hours_value) && job.weekly_hours_value > 0) {
    return {
      value: job.weekly_hours_value,
      label: formatWeeklyHoursLabel(job.weekly_hours_value),
    };
  }

  for (const field of WEEKLY_HOURS_FIELDS) {
    const raw = job?.[field];
    if (raw == null) {
      continue;
    }

    const parsed = parseWeeklyHoursValue(raw);
    if (Number.isFinite(parsed)) {
      return {
        value: parsed,
        label: formatWeeklyHoursLabel(parsed),
      };
    }

    if (typeof raw === 'string' && raw.trim()) {
      return {
        value: null,
        label: raw.trim(),
      };
    }
  }

  return { value: null, label: '' };
};

const detectSalaryPeriod = (job, salaryText) => {
  const baseText = [
    salaryText ?? '',
    ...SALARY_PERIOD_FIELDS.map((field) => job?.[field] ?? ''),
  ]
    .join(' ')
    .toLowerCase();

  if (baseText.includes('monthly')) return 'month';
  if (baseText.includes('weekly')) return 'week';
  if (baseText.includes('yearly')) return 'year';
  if (baseText.includes('hourly')) return 'hour';
  if (baseText.includes('month')) return 'month';
  if (baseText.includes('week')) return 'week';
  if (baseText.includes('day')) return 'day';
  if (baseText.includes('hour')) return 'hour';
  if (baseText.includes('year') || baseText.includes('annual') || baseText.includes('annum')) return 'year';
  return null;
};

const normalizeSalaryCadence = (value) => {
  if (!value) {
    return null;
  }

  const lowered = String(value).toLowerCase();

  if (lowered.includes('hour')) return 'hour';
  if (lowered.includes('week')) return 'week';
  if (lowered.includes('month')) return 'month';
  if (lowered.includes('year') || lowered.includes('annual')) return 'year';
  return null;
};

const convertCadenceValueToMonthly = (value, cadence, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = normalizeSalaryCadence(cadence);
  const lowered = cadence ? String(cadence).toLowerCase() : '';
  const hoursPerWeek = resolveWeeklyHours(weeklyHours);

  if (!normalized && lowered.includes('day')) {
    return value * FULL_TIME_WORKING_DAYS * WEEKS_PER_MONTH;
  }

  switch (normalized) {
    case 'hour':
      return value * hoursPerWeek * WEEKS_PER_MONTH;
    case 'week':
      return value * WEEKS_PER_MONTH;
    case 'year':
      return value / THIRTEENTH_MONTHS_PER_YEAR;
    case 'month':
    default:
      return value;
  }
};

const convertMonthlyValueToCadence = (value, cadence, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = normalizeSalaryCadence(cadence);
  const lowered = cadence ? String(cadence).toLowerCase() : '';
  const hoursPerWeek = resolveWeeklyHours(weeklyHours);

  if (!normalized && lowered.includes('day')) {
    return value / (FULL_TIME_WORKING_DAYS * WEEKS_PER_MONTH);
  }

  switch (normalized) {
    case 'hour':
      return value / (hoursPerWeek * WEEKS_PER_MONTH);
    case 'week':
      return value / WEEKS_PER_MONTH;
    case 'year':
      return value * THIRTEENTH_MONTHS_PER_YEAR;
    case 'month':
    default:
      return value;
  }
};

const formatSalaryValue = (value, cadence = 'month', weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const converted = convertMonthlyValueToCadence(value, cadence, weeklyHours);

  if (!Number.isFinite(converted)) {
    return '';
  }

  const decimals = normalizeSalaryCadence(cadence) === 'hour' ? 2 : 0;
  const formatted = converted.toFixed(decimals);
  return formatted.replace(/\.00$/, '').replace(/(\.\d*?)0+$/, '$1');
};

const formatSalaryDisplay = (min, max, cadence, fallbackText = '') => {
  const formattedMin = formatSalaryDisplayValue(min);
  const formattedMax = formatSalaryDisplayValue(max);
  const cadenceKey = normalizeSalaryCadence(cadence);
  const cadenceLabel = cadenceKey ? SALARY_CADENCE_LABELS[cadenceKey] : null;

  if (!formattedMin && !formattedMax) {
    const fallback = fallbackText.trim();
    return fallback || 'Compensation undisclosed';
  }

  let range = formattedMin || formattedMax || '';

  if (formattedMin && formattedMax) {
    range = formattedMin === formattedMax ? formattedMin : `${formattedMin} – ${formattedMax}`;
  }

  const cadenceSuffix = cadenceLabel ? ` · ${cadenceLabel}` : '';
  return `${range} CHF${cadenceSuffix}`.trim();
};

const formatRangeLabel = (min, max, suffix) => {
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (!hasMin && !hasMax) {
    return '';
  }

  const formattedMin = hasMin ? formatSalaryDisplayValue(min) : null;
  const formattedMax = hasMax ? formatSalaryDisplayValue(max) : null;

  if (formattedMin && formattedMax) {
    const range = formattedMin === formattedMax ? formattedMin : `${formattedMin} – ${formattedMax}`;
    return `${range} ${suffix}`;
  }

  const single = formattedMin || formattedMax;
  return single ? `${single} ${suffix}` : '';
};

const composeSalaryDisplay = ({ baseMin, baseMax, cadence, fallbackText = '' }) => {
  const cadenceKey = normalizeSalaryCadence(cadence);
  const hasBase = Number.isFinite(baseMin) || Number.isFinite(baseMax);

  if (!hasBase) {
    const fallback = fallbackText?.trim();
    return fallback || 'Compensation undisclosed';
  }

  return formatSalaryDisplay(baseMin, baseMax, cadenceKey, fallbackText);
};

const convertToMonthly = (value, period, salaryText, weeklyHours = FULL_TIME_WEEKLY_HOURS) => {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  let resolvedPeriod = period;
  if (!resolvedPeriod) {
    const reference = salaryText?.toLowerCase() ?? '';
    if (reference.includes('per month') || reference.includes('/ month')) {
      resolvedPeriod = 'month';
    } else if (reference.includes('per week') || reference.includes('/ week')) {
      resolvedPeriod = 'week';
    } else if (reference.includes('per day') || reference.includes('/ day')) {
      resolvedPeriod = 'day';
    } else if (reference.includes('per hour') || reference.includes('/ hour')) {
      resolvedPeriod = 'hour';
    } else if (value > 20000) {
      resolvedPeriod = 'year';
    } else {
      resolvedPeriod = 'month';
    }
  }

  const converted = convertCadenceValueToMonthly(value, resolvedPeriod, weeklyHours);
  return Number.isFinite(converted) ? converted : value;
};

const computeSalaryRange = (job) => {
  const salaryText = job?.salary ?? '';
  const period = detectSalaryPeriod(job, salaryText);
  const { value: weeklyHoursValue } = getWeeklyHoursMeta(job);
  const hoursForConversion = resolveWeeklyHours(weeklyHoursValue);

  const minCandidate = SALARY_MIN_FIELDS.map((field) => parseNumericValue(job?.[field]))
    .find((value) => value != null);
  const maxCandidate = SALARY_MAX_FIELDS.map((field) => parseNumericValue(job?.[field]))
    .find((value) => value != null);

  const directValues = [minCandidate, maxCandidate]
    .filter((value) => value != null)
    .map((value) => convertToMonthly(value, period, salaryText, hoursForConversion))
    .filter((value) => Number.isFinite(value));

  const parsedFromString = Array.from(
    String(salaryText)
      .toLowerCase()
      .matchAll(/(\d+(?:[.,]\d+)?)\s*(k|m)?/g)
  )
    .map((match) => {
      let numeric = Number.parseFloat(match[1].replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        return null;
      }
      if (match[2] === 'm') numeric *= 1_000_000;
      if (match[2] === 'k') numeric *= 1_000;
      return convertToMonthly(numeric, period, salaryText, hoursForConversion);
    })
    .filter((value) => Number.isFinite(value));

  const values = [...directValues, ...parsedFromString].filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return [null, null];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [Math.round(min), Math.round(max)];
};

const detectMissingColumn = (message, tableName = '') => {
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

const deriveColumnPresence = (records) => {
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

const deriveSalaryBoundsFromJobs = (jobs) => {
  let min = Infinity;
  let max = 0;

  jobs.forEach((job) => {
    const baseMin = Number.isFinite(job.salary_min_value) ? job.salary_min_value : null;
    const baseMax = Number.isFinite(job.salary_max_value) ? job.salary_max_value : null;
    let jobMin = baseMin;
    let jobMax = baseMax;

    if (jobMin == null || jobMax == null) {
      const [derivedMin, derivedMax] = computeSalaryRange(job);
      if (jobMin == null) jobMin = derivedMin;
      if (jobMax == null) jobMax = derivedMax;
    }

    if (Number.isFinite(jobMin)) {
      min = Math.min(min, jobMin);
    }
    if (Number.isFinite(jobMax)) {
      max = Math.max(max, jobMax);
    }
  });

  if (!Number.isFinite(min) || !Number.isFinite(max) || min === Infinity || max === 0) {
    return [...SALARY_FALLBACK_RANGE];
  }

  if (min === max) {
    const buffer = Math.max(min * 0.2, 500);
    return [Math.max(0, Math.floor(min - buffer)), Math.ceil(max + buffer)];
  }

  return [Math.floor(min), Math.ceil(max)];
};

const computeEquityRange = (job) => {
  const equityText = job?.equity ?? '';

  const minCandidate = EQUITY_MIN_FIELDS.map((field) => parsePercentageValue(job?.[field]))
    .find((value) => value != null);
  const maxCandidate = EQUITY_MAX_FIELDS.map((field) => parsePercentageValue(job?.[field]))
    .find((value) => value != null);

  const parsedFromString = Array.from(String(equityText).toLowerCase().matchAll(/(\d+(?:[.,]\d+)?)\s*%?/g))
    .map((match) => Number.parseFloat(match[1].replace(',', '.')))
    .filter((value) => Number.isFinite(value));

  const values = [minCandidate, maxCandidate, ...parsedFromString]
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (values.length === 0) {
    return [null, null];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [roundToStep(min, EQUITY_STEP), roundToStep(max, EQUITY_STEP)];
};

const deriveEquityBoundsFromJobs = (jobs) => {
  let min = Infinity;
  let max = 0;

  jobs.forEach((job) => {
    const baseMin = Number.isFinite(job.equity_min_value) ? job.equity_min_value : null;
    const baseMax = Number.isFinite(job.equity_max_value) ? job.equity_max_value : null;
    let jobMin = baseMin;
    let jobMax = baseMax;

    if (jobMin == null || jobMax == null) {
      const [derivedMin, derivedMax] = computeEquityRange(job);
      if (jobMin == null) jobMin = derivedMin;
      if (jobMax == null) jobMax = derivedMax;
    }

    if (Number.isFinite(jobMin)) {
      min = Math.min(min, jobMin);
    }
    if (Number.isFinite(jobMax)) {
      max = Math.max(max, jobMax);
    }
  });

  if (!Number.isFinite(min) || !Number.isFinite(max) || min === Infinity) {
    return [...EQUITY_FALLBACK_RANGE];
  }

  const lowerBound = Math.max(0, Math.min(min, 0));
  const upperBound = Math.max(max, lowerBound);

  if (lowerBound === upperBound) {
    const buffer = Math.max(upperBound * 0.4, 0.2);
    const lower = Math.max(0, upperBound - buffer);
    const upper = upperBound + buffer;
    return [roundDownToStep(lower, EQUITY_STEP), roundUpToStep(upper, EQUITY_STEP)];
  }

  return [roundDownToStep(lowerBound, EQUITY_STEP), roundUpToStep(upperBound, EQUITY_STEP)];
};


const mapSupabaseUser = (supabaseUser) => {
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

const SwissStartupConnect = () => {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [loadedTranslations, setLoadedTranslations] = useState(() => {
    const initial = {};
    translationCache.forEach((value, key) => {
      initial[key] = value;
    });
    return initial;
  });

  useEffect(() => {
    let cancelled = false;

    if (language === 'en') {
      return () => {
        cancelled = true;
      };
    }

    const cached = translationCache.get(language);
    if (cached) {
      setLoadedTranslations((previous) => {
        if (previous[language]) {
          return previous;
        }
        return { ...previous, [language]: cached };
      });
      return () => {
        cancelled = true;
      };
    }

    loadTranslationsForLanguage(language)
      .then((dictionary) => {
        if (cancelled || !dictionary) {
          return;
        }
        setLoadedTranslations((previous) => ({ ...previous, [language]: dictionary }));
      })
      .catch((error) => {
        console.error(`Failed to resolve ${language} translations`, error);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);
  const translate = useCallback(
    (key, fallback = '', replacements) => {
      const apply = (template) => {
        const base = template || fallback || key;
        return applyReplacements(base, replacements);
      };

      if (language === 'en') {
        return apply(fallback);
      }

      const dictionary = loadedTranslations[language];
      if (!dictionary) {
        return apply(fallback);
      }

      const segments = key.split('.');
      let current = dictionary;
      for (const segment of segments) {
        if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
          current = current[segment];
        } else {
          current = null;
          break;
        }
      }

      if (typeof current === 'string') {
        return apply(current);
      }

      if (Array.isArray(current)) {
        return current.map((item) => apply(typeof item === 'string' ? item : ''));
      }

      return apply(fallback);
    },
    [language, loadedTranslations]
  );

  const getLocalizedJobText = useCallback(
    (job, field) => {
      if (!job) {
        return '';
      }

      if (language !== 'en') {
        const localized = job?.translations?.[language]?.[field];
        if (typeof localized === 'string' && localized.trim()) {
          return localized;
        }
      }

      const original = job?.[field];
      return typeof original === 'string' ? original : '';
    },
    [language]
  );

  const getLocalizedJobList = useCallback(
    (job, field) => {
      if (!job) {
        return [];
      }

      if (language !== 'en') {
        const localized = job?.translations?.[language]?.[field];
        if (Array.isArray(localized) && localized.length > 0) {
          return localized;
        }
      }

      const original = job?.[field];
      if (Array.isArray(original)) {
        return original;
      }
      if (typeof original === 'string' && original.trim()) {
        return [original];
      }
      return [];
    },
    [language]
  );

  const getLocalizedCompanyText = useCallback(
    (company, field) => {
      if (!company) {
        return '';
      }

      if (language !== 'en') {
        const localized = company?.translations?.[language]?.[field];
        if (typeof localized === 'string' && localized.trim()) {
          return localized;
        }
      }

      const original = company?.[field];
      return typeof original === 'string' ? original : '';
    },
    [language]
  );

  const getJobLanguages = useCallback(
    (job) => {
      if (!job) {
        return [];
      }

      if (job.language_labels && typeof job.language_labels === 'object') {
        const localized = job.language_labels[language];
        if (Array.isArray(localized) && localized.length > 0) {
          return localized;
        }
        if (Array.isArray(job.language_labels.en) && job.language_labels.en.length > 0) {
          return job.language_labels.en;
        }
      }

      const resolved = resolveJobLanguageLabels(job);
      return resolved.labels[language] || resolved.labels.en || [];
    },
    [language]
  );

  const acknowledgeMessage = translate(
    'applications.acknowledge',
    'By applying you agree that the startup will see your profile information, uploaded CV, motivational letter, and profile photo.'
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('ssc_language', language);
  }, [language]);

  const [theme, setTheme] = useState(getInitialTheme);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [isDarkMode, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  }, []);

  const buildPluralSuffix = useCallback(
    (count, overrides = {}) => {
      const defaults = {
        en: ['', 's'],
        fr: ['', 's'],
        de: ['', 'n'],
      };
      const mapping = { ...defaults, ...overrides };
      const [singular, plural] = mapping[language] || mapping.en;
      return count === 1 ? singular : plural;
    },
    [language]
  );

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [activeTab, setActiveTab] = useState('general');
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

  const handleBrandClick = useCallback(() => {
    setActiveTab('general');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [setActiveTab]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (activeTab !== 'general') {
      setHasScrolledPastHero(false);
      return undefined;
    }

    const handleScroll = () => {
      const shouldHide = window.scrollY > 80;
      setHasScrolledPastHero((previous) => (previous === shouldHide ? previous : shouldHide));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [salaryRange, setSalaryRange] = useState(() => [...SALARY_FALLBACK_RANGE]);
  const [salaryBounds, setSalaryBounds] = useState(() => [...SALARY_FALLBACK_RANGE]);
  const [salaryRangeDirty, setSalaryRangeDirty] = useState(false);
  const [salaryFilterCadence, setSalaryFilterCadence] = useState('month');
  const [salaryInputValues, setSalaryInputValues] = useState(() => ({
    min: formatSalaryValue(SALARY_FALLBACK_RANGE[0], 'month'),
    max: formatSalaryValue(SALARY_FALLBACK_RANGE[1], 'month'),
  }));
  const [equityRange, setEquityRange] = useState(() => [...EQUITY_FALLBACK_RANGE]);
  const [equityBounds, setEquityBounds] = useState(() => [...EQUITY_FALLBACK_RANGE]);
  const [equityRangeDirty, setEquityRangeDirty] = useState(false);
  const [equityInputValues, setEquityInputValues] = useState(() => ({
    min: formatEquityValue(EQUITY_FALLBACK_RANGE[0]),
    max: formatEquityValue(EQUITY_FALLBACK_RANGE[1]),
  }));

  const localizedCvTips = useMemo(() => {
    const translated = translate('modals.cv.tips', '');
    if (Array.isArray(translated) && translated.length > 0) {
      return translated;
    }
    return cvWritingTips.map((tip, index) => translate(`modals.cv.tips.${index}`, tip));
  }, [translate]);

  const [salaryMin, salaryMax] = salaryRange;
  const [equityMin, equityMax] = equityRange;

  const [jobs, setJobs] = useState([]);
  const [jobColumnPresence, setJobColumnPresence] = useState({});
  const [applicationColumnPresence, setApplicationColumnPresence] = useState({});
  const [jobsLoading, setJobsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyProfile, setActiveCompanyProfile] = useState(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyCatalog, setCompanyCatalog] = useState([]);
  const [companyCatalogById, setCompanyCatalogById] = useState({});
  const fallbackJobsRef = useRef([]);
  const fallbackCompaniesRef = useRef([]);
  const fallbackEventsRef = useRef([]);
  const upsertCompanyFromStartup = useCallback(
    (startupRecord) => {
      const mapped = mapStartupToCompany(startupRecord);
      if (!mapped || !mapped.name) {
        return;
      }

      const idKey = mapped.id != null ? String(mapped.id) : '';
      const nameKey = mapped.name ? mapped.name.trim().toLowerCase() : '';

      setCompanies((previous) => {
        let replaced = false;
        const next = previous.map((company) => {
          const companyIdKey = company?.id != null ? String(company.id) : '';
          const companyNameKey =
            typeof company?.name === 'string' ? company.name.trim().toLowerCase() : '';
          if ((idKey && companyIdKey === idKey) || (nameKey && companyNameKey === nameKey)) {
            replaced = true;
            return { ...company, ...mapped };
          }
          return company;
        });

        if (!replaced) {
          next.push(mapped);
        }

        return next;
      });
    },
    [setCompanies]
  );
  const [jobSort, setJobSort] = useState('recent');
  const jobSortOptions = useMemo(
    () => [
      { value: 'recent', label: translate('jobs.sort.recent', 'Most recent'), icon: Clock },
      { value: 'salary_desc', label: translate('jobs.sort.salary', 'Highest salary'), icon: TrendingUp },
      { value: 'equity_desc', label: translate('jobs.sort.equity', 'Highest equity'), icon: Percent },
    ],
    [translate]
  );

  const [savedJobs, setSavedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = window.localStorage.getItem('ssc_saved_jobs');
      const parsed = stored ? JSON.parse(stored) : [];
      return sanitizeIdArray(parsed);
    } catch (error) {
      console.error('Failed to parse saved jobs', error);
      return [];
    }
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapFocusJobId, setMapFocusJobId] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    university: '',
    program: '',
    experience: '',
    bio: '',
    portfolio_url: '',
    cv_url: '',
    cv_file_name: '',
    avatar_url: '',
    cv_public: false,
  });
  const [user, setUser] = useState(null);
  const userDisplayName = useMemo(() => {
    const profileName = profileForm.full_name?.trim?.();
    if (profileName) {
      return profileName;
    }

    const storedProfileName = profile?.full_name?.trim?.();
    if (storedProfileName) {
      return storedProfileName;
    }

    if (user?.name?.trim?.()) {
      return user.name.trim();
    }

    return user ? translate('accountMenu.memberFallback', 'Member') : '';
  }, [profileForm.full_name, profile?.full_name, user, translate]);
  const userInitial = useMemo(() => (userDisplayName ? userDisplayName.charAt(0).toUpperCase() : ''), [userDisplayName]);
  const userAvatarUrl = useMemo(() => {
    if (profileForm.avatar_url?.trim?.()) {
      return profileForm.avatar_url.trim();
    }
    if (profile?.avatar_url?.trim?.()) {
      return profile.avatar_url.trim();
    }
    if (user?.avatar_url?.trim?.()) {
      return user.avatar_url.trim();
    }
    return '';
  }, [profileForm.avatar_url, profile?.avatar_url, user?.avatar_url]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', type: 'student' });
  const [appliedJobs, setAppliedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('ssc_applied_jobs');
      return sanitizeIdArray(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Failed to parse applied jobs', error);
      return [];
    }
  });
  const appliedJobSet = useMemo(() => {
    const entries = new Set();
    appliedJobs.forEach((id) => {
      const key = getJobIdKey(id);
      if (key) {
        entries.add(key);
      }
    });
    return entries;
  }, [appliedJobs]);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);
  const [profileColumnPresence, setProfileColumnPresence] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [startupProfile, setStartupProfile] = useState(null);
  const [startupModalOpen, setStartupModalOpen] = useState(false);
  const [startupForm, setStartupForm] = useState({
    name: '',
    registry_number: '',
    description: '',
    website: '',
    logo_url: '',
    verification_status: 'unverified',
    verification_note: '',
    team_size: '',
    fundraising: '',
    info_link: '',
  });
  const [startupColumnPresence, setStartupColumnPresence] = useState({});
  const [startupSaving, setStartupSaving] = useState(false);

  const [resourceModal, setResourceModal] = useState(null);
  const [reviewsModal, setReviewsModal] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [canReview, setCanReview] = useState(false);

  const [applicationModal, setApplicationModal] = useState(null);
  const lastUploadedCvRef = useRef('');
  const cvFileInputRef = useRef(null);
  const [cvLocalName, setCvLocalName] = useState('');
  const [cvUploadState, setCvUploadState] = useState('idle');
  const [cvUploadError, setCvUploadError] = useState('');
  const [acknowledgeShare, setAcknowledgeShare] = useState(false);
  const [motivationalLetterUrl, setMotivationalLetterUrl] = useState('');
  const [motivationalLetterName, setMotivationalLetterName] = useState('');
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [applicationCvUrl, setApplicationCvUrl] = useState('');
  const [applicationCvName, setApplicationCvName] = useState('');
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationStatusUpdating, setApplicationStatusUpdating] = useState(null);
  const [applicationsVersion, setApplicationsVersion] = useState(0);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [applicationThreads, setApplicationThreads] = useState(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const stored = window.localStorage.getItem(APPLICATION_THREAD_STORAGE_KEY);
      if (!stored) {
        return {};
      }
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }
      const normalised = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!key) {
          return;
        }
        normalised[key] = normalizeThreadStateValue(value);
      });
      return normalised;
    } catch (error) {
      console.error('Failed to parse application threads', error);
      return {};
    }
  });
  const [applicationThreadDrafts, setApplicationThreadDrafts] = useState({});
  const [applicationThreadTypeDrafts, setApplicationThreadTypeDrafts] = useState({});
  const [applicationThreadScheduleDrafts, setApplicationThreadScheduleDrafts] = useState({});
  const [applicationThreadErrors, setApplicationThreadErrors] = useState({});
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetSaving, setPasswordResetSaving] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    street_address: '',
    city: '',
    postal_code: '',
    event_date: '',
    event_time: '',
    poster_url: '',
    poster_file: null,
  });
  const [eventFormSaving, setEventFormSaving] = useState(false);
  const sortEventsBySchedule = useCallback(sortEventsByScheduleStatic, []);

  const localizedSelectedJob = useMemo(() => {
    if (!selectedJob) {
      return null;
    }

    return {
      ...selectedJob,
      localizedTitle: getLocalizedJobText(selectedJob, 'title'),
      localizedDescription: getLocalizedJobText(selectedJob, 'description'),
      localizedRequirements: getLocalizedJobList(selectedJob, 'requirements'),
      localizedBenefits: getLocalizedJobList(selectedJob, 'benefits'),
      localizedLanguages: getJobLanguages(selectedJob),
    };
  }, [selectedJob, getJobLanguages, getLocalizedJobList, getLocalizedJobText]);
  const selectedJobIdKey = getJobIdKey(selectedJob?.id);
  const selectedJobApplied = selectedJobIdKey ? appliedJobSet.has(selectedJobIdKey) : false;
  const selectedJobArrangementLabel = buildWorkArrangementLabel(translate, selectedJob?.work_arrangement);

  const localizedApplicationModal = useMemo(() => {
    if (!applicationModal) {
      return null;
    }

    return {
      ...applicationModal,
      localizedTitle: getLocalizedJobText(applicationModal, 'title'),
      localizedDescription: getLocalizedJobText(applicationModal, 'description'),
      localizedLanguages: getJobLanguages(applicationModal),
    };
  }, [applicationModal, getJobLanguages, getLocalizedJobText]);
  const getApplicationThreadKey = useCallback((application) => {
    if (!application) {
      return '';
    }

    const jobIdentifier = application.job_id ?? application?.jobs?.id;
    const profileIdentifier = application.profile_id ?? application?.profiles?.id;

    if (!jobIdentifier || !profileIdentifier) {
      return '';
    }

    return normalizeApplicationKey(jobIdentifier, profileIdentifier);
  }, []);

  const buildThreadMetaFromApplication = useCallback(
    (application) => {
      if (!application) {
        return null;
      }

      const job = application.jobs || {};
      const candidate = application.profiles || {};
      const jobId = job.id ?? application.job_id ?? '';
      const profileId = candidate.id ?? application.profile_id ?? '';

      if (!jobId && !profileId) {
        return null;
      }

      const jobTitle = getLocalizedJobText(job, 'title') || job.title || '';
      const companyName = job.company_name || '';
      const startupId = job.startup_id ?? application.startup_id ?? '';

      return {
        jobId,
        profileId,
        jobTitle,
        companyName,
        startupId,
      };
    },
    [getLocalizedJobText]
  );
  const studentInboxThreads = useMemo(() => {
    if (!user || user.type !== 'student') {
      return [];
    }

    const profileIdentifier = profile?.id || profileForm?.id || user?.id;
    const profileKey = getJobIdKey(profileIdentifier);
    if (!profileKey) {
      return [];
    }

    const threads = [];

    Object.entries(applicationThreads).forEach(([key, value]) => {
      const { entries, meta } = normalizeThreadStateValue(value);
      const { jobId, profileId } = parseThreadKey(key);
      const resolvedProfileId = getJobIdKey(meta?.profileId || profileId);

      if (!resolvedProfileId || resolvedProfileId !== profileKey) {
        return;
      }

      const resolvedJobId = getJobIdKey(meta?.jobId || jobId);
      let jobTitle = meta?.jobTitle || '';
      let companyName = meta?.companyName || '';

      if (resolvedJobId) {
        const jobMatch = jobs.find((job) => getJobIdKey(job.id) === resolvedJobId);
        if (jobMatch) {
          jobTitle = jobTitle || getLocalizedJobText(jobMatch, 'title') || jobMatch.title || '';
          companyName = companyName || jobMatch.company_name || '';
        }
      }

      const sortedEntries = [...entries].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      });

      const employerHasMessaged = sortedEntries.some(
        (entry) => (entry.author || 'startup') === 'startup'
      );
      const latestEntry = sortedEntries[sortedEntries.length - 1];
      const lastTime = latestEntry ? new Date(latestEntry.createdAt).getTime() : 0;

      threads.push({
        key,
        entries: sortedEntries,
        meta: {
          jobId: resolvedJobId,
          profileId: resolvedProfileId,
          jobTitle,
          companyName,
        },
        employerHasMessaged,
        lastTime,
      });
    });

    return threads.sort((a, b) => b.lastTime - a.lastTime);
  }, [applicationThreads, user, profile?.id, profileForm?.id, jobs, getLocalizedJobText]);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityOldPassword, setSecurityOldPassword] = useState('');
  const [securityNewPassword, setSecurityNewPassword] = useState('');
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState('');
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityEmail, setSecurityEmail] = useState('');
  const [securityEmailSaving, setSecurityEmailSaving] = useState(false);
  const [securityEmailMessage, setSecurityEmailMessage] = useState('');

  const [registerConfirm, setRegisterConfirm] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  const [jobsVersion, setJobsVersion] = useState(0);
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [postJobError, setPostJobError] = useState('');
  const [jobForm, setJobForm] = useState({
    title: '',
    location: '',
    work_arrangement: '',
    employment_type: 'Full-time',
    weekly_hours: '',
    internship_duration_months: '',
    salary_min: '',
    salary_max: '',
    salary_cadence: '',
    salary_is_bracket: false,
    language_requirements: [],
    equity: '',
    description: '',
    requirements: '',
    benefits: '',
    tags: '',
    motivational_letter_required: false,
  });
  const [salaryCalculatorOpen, setSalaryCalculatorOpen] = useState(false);
  const [salaryCalculatorRevealed, setSalaryCalculatorRevealed] = useState(false);
  const [salaryCalculatorCompany, setSalaryCalculatorCompany] = useState('');
  const [salaryCalculatorJobId, setSalaryCalculatorJobId] = useState('');
  const [salaryCalculatorPanelVisible, setSalaryCalculatorPanelVisible] = useState(false);

  const clearFeedback = useCallback(() => setFeedback(null), []);
  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);
  const handleToggleApplicationRow = useCallback((applicationId) => {
    setExpandedApplicationId((previous) => (previous === applicationId ? null : applicationId));
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(clearFeedback, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, clearFeedback]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!expandedApplicationId) {
      return;
    }

    const match = applications.some((application) => application.id === expandedApplicationId);
    if (!match) {
      setExpandedApplicationId(null);
    }
  }, [applications, expandedApplicationId]);

  useEffect(() => {
    if (user?.type !== 'student') {
      return;
    }

    const pendingCv = lastUploadedCvRef.current?.trim?.();
    if (!pendingCv) {
      return;
    }

    const currentFormCv = profileForm.cv_url?.trim?.();
    if (currentFormCv) {
      return;
    }

    setProfileForm((previous) => {
      const previousCv = previous.cv_url?.trim?.();
      if (previousCv) {
        return previous;
      }

      return { ...previous, cv_url: pendingCv };
    });
    setUseExistingCv(true);
  }, [profileForm.cv_url, user?.type]);

  useEffect(() => {
    setCvLocalName(profileForm.cv_file_name || '');
  }, [profileForm.cv_file_name]);

  useEffect(() => {
    if (!profileForm.cv_url) {
      setCvUploadState('idle');
    }
  }, [profileForm.cv_url]);

  useEffect(() => {
    if (!salaryCalculatorOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSalaryCalculatorOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [salaryCalculatorOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (salaryCalculatorOpen) {
      setSalaryCalculatorPanelVisible(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSalaryCalculatorPanelVisible(false);
    }, SALARY_CALCULATOR_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [salaryCalculatorOpen]);

  useEffect(() => {
    const initialiseSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setEmailVerified(!!session?.user?.email_confirmed_at);
      setAuthLoading(false);
    };

    initialiseSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setEmailVerified(!!session?.user?.email_confirmed_at);
      if (event === 'PASSWORD_RECOVERY') {
        setResetPasswordModalOpen(true);
        setShowLoginModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setSecurityEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(
        APPLICATION_THREAD_STORAGE_KEY,
        JSON.stringify(applicationThreads)
      );
    } catch (error) {
      console.error('Failed to persist application threads', error);
    }
  }, [applicationThreads]);

  useEffect(() => {
    if (user?.type !== 'startup' || applications.length === 0) {
      return;
    }

    setApplicationThreads((previous) => {
      let nextState = previous;
      let changed = false;

      applications.forEach((application) => {
        const threadKey = getApplicationThreadKey(application);
        if (!threadKey) {
          return;
        }

        const meta = buildThreadMetaFromApplication(application);
        const existing = nextState[threadKey];
        const normalised = normalizeThreadStateValue(existing);
        const existingMeta = normalised.meta || {};
        const mergedMeta = meta ? { ...existingMeta, ...meta } : existingMeta;
        const needsMetaUpdate =
          meta && Object.keys(meta).some((key) => meta[key] && existingMeta[key] !== meta[key]);
        const needsStructureUpdate = !existing || Array.isArray(existing);

        if (needsMetaUpdate || needsStructureUpdate) {
          if (!changed) {
            nextState = { ...nextState };
            changed = true;
          }
          nextState[threadKey] = {
            entries: normalised.entries,
            meta: Object.keys(mergedMeta).length > 0 ? mergedMeta : null,
          };
        }

        const legacyKey = getJobIdKey(application.id);
        if (legacyKey && legacyKey !== threadKey && nextState[legacyKey]) {
          if (!changed) {
            nextState = { ...nextState };
            changed = true;
          }
          delete nextState[legacyKey];
        }
      });

      return changed ? nextState : previous;
    });
  }, [applications, user?.type, getApplicationThreadKey, buildThreadMetaFromApplication]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setCompactHeader(window.scrollY > 140);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleReveal = () => {
      const target = filtersSectionRef.current;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const revealThreshold = window.innerHeight * 0.6;
      const top = target ? target.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      const shouldReveal = scrollY > window.innerHeight * 0.1 || top <= revealThreshold;

      setSalaryCalculatorRevealed((prev) => {
        if (prev !== shouldReveal && !shouldReveal) {
          setSalaryCalculatorOpen(false);
        }
        return shouldReveal;
      });
    };

    window.addEventListener('scroll', handleReveal, { passive: true });
    handleReveal();
    return () => window.removeEventListener('scroll', handleReveal);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sanitised = sanitizeIdArray(savedJobs);
    window.localStorage.setItem('ssc_saved_jobs', JSON.stringify(sanitised));
  }, [savedJobs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_applied_jobs', JSON.stringify(sanitizeIdArray(appliedJobs)));
  }, [appliedJobs]);

  const loadProfile = useCallback(
    async (supabaseUser, options = {}) => {
      if (!supabaseUser) {
        setProfile(null);
        lastUploadedCvRef.current = '';
        return;
      }

      const applyProfileState = (profileRecord, applyOptions = {}) => {
        if (!profileRecord) {
          return;
        }

        const resolvedOptions = { ...options, ...applyOptions };
        const isStudentProfile = supabaseUser.type === 'student';
        const normalized = isStudentProfile
          ? profileRecord
          : { ...profileRecord, cv_url: null, cv_public: false };

        const lastUploadedCv = lastUploadedCvRef.current?.trim?.() || '';

        const profileId =
          normalized.id ||
          profileRecord.id ||
          normalized.user_id ||
          profileRecord.user_id ||
          supabaseUser.id;

        const sanitizedProfile = {
          ...normalized,
          id: profileId,
          user_id: supabaseUser.id,
          type: supabaseUser.type,
        };

        let resolvedCvUrl = '';
        let resolvedCvFileName =
          sanitizedProfile.cv_file_name || getFileNameFromUrl(sanitizedProfile.cv_url);

        if (isStudentProfile) {
          const incomingCv = sanitizedProfile.cv_url;
          if (typeof incomingCv === 'string' && incomingCv.trim()) {
            resolvedCvUrl = incomingCv.trim();
            if (!resolvedCvFileName) {
              resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
            }
            if (lastUploadedCv && resolvedCvUrl === lastUploadedCv) {
              lastUploadedCvRef.current = '';
            }
          }
        }

        if (resolvedOptions.updatePresence !== false) {
          setProfileColumnPresence((previous) => ({
            ...previous,
            ...deriveColumnPresence([sanitizedProfile]),
          }));
        }

        setProfile((previous) => {
          const nextProfile = { ...sanitizedProfile };
          if (isStudentProfile) {
            const previousCv = previous?.cv_url;
            const trimmedPreviousCv =
              typeof previousCv === 'string' ? previousCv.trim() : previousCv ?? '';
            if (!resolvedCvUrl) {
              if (lastUploadedCv) {
                resolvedCvUrl = lastUploadedCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              } else if (!resolvedOptions.overwriteDraft && trimmedPreviousCv) {
                resolvedCvUrl = trimmedPreviousCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              }
            }
            nextProfile.cv_url = resolvedCvUrl || null;
            nextProfile.cv_file_name = resolvedCvFileName || getFileNameFromUrl(resolvedCvUrl) || '';
          } else {
            nextProfile.cv_url = null;
            nextProfile.cv_file_name = '';
          }

          if (!resolvedOptions.overwriteDraft && previous) {
            if (!nextProfile.avatar_url && previous.avatar_url) {
              nextProfile.avatar_url = previous.avatar_url;
            }
          }
          writeCachedProfile(supabaseUser.id, nextProfile);
          return nextProfile;
        });

        setProfileForm((previous) => {
          const nextForm = {
            full_name: sanitizedProfile.full_name || supabaseUser.name,
            university: sanitizedProfile.university || '',
            program: sanitizedProfile.program || '',
            experience: sanitizedProfile.experience || '',
            bio: sanitizedProfile.bio || '',
            portfolio_url: sanitizedProfile.portfolio_url || '',
            cv_url: isStudentProfile ? sanitizedProfile.cv_url || '' : '',
            cv_file_name: isStudentProfile
              ? resolvedCvFileName || getFileNameFromUrl(sanitizedProfile.cv_url)
              : '',
            avatar_url: sanitizedProfile.avatar_url || '',
            cv_public: isStudentProfile ? !!sanitizedProfile.cv_public : false,
          };

          if (isStudentProfile) {
            const previousFormCv = previous?.cv_url;
            const trimmedPreviousFormCv =
              typeof previousFormCv === 'string' ? previousFormCv.trim() : previousFormCv ?? '';
            if (!resolvedCvUrl) {
              if (lastUploadedCv) {
                resolvedCvUrl = lastUploadedCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              } else if (!resolvedOptions.overwriteDraft && trimmedPreviousFormCv) {
                resolvedCvUrl = trimmedPreviousFormCv;
                if (!resolvedCvFileName) {
                  resolvedCvFileName = getFileNameFromUrl(resolvedCvUrl);
                }
              }
            }
            nextForm.cv_url = resolvedCvUrl || '';
            nextForm.cv_file_name =
              resolvedCvFileName || getFileNameFromUrl(resolvedCvUrl) || nextForm.cv_file_name || '';
          } else {
            nextForm.cv_url = '';
            nextForm.cv_file_name = '';
          }

          if (!resolvedOptions.overwriteDraft && previous) {
            if (!nextForm.avatar_url && previous.avatar_url) {
              nextForm.avatar_url = previous.avatar_url;
            }
          }

          return nextForm;
        });
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          const message = error.message?.toLowerCase?.() || '';
          if (message.includes('row-level security')) {
            const cachedProfile = readCachedProfile(supabaseUser.id);
            if (cachedProfile) {
              applyProfileState(cachedProfile, { updatePresence: false });
              return;
            }
          }

          console.error('Profile fetch error', error);
          const cachedProfile = readCachedProfile(supabaseUser.id);
          if (cachedProfile) {
            applyProfileState(cachedProfile, { updatePresence: false });
          }
          return;
        }

        let profileRecord = data;

        if (!profileRecord) {
          const baseProfile = {
            user_id: supabaseUser.id,
            full_name: supabaseUser.name || '',
            type: supabaseUser.type,
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(baseProfile)
            .select('*')
            .single();

          if (insertError) {
            const message = insertError.message?.toLowerCase?.() || '';
            if (message.includes('row-level security')) {
              const cachedProfile = readCachedProfile(supabaseUser.id);
              if (cachedProfile) {
                applyProfileState(cachedProfile, { updatePresence: false });
                return;
              }

              applyProfileState(
                { ...baseProfile, id: supabaseUser.id },
                { updatePresence: false }
              );
              return;
            }

            console.error('Profile insert error', insertError);
            const cachedProfile = readCachedProfile(supabaseUser.id);
            if (cachedProfile) {
              applyProfileState(cachedProfile, { updatePresence: false });
            }
            return;
          }

          profileRecord = inserted;
        }

        applyProfileState(profileRecord);
      } catch (error) {
        console.error('Profile load error', error);
        const cachedProfile = readCachedProfile(supabaseUser.id);
        if (cachedProfile) {
          applyProfileState(cachedProfile, { updatePresence: false });
        }
      }
    },
    []
  );

  const loadStartupProfile = useCallback(
    async (supabaseUser) => {
      if (!supabaseUser || supabaseUser.type !== 'startup') {
        setStartupProfile(null);
        setStartupColumnPresence({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('owner_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Startup fetch error', error);
          return;
        }

        let startupRecord = data;

        if (!startupRecord) {
          const baseStartup = {
            owner_id: supabaseUser.id,
            name: supabaseUser.name,
            registry_number: '',
            description: '',
            website: '',
            logo_url: '',
            verification_status: 'unverified',
            verification_note: '',
          };

          const { data: inserted, error: insertError } = await supabase
            .from('startups')
            .insert(baseStartup)
            .select('*')
            .single();

          if (insertError) {
            console.error('Startup insert error', insertError);
            return;
          }

          startupRecord = inserted;
        }

        if (startupRecord) {
          setStartupColumnPresence((previous) => ({
            ...previous,
            ...deriveColumnPresence([startupRecord]),
          }));
        }

        setStartupProfile(startupRecord);
        upsertCompanyFromStartup(startupRecord);

        const teamSizeValue = firstNonEmpty(
          startupRecord.team,
          startupRecord.team_size,
          startupRecord.employees,
          startupRecord.headcount
        );
        const fundraisingValue = firstNonEmpty(
          startupRecord.fundraising,
          startupRecord.total_funding,
          startupRecord.total_raised,
          startupRecord.funding
        );
        const infoLinkValue = firstNonEmpty(
          startupRecord.info_link,
          startupRecord.profile_link,
          startupRecord.external_profile,
          startupRecord.external_profile_url
        );

        setStartupForm({
          name: startupRecord.name || supabaseUser.name,
          registry_number: startupRecord.registry_number || '',
          description: startupRecord.description || '',
          website: startupRecord.website || '',
          logo_url: startupRecord.logo_url || '',
          verification_status: startupRecord.verification_status || 'unverified',
          verification_note: startupRecord.verification_note || '',
          team_size: teamSizeValue || '',
          fundraising: fundraisingValue || '',
          info_link: infoLinkValue || '',
        });
      } catch (error) {
        console.error('Startup load error', error);
      }
    },
    [upsertCompanyFromStartup]
  );

  useEffect(() => {
    if (authLoading) return;
    loadProfile(user);
    loadStartupProfile(user);
  }, [authLoading, loadProfile, loadStartupProfile, user]);

  useEffect(() => {
    let cancelled = false;

    loadMockJobs()
      .then((fallback) => {
        if (cancelled || !Array.isArray(fallback)) {
          return;
        }
        fallbackJobsRef.current = fallback;
        setJobs((previous) => {
          if (previous.length > 0) {
            return previous;
          }
          return fallback;
        });
        setJobColumnPresence((previous) => {
          if (previous && Object.keys(previous).length > 0) {
            return previous;
          }
          return deriveColumnPresence(fallback);
        });
      })
      .catch((error) => {
        console.error('Fallback jobs load error', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateCompanies = async () => {
      try {
        const [profiles, byId, fallback] = await Promise.all([
          loadCompanyProfiles(),
          loadCompanyProfilesById(),
          loadMockCompanies(),
        ]);

        if (cancelled) {
          return;
        }

        setCompanyCatalog(profiles);
        setCompanyCatalogById(byId);
        fallbackCompaniesRef.current = fallback;
        setCompanies((previous) => {
          if (previous.length > 0) {
            return previous;
          }
          return fallback;
        });
      } catch (error) {
        console.error('Fallback companies load error', error);
      }
    };

    hydrateCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadJobs = async () => {
      setJobsLoading(true);
      try {
        const fallbackJobs =
          fallbackJobsRef.current.length > 0
            ? fallbackJobsRef.current
            : await loadMockJobs();
        const { jobs: nextJobs, error, fallbackUsed, columnPresenceData } = await fetchJobs({
          fallbackJobs,
        });

        if (error) {
          console.error('Job load error', error);
        } else if (fallbackUsed) {
          console.info('Using fallback jobs dataset');
        }

        setJobs(nextJobs);
        setJobColumnPresence(deriveColumnPresence(columnPresenceData));
      } catch (error) {
        console.error('Job load error', error);
        const fallbackJobs =
          fallbackJobsRef.current.length > 0
            ? fallbackJobsRef.current
            : await loadMockJobs();
        setJobs(fallbackJobs);
        setJobColumnPresence(deriveColumnPresence(fallbackJobs));
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, [jobsVersion]);

  useEffect(() => {
    const loadCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const fallbackCompanies =
          fallbackCompaniesRef.current.length > 0
            ? fallbackCompaniesRef.current
            : await loadMockCompanies();
        const { companies: nextCompanies, error, fallbackUsed } = await fetchCompanies({
          fallbackCompanies,
          mapStartupToCompany,
        });

        if (error) {
          console.error('Company load error', error);
        } else if (fallbackUsed) {
          console.info('Using fallback companies dataset');
        }

        setCompanies(nextCompanies);
      } catch (error) {
        console.error('Company load error', error);
        const fallbackCompanies =
          fallbackCompaniesRef.current.length > 0
            ? fallbackCompaniesRef.current
            : await loadMockCompanies();
        setCompanies(fallbackCompanies);
      } finally {
        setCompaniesLoading(false);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || user.type !== 'startup') {
        setApplications([]);
        return;
      }

      setApplicationsLoading(true);
      try {
        const baseColumns = ['id', 'status', 'motivational_letter', 'created_at'];
        if (applicationColumnPresence.acknowledged !== false) {
          baseColumns.push('acknowledged');
        }
        if (applicationColumnPresence.cv_override_url !== false) {
          baseColumns.push('cv_override_url');
        }

        let columnsToRequest = [...baseColumns];
        let fetchedApplications = [];
        let fetchError = null;

        while (columnsToRequest.length > 0) {
          const selectColumns = `${columnsToRequest.join(', ')}, profiles ( id, full_name, university, program, avatar_url, cv_url ), jobs ( id, title, company_name, startup_id )`;
          let query = supabase
            .from('job_applications')
            .select(selectColumns)
            .order('created_at', { ascending: false });

          if (startupProfile?.id) {
            query = query.eq('jobs.startup_id', startupProfile.id);
          }

          const { data, error } = await query;

          if (!error) {
            fetchedApplications = Array.isArray(data) ? data : [];
            fetchError = null;
            break;
          }

          fetchError = error;
          const missingColumn = detectMissingColumn(error.message, 'job_applications');
          if (!missingColumn || !columnsToRequest.includes(missingColumn)) {
            break;
          }

          columnsToRequest = columnsToRequest.filter((column) => column !== missingColumn);
          setApplicationColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));
        }

        if (fetchError) {
          console.error('Applications load error', fetchError);
          const localFallback = loadLocalApplicationsForStartup(startupProfile?.id);
          const sortedLocal = [...localFallback].sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            const safeATime = Number.isFinite(aTime) ? aTime : 0;
            const safeBTime = Number.isFinite(bTime) ? bTime : 0;
            return safeBTime - safeATime;
          });
          setApplications(sortedLocal);
          setApplicationColumnPresence((previous) => {
            const next = { ...previous };
            const derived = deriveColumnPresence(sortedLocal);
            Object.keys(derived).forEach((column) => {
              next[column] = true;
            });
            return next;
          });
        } else {
          const remoteApplications = fetchedApplications.map((application) => ({
            ...application,
            isLocal: false,
          }));
          const localFallback = loadLocalApplicationsForStartup(startupProfile?.id, fetchedApplications);
          const combined = [...remoteApplications, ...localFallback].sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            const safeATime = Number.isFinite(aTime) ? aTime : 0;
            const safeBTime = Number.isFinite(bTime) ? bTime : 0;
            return safeBTime - safeATime;
          });
          setApplications(combined);
          setApplicationColumnPresence((previous) => {
            const next = { ...previous };
            columnsToRequest.forEach((column) => {
              next[column] = true;
            });
            const derived = deriveColumnPresence(combined);
            Object.keys(derived).forEach((column) => {
              next[column] = true;
            });
            return next;
          });
        }
      } catch (error) {
        console.error('Applications load error', error);
        const localFallback = loadLocalApplicationsForStartup(startupProfile?.id);
        const sortedLocal = [...localFallback].sort((a, b) => {
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          const safeATime = Number.isFinite(aTime) ? aTime : 0;
          const safeBTime = Number.isFinite(bTime) ? bTime : 0;
          return safeBTime - safeATime;
        });
        setApplications(sortedLocal);
        setApplicationColumnPresence((previous) => {
          const next = { ...previous };
          const derived = deriveColumnPresence(sortedLocal);
          Object.keys(derived).forEach((column) => {
            next[column] = true;
          });
          return next;
        });
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [user, startupProfile?.id, applicationsVersion]);

  useEffect(() => {
    let cancelled = false;

    loadMockEvents()
      .then((fallback) => {
        if (cancelled || !Array.isArray(fallback)) {
          return;
        }
        fallbackEventsRef.current = fallback;
        setEvents((previous) => {
          if (previous.length > 0) {
            return previous;
          }
          return sortEventsByScheduleStatic(fallback);
        });
      })
      .catch((error) => {
        console.error('Fallback events load error', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) {
          console.error('Events load error', error);
          const fallbackEvents =
            fallbackEventsRef.current.length > 0
              ? fallbackEventsRef.current
              : await loadMockEvents();
          setEvents(sortEventsByScheduleStatic(fallbackEvents));
        } else {
          const sortedEvents = sortEventsBySchedule(data || []);
          if (sortedEvents.length > 0) {
            setEvents(sortedEvents);
          } else {
            const fallbackEvents =
              fallbackEventsRef.current.length > 0
                ? fallbackEventsRef.current
                : await loadMockEvents();
            setEvents(sortEventsByScheduleStatic(fallbackEvents));
          }
        }
      } catch (error) {
        console.error('Events load error', error);
        const fallbackEvents =
          fallbackEventsRef.current.length > 0
            ? fallbackEventsRef.current
            : await loadMockEvents();
        setEvents(sortEventsByScheduleStatic(fallbackEvents));
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [sortEventsBySchedule]);

  const addFilter = (filterId) => {
    setSelectedFilters((prev) => (prev.includes(filterId) ? prev : [...prev, filterId]));
  };

  const removeFilter = (filterId) => {
    setSelectedFilters((prev) => prev.filter((item) => item !== filterId));
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setSalaryRangeDirty(false);
    setEquityRangeDirty(false);
    setSalaryFilterCadence('month');
    setSalaryRange((prev) => {
      const [boundMin, boundMax] = salaryBounds;
      if (prev[0] === boundMin && prev[1] === boundMax) {
        return prev;
      }
      return [boundMin, boundMax];
    });
    setEquityRange((prev) => {
      const [boundMin, boundMax] = equityBounds;
      if (prev[0] === boundMin && prev[1] === boundMax) {
        return prev;
      }
      return [boundMin, boundMax];
    });
  };

  const updateSalaryRange = useCallback(
    (computeNext) => {
      setSalaryRangeDirty(true);
      let resolvedValues = null;
      setSalaryRange((prev) => {
        const [boundMin, boundMax] = salaryBounds;
        const next = typeof computeNext === 'function' ? computeNext(prev, boundMin, boundMax) : computeNext;

        if (!next || !Array.isArray(next) || next.length < 2) {
          return prev;
        }

        let [nextMin, nextMax] = next;

        if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
          return prev;
        }

        nextMin = clamp(roundToStep(nextMin, SALARY_STEP), boundMin, boundMax);
        nextMax = clamp(roundToStep(nextMax, SALARY_STEP), boundMin, boundMax);

        if (nextMin > nextMax) {
          [nextMin, nextMax] = [nextMax, nextMin];
        }

        if (nextMin === prev[0] && nextMax === prev[1]) {
          return prev;
        }

        resolvedValues = [nextMin, nextMax];
        return [nextMin, nextMax];
      });
      if (resolvedValues) {
        const [nextMin, nextMax] = resolvedValues;
        setSalaryInputValues((prev) => {
          const next = {
            min: formatSalaryValue(nextMin, salaryFilterCadence),
            max: formatSalaryValue(nextMax, salaryFilterCadence),
          };

          if (prev.min === next.min && prev.max === next.max) {
            return prev;
          }

          return next;
        });
      }
    },
    [salaryBounds, salaryFilterCadence]
  );

  const updateEquityRange = useCallback(
    (computeNext, options = {}) => {
      setEquityRangeDirty(true);
      let resolvedValues = null;
      const { constrain } = options;
      const [boundMin, boundMax] = equityBounds;
      setEquityRange((prev) => {
        const next = typeof computeNext === 'function' ? computeNext(prev, boundMin, boundMax) : computeNext;

        if (!next || !Array.isArray(next) || next.length < 2) {
          return prev;
        }

        let [nextMinCandidate, nextMaxCandidate] = next;

        if (!Number.isFinite(nextMinCandidate) || !Number.isFinite(nextMaxCandidate)) {
          return prev;
        }

        let nextMin = clamp(roundToStep(nextMinCandidate, EQUITY_STEP), boundMin, boundMax);
        let nextMax = clamp(roundToStep(nextMaxCandidate, EQUITY_STEP), boundMin, boundMax);

        if (constrain === 'min') {
          nextMin = Math.min(nextMin, prev[1]);
          nextMax = Math.max(nextMax, nextMin);
        } else if (constrain === 'max') {
          nextMax = Math.max(nextMax, prev[0]);
          nextMin = Math.min(nextMin, nextMax);
        } else if (nextMin > nextMax) {
          [nextMin, nextMax] = [nextMax, nextMin];
        }

        if (nextMin === prev[0] && nextMax === prev[1]) {
          resolvedValues = [nextMin, nextMax];
          return prev;
        }

        resolvedValues = [nextMin, nextMax];
        return [nextMin, nextMax];
      });

      if (resolvedValues) {
        const [nextMin, nextMax] = resolvedValues;
        setEquityInputValues((prev) => {
          const next = {
            min: formatEquityValue(nextMin),
            max: formatEquityValue(nextMax),
          };

          if (prev.min === next.min && prev.max === next.max) {
            return prev;
          }

          return next;
        });
      }
    },
    [equityBounds]
  );

  const [activeSalaryThumb, setActiveSalaryThumb] = useState(null);
  const [activeEquityThumb, setActiveEquityThumb] = useState(null);

  const handleSalaryThumbActivate = useCallback((bound) => {
    setActiveSalaryThumb(bound);
  }, []);

  const handleSalaryThumbRelease = useCallback(() => {
    setActiveSalaryThumb(null);
  }, []);

  const handleEquityThumbActivate = useCallback((bound) => {
    setActiveEquityThumb(bound);
  }, []);

  const handleEquityThumbRelease = useCallback(() => {
    setActiveEquityThumb(null);
  }, []);

  const handleSalarySliderChange = (bound) => (event) => {
    const rawValue = Number(event.target.value);
    if (!Number.isFinite(rawValue)) {
      return;
    }

    const monthlyValue = convertCadenceValueToMonthly(rawValue, salaryFilterCadence);
    if (!Number.isFinite(monthlyValue)) {
      return;
    }

    updateSalaryRange((prev) => {
      if (bound === 'min') {
        return [monthlyValue, prev[1]];
      }

      return [prev[0], monthlyValue];
    });
  };

  const handleSalaryInputChange = (bound, value) => {
    const sanitized = sanitizeDecimalInput(value);

    setSalaryInputValues((prev) => {
      if (prev[bound] === sanitized) {
        return prev;
      }
      return { ...prev, [bound]: sanitized };
    });

    if (sanitized === '') {
      return;
    }

    const numeric = Number.parseFloat(sanitized.replace(',', '.'));
    if (!Number.isFinite(numeric)) {
      return;
    }

    const monthlyValue = convertCadenceValueToMonthly(numeric, salaryFilterCadence);
    if (!Number.isFinite(monthlyValue)) {
      return;
    }

    updateSalaryRange((prev) => {
      if (bound === 'min') {
        return [monthlyValue, prev[1]];
      }

      return [prev[0], monthlyValue];
    });
  };

  const handleEquitySliderChange = (bound) => (event) => {
    const rawValue = Number(event.target.value);
    if (!Number.isFinite(rawValue)) {
      return;
    }

    updateEquityRange(
      (prev) => {
        if (bound === 'min') {
          return [rawValue, prev[1]];
        }

        return [prev[0], rawValue];
      },
      { constrain: bound }
    );
  };

  const handleEquityInputChange = (bound, value) => {
    const sanitized = sanitizeDecimalInput(value);

    setEquityInputValues((prev) => {
      if (prev[bound] === sanitized) {
        return prev;
      }
      return { ...prev, [bound]: sanitized };
    });

    if (!sanitized || sanitized === '.' || sanitized === ',' || /[.,]$/.test(sanitized)) {
      return;
    }

    const numeric = Number.parseFloat(sanitized.replace(',', '.'));
    if (!Number.isFinite(numeric)) {
      return;
    }

    updateEquityRange(
      (prev) => {
        if (bound === 'min') {
          return [numeric, prev[1]];
        }

        return [prev[0], numeric];
      },
      { constrain: bound }
    );
  };

  const handleEquityInputFocus = (bound) => () => {
    equityInputFocusRef.current[bound] = true;
  };

  const handleEquityInputBlur = (bound) => () => {
    equityInputFocusRef.current[bound] = false;

    const raw = equityInputValues[bound] ?? '';
    const sanitized = sanitizeDecimalInput(raw);
    const trimmed = sanitized.replace(/[.,]$/, '');
    const fallback = bound === 'min' ? formatEquityValue(equityMin) : formatEquityValue(equityMax);

    if (!trimmed) {
      setEquityInputValues((prev) => {
        if (prev[bound] === fallback) {
          return prev;
        }
        return { ...prev, [bound]: fallback };
      });
      return;
    }

    const numeric = Number.parseFloat(trimmed.replace(',', '.'));
    if (!Number.isFinite(numeric)) {
      setEquityInputValues((prev) => {
        if (prev[bound] === fallback) {
          return prev;
        }
        return { ...prev, [bound]: fallback };
      });
      return;
    }

    updateEquityRange(
      (prev) => {
        if (bound === 'min') {
          return [numeric, prev[1]];
        }

        return [prev[0], numeric];
      },
      { constrain: bound }
    );
  };


  const toggleSavedJob = (jobId) => {
    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({
        type: 'info',
        message: translate('jobs.saveTooltip', 'Sign in as a student to save roles'),
      });
      return;
    }

    if (user.type !== 'student') {
      setFeedback({
        type: 'info',
        message: translate('jobs.savedSwitch', 'Switch to a student account to save roles.'),
      });
      return;
    }

    setSavedJobs((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        setFeedback({
          type: 'info',
          message: translate('jobs.feedbackRemoved', 'Removed from saved roles.'),
        });
        return prev.filter((id) => id !== jobId);
      }
      setFeedback({
        type: 'success',
        message: translate('jobs.feedbackAdded', 'Added to your saved roles.'),
      });
      return [...prev, jobId];
    });
  };

  const companyNameLookup = useMemo(() => {
    const map = {};
    companies.forEach((company) => {
      if (company.id) {
        map[String(company.id)] = company.name;
      }
    });
    return map;
  }, [companies]);

  const companyMetaLookup = useMemo(() => {
    const map = {};
    companies.forEach((company) => {
      const teamLabel =
        company.team ||
        company.team_size ||
        company.employees ||
        company.headcount ||
        '';
      const fundraisingLabel =
        company.fundraising ||
        company.total_funding ||
        company.total_raised ||
        company.funding ||
        '';
      const infoLinkLabel =
        company.info_link ||
        company.profile_link ||
        company.external_profile ||
        company.external_profile_url ||
        '';
      const meta = {
        team: teamLabel ? String(teamLabel) : '',
        fundraising: fundraisingLabel ? String(fundraisingLabel) : '',
        infoLink: infoLinkLabel ? String(infoLinkLabel) : '',
      };

      if (company.id != null) {
        map[`id:${company.id}`] = meta;
      }

      if (company.name) {
        const nameKey = company.name.trim().toLowerCase();
        if (nameKey) {
          map[`name:${nameKey}`] = meta;
        }
      }
    });
    return map;
  }, [companies]);

  const normalizedJobs = useMemo(() => {
    return jobs.map((job) => {
      const idKey = job.startup_id ? String(job.startup_id) : null;
      const nameFromLookup = idKey ? companyNameLookup[idKey] : null;
      const ensuredName = job.company_name?.trim() || nameFromLookup || 'Verified startup';
      const isPartTime = job.employment_type?.toLowerCase().includes('part');
      const { value: weeklyHoursValueRaw, label: weeklyHoursLabelRaw } = getWeeklyHoursMeta(job);
      const hoursForConversion = resolveWeeklyHours(weeklyHoursValueRaw);
      const weeklyHoursValue = isPartTime && Number.isFinite(weeklyHoursValueRaw) ? weeklyHoursValueRaw : null;
      const weeklyHoursLabel = isPartTime ? weeklyHoursLabelRaw : '';
      const rawDuration =
        job.duration_months ?? job.contract_duration_months ?? job.internship_duration_months ?? null;
      const parsedDuration = parseDurationMonths(rawDuration);
      const internshipDuration =
        job.employment_type === 'Internship'
          ? parseDurationMonths(job.internship_duration_months ?? rawDuration)
          : null;
      const durationMonths = internshipDuration ?? parsedDuration;
      const durationLabel = formatDurationLabel(durationMonths);
      const internshipDurationLabel = formatDurationLabel(internshipDuration);
      const [salaryMinValue, salaryMaxValue] = computeSalaryRange(job);
      const [equityMinValue, equityMaxValue] = computeEquityRange(job);
      const normalizedSalaryMin = Number.isFinite(job.salary_min_value)
        ? job.salary_min_value
        : salaryMinValue;
      const normalizedSalaryMax = Number.isFinite(job.salary_max_value)
        ? job.salary_max_value
        : salaryMaxValue;
      const resolvedEquityMin = Number.isFinite(job.equity_min_value)
        ? job.equity_min_value
        : equityMinValue;
      const resolvedEquityMaxCandidate = Number.isFinite(job.equity_max_value)
        ? job.equity_max_value
        : equityMaxValue;
      const normalizedEquityMin = Number.isFinite(resolvedEquityMin) ? resolvedEquityMin : null;
      const normalizedEquityMax = Number.isFinite(resolvedEquityMaxCandidate)
        ? resolvedEquityMaxCandidate
        : normalizedEquityMin;
      const salaryCadence = normalizeSalaryCadence(job.salary_cadence || detectSalaryPeriod(job, job.salary));
      const monthlyMin = Number.isFinite(normalizedSalaryMin) ? normalizedSalaryMin : null;
      const monthlyMax = Number.isFinite(normalizedSalaryMax) ? normalizedSalaryMax : null;
      const baseMin = Number.isFinite(monthlyMin)
        ? convertMonthlyValueToCadence(monthlyMin, salaryCadence || 'month', hoursForConversion)
        : null;
      const baseMax = Number.isFinite(monthlyMax)
        ? convertMonthlyValueToCadence(monthlyMax, salaryCadence || 'month', hoursForConversion)
        : null;
      const includesThirteenthSalary = inferThirteenthSalary(job);
      const salaryDisplay = composeSalaryDisplay({
        baseMin,
        baseMax,
        cadence: salaryCadence,
        fallbackText: job.salary,
      });
      const equityDisplay = formatEquityDisplay(normalizedEquityMin, normalizedEquityMax);
      const metaFromId = idKey ? companyMetaLookup[`id:${idKey}`] : null;
      const metaFromName = ensuredName
        ? companyMetaLookup[`name:${ensuredName.trim().toLowerCase()}`]
        : null;
      const companyMeta = metaFromId || metaFromName || {};
      const { keys: languageKeys, labels: languageLabels } = resolveJobLanguageLabels(job);
      return {
        ...job,
        company_name: ensuredName,
        salary_min_value: normalizedSalaryMin,
        salary_max_value: normalizedSalaryMax,
        salary_cadence: salaryCadence,
        salary_original: job.salary,
        salary: salaryDisplay,
        equity_min_value: normalizedEquityMin,
        equity_max_value: normalizedEquityMax,
        equity_original: job.equity,
        equity: equityDisplay,
        weekly_hours_value: weeklyHoursValue,
        weekly_hours_label: weeklyHoursLabel,
        duration_months: durationMonths,
        duration_label: durationLabel,
        internship_duration_months: internshipDuration,
        internship_duration_label: internshipDurationLabel,
        includes_thirteenth_salary: includesThirteenthSalary,
        language_keys: languageKeys,
        language_labels: languageLabels,
        company_team:
          job.company_team ||
          job.team ||
          job.team_size ||
          job.employees ||
          companyMeta.team ||
          '',
        company_fundraising:
          job.company_fundraising ||
          job.fundraising ||
          job.total_funding ||
          job.total_raised ||
          job.funding ||
          companyMeta.fundraising ||
          '',
        company_info_link:
          job.company_info_link ||
          job.info_link ||
          job.profile_link ||
          job.external_profile ||
          job.external_profile_url ||
          companyMeta.infoLink ||
          '',
      };
    });
  }, [jobs, companyMetaLookup, companyNameLookup]);

  const calculatorCompanies = useMemo(() => {
    const map = new Map();

    normalizedJobs.forEach((job) => {
      const name = job.company_name?.trim();
      if (!name) {
        return;
      }

      const key = job.startup_id ? `id:${job.startup_id}` : `name:${name.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { key, label: name });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [normalizedJobs]);

  const calculatorJobs = useMemo(() => {
    if (!salaryCalculatorCompany) {
      return [];
    }

    return normalizedJobs
      .filter((job) => {
        const name = job.company_name?.trim();
        if (!name) {
          return false;
        }
        const key = job.startup_id ? `id:${job.startup_id}` : `name:${name.toLowerCase()}`;
        return key === salaryCalculatorCompany;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [normalizedJobs, salaryCalculatorCompany]);

  useEffect(() => {
    if (calculatorCompanies.length === 0) {
      if (salaryCalculatorCompany) {
        setSalaryCalculatorCompany('');
      }
      return;
    }

    const hasSelected = calculatorCompanies.some((company) => company.key === salaryCalculatorCompany);
    if (!hasSelected) {
      setSalaryCalculatorCompany(calculatorCompanies[0].key);
    }
  }, [calculatorCompanies, salaryCalculatorCompany]);

  useEffect(() => {
    if (calculatorJobs.length === 0) {
      if (salaryCalculatorJobId) {
        setSalaryCalculatorJobId('');
      }
      return;
    }

    const hasSelected = calculatorJobs.some((job) => job.id === salaryCalculatorJobId);
    if (!hasSelected) {
      setSalaryCalculatorJobId(calculatorJobs[0].id);
    }
  }, [calculatorJobs, salaryCalculatorJobId]);

  const selectedCalculatorJob = useMemo(() => {
    if (!salaryCalculatorJobId) {
      return null;
    }

    return calculatorJobs.find((job) => job.id === salaryCalculatorJobId) || null;
  }, [calculatorJobs, salaryCalculatorJobId]);

  const salaryCalculatorSummary = useMemo(() => {
    if (!selectedCalculatorJob) {
      return { rows: [], note: '' };
    }

    const monthlyMin = Number.isFinite(selectedCalculatorJob.salary_min_value)
      ? selectedCalculatorJob.salary_min_value
      : null;
    const monthlyMax = Number.isFinite(selectedCalculatorJob.salary_max_value)
      ? selectedCalculatorJob.salary_max_value
      : null;
    const weeklyHours = selectedCalculatorJob.weekly_hours_value ?? FULL_TIME_WEEKLY_HOURS;
    const durationMonths = Number.isFinite(selectedCalculatorJob.duration_months)
      ? selectedCalculatorJob.duration_months
      : null;
    const employmentType = selectedCalculatorJob.employment_type || '';
    const isFullTimeRole = employmentType.toLowerCase().includes('full');
    const hasFiniteDuration = Number.isFinite(durationMonths) && durationMonths > 0;
    const shouldShowTotal = !isFullTimeRole;
    const currencyPrefix = translate('calculator.currency', 'CHF');
    const notDisclosed = translate('calculator.notDisclosed', 'Not disclosed');

    const formatRowValue = (cadence) => {
      const convertValue = (value) =>
        cadence === 'month' ? value : convertMonthlyValueToCadence(value, cadence, weeklyHours);

      const minConverted = Number.isFinite(monthlyMin) ? convertValue(monthlyMin) : null;
      const maxConverted = Number.isFinite(monthlyMax) ? convertValue(monthlyMax) : null;
      const formattedMin = formatCalculatorCurrency(minConverted, cadence);
      const formattedMax = formatCalculatorCurrency(maxConverted, cadence);

      if (!formattedMin && !formattedMax) {
        return notDisclosed;
      }

      const range = formattedMin && formattedMax
        ? formattedMin === formattedMax
          ? formattedMin
          : `${formattedMin} – ${formattedMax}`
        : formattedMin || formattedMax;

      return `${currencyPrefix} ${range}`;
    };

    const durationLabel = Number.isFinite(durationMonths)
      ? translate(
          durationMonths === 1 ? 'calculator.duration.one' : 'calculator.duration.other',
          durationMonths === 1 ? '{{count}} month' : '{{count}} months',
          { count: Math.round(durationMonths) }
        )
      : '';

    const rowDefinitions = [
      {
        key: 'hour',
        label: translate('calculator.rows.hour.label', 'Hourly'),
        suffix: translate('calculator.rows.hour.suffix', ' / hour'),
      },
      {
        key: 'week',
        label: translate('calculator.rows.week.label', 'Weekly'),
        suffix: translate('calculator.rows.week.suffix', ' / week'),
      },
      {
        key: 'month',
        label: translate('calculator.rows.month.label', 'Monthly'),
        suffix: translate('calculator.rows.month.suffix', ' / month'),
      },
      {
        key: 'year',
        label: translate(
          shouldShowTotal ? 'calculator.rows.total.label' : 'calculator.rows.year.label',
          shouldShowTotal ? 'Total' : 'Yearly'
        ),
        suffix: shouldShowTotal
          ? ''
          : translate('calculator.rows.year.suffix', ' / year'),
      },
    ];

    const rows = rowDefinitions.map((definition) => {
      if (definition.key === 'year' && shouldShowTotal) {
        const monthsForTotal = hasFiniteDuration ? durationMonths : THIRTEENTH_MONTHS_PER_YEAR;
        const totalMin = Number.isFinite(monthlyMin) ? monthlyMin * monthsForTotal : null;
        const totalMax = Number.isFinite(monthlyMax) ? monthlyMax * monthsForTotal : null;
        const formattedMin = formatCalculatorCurrency(totalMin, 'year');
        const formattedMax = formatCalculatorCurrency(totalMax, 'year');

        if (!formattedMin && !formattedMax) {
          return { key: definition.key, label: definition.label, value: notDisclosed };
        }

        const range = formattedMin && formattedMax
          ? formattedMin === formattedMax
            ? formattedMin
            : `${formattedMin} – ${formattedMax}`
          : formattedMin || formattedMax;

        const durationSuffix = hasFiniteDuration && durationLabel
          ? translate('calculator.rows.total.durationSuffix', ' ({{duration}})', {
              duration: durationLabel,
            })
          : '';

        return {
          key: definition.key,
          label: definition.label,
          value: translate('calculator.rows.total.value', '{{value}} total{{suffix}}', {
            value: `${currencyPrefix} ${range}`,
            suffix: durationSuffix,
          }),
        };
      }

      const value = formatRowValue(definition.key);
      if (value === notDisclosed) {
        return { key: definition.key, label: definition.label, value };
      }

      return {
        key: definition.key,
        label: definition.label,
        value: translate('calculator.rows.valueWithSuffix', '{{value}}{{suffix}}', {
          value,
          suffix: definition.suffix,
        }),
      };
    });

    const baseHoursLabel = selectedCalculatorJob.weekly_hours_label
      ? selectedCalculatorJob.weekly_hours_label.replace(/\s+/g, ' ')
      : '';
    const hoursLabel = baseHoursLabel
      ? baseHoursLabel
      : translate('calculator.hoursFallback', '{{hours}} hours/week', { hours: weeklyHours });

    const noteParts = [translate('calculator.note.base', 'Based on the posted salary range')];
    if (hoursLabel) {
      noteParts.push(translate('calculator.note.converted', 'Converted with {{hours}}', { hours: hoursLabel }));
    }
    if (shouldShowTotal) {
      if (hasFiniteDuration && durationLabel) {
        noteParts.push(
          translate('calculator.note.contract', 'Contract lasts {{duration}}', {
            duration: durationLabel,
          })
        );
      }
    } else if (selectedCalculatorJob.includes_thirteenth_salary) {
      noteParts.push(
        translate('calculator.note.thirteenth', 'Yearly amounts include a 13th salary')
      );
    }

    const note = noteParts.length > 0 ? `${noteParts.join(' · ')}.` : '';

    return { rows, note };
  }, [selectedCalculatorJob, translate]);

  useEffect(() => {
    const nextBounds = deriveSalaryBoundsFromJobs(normalizedJobs);

    setSalaryBounds((prev) => {
      if (prev[0] === nextBounds[0] && prev[1] === nextBounds[1]) {
        return prev;
      }
      return nextBounds;
    });

    setSalaryRange((prev) => {
      const [boundMin, boundMax] = nextBounds;

      if (!salaryRangeDirty) {
        if (prev[0] === boundMin && prev[1] === boundMax) {
          return prev;
        }
        return [boundMin, boundMax];
      }

      const clampedMin = clamp(prev[0], boundMin, boundMax);
      const clampedMax = clamp(prev[1], boundMin, boundMax);

      if (!Number.isFinite(clampedMin) || !Number.isFinite(clampedMax) || clampedMin > clampedMax) {
        if (prev[0] === boundMin && prev[1] === boundMax) {
          return prev;
        }
        return [boundMin, boundMax];
      }

      if (prev[0] === Math.round(clampedMin) && prev[1] === Math.round(clampedMax)) {
        return prev;
      }

      return [Math.round(clampedMin), Math.round(clampedMax)];
    });
  }, [normalizedJobs, salaryRangeDirty]);

  useEffect(() => {
    const nextBounds = deriveEquityBoundsFromJobs(normalizedJobs);

    setEquityBounds((prev) => {
      if (prev[0] === nextBounds[0] && prev[1] === nextBounds[1]) {
        return prev;
      }
      return nextBounds;
    });

    setEquityRange((prev) => {
      const [boundMin, boundMax] = nextBounds;

      if (!equityRangeDirty) {
        if (prev[0] === boundMin && prev[1] === boundMax) {
          return prev;
        }
        return [boundMin, boundMax];
      }

      const clampedMin = clamp(prev[0], boundMin, boundMax);
      const clampedMax = clamp(prev[1], boundMin, boundMax);

      if (!Number.isFinite(clampedMin) || !Number.isFinite(clampedMax) || clampedMin > clampedMax) {
        if (prev[0] === boundMin && prev[1] === boundMax) {
          return prev;
        }
        return [boundMin, boundMax];
      }

      const roundedMin = roundToStep(clampedMin, EQUITY_STEP);
      const roundedMax = roundToStep(clampedMax, EQUITY_STEP);

      if (prev[0] === roundedMin && prev[1] === roundedMax) {
        return prev;
      }

      return [roundedMin, roundedMax];
    });
  }, [normalizedJobs, equityRangeDirty]);

  useEffect(() => {
    setSalaryInputValues((prev) => {
      const next = {
        min: formatSalaryValue(salaryMin, salaryFilterCadence),
        max: formatSalaryValue(salaryMax, salaryFilterCadence),
      };

      if (prev.min === next.min && prev.max === next.max) {
        return prev;
      }

      return next;
    });
  }, [salaryMin, salaryMax, salaryFilterCadence]);

  useEffect(() => {
    setEquityInputValues((prev) => {
      const next = {
        min: formatEquityValue(equityMin),
        max: formatEquityValue(equityMax),
      };

      const minLocked = equityInputFocusRef.current.min;
      const maxLocked = equityInputFocusRef.current.max;

      const resolved = {
        min: minLocked ? prev.min : next.min,
        max: maxLocked ? prev.max : next.max,
      };

      if (prev.min === resolved.min && prev.max === resolved.max) {
        return prev;
      }

      return resolved;
    });
  }, [equityMin, equityMax]);

  const companyJobCounts = useMemo(() => {
    const map = {};
    normalizedJobs.forEach((job) => {
      const idKey = job.startup_id != null ? String(job.startup_id) : '';
      const name = job.company_name?.trim();
      const nameKey = name ? name.toLowerCase() : '';

      if (idKey) {
        map[idKey] = (map[idKey] || 0) + 1;
      }

      if (nameKey) {
        map[nameKey] = (map[nameKey] || 0) + 1;
      }
    });
    return map;
  }, [normalizedJobs]);

  const augmentedCompanies = useMemo(() => {
    if (normalizedJobs.length === 0) {
      return companies;
    }

    const seenIds = new Set();
    const seenNames = new Set();

    companies.forEach((company) => {
      const idKey = company?.id != null ? String(company.id) : '';
      if (idKey) {
        seenIds.add(idKey);
      }

      const nameKey =
        typeof company?.name === 'string' ? company.name.trim().toLowerCase() : '';
      if (nameKey) {
        seenNames.add(nameKey);
      }
    });

    const derived = new Map();

    normalizedJobs.forEach((job) => {
      const idKey = job.startup_id != null ? String(job.startup_id) : '';
      const name = job.company_name?.trim();
      const nameKey = name ? name.toLowerCase() : '';

      if ((idKey && seenIds.has(idKey)) || (nameKey && seenNames.has(nameKey))) {
        return;
      }

      if (!idKey && !nameKey) {
        return;
      }

      const derivedKey = idKey || nameKey;
      const previous = derived.get(derivedKey) || {
        id: idKey || undefined,
        name: name || translate('companies.defaultName', 'Verified startup'),
        tagline: '',
        location: '',
        industry: '',
        team: '',
        fundraising: '',
        culture: '',
        website: '',
        info_link: '',
        verification_status: 'unverified',
        created_at: job.created_at,
      };

      derived.set(derivedKey, {
        ...previous,
        tagline: previous.tagline || job.title || job.description || '',
        location: previous.location || job.location || '',
        industry: previous.industry || job.industry || job.sector || '',
        team:
          previous.team ||
          job.company_team ||
          job.team ||
          job.team_size ||
          job.employees ||
          '',
        fundraising:
          previous.fundraising ||
          job.company_fundraising ||
          job.fundraising ||
          job.total_funding ||
          job.total_raised ||
          job.funding ||
          '',
        culture: previous.culture || job.company_culture || job.culture || '',
        website: previous.website || job.company_website || job.website || '',
        info_link:
          previous.info_link ||
          job.company_info_link ||
          job.info_link ||
          job.profile_link ||
          job.external_profile ||
          job.external_profile_url ||
          '',
        created_at: previous.created_at || job.created_at,
      });
    });

    if (derived.size === 0) {
      return companies;
    }

    return [...companies, ...derived.values()];
  }, [companies, normalizedJobs, translate]);

  const isStartupVerified = startupProfile?.verification_status === 'verified';
  const startupId = startupProfile?.id ? String(startupProfile.id) : null;

  const startupJobs = useMemo(() => {
    if (!startupId) return [];
    return normalizedJobs
      .filter((job) => String(job.startup_id || '') === startupId)
      .sort((a, b) => {
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [normalizedJobs, startupId]);

  const openPostJobFlow = useCallback(() => {
    if (!startupId) {
      setFeedback({
        type: 'info',
        message: translate('jobForm.errors.startupProfileIncomplete', 'Complete your startup profile before posting a job.'),
      });
      setStartupModalOpen(true);
      return;
    }

    if (!isStartupVerified) {
      setFeedback({
        type: 'info',
        message: translate(
          'jobForm.errors.verificationRequired',
          'Verification is required before publishing job offers. Submit your documents to get verified.',
        ),
      });
      setStartupModalOpen(true);
      return;
    }

    setPostJobError('');
    setPostJobModalOpen(true);
  }, [isStartupVerified, startupId]);

  const filteredJobs = useMemo(() => {
    return normalizedJobs.filter((job) => {
      const matchesSearch =
        !searchTerm.trim() ||
        [job.title, job.company_name, job.location, job.description]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

      const matchesFilters = selectedFilters.every((filterId) => {
        const predicate = filterPredicates[filterId];
        return predicate ? predicate(job) : true;
      });

      const matchesSalary = (() => {
        if (!Number.isFinite(salaryMin) || !Number.isFinite(salaryMax)) {
          return true;
        }

        const jobMin = Number.isFinite(job.salary_min_value) ? job.salary_min_value : null;
        const jobMax = Number.isFinite(job.salary_max_value) ? job.salary_max_value : null;

        if (jobMin == null && jobMax == null) {
          return true;
        }

        const effectiveMin = jobMin ?? jobMax;
        const effectiveMax = jobMax ?? jobMin;

        if (!Number.isFinite(effectiveMin) || !Number.isFinite(effectiveMax)) {
          return true;
        }

        return effectiveMax >= salaryMin && effectiveMin <= salaryMax;
      })();

      const matchesEquity = (() => {
        if (!Number.isFinite(equityMin) || !Number.isFinite(equityMax)) {
          return true;
        }

        const jobMin = Number.isFinite(job.equity_min_value) ? job.equity_min_value : null;
        const jobMax = Number.isFinite(job.equity_max_value) ? job.equity_max_value : null;

        if (jobMin == null && jobMax == null) {
          return equityMin <= 0;
        }

        const effectiveMin = jobMin ?? jobMax;
        const effectiveMax = jobMax ?? jobMin;

        if (!Number.isFinite(effectiveMin) || !Number.isFinite(effectiveMax)) {
          return equityMin <= 0;
        }

        return effectiveMax >= equityMin && effectiveMin <= equityMax;
      })();

      return matchesSearch && matchesFilters && matchesSalary && matchesEquity;
    });
  }, [normalizedJobs, searchTerm, selectedFilters, salaryMin, salaryMax, equityMin, equityMax]);

  const sortedFilteredJobs = useMemo(() => {
    const now = Date.now();
    const entries = filteredJobs.map((job, index) => ({ job, index }));

    const getSalaryScore = (job) => {
      const max = Number.isFinite(job.salary_max_value) ? job.salary_max_value : null;
      const min = Number.isFinite(job.salary_min_value) ? job.salary_min_value : null;

      if (max == null && min == null) {
        return -Infinity;
      }

      return Math.max(max ?? min ?? 0, min ?? max ?? 0);
    };

    const getEquityScore = (job) => {
      const max = Number.isFinite(job.equity_max_value) ? job.equity_max_value : null;
      const min = Number.isFinite(job.equity_min_value) ? job.equity_min_value : null;

      if (max == null && min == null) {
        return -Infinity;
      }

      return Math.max(max ?? min ?? 0, min ?? max ?? 0);
    };

    const getRecencyScore = (job, index) => {
      if (job.created_at) {
        const timestamp = new Date(job.created_at).getTime();
        if (Number.isFinite(timestamp)) {
          return timestamp;
        }
      }

      const posted = typeof job.posted === 'string' ? job.posted.toLowerCase() : '';
      const relativeMatch = posted.match(/(\d+)\s+(hour|day|week|month)/);
      if (relativeMatch) {
        const amount = Number.parseInt(relativeMatch[1], 10);
        const unit = relativeMatch[2];
        const unitMs = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        }[unit];

        if (Number.isFinite(amount) && unitMs) {
          return now - amount * unitMs;
        }
      }

      if (posted.includes('today')) {
        return now;
      }

      return Number.MAX_SAFE_INTEGER - index;
    };

    const sorted = entries.sort((a, b) => {
      if (jobSort === 'salary_desc') {
        return getSalaryScore(b.job) - getSalaryScore(a.job);
      }

      if (jobSort === 'equity_desc') {
        return getEquityScore(b.job) - getEquityScore(a.job);
      }

      return getRecencyScore(b.job, b.index) - getRecencyScore(a.job, a.index);
    });

    return sorted.map((entry) => entry.job);
  }, [filteredJobs, jobSort]);

  const jobsForDisplay = useMemo(() => {
    if (activeTab !== 'general') {
      return sortedFilteredJobs;
    }

    return sortedFilteredJobs.slice(0, 5);
  }, [activeTab, sortedFilteredJobs]);

  const showSeeMoreOpportunities = activeTab === 'general' && sortedFilteredJobs.length > jobsForDisplay.length;

  const savedJobList = useMemo(() => {
    if (!user || user.type !== 'student') {
      return [];
    }
    return normalizedJobs.filter((job) => savedJobs.includes(job.id));
  }, [normalizedJobs, savedJobs, user]);

  const openApplyModal = (job) => {
    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({
        type: 'info',
        message: translate('jobs.applyPromptLogin', 'Create a profile to apply to roles.'),
      });
      return;
    }

    if (user.type !== 'student') {
      setFeedback({
        type: 'info',
        message: translate('jobs.applyPromptStudent', 'Switch to a student account to apply.'),
      });
      return;
    }

    if (!emailVerified) {
      setFeedback({
        type: 'info',
        message: translate('jobs.applyPromptVerify', 'Please verify your email address before applying.'),
      });
      return;
    }

    const jobIdKey = getJobIdKey(job.id);
    if (jobIdKey && appliedJobSet.has(jobIdKey)) {
      setFeedback({
        type: 'info',
        message: translate('jobs.alreadyApplied', 'You already applied to this role.'),
      });
      return;
    }

    setApplicationModal(job);
    setAcknowledgeShare(false);
    setMotivationalLetterUrl('');
    setMotivationalLetterName('');
    setApplicationError('');
    const hasProfileCv = !!profileForm.cv_url;
    setUseExistingCv(hasProfileCv);
    setApplicationCvUrl('');
    setApplicationCvName('');
  };

  const closeApplicationModal = () => {
    setApplicationModal(null);
    setMotivationalLetterUrl('');
    setMotivationalLetterName('');
    setApplicationError('');
    setUseExistingCv(!!profileForm.cv_url);
    setApplicationCvUrl('');
    setApplicationCvName('');
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordResetError('');
  };

  const closeSecurityModal = () => {
    setSecurityModalOpen(false);
    setSecurityOldPassword('');
    setSecurityNewPassword('');
    setSecurityConfirmPassword('');
    setSecurityError('');
    setSecurityEmail(user?.email ?? '');
    setSecurityEmailMessage('');
    setSecurityEmailSaving(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowNewConfirm(false);
  };

  const uploadFile = useCallback(
    async (bucket, file, options = {}) => {
      if (!file) {
        return null;
      }

      if (!user?.id) {
        throw new Error(
          translate('uploads.errors.authRequired', 'Sign in to upload files before trying again.')
        );
      }

      const extension = getFileExtension(file.name) || 'file';
      const nameWithoutExtension = file.name
        .replace(/\.[^/.]+$/, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const sanitizedPrefix = options.prefix
        ? options.prefix
            .split('/')
            .map((segment) =>
              segment
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_.-]+/g, '-')
                .replace(/^-+|-+$/g, '')
            )
            .filter(Boolean)
            .join('/')
        : '';
      const baseName = nameWithoutExtension || 'document';

      const attemptUpload = async (prefix) => {
        const normalizedPrefix = prefix ? prefix.replace(/\/+$/, '') : '';
        const pathSegments = [];
        if (normalizedPrefix) {
          pathSegments.push(normalizedPrefix);
        }
        pathSegments.push(user.id);
        const filePath = `${pathSegments.join('/')}/${Date.now()}-${baseName}.${extension}`;
        const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

        if (error) {
          throw error;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        return publicUrl;
      };

      try {
        const uploadedUrl = await attemptUpload(sanitizedPrefix);
        if (!uploadedUrl) {
          throw new Error(
            translate('uploads.errors.noPublicUrl', 'Upload did not return a public URL.')
          );
        }
        return uploadedUrl;
      } catch (error) {
        const message = error?.message?.toLowerCase?.() ?? '';
        if (message.includes('row-level security')) {
          const fallbackPrefix = sanitizedPrefix
            ? sanitizedPrefix.startsWith('profiles')
              ? sanitizedPrefix
              : `profiles/${sanitizedPrefix}`
            : 'profiles';
          const fallbackUrl = await attemptUpload(fallbackPrefix);
          if (!fallbackUrl) {
            throw new Error(
              translate('uploads.errors.noPublicUrl', 'Upload did not return a public URL.')
            );
          }
          return fallbackUrl;
        }
        throw error;
      }
    },
    [translate, user?.id]
  );

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    try {
      const isStudentProfile = user.type === 'student';
      const trimmedFullName = profileForm.full_name?.trim?.() ?? '';
      const trimmedUniversity = profileForm.university?.trim?.() ?? '';
      const trimmedProgram = profileForm.program?.trim?.() ?? '';
      const trimmedExperience = profileForm.experience?.trim?.() ?? '';
      const trimmedBio = profileForm.bio?.trim?.() ?? '';
      const trimmedPortfolio = profileForm.portfolio_url?.trim?.() ?? '';

      const plannedUpdates = {
        user_id: user.id,
        type: user.type,
        full_name: trimmedFullName,
        university: trimmedUniversity,
        program: trimmedProgram,
        experience: trimmedExperience,
        bio: trimmedBio,
        portfolio_url: trimmedPortfolio,
        avatar_url: profileForm.avatar_url || null,
      };

      if (isStudentProfile) {
        plannedUpdates.cv_url = profileForm.cv_url || null;
        if (profileColumnPresence.cv_public !== false) {
          plannedUpdates.cv_public = profileForm.cv_public;
        }
      } else {
        if (profileColumnPresence.cv_url !== false) {
          plannedUpdates.cv_url = null;
        }
        if (profileColumnPresence.cv_public !== false) {
          plannedUpdates.cv_public = false;
        }
      }

      const filterUnsupportedColumns = (payload) =>
        Object.entries(payload).reduce((accumulator, [key, value]) => {
          if (profileColumnPresence[key] === false) {
            return accumulator;
          }
          if (value === undefined) {
            return accumulator;
          }
          accumulator[key] = value;
          return accumulator;
        }, {});

      let attemptPayload = filterUnsupportedColumns(plannedUpdates);

      if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'user_id')) {
        attemptPayload.user_id = user.id;
      }

      let upsertedProfile = null;
      let cachedFallbackProfile = null;

      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(attemptPayload, { onConflict: 'user_id' })
          .select('*')
          .single();

        if (!error) {
          upsertedProfile = data;
          setProfileColumnPresence((previous) => {
            const next = { ...previous };
            Object.keys(attemptPayload).forEach((key) => {
              next[key] = true;
            });
            return next;
          });
          break;
        }

        const missingColumn = detectMissingColumn(error.message, 'profiles');
        if (!missingColumn) {
          const message = error.message?.toLowerCase?.() || '';
          if (message.includes('row-level security')) {
            cachedFallbackProfile = {
              ...(profile ?? {}),
              ...attemptPayload,
              user_id: user.id,
            };
            if (!cachedFallbackProfile.id) {
              cachedFallbackProfile.id = profile?.id || profile?.user_id || user.id;
            }
            break;
          }
          throw error;
        }

        setProfileColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));

        if (missingColumn === 'cv_public') {
          setProfileForm((prev) => ({ ...prev, cv_public: false }));
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
          throw error;
        }

        const { [missingColumn]: _omitted, ...rest } = attemptPayload;
        attemptPayload = rest;

        if (!Object.keys(attemptPayload).length) {
          throw error;
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'user_id')) {
          attemptPayload.user_id = user.id;
        }
      }

      const supportsCvVisibility =
        isStudentProfile && Object.prototype.hasOwnProperty.call(attemptPayload, 'cv_public');

      const mergedProfile = upsertedProfile
        ? { ...(profile ?? {}), ...upsertedProfile }
        : cachedFallbackProfile
          ? { ...cachedFallbackProfile }
          : { ...(profile ?? {}), ...attemptPayload };

      if (!mergedProfile.id) {
        mergedProfile.id = profile?.id || profile?.user_id || user.id;
      }
      mergedProfile.user_id = user.id;
      mergedProfile.type = user.type;

      const sanitizedProfile = isStudentProfile
        ? mergedProfile
        : { ...mergedProfile, cv_url: null, cv_public: false };

      setProfile(sanitizedProfile);
      setProfileForm({
        full_name: sanitizedProfile.full_name || '',
        university: sanitizedProfile.university || '',
        program: sanitizedProfile.program || '',
        experience: sanitizedProfile.experience || '',
        bio: sanitizedProfile.bio || '',
        portfolio_url: sanitizedProfile.portfolio_url || '',
        cv_url: isStudentProfile ? sanitizedProfile.cv_url || '' : '',
        cv_file_name: isStudentProfile
          ? sanitizedProfile.cv_file_name || getFileNameFromUrl(sanitizedProfile.cv_url)
          : '',
        avatar_url: sanitizedProfile.avatar_url || '',
        cv_public: supportsCvVisibility ? !!sanitizedProfile.cv_public : false,
      });
      writeCachedProfile(user.id, sanitizedProfile);
      if (!cachedFallbackProfile) {
        await loadProfile(
          {
            id: user.id,
            name: user.name,
            type: user.type,
          },
          { overwriteDraft: true }
        );
      }
      const savedMessage = translate('toasts.saved', 'Saved successfully!');
      showToast(savedMessage);
      clearFeedback();
      setProfileModalOpen(false);
    } catch (error) {
      const rawMessage = error?.message?.trim?.();
      const message = rawMessage || translate('common.errors.unknown', 'Unknown error');
      setFeedback({
        type: 'error',
        message: translate('profileModal.errors.save', 'Could not save profile: {{message}}', {
          message,
        }),
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleStartupSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setStartupSaving(true);
    try {
      const trimmedName = startupForm.name?.trim?.() || user.name || '';
      const trimmedRegistry = startupForm.registry_number?.trim?.() ?? '';
      const trimmedDescription = startupForm.description?.trim?.() ?? '';
      const trimmedWebsite = startupForm.website?.trim?.() ?? '';
      const trimmedLogo = startupForm.logo_url?.trim?.() ?? '';
      const trimmedTeam = startupForm.team_size?.trim?.() ?? '';
      const trimmedFundraising = startupForm.fundraising?.trim?.() ?? '';
      const trimmedInfoLink = startupForm.info_link?.trim?.() ?? '';

      const basePayload = { owner_id: user.id };
      const assignBaseField = (key, value) => {
        if (value === undefined) {
          return;
        }
        if (key !== 'owner_id' && startupColumnPresence[key] === false) {
          return;
        }
        basePayload[key] = value;
      };

      assignBaseField('name', trimmedName);
      assignBaseField('registry_number', trimmedRegistry || null);
      assignBaseField('description', trimmedDescription || null);
      assignBaseField('website', trimmedWebsite || null);
      assignBaseField('logo_url', trimmedLogo || null);

      const dynamicAssignments = [];
      const registerDynamicField = (keys, rawValue) => {
        if (!Array.isArray(keys) || keys.length === 0) {
          return;
        }
        const normalizedKeys = keys.filter(Boolean);
        if (normalizedKeys.length === 0) {
          return;
        }

        const trimmedValue = rawValue?.trim?.() ?? '';
        const value = trimmedValue || null;

        let selectedIndex = normalizedKeys.findIndex((key) => startupColumnPresence[key] === true);
        if (selectedIndex === -1) {
          selectedIndex = normalizedKeys.findIndex((key) => startupColumnPresence[key] !== false);
        }

        if (selectedIndex === -1) {
          return;
        }

        const currentKey = normalizedKeys[selectedIndex];
        basePayload[currentKey] = value;
        dynamicAssignments.push({ keys: normalizedKeys, selectedIndex, currentKey, value });
      };

      registerDynamicField(STARTUP_TEAM_FIELDS, trimmedTeam);
      registerDynamicField(STARTUP_FUNDRAISING_FIELDS, trimmedFundraising);
      registerDynamicField(STARTUP_INFO_FIELDS, trimmedInfoLink);

      let attemptPayload = { ...basePayload };
      if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'owner_id')) {
        attemptPayload.owner_id = user.id;
      }
      const removedColumns = new Set();
      let finalPayload = attemptPayload;
      let upsertedStartup = null;

      const markColumnMissing = (column) => {
        removedColumns.add(column);
        setStartupColumnPresence((previous) => ({ ...previous, [column]: false }));
      };

      const handleMissingColumn = (column) => {
        if (!column) {
          return;
        }

        if (Object.prototype.hasOwnProperty.call(attemptPayload, column)) {
          const { [column]: _omitted, ...rest } = attemptPayload;
          attemptPayload = rest;
        }

        const assignment = dynamicAssignments.find((entry) => entry.keys.includes(column));
        markColumnMissing(column);

        if (!assignment || assignment.currentKey !== column) {
          return;
        }

        for (let index = assignment.selectedIndex + 1; index < assignment.keys.length; index += 1) {
          const nextKey = assignment.keys[index];
          if (removedColumns.has(nextKey)) {
            continue;
          }
          if (startupColumnPresence[nextKey] === false) {
            continue;
          }
          attemptPayload[nextKey] = assignment.value;
          assignment.selectedIndex = index;
          assignment.currentKey = nextKey;
          return;
        }

        assignment.exhausted = true;
      };

      while (Object.keys(attemptPayload).length > 0) {
        const { data, error } = await supabase
          .from('startups')
          .upsert(attemptPayload, { onConflict: 'owner_id' })
          .select('*')
          .single();

        if (!error) {
          upsertedStartup = data;
          finalPayload = attemptPayload;
          break;
        }

        const missingColumn = detectMissingColumn(error.message, 'startups');
        if (!missingColumn) {
          throw error;
        }

        if (
          removedColumns.has(missingColumn) &&
          !Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)
        ) {
          throw error;
        }

        handleMissingColumn(missingColumn);

        if (Object.keys(attemptPayload).length === 0) {
          throw error;
        }

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, 'owner_id')) {
          attemptPayload.owner_id = user.id;
        }
      }

      if (!upsertedStartup) {
        throw new Error(translate('common.errors.unknown', 'Unknown error'));
      }

      setStartupColumnPresence((previous) => {
        const next = { ...previous };
        Object.keys(finalPayload || {}).forEach((column) => {
          next[column] = true;
        });
        dynamicAssignments.forEach((assignment) => {
          if (assignment.currentKey) {
            next[assignment.currentKey] = true;
          }
        });
        return next;
      });

      const savedRecord = { ...(startupProfile ?? {}), ...upsertedStartup };
      setStartupProfile(savedRecord);
      upsertCompanyFromStartup(savedRecord);

      const nextTeam = firstNonEmpty(
        savedRecord.team,
        savedRecord.team_size,
        savedRecord.employees,
        savedRecord.headcount
      );
      const nextFundraising = firstNonEmpty(
        savedRecord.fundraising,
        savedRecord.total_funding,
        savedRecord.total_raised,
        savedRecord.funding
      );
      const nextInfoLink = firstNonEmpty(
        savedRecord.info_link,
        savedRecord.profile_link,
        savedRecord.external_profile,
        savedRecord.external_profile_url
      );

      setStartupForm({
        name: savedRecord.name || trimmedName,
        registry_number: savedRecord.registry_number || '',
        description: savedRecord.description || '',
        website: savedRecord.website || '',
        logo_url: savedRecord.logo_url || '',
        verification_status: savedRecord.verification_status || 'unverified',
        verification_note: savedRecord.verification_note || '',
        team_size: nextTeam || '',
        fundraising: nextFundraising || '',
        info_link: nextInfoLink || '',
      });

      const savedMessage = translate(
        'startupModal.feedback.saved',
        'Saved successfully! Verification updates will appear here.',
      );
      const toastMessage = translate('toasts.saved', 'Saved successfully!');
      showToast(toastMessage);
      setFeedback({
        type: 'info',
        message: savedMessage,
      });
      setStartupModalOpen(false);
    } catch (error) {
      const rawMessage = error?.message?.trim?.();
      const message = rawMessage || translate('common.errors.unknown', 'Unknown error');
      setFeedback({
        type: 'error',
        message: translate('startupModal.errors.save', 'Could not save startup profile: {{message}}', {
          message,
        }),
      });
    } finally {
      setStartupSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('avatars', file);
      if (!publicUrl) {
        throw new Error(
          translate('profileModal.errors.photoNoUrl', 'Profile photo upload did not return a URL.')
        );
      }
      setProfileForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      setFeedback({
        type: 'success',
        message: translate(
          'profileModal.feedback.avatarSuccess',
          'Profile photo uploaded. Save your profile to keep it.'
        ),
      });
    } catch (error) {
      const rawMessage = error?.message?.trim?.();
      const message = rawMessage || translate('common.errors.unknown', 'Unknown error');
      setFeedback({
        type: 'error',
        message: translate('profileModal.errors.photoUpload', 'Avatar upload failed: {{message}}', {
          message,
        }),
      });
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      if (event.target) {
        event.target.value = '';
      }
    };

    const previousCvUrl = profileForm.cv_url || '';
    const previousCvFileName = profileForm.cv_file_name || '';

    setCvUploadError('');

    if (user?.type !== 'student') {
      const message = translate(
        'profileModal.errors.cvStudentOnly',
        'Only student accounts can upload a CV.',
      );
      setCvUploadState('error');
      setCvLocalName(previousCvFileName);
      setFeedback({
        type: 'info',
        message,
      });
      setCvUploadError(message);
      resetInput();
      return;
    }

    if (!isAllowedDocumentFile(file)) {
      const message = translate(
        'profileModal.errors.cvInvalidType',
        'Upload CV as .pdf, .doc, .docx, or .tex only.',
      );
      setCvUploadState('error');
      setCvLocalName(previousCvFileName);
      setFeedback({
        type: 'error',
        message,
      });
      setCvUploadError(message);
      resetInput();
      return;
    }

    setCvUploadState('uploading');
    setCvLocalName(file.name || previousCvFileName);

    try {
      const publicUrl = await uploadFile('cvs', file, { prefix: 'profiles' });
      if (!publicUrl) {
        throw new Error(translate('profileModal.errors.cvNoUrl', 'CV upload did not return a URL.'));
      }
      const normalizedUrl = publicUrl.trim?.() || publicUrl;
      lastUploadedCvRef.current = normalizedUrl;
      const currentFormSnapshot = profileForm;
      setProfileForm((prev) => ({ ...prev, cv_url: normalizedUrl, cv_file_name: file.name || '' }));
      setProfile((prev) => {
        if (!user?.id) {
          return prev;
        }

        const nextProfile = prev
          ? { ...prev, cv_url: normalizedUrl, cv_file_name: file.name || prev.cv_file_name || '' }
          : {
              id: user.id,
              user_id: user.id,
              type: user.type,
              full_name: currentFormSnapshot.full_name || user.name || '',
              university: currentFormSnapshot.university || '',
              program: currentFormSnapshot.program || '',
              experience: currentFormSnapshot.experience || '',
              bio: currentFormSnapshot.bio || '',
              portfolio_url: currentFormSnapshot.portfolio_url || '',
              avatar_url: currentFormSnapshot.avatar_url || '',
              cv_public: !!currentFormSnapshot.cv_public,
              cv_url: normalizedUrl,
              cv_file_name: file.name || '',
            };

        writeCachedProfile(user.id, nextProfile);
        return nextProfile;
      });
      setUseExistingCv(true);
      setCvUploadState('success');
      setCvUploadError('');
      setFeedback({
        type: 'success',
        message: translate(
          'profileModal.feedback.cvSuccess',
          'CV uploaded. Save your profile to keep it updated.'
        ),
      });
    } catch (error) {
      const message = error?.message?.toLowerCase?.().includes('row-level security')
        ? translate(
            'profileModal.errors.cvRowLevelSecurity',
            'CV upload failed: your account is not allowed to store documents in that folder. Please try again or update your profile CV instead.'
          )
        : translate('profileModal.errors.cvUpload', 'CV upload failed: {{message}}', {
            message: error?.message?.trim?.() || translate('common.errors.unknown', 'Unknown error'),
          });
      setCvUploadState('error');
      setCvLocalName(previousCvFileName);
      setCvUploadError(message);
      setFeedback({ type: 'error', message });
      setProfileForm((prev) => ({ ...prev, cv_url: previousCvUrl, cv_file_name: previousCvFileName }));
    } finally {
      resetInput();
    }
  };

  const handleCvRemove = () => {
    if (cvUploadState === 'uploading') {
      return;
    }

    const currentFormSnapshot = profileForm;

    setCvUploadError('');
    setCvUploadState('idle');
    setCvLocalName('');
    lastUploadedCvRef.current = '';
    setUseExistingCv(false);

    setProfileForm((prev) => ({ ...prev, cv_url: '', cv_file_name: '', cv_public: false }));

    setProfile((prev) => {
      if (!user?.id) {
        return prev;
      }

      const baseProfile = prev
        ? { ...prev }
        : {
            id: user.id,
            user_id: user.id,
            type: user.type,
            full_name: currentFormSnapshot.full_name || user.name || '',
            university: currentFormSnapshot.university || '',
            program: currentFormSnapshot.program || '',
            experience: currentFormSnapshot.experience || '',
            bio: currentFormSnapshot.bio || '',
            portfolio_url: currentFormSnapshot.portfolio_url || '',
            avatar_url: currentFormSnapshot.avatar_url || '',
          };

      const nextProfile = {
        ...baseProfile,
        cv_url: null,
        cv_file_name: '',
        cv_public: false,
      };

      writeCachedProfile(user.id, nextProfile);
      return nextProfile;
    });

    const removalMessage = translate(
      'profileModal.feedback.cvRemoved',
      'CV removed. Save your profile to update it.',
    );

    setFeedback({
      type: 'info',
      message: removalMessage,
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('logos', file);
      if (!publicUrl) {
        throw new Error(translate('profileModal.errors.logoNoUrl', 'Logo upload did not return a URL.'));
      }
      setStartupForm((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (error) {
      const rawMessage = error?.message?.trim?.();
      const message = rawMessage || translate('common.errors.unknown', 'Unknown error');
      setFeedback({
        type: 'error',
        message: translate('profileModal.errors.logoUpload', 'Logo upload failed: {{message}}', {
          message,
        }),
      });
    }
  };

  const startupVerificationStatusKey = startupForm.verification_status || 'unverified';
  const startupVerificationStatusFallback =
    startupVerificationStatusKey === 'verified'
      ? 'Verified'
      : startupVerificationStatusKey === 'pending'
        ? 'Pending'
        : 'Unverified';
  const startupVerificationStatusLabel = translate(
    `startupModal.verification.statuses.${startupVerificationStatusKey}`,
    startupVerificationStatusFallback
  );

  const jobSalaryCadence = normalizeSalaryCadence(jobForm.salary_cadence);
  const jobSalaryIsBracket = Boolean(jobForm.salary_is_bracket);
  const jobLanguageSelection = Array.isArray(jobForm.language_requirements)
    ? jobForm.language_requirements
    : [];
  const jobSalaryLabel = jobSalaryIsBracket
    ? translate('jobForm.labels.salaryRange', 'Salary range')
    : translate('jobForm.labels.salary', 'Salary');
  const jobSalaryMinLabel = jobSalaryIsBracket
    ? translate('jobForm.labels.salaryMin', 'Min')
    : translate('jobForm.labels.salaryAmount', 'Amount');
  const jobSalaryMaxLabel = translate('jobForm.labels.salaryMax', 'Max');
  const jobSalaryMinimum = jobSalaryCadence ? SALARY_MINIMUMS_BY_CADENCE[jobSalaryCadence] : null;
  const jobSalaryCadenceLabel = jobSalaryCadence
    ? translate(
        `jobForm.salary.cadence.${jobSalaryCadence}`,
        SALARY_CADENCE_LABELS[jobSalaryCadence] || jobSalaryCadence,
      )
    : '';
  const jobIsPartTime = jobForm.employment_type === 'Part-time';
  const jobWeeklyHoursInput = jobIsPartTime ? parseWeeklyHoursValue(jobForm.weekly_hours) : null;
  const jobWeeklyHoursLabel = jobIsPartTime && Number.isFinite(jobWeeklyHoursInput)
    ? formatWeeklyHoursLabel(jobWeeklyHoursInput)
    : '';
  const jobSalaryHelperExtra = jobIsPartTime
    ? Number.isFinite(jobWeeklyHoursInput)
      ? translate('jobForm.salary.helper.partTimeHours', 'Calculations will use {{hours}}.', {
          hours: jobWeeklyHoursLabel,
        })
      : translate('jobForm.salary.helper.partTimeMissing', 'Add weekly hours so we can convert part-time pay.')
    : '';
  const jobSalaryTypeLabel = translate(
    jobSalaryIsBracket ? 'jobForm.salary.types.bracket' : 'jobForm.salary.types.single',
    jobSalaryIsBracket ? 'amounts for your bracket' : 'amount',
  );
  const jobSalaryHelperText = jobSalaryCadence
    ? translate(
        jobSalaryIsBracket ? 'jobForm.salary.helper.bracket' : 'jobForm.salary.helper.single',
        'Enter CHF {{cadence}} {{type}} (minimum CHF {{minimum}}).{{extra}}',
        {
          cadence: jobSalaryCadenceLabel,
          type: jobSalaryTypeLabel,
          minimum: jobSalaryMinimum,
          extra: jobSalaryHelperExtra ? ` ${jobSalaryHelperExtra}` : '',
        },
      )
    : translate('jobForm.salary.helper.chooseCadence', 'Choose the salary cadence before entering amounts.');
  const jobSalaryPlaceholder = jobSalaryCadence ? SALARY_PLACEHOLDER_BY_CADENCE[jobSalaryCadence] : '';
  const jobSalaryPlaceholderText = jobSalaryCadence
    ? translate('jobForm.salary.placeholder.example', 'e.g. {{example}}', { example: jobSalaryPlaceholder })
    : translate('jobForm.salary.placeholder.fallback', 'Select cadence first');
  const jobSalaryPreview = useMemo(() => {
    const cadence = normalizeSalaryCadence(jobForm.salary_cadence);
    if (!cadence) {
      return '';
    }

    const isPartTimeRole = jobForm.employment_type === 'Part-time';
    const weeklyHoursInput = isPartTimeRole ? parseWeeklyHoursValue(jobForm.weekly_hours) : null;
    if (isPartTimeRole && !Number.isFinite(weeklyHoursInput)) {
      return '';
    }

    const min = Number.parseFloat((jobForm.salary_min || '').replace(',', '.'));
    if (!Number.isFinite(min)) {
      return '';
    }

    let max = min;
    if (jobSalaryIsBracket) {
      const maxCandidate = Number.parseFloat((jobForm.salary_max || '').replace(',', '.'));
      if (!Number.isFinite(maxCandidate)) {
        return '';
      }
      max = maxCandidate;
    }

    const hoursForPreview = isPartTimeRole ? weeklyHoursInput : FULL_TIME_WEEKLY_HOURS;
    const monthlyMin = convertCadenceValueToMonthly(min, cadence, hoursForPreview);
    const monthlyMax = convertCadenceValueToMonthly(max, cadence, hoursForPreview);

    if (!Number.isFinite(monthlyMin) || !Number.isFinite(monthlyMax)) {
      return '';
    }

    const monthlyLabel = formatRangeLabel(monthlyMin, monthlyMax, 'CHF / month');
    const yearlyLabel = formatRangeLabel(
      monthlyMin * THIRTEENTH_MONTHS_PER_YEAR,
      monthlyMax * THIRTEENTH_MONTHS_PER_YEAR,
      'CHF / year (13th salary)'
    );

    const previews = [];

    if (monthlyLabel) {
      previews.push(monthlyLabel);
    }

    if (jobForm.employment_type === 'Full-time' && yearlyLabel) {
      previews.push(yearlyLabel);
    }

    if (isPartTimeRole && Number.isFinite(weeklyHoursInput)) {
      previews.push(formatWeeklyHoursLabel(weeklyHoursInput));
    }

    return previews.join(' · ');
  }, [
    jobForm.salary_cadence,
    jobForm.salary_min,
    jobForm.salary_max,
    jobSalaryIsBracket,
    jobForm.employment_type,
    jobForm.weekly_hours,
  ]);

  const handleJobSalaryCadenceChange = useCallback((nextValue) => {
    setJobForm((prev) => ({
      ...prev,
      salary_cadence: nextValue,
      salary_min: '',
      salary_max: '',
    }));
  }, []);

  const handleJobLanguageToggle = useCallback((languageValue) => {
    setJobForm((prev) => {
      const current = Array.isArray(prev.language_requirements) ? prev.language_requirements : [];
      const exists = current.includes(languageValue);
      const next = exists
        ? current.filter((value) => value !== languageValue)
        : [...current, languageValue];
      const ordered = LANGUAGE_OPTIONS.map((option) => option.value).filter((value) => next.includes(value));
      return { ...prev, language_requirements: ordered };
    });
  }, []);

  const handleJobSalaryBracketChange = useCallback((nextValue) => {
    setJobForm((prev) => ({
      ...prev,
      salary_is_bracket: nextValue,
      salary_max: nextValue ? prev.salary_max : '',
    }));
  }, []);

  const handleJobEquityBlur = () => {
    setJobForm((prev) => {
      const currentValue = prev.equity ?? '';
      const sanitized = sanitizeDecimalInput(currentValue);
      if (!sanitized) {
        return { ...prev, equity: '' };
      }

      const numeric = Number.parseFloat(sanitized.replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        return { ...prev, equity: '' };
      }

      const clampedValue = clamp(numeric, 0.1, 100);
      const formatted = formatEquityValue(clampedValue);
      const usesComma = currentValue.includes(',');

      return {
        ...prev,
        equity: usesComma ? formatted.replace('.', ',') : formatted,
      };
    });
  };

  const handleJobWeeklyHoursBlur = () => {
    let convertedToFullTime = false;
    setJobForm((prev) => {
      if (prev.employment_type !== 'Part-time') {
        return prev;
      }

      const sanitized = sanitizeDecimalInput(prev.weekly_hours ?? '');
      if (!sanitized) {
        return { ...prev, weekly_hours: '' };
      }

      const numeric = Number.parseFloat(sanitized.replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        return { ...prev, weekly_hours: '' };
      }

      if (numeric > 40) {
        convertedToFullTime = true;
        return {
          ...prev,
          employment_type: 'Full-time',
          weekly_hours: '',
        };
      }

      const normalized = Number.isInteger(numeric)
        ? String(numeric)
        : formatEquityValue(numeric).replace('%', '');

      return {
        ...prev,
        weekly_hours: normalized,
      };
    });

    if (convertedToFullTime) {
      setFeedback({
        type: 'info',
        message: translate(
          'jobForm.info.partTimeAutoFullTime',
          'Part-time roles over 40h/week switch to full-time automatically.',
        ),
      });
    }
  };

  const handleInternshipDurationBlur = () => {
    let clamped = false;
    setJobForm((prev) => {
      if (prev.employment_type !== 'Internship') {
        return prev;
      }

      const raw = prev.internship_duration_months ?? '';
      const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);

      if (!Number.isFinite(numeric)) {
        return { ...prev, internship_duration_months: '' };
      }

      const limited = clamp(numeric, 1, 12);
      clamped = limited !== numeric;

      return {
        ...prev,
        internship_duration_months: String(limited),
      };
    });

    if (clamped) {
      setFeedback({
        type: 'info',
        message: translate(
          'jobForm.errors.internshipDurationTooLong',
          'Internships can run for a maximum of 12 months.',
        ),
      });
    }
  };

  const handlePostJobSubmit = async (event) => {
    event.preventDefault();
    if (!startupProfile?.id || !user) {
      setPostJobError(
        translate('jobForm.errors.startupProfileIncomplete', 'Complete your startup profile before posting a job.'),
      );
      return;
    }

    if (!isStartupVerified) {
      setPostJobError(
        translate('jobForm.errors.verificationRequired', 'Only verified startups can publish job opportunities.'),
      );
      return;
    }

    setPostingJob(true);
    setPostJobError('');

    try {
      const locationSelection = jobForm.location?.trim() ?? '';
      if (!isAllowedSwissLocation(locationSelection)) {
        setPostJobError(
          translate(
            'jobForm.errors.locationInvalid',
            'Choose a Swiss city, canton, or remote option from the list.',
          ),
        );
        setPostingJob(false);
        return;
      }

      const locationOption = SWISS_LOCATION_OPTIONS.find(
        (option) => normalizeLocationValue(option.value) === normalizeLocationValue(locationSelection),
      );
      const locationValue = locationOption ? locationOption.value : locationSelection;

      const arrangementSelection = jobForm.work_arrangement?.trim() ?? '';
      if (!WORK_ARRANGEMENT_VALUES.has(arrangementSelection)) {
        setPostJobError(
          translate(
            'jobForm.errors.workArrangementMissing',
            'Select whether the role is on-site, hybrid, or remote.',
          ),
        );
        setPostingJob(false);
        return;
      }

      const languageSelection = Array.isArray(jobForm.language_requirements)
        ? jobForm.language_requirements.filter(Boolean)
        : [];
      const canonicalLanguageSelection = Array.from(
        new Set(languageSelection.map(mapLanguageValueToCanonical).filter(Boolean)),
      );

      if (canonicalLanguageSelection.length === 0) {
        setPostJobError(
          translate(
            'jobForm.errors.languagesMissing',
            'Select at least one language applicants must be comfortable using.',
          ),
        );
        setPostingJob(false);
        return;
      }

      const cadenceSelection = normalizeSalaryCadence(jobForm.salary_cadence) || null;
      if (!cadenceSelection) {
        setPostJobError(
          translate(
            'jobForm.errors.salaryCadenceMissing',
            'Select whether the salary is hourly, weekly, monthly, or yearly.',
          ),
        );
        setPostingJob(false);
        return;
      }

      const salaryIsBracket = Boolean(jobForm.salary_is_bracket);
      const salaryMinRaw = jobForm.salary_min?.trim() ?? '';
      const salaryMaxRaw = salaryIsBracket ? jobForm.salary_max?.trim() ?? '' : salaryMinRaw;

      const salaryMinValue = Number.parseFloat(salaryMinRaw.replace(',', '.'));
      const salaryMaxValueInput = Number.parseFloat(salaryMaxRaw.replace(',', '.'));

      if (!Number.isFinite(salaryMinValue)) {
        setPostJobError(
          translate('jobForm.errors.salaryMinMissing', 'Enter the minimum salary before posting the role.'),
        );
        setPostingJob(false);
        return;
      }

      const cadenceMinimum = SALARY_MINIMUMS_BY_CADENCE[cadenceSelection] ?? 0;
      const cadenceLabel = SALARY_CADENCE_LABELS[cadenceSelection] || cadenceSelection;

      if (salaryMinValue < cadenceMinimum) {
        setPostJobError(
          translate('jobForm.errors.salaryMinBelowMinimum', 'Minimum {{cadence}} salary must be at least CHF {{minimum}}.', {
            cadence: cadenceLabel,
            minimum: cadenceMinimum,
          }),
        );
        setPostingJob(false);
        return;
      }

      let salaryMaxValue = salaryMinValue;

      if (salaryIsBracket) {
        if (!Number.isFinite(salaryMaxValueInput)) {
          setPostJobError(
            translate('jobForm.errors.salaryMaxMissing', 'Enter the maximum salary for the bracket.'),
          );
          setPostingJob(false);
          return;
        }

        salaryMaxValue = salaryMaxValueInput;

        if (salaryMaxValue < salaryMinValue) {
          setPostJobError(
            translate('jobForm.errors.salaryMaxLessThanMin', 'Maximum salary cannot be lower than the minimum salary.'),
          );
          setPostingJob(false);
          return;
        }

        if (salaryMaxValue < cadenceMinimum) {
          setPostJobError(
            translate('jobForm.errors.salaryMaxBelowMinimum', 'Maximum {{cadence}} salary must be at least CHF {{minimum}}.', {
              cadence: cadenceLabel,
              minimum: cadenceMinimum,
            }),
          );
          setPostingJob(false);
          return;
        }
      }

      let employmentTypeForPayload = jobForm.employment_type;
      let weeklyHoursNumeric = null;
      if (employmentTypeForPayload === 'Part-time') {
        const weeklyHoursRaw = jobForm.weekly_hours?.trim() ?? '';
        const parsedWeeklyHours = parseWeeklyHoursValue(weeklyHoursRaw);
        if (!Number.isFinite(parsedWeeklyHours)) {
          setPostJobError(
            translate('jobForm.errors.weeklyHoursMissing', 'Enter the weekly working hours for part-time roles.'),
          );
          setPostingJob(false);
          return;
        }

        if (parsedWeeklyHours > 40) {
          employmentTypeForPayload = 'Full-time';
        } else {
          weeklyHoursNumeric = parsedWeeklyHours;
        }
      }

      const convertedToFullTime = jobForm.employment_type === 'Part-time' && employmentTypeForPayload === 'Full-time';

      let internshipDurationNumeric = null;
      if (employmentTypeForPayload === 'Internship') {
        const durationRaw = jobForm.internship_duration_months?.trim() ?? '';
        const parsedDuration = Number.parseInt(durationRaw, 10);

        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
          setPostJobError(
            translate('jobForm.errors.internshipDurationMissing', 'Share how many months the internship will last.'),
          );
          setPostingJob(false);
          return;
        }

        if (parsedDuration > 12) {
          setPostJobError(
            translate('jobForm.errors.internshipDurationTooLong', 'Internships can run for a maximum of 12 months.'),
          );
          setPostingJob(false);
          return;
        }

        internshipDurationNumeric = parsedDuration;
      }

      const hoursForConversion =
        employmentTypeForPayload === 'Part-time' && Number.isFinite(weeklyHoursNumeric)
          ? weeklyHoursNumeric
          : FULL_TIME_WEEKLY_HOURS;
      const monthlyMin = convertCadenceValueToMonthly(salaryMinValue, cadenceSelection, hoursForConversion);
      const monthlyMax = convertCadenceValueToMonthly(salaryMaxValue, cadenceSelection, hoursForConversion);

      if (!Number.isFinite(monthlyMin) || !Number.isFinite(monthlyMax)) {
        setPostJobError(
          translate(
            'jobForm.errors.salaryConversionFailed',
            'Could not derive CHF salary values from the provided cadence.',
          ),
        );
        setPostingJob(false);
        return;
      }

      const salaryDisplay = composeSalaryDisplay({
        baseMin: salaryMinValue,
        baseMax: salaryMaxValue,
        cadence: cadenceSelection,
      });

      const equityRaw = sanitizeDecimalInput(jobForm.equity?.trim() ?? '');
      let equityDisplay = '';
      let equityNumericValue = null;

      if (equityRaw) {
        const parsedEquity = Number.parseFloat(equityRaw.replace(',', '.'));

        if (!Number.isFinite(parsedEquity) || parsedEquity < 0.1 || parsedEquity > 100) {
          setPostJobError(
            translate('jobForm.errors.equityRange', 'Equity must be a number between 0.1 and 100.'),
          );
          setPostingJob(false);
          return;
        }

        equityNumericValue = parsedEquity;
        equityDisplay = `${formatEquityValue(parsedEquity)}%`;
      }

      const weeklyHoursLabel =
        employmentTypeForPayload === 'Part-time' && Number.isFinite(weeklyHoursNumeric)
          ? formatWeeklyHoursLabel(weeklyHoursNumeric)
          : null;

      const manualTags = jobForm.tags
        ? jobForm.tags.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
      const languageTags = canonicalLanguageSelection.map((key) => `${LANGUAGE_TAG_PREFIX}${key}`);
      const tagsWithLanguages = Array.from(new Set([...manualTags, ...languageTags]));

      const basePayload = {
        startup_id: startupProfile.id,
        title: jobForm.title.trim(),
        company_name: startupProfile.name || startupForm.name,
        location: locationValue,
        work_arrangement: arrangementSelection,
        employment_type: employmentTypeForPayload,
        salary: salaryDisplay,
        equity: equityNumericValue != null ? equityDisplay : null,
        description: jobForm.description.trim(),
        requirements: jobForm.requirements
          ? jobForm.requirements.split('\n').map((item) => item.trim()).filter(Boolean)
          : [],
        benefits: jobForm.benefits
          ? jobForm.benefits.split('\n').map((item) => item.trim()).filter(Boolean)
          : [],
        tags: tagsWithLanguages,
        motivational_letter_required: jobForm.motivational_letter_required,
        posted: 'Just now',
        salary_is_bracket: jobForm.salary_is_bracket,
      };

      const dynamicAssignments = [];
      const registerAssignment = (keys, value) => {
        if (value == null || (typeof value === 'number' && !Number.isFinite(value))) {
          return;
        }

        const normalizedKeys = keys.filter(Boolean);
        if (normalizedKeys.length === 0) {
          return;
        }

        let selectedIndex = normalizedKeys.findIndex((key) => jobColumnPresence[key] === true);
        if (selectedIndex === -1) {
          selectedIndex = normalizedKeys.findIndex((key) => jobColumnPresence[key] !== false);
        }

        if (selectedIndex === -1) {
          return;
        }

        const currentKey = normalizedKeys[selectedIndex];
        basePayload[currentKey] = value;
        dynamicAssignments.push({
          keys: normalizedKeys,
          value,
          selectedIndex,
          currentKey,
        });
      };

      registerAssignment(SALARY_MIN_FIELDS, Math.round(monthlyMin));
      registerAssignment(SALARY_MAX_FIELDS, Math.round(monthlyMax));
      registerAssignment(SALARY_PERIOD_FIELDS, cadenceSelection);

      if (employmentTypeForPayload === 'Internship' && Number.isFinite(internshipDurationNumeric)) {
        registerAssignment(INTERNSHIP_DURATION_FIELDS, internshipDurationNumeric);
      }

      if (employmentTypeForPayload === 'Part-time' && Number.isFinite(weeklyHoursNumeric)) {
        registerAssignment(WEEKLY_HOURS_VALUE_FIELDS, weeklyHoursNumeric);
      }

      if (weeklyHoursLabel) {
        registerAssignment(WEEKLY_HOURS_LABEL_FIELDS, weeklyHoursLabel);
      }

      let attemptPayload = { ...basePayload };
      const removedColumns = new Set();

      const markColumnMissing = (column) => {
        removedColumns.add(column);
        setJobColumnPresence((previous) => ({ ...previous, [column]: false }));
      };

      const handleMissingColumn = (column) => {
        if (Object.prototype.hasOwnProperty.call(attemptPayload, column)) {
          const { [column]: _omitted, ...rest } = attemptPayload;
          attemptPayload = rest;
        }

        const assignment = dynamicAssignments.find((entry) => entry.keys.includes(column));
        markColumnMissing(column);

        if (!assignment || assignment.currentKey !== column) {
          return;
        }

        for (let nextIndex = assignment.selectedIndex + 1; nextIndex < assignment.keys.length; nextIndex += 1) {
          const nextKey = assignment.keys[nextIndex];
          if (removedColumns.has(nextKey)) {
            continue;
          }

          if (jobColumnPresence[nextKey] === false) {
            continue;
          }

          attemptPayload[nextKey] = assignment.value;
          assignment.selectedIndex = nextIndex;
          assignment.currentKey = nextKey;
          return;
        }

        assignment.exhausted = true;
      };

      while (true) {
        const { error } = await supabase.from('jobs').insert(attemptPayload);
        if (!error) {
          setJobColumnPresence((previous) => {
            const next = { ...previous };
            Object.keys(attemptPayload).forEach((key) => {
              next[key] = true;
            });
            return next;
          });
          break;
        }

        const missingColumn = detectMissingColumn(error.message, 'jobs');
        if (!missingColumn) {
          setPostJobError(error.message);
          setPostingJob(false);
          return;
        }

        if (removedColumns.has(missingColumn) && !Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
          setPostJobError(error.message);
          setPostingJob(false);
          return;
        }

        handleMissingColumn(missingColumn);

        if (Object.keys(attemptPayload).length === 0) {
          setPostJobError(error.message);
          setPostingJob(false);
          return;
        }
      }

      const successMessage = translate('jobForm.toast.published', 'Job published successfully!');
      const fullTimeFeedbackMessage = translate(
        'jobForm.feedback.publishedFullTime',
        'Job published successfully! Posted as a full-time role because it exceeds 40 hours per week.',
      );
      showToast(successMessage);
      setFeedback({
        type: 'success',
        message: convertedToFullTime ? fullTimeFeedbackMessage : successMessage,
      });
      setPostJobModalOpen(false);
      setJobForm({
        title: '',
        location: '',
        work_arrangement: '',
        employment_type: 'Full-time',
        weekly_hours: '',
        internship_duration_months: '',
        salary_min: '',
        salary_max: '',
        salary_cadence: '',
        salary_is_bracket: false,
        language_requirements: [],
        equity: '',
        description: '',
        requirements: '',
        benefits: '',
        tags: '',
        motivational_letter_required: false,
      });
      setActiveTab('my-jobs');
      setJobsVersion((prev) => prev + 1);
    } catch (error) {
      setPostJobError(error.message);
    } finally {
      setPostingJob(false);
    }
  };

  const handleApplicationCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedDocumentFile(file)) {
      setApplicationError('CV must be a .pdf, .doc, .docx, or .tex file.');
      return;
    }
    try {
      const publicUrl = await uploadFile('cvs', file, { prefix: 'applications' });
      if (!publicUrl) {
        throw new Error('CV upload did not return a URL.');
      }
      setApplicationCvUrl(publicUrl);
      setApplicationCvName(file.name);
      setUseExistingCv(false);
      setApplicationError('');
    } catch (error) {
      const message = error?.message?.toLowerCase?.().includes('row-level security')
        ? 'CV upload failed: please upload the document to your profile first or try again in a moment.'
        : `CV upload failed: ${error.message}`;
      setApplicationError(message);
    }
  };

  const handleMotivationalLetterUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedDocumentFile(file)) {
      setApplicationError('Motivational letter must be a .pdf, .doc, .docx, or .tex file.');
      return;
    }

    try {
      const publicUrl = await uploadFile('cvs', file, { prefix: 'letters' });
      if (!publicUrl) {
        throw new Error('Motivational letter upload did not return a URL.');
      }
      setMotivationalLetterUrl(publicUrl);
      setMotivationalLetterName(file.name);
      setApplicationError('');
    } catch (error) {
      const message = error?.message?.toLowerCase?.().includes('row-level security')
        ? 'Motivational letter upload failed: please try again later or contact support if the issue persists.'
        : `Motivational letter upload failed: ${error.message}`;
      setApplicationError(message);
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        setFeedback({
          type: 'success',
          message: translate(
            'authModal.feedback.verificationSent',
            'Verification email sent. Check your inbox and spam folder.'
          ),
        });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginForm.email.trim()) {
      setAuthError(
        translate(
          'authModal.errors.missingEmail',
          'Enter your email above so we can send reset instructions.'
        )
      );
      return;
    }

    setForgotPasswordMessage(
      translate('authModal.forgot.sending', 'Sending reset email…')
    );
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
      });

      if (error) {
        setForgotPasswordMessage(
          translate('authModal.forgot.failed', 'Reset failed: {{message}}', {
            message: error.message,
          })
        );
      } else {
        setForgotPasswordMessage(
          translate('authModal.forgot.success', 'Check your inbox for a password reset link.')
        );
      }
    } catch (error) {
      setForgotPasswordMessage(
        translate('authModal.forgot.failed', 'Reset failed: {{message}}', {
          message: error.message,
        })
      );
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.user) {
        const mapped = mapSupabaseUser(data.user);
        setUser(mapped);
        setEmailVerified(!!data.user.email_confirmed_at);
        if (!data.user.email_confirmed_at) {
          setFeedback({
            type: 'info',
            message: translate(
              'authModal.feedback.confirmEmail',
              'Check your inbox and confirm your email to unlock all features.'
            ),
          });
        }
        setFeedback({
          type: 'success',
          message: translate('authModal.feedback.welcome', 'Welcome back, {{name}}!', {
            name: mapped.name,
          }),
        });
      }
      setLoginForm({ email: '', password: '' });
      setForgotPasswordMessage('');
      setShowLoginModal(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthError('');
    if (!registerForm.name.trim()) {
      setAuthError('Please add your name so startups know who to contact.');
      return;
    }
    if (registerForm.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (registerForm.password !== registerConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerForm.email.trim(),
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name.trim(),
            type: registerForm.type,
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      setRegisterForm({ name: '', email: '', password: '', type: 'student' });
      setRegisterConfirm('');
      if (data.user) {
        const mapped = mapSupabaseUser(data.user);
        setUser(mapped);
        setEmailVerified(!!data.user.email_confirmed_at);
        setFeedback({ type: 'success', message: 'Profile created. Let’s find your first match.' });
        setShowLoginModal(false);
      } else {
        setFeedback({
          type: 'success',
          message: 'Check your inbox to confirm your email before signing in.',
        });
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    const previousUserId = user?.id;
    await supabase.auth.signOut();
    if (previousUserId) {
      removeCachedProfile(previousUserId);
    }
    setUser(null);
    setProfile(null);
    setFeedback({ type: 'info', message: 'Signed out. Your saved roles stay here for you.' });
  };

  const submitApplication = async () => {
    if (!applicationModal || !user) return;
    if (!acknowledgeShare) {
      setApplicationError('Please acknowledge that your profile will be shared.');
      return;
    }
    if (applicationModal.motivational_letter_required && !motivationalLetterUrl) {
      setApplicationError('A motivational letter file is required for this role.');
      return;
    }

    setApplicationSaving(true);
    setApplicationError('');

    try {
      if (!profile?.id) {
        setApplicationError('Complete your student profile before applying.');
        setApplicationSaving(false);
        return;
      }

      const selectedCvUrl = useExistingCv ? profileForm.cv_url : applicationCvUrl;

      if (!selectedCvUrl) {
        setApplicationError('Upload your CV or select the one saved in your profile before applying.');
        setApplicationSaving(false);
        return;
      }

      const basePayload = {
        job_id: applicationModal.id,
        profile_id: profile.id,
      };

      const assignOptionalField = (field, value, { skipIfNull } = {}) => {
        if (applicationColumnPresence[field] === false) {
          return;
        }
        if (skipIfNull && (value == null || value === '')) {
          return;
        }
        basePayload[field] = value;
      };

      assignOptionalField('status', 'submitted');
      assignOptionalField('acknowledged', false);
      if (applicationColumnPresence.motivational_letter !== false) {
        basePayload.motivational_letter = motivationalLetterUrl || null;
      }
      assignOptionalField('cv_override_url', !useExistingCv ? selectedCvUrl : null, { skipIfNull: true });

      let attemptPayload = { ...basePayload };
      const removedColumns = new Set();
      let insertSucceeded = false;
      let lastErrorMessage = '';
      let fallbackNotice = false;

      while (Object.keys(attemptPayload).length > 0) {
        const { error } = await supabase.from('job_applications').insert(attemptPayload);

        if (!error) {
          insertSucceeded = true;
          break;
        }

        lastErrorMessage = error.message;
        const missingColumn = detectMissingColumn(error.message, 'job_applications');

        if (!missingColumn) {
          break;
        }

        if (removedColumns.has(missingColumn)) {
          break;
        }

        removedColumns.add(missingColumn);
        setApplicationColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));

        if (!Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
          break;
        }

        const { [missingColumn]: _omitted, ...rest } = attemptPayload;
        attemptPayload = rest;
      }

      if (!insertSucceeded) {
        const rowLevelSecurityError = lastErrorMessage
          ?.toLowerCase?.()
          ?.includes('row-level security');

        if (!rowLevelSecurityError) {
          setApplicationError(
            lastErrorMessage ||
              translate('applications.errors.submit', 'Could not submit application. Please try again.')
          );
          return;
        }

        fallbackNotice = true;
        console.warn('RLS prevented Supabase application insert; storing locally.');

        const now = new Date();
        const createdAt = Number.isFinite(now.getTime()) ? now.toISOString() : new Date().toISOString();
        const baseProfileCvUrl = profileForm.cv_url?.trim?.() || profile?.cv_url || '';
        const profileName =
          profileForm.full_name?.trim?.() || profile?.full_name || user?.name?.trim?.() || '';
        const companyNameSnapshot = applicationModal.company_name?.trim?.() || 'Verified startup';
        const jobTitleSnapshot = getLocalizedJobText(applicationModal, 'title') || applicationModal.title || '';
        const localStartupId = applicationModal.startup_id || null;
        const localApplicationEntry = {
          id: `local-${Date.now()}`,
          job_id: applicationModal.id,
          profile_id: profile.id,
          startup_id: localStartupId,
          status: 'submitted',
          acknowledged: false,
          motivational_letter:
            applicationColumnPresence.motivational_letter !== false ? motivationalLetterUrl || null : null,
          cv_override_url:
            applicationColumnPresence.cv_override_url !== false && !useExistingCv ? selectedCvUrl : null,
          created_at: createdAt,
          profiles: {
            id: profile.id,
            full_name: profileName,
            university: profileForm.university?.trim?.() || profile?.university || '',
            program: profileForm.program?.trim?.() || profile?.program || '',
            avatar_url: profileForm.avatar_url?.trim?.() || profile?.avatar_url || user?.avatar_url || '',
            cv_url: useExistingCv ? selectedCvUrl : baseProfileCvUrl,
          },
          jobs: {
            id: applicationModal.id,
            title: jobTitleSnapshot,
            company_name: companyNameSnapshot,
            startup_id: localStartupId,
          },
          isLocal: true,
        };
        upsertLocalApplication(localApplicationEntry);
      } else {
        const successfulColumns = Object.keys(attemptPayload).filter(
          (key) => key !== 'job_id' && key !== 'profile_id'
        );

        if (successfulColumns.length > 0) {
          setApplicationColumnPresence((previous) => {
            const next = { ...previous };
            successfulColumns.forEach((column) => {
              next[column] = true;
            });
            return next;
          });
        }
      }

      const appliedJobKey = getJobIdKey(applicationModal.id);
      if (appliedJobKey) {
        setAppliedJobs((prev) => (prev.includes(appliedJobKey) ? prev : [...prev, appliedJobKey]));
        setJobs((previousJobs) =>
          previousJobs.map((job) => {
            const jobKey = getJobIdKey(job.id);
            if (!jobKey || jobKey !== appliedJobKey) {
              return job;
            }
            const currentCountRaw = Number.isFinite(job.applicants)
              ? job.applicants
              : Number.parseInt(job.applicants, 10);
            const nextCount = Number.isFinite(currentCountRaw) ? currentCountRaw + 1 : 1;
            return { ...job, applicants: nextCount };
          })
        );
        setSelectedJob((previousSelected) => {
          if (!previousSelected) {
            return previousSelected;
          }
          const selectedKey = getJobIdKey(previousSelected.id);
          if (!selectedKey || selectedKey !== appliedJobKey) {
            return previousSelected;
          }
          const currentCountRaw = Number.isFinite(previousSelected.applicants)
            ? previousSelected.applicants
            : Number.parseInt(previousSelected.applicants, 10);
          const nextCount = Number.isFinite(currentCountRaw) ? currentCountRaw + 1 : 1;
          return { ...previousSelected, applicants: nextCount };
        });
      }
      const feedbackKey = fallbackNotice
        ? 'applications.feedback.submittedFallback'
        : 'applications.feedback.submitted';
      const feedbackMessage = translate(
        feedbackKey,
        fallbackNotice
          ? 'Application submitted! 🎉 We’ll sync it as soon as permissions update.'
          : 'Application submitted! 🎉',
      );
      setFeedback({ type: 'success', message: feedbackMessage });
      closeApplicationModal();
    } catch (error) {
      setApplicationError(error.message);
    } finally {
      setApplicationSaving(false);
    }
  };

  const updateApplicationStatus = async (applicationId, nextStatus) => {
    setApplicationStatusUpdating(applicationId);
    const targetApplication = applications.find((application) => application.id === applicationId);
    if (targetApplication?.isLocal) {
      const statusLabel = translate(
        `applications.status.${nextStatus}`,
        formatStatusKeyLabel(nextStatus)
      );
      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId ? { ...application, status: nextStatus } : application
        )
      );
      updateStoredLocalApplication(applicationId, (entry) => ({ ...entry, status: nextStatus }));
      setFeedback({
        type: 'success',
        message: translate('applications.statusFeedback', 'Application marked as {{status}}.', {
          status: statusLabel,
        }),
      });
      setApplicationStatusUpdating(null);
      return;
    }
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: nextStatus })
        .eq('id', applicationId);

      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      const statusLabel = translate(
        `applications.status.${nextStatus}`,
        formatStatusKeyLabel(nextStatus)
      );
      setFeedback({
        type: 'success',
        message: translate('applications.statusFeedback', 'Application marked as {{status}}.', {
          status: statusLabel,
        }),
      });
      setApplicationsVersion((prev) => prev + 1);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setApplicationStatusUpdating(null);
    }
  };

  const appendThreadEntry = (threadKey, entry, meta, legacyKey) => {
    if (!threadKey) {
      return;
    }

    setApplicationThreads((prev) => {
      const baseState = legacyKey && legacyKey !== threadKey ? removeThreadKeys(prev, [legacyKey]) : prev;
      const current = normalizeThreadStateValue(baseState[threadKey]);
      const mergedMeta = meta ? { ...(current.meta || {}), ...meta } : current.meta || null;
      const safeMeta = mergedMeta && Object.keys(mergedMeta).length > 0 ? mergedMeta : null;
      const nextValue = {
        entries: [...current.entries, entry],
        meta: safeMeta,
      };
      return { ...baseState, [threadKey]: nextValue };
    });
  };

  const handleApplicationThreadDraftChange = (threadKey, value, legacyKey) => {
    const cleanupKeys = legacyKey && legacyKey !== threadKey ? [legacyKey] : [];
    setApplicationThreadDrafts((prev) => {
      const cleaned = cleanupKeys.length > 0 ? removeThreadKeys(prev, cleanupKeys) : prev;
      if (!threadKey) {
        return cleaned;
      }
      if (cleaned[threadKey] === value) {
        return cleaned;
      }
      return { ...cleaned, [threadKey]: value };
    });
    if (value?.trim?.()) {
      setApplicationThreadErrors((prev) =>
        removeThreadKeys(prev, [threadKey, legacyKey].filter(Boolean))
      );
    }
  };

  const handleApplicationThreadTypeChange = (threadKey, nextType, legacyKey) => {
    const cleanupKeys = legacyKey && legacyKey !== threadKey ? [legacyKey] : [];
    setApplicationThreadTypeDrafts((prev) => {
      const cleaned = cleanupKeys.length > 0 ? removeThreadKeys(prev, cleanupKeys) : prev;
      if (!threadKey) {
        return cleaned;
      }
      if (cleaned[threadKey] === nextType) {
        return cleaned;
      }
      return { ...cleaned, [threadKey]: nextType };
    });
    setApplicationThreadErrors((prev) =>
      removeThreadKeys(prev, [threadKey, legacyKey].filter(Boolean))
    );
    if (nextType !== 'interview') {
      setApplicationThreadScheduleDrafts((prev) =>
        removeThreadKeys(prev, [threadKey, legacyKey].filter(Boolean))
      );
    }
  };

  const handleApplicationThreadScheduleChange = (threadKey, value, legacyKey) => {
    const cleanupKeys = legacyKey && legacyKey !== threadKey ? [legacyKey] : [];
    setApplicationThreadScheduleDrafts((prev) => {
      const cleaned = cleanupKeys.length > 0 ? removeThreadKeys(prev, cleanupKeys) : prev;
      if (!threadKey) {
        return cleaned;
      }
      if (cleaned[threadKey] === value) {
        return cleaned;
      }
      return { ...cleaned, [threadKey]: value };
    });
  };

  const handleApplicationThreadSubmit = (event, application, threadKey, legacyKey) => {
    event.preventDefault();

    const targetKey = threadKey || legacyKey || getJobIdKey(application?.id);
    const rawDraft = pickThreadValue(applicationThreadDrafts, threadKey, legacyKey) || '';
    const draftString = typeof rawDraft === 'string' ? rawDraft : String(rawDraft);
    const message = draftString.trim();

    if (!targetKey) {
      return;
    }

    if (!message) {
      setApplicationThreadErrors((prev) => ({
        ...prev,
        [targetKey]: translate('applications.threadValidation', 'Add a note before saving it.'),
      }));
      return;
    }

    const typeDraft = pickThreadValue(applicationThreadTypeDrafts, threadKey, legacyKey);
    const type = typeof typeDraft === 'string' && typeDraft ? typeDraft : APPLICATION_THREAD_TYPES[0];
    const scheduleDraft = pickThreadValue(applicationThreadScheduleDrafts, threadKey, legacyKey);
    const scheduleRaw = typeof scheduleDraft === 'string' ? scheduleDraft.trim() : '';
    const scheduleAt = type === 'interview' && scheduleRaw ? scheduleRaw : null;

    const entry = {
      id: `${targetKey}-${Date.now()}`,
      type,
      message,
      createdAt: new Date().toISOString(),
      scheduleAt,
      author: 'startup',
    };

    appendThreadEntry(targetKey, entry, buildThreadMetaFromApplication(application), legacyKey);

    const keysToClear = [threadKey, legacyKey, targetKey].filter(Boolean);
    setApplicationThreadDrafts((prev) => removeThreadKeys(prev, keysToClear));
    setApplicationThreadErrors((prev) => removeThreadKeys(prev, keysToClear));
    setApplicationThreadScheduleDrafts((prev) => removeThreadKeys(prev, keysToClear));
    if (legacyKey && legacyKey !== targetKey) {
      setApplicationThreadTypeDrafts((prev) => removeThreadKeys(prev, [legacyKey]));
    }
  };

  const handleStudentThreadSubmit = (event, threadKey, meta, canReply) => {
    event.preventDefault();
    if (!canReply || !threadKey) {
      return;
    }

    const rawDraft = pickThreadValue(applicationThreadDrafts, threadKey, null) || '';
    const draftString = typeof rawDraft === 'string' ? rawDraft : String(rawDraft);
    const message = draftString.trim();

    if (!message) {
      setApplicationThreadErrors((prev) => ({
        ...prev,
        [threadKey]: translate('applications.threadValidation', 'Add a note before saving it.'),
      }));
      return;
    }

    const entry = {
      id: `${threadKey}-${Date.now()}`,
      type: 'message',
      message,
      createdAt: new Date().toISOString(),
      scheduleAt: null,
      author: 'student',
    };

    appendThreadEntry(threadKey, entry, meta, null);
    setApplicationThreadDrafts((prev) => removeThreadKeys(prev, [threadKey]));
    setApplicationThreadErrors((prev) => removeThreadKeys(prev, [threadKey]));
  };

  const resolveApplicationThreadType = useCallback(
    (primaryKey, fallbackKey) =>
      (typeof primaryKey === 'string' && applicationThreadTypeDrafts[primaryKey]) ||
      (typeof fallbackKey === 'string' && applicationThreadTypeDrafts[fallbackKey]) ||
      APPLICATION_THREAD_TYPES[0],
    [applicationThreadTypeDrafts]
  );

  const formatThreadTimestamp = useCallback((value) => {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      return value;
    }
  }, []);

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setPasswordResetError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordResetError('Passwords do not match.');
      return;
    }

    setPasswordResetSaving(true);
    setPasswordResetError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordResetError(error.message);
        return;
      }
      setFeedback({ type: 'success', message: 'Password updated. You can now sign in.' });
      setResetPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowLoginModal(true);
    } catch (error) {
      setPasswordResetError(error.message);
    } finally {
      setPasswordResetSaving(false);
    }
  };

  const handleSecurityPasswordChange = async (event) => {
    event.preventDefault();
    setSecurityError('');

    if (!user?.email) {
      setSecurityError('User email not available.');
      return;
    }
    if (securityNewPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }
    if (securityNewPassword !== securityConfirmPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    setSecuritySaving(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: securityOldPassword,
      });

      if (reauthError) {
        setSecurityError('Current password is incorrect.');
        setSecuritySaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: securityNewPassword });
      if (updateError) {
        setSecurityError(updateError.message);
        setSecuritySaving(false);
        return;
      }

      setFeedback({ type: 'success', message: 'Password updated successfully.' });
      setSecurityOldPassword('');
      setSecurityNewPassword('');
      setSecurityConfirmPassword('');
      setSecurityModalOpen(false);
    } catch (error) {
      setSecurityError(error.message);
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSecurityEmailChange = async (event) => {
    event.preventDefault();
    setSecurityEmailMessage('');

    const nextEmail = securityEmail.trim();
    if (!nextEmail) {
      setSecurityEmailMessage('Enter a valid email address.');
      return;
    }
    if (nextEmail === user?.email) {
      setSecurityEmailMessage('This is already your current email.');
      return;
    }

    setSecurityEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) {
        setSecurityEmailMessage(error.message);
      } else {
        setSecurityEmailMessage('Check your new inbox to confirm the change.');
      }
    } catch (error) {
      setSecurityEmailMessage(error.message);
    } finally {
      setSecurityEmailSaving(false);
    }
  };

  const openReviewsModal = async (company) => {
    setReviewsModal(company);
    setReviewsLoading(true);
    setReviews([]);
    setCanReview(false);

    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('id, rating, title, body, created_at, profiles(full_name, avatar_url)')
        .eq('startup_id', company.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data);
      }

      if (user && profile) {
        const { data: membership, error: membershipError } = await supabase
          .from('startup_members')
          .select('id, verified_at')
          .eq('startup_id', company.id)
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (!membershipError && membership && membership.verified_at) {
          setCanReview(true);
        }
      }
    } catch (error) {
      console.error('Reviews load error', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewsModal || !profile) return;

    try {
      const payload = {
        startup_id: reviewsModal.id,
        profile_id: profile.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        body: reviewForm.body.trim(),
      };

      const { error } = await supabase.from('company_reviews').insert(payload);
      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }
      setFeedback({ type: 'success', message: 'Review submitted. Thank you!' });
      setReviewForm({ rating: 5, title: '', body: '' });
      openReviewsModal(reviewsModal); // refresh
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    if (!user || user.type !== 'startup' || !startupProfile) return;

    setEventFormSaving(true);
    try {
      const trimmedTitle = eventForm.title.trim();
      const trimmedLocation = eventForm.location.trim();
      const trimmedStreet = eventForm.street_address.trim();
      const trimmedCity = eventForm.city.trim();
      const trimmedPostal = eventForm.postal_code.trim();
      const trimmedTime = (eventForm.event_time || '').trim();

      if (!/\d/.test(trimmedStreet)) {
        setFeedback({
          type: 'error',
          message: translate(
            'events.form.streetNumberError',
            'Street address must include a building number.'
          ),
        });
        setEventFormSaving(false);
        return;
      }

      if (!trimmedTime) {
        setFeedback({
          type: 'error',
          message: translate('events.form.timeRequired', 'Please add a start time for the event.'),
        });
        setEventFormSaving(false);
        return;
      }

      let posterUrl = eventForm.poster_url;

      // Upload poster if file is provided
      if (eventForm.poster_file) {
        const fileExt = eventForm.poster_file.name.split('.').pop();
        const fileName = `${startupProfile.id}_${Date.now()}.${fileExt}`;
        const filePath = `event-posters/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-posters')
          .upload(filePath, eventForm.poster_file);

        if (uploadError) {
          setFeedback({ type: 'error', message: 'Failed to upload poster image' });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('event-posters')
          .getPublicUrl(filePath);
        
        posterUrl = publicUrl;
      }

      const payload = {
        startup_id: startupProfile.id,
        title: trimmedTitle,
        description: eventForm.description.trim(),
        location: trimmedLocation,
        street_address: trimmedStreet,
        city: trimmedCity,
        postal_code: trimmedPostal,
        event_date: eventForm.event_date,
        event_time: trimmedTime,
        poster_url: posterUrl,
      };

      const { error } = await supabase.from('events').insert(payload);
      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      setFeedback({ type: 'success', message: 'Event posted successfully!' });
      closeEventModal();
      
      // Refresh events list
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      const sortedEvents = sortEventsBySchedule(data || []);
      if (sortedEvents.length > 0) {
        setEvents(sortedEvents);
      } else {
        const fallbackEvents =
          fallbackEventsRef.current.length > 0
            ? fallbackEventsRef.current
            : await loadMockEvents();
        setEvents(sortEventsByScheduleStatic(fallbackEvents));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
      const fallbackEvents =
        fallbackEventsRef.current.length > 0
          ? fallbackEventsRef.current
          : await loadMockEvents();
      setEvents(sortEventsByScheduleStatic(fallbackEvents));
    } finally {
      setEventFormSaving(false);
    }
  };

  const toggleFollowCompany = (followKey) => {
    if (!followKey) {
      return;
    }

    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({
        type: 'info',
        message: translate('companies.followPrompt', 'Sign in to follow startups.'),
      });
      return;
    }

    setFollowedCompanies((prev) => {
      const key = followKey.trim();
      if (!key) {
        return prev;
      }
      if (prev.includes(key)) {
        return prev.filter((id) => id !== key);
      }
      return [...prev, key];
    });
  };

  const resolveCompanyProfile = (company) => {
    if (!company) {
      return null;
    }

    const idKey = company.id != null ? String(company.id) : '';
    const normalizedName =
      typeof company.name === 'string' ? company.name.trim().toLowerCase() : '';

    const catalogMatch =
      (idKey && companyCatalogById[idKey]) ||
      (normalizedName
        ? companyCatalog.find((entry) =>
            entry.name && entry.name.trim().toLowerCase() === normalizedName
          )
        : null);

    if (catalogMatch) {
      return {
        ...catalogMatch,
        ...company,
        profile: {
          ...(catalogMatch.profile || {}),
          ...(company.profile || {}),
        },
      };
    }

    const fallbackProfile = {
      hero: {
        headline: company.tagline || '',
        subheadline: company.culture || '',
        imageUrl: company.cover_image || company.hero_image || '',
      },
      about:
        company.description ||
        company.summary ||
        company.culture ||
        company.tagline ||
        '',
      metrics: [],
      openRoles: [],
      team: [],
      updates: [],
      ...(company.profile || {}),
    };

    return {
      ...company,
      profile: fallbackProfile,
    };
  };

  const openCompanyProfile = (company) => {
    const resolved = resolveCompanyProfile(company);
    if (resolved) {
      setActiveCompanyProfile(resolved);
    }
  };

  const closeCompanyProfile = () => {
    setActiveCompanyProfile(null);
  };

  const closeResourceModal = () => setResourceModal(null);
  const closeReviewsModal = () => setReviewsModal(null);
  const closeEventModal = () => {
    setEventModalOpen(false);
    setEventForm({
      title: '',
      description: '',
      location: '',
      street_address: '',
      city: '',
      postal_code: '',
      event_date: '',
      event_time: '',
      poster_url: '',
      poster_file: null,
    });
  };

  const navTabs = useMemo(() => {
    const baseTabs = ['general', 'jobs', 'companies', 'map', 'events'];
    if (user?.type === 'startup') {
      baseTabs.push('my-jobs', 'applications');
    }
    return baseTabs;
  }, [user?.type]);

  const navLabels = useMemo(
    () => ({
      general: translate('nav.general', 'General'),
      jobs: translate('nav.jobs', 'Opportunities'),
      companies: translate('nav.companies', 'Startups'),
      'my-jobs': translate('nav.myJobs', 'My jobs'),
      applications: translate('nav.applications', 'Applicants'),
      map: translate('nav.map', 'Map'),
      events: translate('nav.events', 'Events'),
      saved: translate('nav.saved', 'Saved'),
    }),
    [translate]
  );

  const themeToggleLabel = isDarkMode
    ? translate('nav.theme.light', 'Switch to light mode')
    : translate('nav.theme.dark', 'Switch to dark mode');

  const brandHomeLabel = translate('nav.brandHome', 'Go to general overview');

  const currentLanguageOption =
    LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0];
  const otherLanguageOptions = LANGUAGE_OPTIONS.filter(
    (option) => option.value !== currentLanguageOption.value
  );
  const languageMenuId = 'ssc-language-menu';

  const isStudent = user?.type === 'student';
  const isStartupUser = user?.type === 'startup';
  const canPostEvents = isStartupUser && Boolean(startupProfile?.id);
  const isLoggedIn = Boolean(user);
  const canApply = isLoggedIn && isStudent;
  const canSaveJobs = isLoggedIn && isStudent;
  const applyRestrictionMessage = isLoggedIn
    ? translate('jobs.applyRestrictionStudent', 'Student applicants only')
    : translate('jobs.applyRestrictionSignIn', 'Sign in as a student to apply');
  const cvVisibilitySupported = profileColumnPresence.cv_public !== false;
  const isCvUploading = cvUploadState === 'uploading';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const languageToggleRef = useRef(null);
  const actionsRef = useRef(null);
  const filtersSectionRef = useRef(null);
  const equityInputFocusRef = useRef({ min: false, max: false });
  const scrollToFilters = useCallback(() => {
    if (filtersSectionRef.current) {
      filtersSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  const [companySort, setCompanySort] = useState('recent');
  const companySortOptions = useMemo(
    () => [
      { value: 'recent', label: translate('companies.sort.recent', 'Most recent'), icon: Clock },
      { value: 'jobs_desc', label: translate('companies.sort.roles', 'Most roles'), icon: Briefcase },
    ],
    [translate]
  );
  const [followedCompanies, setFollowedCompanies] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('ssc_followed_companies');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return Array.from(
        new Set(
          parsed
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter(Boolean)
        )
      );
    } catch (error) {
      console.error('Failed to parse followed companies', error);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sanitized = Array.from(new Set(followedCompanies.filter(Boolean)));
    window.localStorage.setItem('ssc_followed_companies', JSON.stringify(sanitized));
  }, [followedCompanies]);

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!languageToggleRef.current) {
        return;
      }

      const target = event.target;
      if (typeof Node !== 'undefined' && !(target instanceof Node)) {
        return;
      }

      if (!languageToggleRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  const resolveCompanyFollowKey = useCallback((company) => {
    if (!company) {
      return '';
    }

    if (company.id != null) {
      return String(company.id).trim();
    }

    const baseName = typeof company.name === 'string' ? company.name.trim() : '';
    if (baseName) {
      return baseName;
    }

    const fallbackName =
      typeof company?.translations?.en?.name === 'string'
        ? company.translations.en.name.trim()
        : '';
    return fallbackName;
  }, []);

  const sortedCompanies = useMemo(() => {
    const enriched = augmentedCompanies.map((company) => {
      const idKey = company.id ? String(company.id) : null;
      const nameKey = company.name ? String(company.name) : null;
      const normalizedNameKey = nameKey ? nameKey.trim().toLowerCase() : '';
      const jobCount =
        (idKey && companyJobCounts[idKey]) ||
        (normalizedNameKey && companyJobCounts[normalizedNameKey]) ||
        0;
      const followKey = resolveCompanyFollowKey(company);
      return {
        ...company,
        jobCount,
        followKey,
        isFollowed: followKey ? followedCompanies.includes(followKey) : false,
      };
    });

    if (companySort === 'jobs_desc') {
      return enriched.sort((a, b) => b.jobCount - a.jobCount);
    }

    return enriched.sort((a, b) => {
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [augmentedCompanies, companyJobCounts, companySort, followedCompanies, resolveCompanyFollowKey]);

  const loadingSpinner = jobsLoading || companiesLoading || authLoading;
  const showCompanySkeleton = companiesLoading && sortedCompanies.length === 0;

  const featuredCompanies = useMemo(() => {
    return [...sortedCompanies]
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 3);
  }, [sortedCompanies]);

  const safeSalaryBoundMin = Number.isFinite(salaryBounds[0]) ? salaryBounds[0] : SALARY_FALLBACK_RANGE[0];
  const safeSalaryBoundMax = Number.isFinite(salaryBounds[1]) ? salaryBounds[1] : SALARY_FALLBACK_RANGE[1];
  const normalizedSalaryMinBound = Math.min(safeSalaryBoundMin, safeSalaryBoundMax);
  const normalizedSalaryMaxBound = Math.max(safeSalaryBoundMin, safeSalaryBoundMax);
  const salarySliderMinValue = clamp(
    Number.isFinite(salaryMin) ? salaryMin : normalizedSalaryMinBound,
    normalizedSalaryMinBound,
    normalizedSalaryMaxBound
  );
  const salarySliderMaxValue = clamp(
    Number.isFinite(salaryMax) ? salaryMax : normalizedSalaryMaxBound,
    normalizedSalaryMinBound,
    normalizedSalaryMaxBound
  );
  const salaryDisplayMinBound = convertMonthlyValueToCadence(normalizedSalaryMinBound, salaryFilterCadence);
  const salaryDisplayMaxBound = convertMonthlyValueToCadence(normalizedSalaryMaxBound, salaryFilterCadence);
  const salaryDisplayMinValue = convertMonthlyValueToCadence(salarySliderMinValue, salaryFilterCadence);
  const salaryDisplayMaxValue = convertMonthlyValueToCadence(salarySliderMaxValue, salaryFilterCadence);

  const sliderBaseMin = Number.isFinite(salaryDisplayMinBound) ? salaryDisplayMinBound : 0;
  const sliderBaseMax = Number.isFinite(salaryDisplayMaxBound) ? salaryDisplayMaxBound : sliderBaseMin;
  const sliderRangeSpanDisplay = sliderBaseMax - sliderBaseMin;
  const sliderRangeDenominator = Math.max(sliderRangeSpanDisplay, SALARY_STEP);

  const calculateSliderPercent = (value) => {
    if (!Number.isFinite(value) || sliderRangeDenominator <= 0) {
      return 0;
    }
    return Math.min(Math.max(((value - sliderBaseMin) / sliderRangeDenominator) * 100, 0), 100);
  };

  const salaryRangeLowerDisplay = Math.min(
    Number.isFinite(salaryDisplayMinValue) ? salaryDisplayMinValue : salaryDisplayMinBound,
    Number.isFinite(salaryDisplayMaxValue) ? salaryDisplayMaxValue : salaryDisplayMaxBound
  );
  const salaryRangeUpperDisplay = Math.max(
    Number.isFinite(salaryDisplayMinValue) ? salaryDisplayMinValue : salaryDisplayMinBound,
    Number.isFinite(salaryDisplayMaxValue) ? salaryDisplayMaxValue : salaryDisplayMaxBound
  );
  const salarySliderStyle = {
    '--range-min': `${calculateSliderPercent(salaryRangeLowerDisplay)}%`,
    '--range-max': `${calculateSliderPercent(salaryRangeUpperDisplay)}%`,
  };
  const salarySliderDisabled =
    !Number.isFinite(salaryDisplayMinBound) ||
    !Number.isFinite(salaryDisplayMaxBound) ||
    sliderRangeSpanDisplay <= 0;
  const salarySliderDecimals = salaryFilterCadence === 'hour' ? 2 : 0;
  const toSliderDisplay = (value, fallback) => {
    const resolved = Number.isFinite(value) ? value : fallback;
    if (!Number.isFinite(resolved)) {
      return 0;
    }
    return Number.parseFloat(resolved.toFixed(salarySliderDecimals));
  };
  const salarySliderMinBoundDisplay = toSliderDisplay(salaryDisplayMinBound, sliderBaseMin);
  const salarySliderMaxBoundDisplay = toSliderDisplay(salaryDisplayMaxBound, sliderBaseMax);
  const salarySliderMinDisplay = toSliderDisplay(salaryDisplayMinValue, sliderBaseMin);
  const salarySliderMaxDisplay = toSliderDisplay(salaryDisplayMaxValue, sliderBaseMax);
  const salarySliderStep =
    salaryFilterCadence === 'hour'
      ? 0.5
      : salaryFilterCadence === 'week'
      ? 10
      : salaryFilterCadence === 'year'
      ? 100
      : SALARY_STEP;
  const salaryRangeAtDefault =
    salarySliderMinValue === normalizedSalaryMinBound && salarySliderMaxValue === normalizedSalaryMaxBound;
  const salaryFilterHelperText = translate(
    `filters.salaryHelper.${salaryFilterCadence}`,
    SALARY_FILTER_HELPERS[salaryFilterCadence] || translate('filters.salaryHelper.fallback', 'CHF monthly')
  );
  const salaryFilterCadenceLabel = translate(
    `filters.salaryCadenceLabel.${salaryFilterCadence}`,
    SALARY_CADENCE_LABELS[salaryFilterCadence] || 'monthly'
  );

  const safeEquityBoundMin = Number.isFinite(equityBounds[0]) ? equityBounds[0] : EQUITY_FALLBACK_RANGE[0];
  const safeEquityBoundMax = Number.isFinite(equityBounds[1]) ? equityBounds[1] : EQUITY_FALLBACK_RANGE[1];
  const normalizedEquityMinBound = Math.min(safeEquityBoundMin, safeEquityBoundMax);
  const normalizedEquityMaxBound = Math.max(safeEquityBoundMin, safeEquityBoundMax);
  const equitySliderMinValue = clamp(
    Number.isFinite(equityMin) ? equityMin : normalizedEquityMinBound,
    normalizedEquityMinBound,
    normalizedEquityMaxBound
  );
  const equitySliderMaxValue = clamp(
    Number.isFinite(equityMax) ? equityMax : normalizedEquityMaxBound,
    normalizedEquityMinBound,
    normalizedEquityMaxBound
  );
  const equitySliderRangeSpan = Math.max(normalizedEquityMaxBound - normalizedEquityMinBound, EQUITY_STEP);
  const equitySliderLowerValue = Math.min(equitySliderMinValue, equitySliderMaxValue);
  const equitySliderUpperValue = Math.max(equitySliderMinValue, equitySliderMaxValue);
  const equitySliderMinThumbMax = Math.max(equitySliderUpperValue, equitySliderLowerValue);
  const equitySliderMaxThumbMin = Math.min(equitySliderLowerValue, equitySliderUpperValue);
  const toEquityPercent = (value) =>
    Math.min(
      Math.max(((value - normalizedEquityMinBound) / equitySliderRangeSpan) * 100, 0),
      100
    );
  const equitySliderStyle = {
    '--range-min': `${toEquityPercent(equitySliderLowerValue)}%`,
    '--range-max': `${toEquityPercent(equitySliderUpperValue)}%`,
  };
  const equitySliderDisabled = normalizedEquityMinBound === normalizedEquityMaxBound;
  const equityRangeAtDefault =
    equityMin === normalizedEquityMinBound && equityMax === normalizedEquityMaxBound;
  const filtersActive =
    selectedFilters.length > 0 || !salaryRangeAtDefault || !equityRangeAtDefault;
  const shouldRenderSalaryCalculatorPanel = salaryCalculatorOpen || salaryCalculatorPanelVisible;


  return (
    <div className={`ssc ${isDarkMode ? 'ssc--dark' : ''}`}>
      {toast && (
        <div className="ssc__toast" role="status" aria-live="polite">
          <CheckCircle2 size={20} />
          <span className="ssc__toast-message">{toast.message}</span>
        </div>
      )}
      <header className={`ssc__header ${compactHeader ? 'is-compact' : ''}`}>
        <div className="ssc__max ssc__header-inner">
          <div className="ssc__header-left">
            <button
              type="button"
              className="ssc__brand"
              onClick={handleBrandClick}
              aria-label={brandHomeLabel}
              title={brandHomeLabel}
            >
              <div className="ssc__brand-badge">⌁</div>
              <div className="ssc__brand-text">
                <span className="ssc__brand-name">SwissStartup Connect</span>
              </div>
            </button>

            <nav className="ssc__nav">
              {navTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`ssc__nav-button ${activeTab === tab ? 'is-active' : ''}`}
                >
                  {navLabels[tab]}
                </button>
              ))}
            </nav>
          </div>

          <div className="ssc__header-controls">
            <button
              type="button"
              className={`ssc__theme-toggle ${isDarkMode ? 'is-active' : ''}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDarkMode}
              aria-label={themeToggleLabel}
              title={themeToggleLabel}
            >
              <Sun className="ssc__theme-toggle-icon ssc__theme-toggle-icon--sun" size={16} aria-hidden="true" />
              <span className="ssc__theme-toggle-thumb" aria-hidden="true" />
              <Moon className="ssc__theme-toggle-icon ssc__theme-toggle-icon--moon" size={16} aria-hidden="true" />
            </button>

            <div
              className={`ssc__language-toggle ${isLanguageMenuOpen ? 'is-open' : ''}`}
              role="group"
              aria-label={translate('nav.language', 'Language')}
              ref={languageToggleRef}
              onMouseEnter={() => setIsLanguageMenuOpen(true)}
              onMouseLeave={() => setIsLanguageMenuOpen(false)}
              onBlur={(event) => {
                if (
                  languageToggleRef.current &&
                  event.relatedTarget &&
                  languageToggleRef.current.contains(event.relatedTarget)
                ) {
                  return;
                }
                setIsLanguageMenuOpen(false);
              }}
            >
              <button
                type="button"
                className="ssc__language-toggle-button"
                onClick={() =>
                  setIsLanguageMenuOpen((prev) => {
                    const isHovering = languageToggleRef.current?.matches?.(':hover');
                    if (prev && isHovering) {
                      return prev;
                    }
                    return !prev;
                  })
                }
                aria-haspopup="listbox"
                aria-expanded={isLanguageMenuOpen}
                aria-controls={languageMenuId}
                title={currentLanguageOption.label}
              >
                {currentLanguageOption.shortLabel || currentLanguageOption.label}
              </button>
              {otherLanguageOptions.length > 0 && (
                <div
                  id={languageMenuId}
                  className="ssc__language-menu"
                  role="listbox"
                  aria-hidden={!isLanguageMenuOpen}
                >
                  {otherLanguageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="ssc__language-menu-option"
                      role="option"
                      onClick={() => {
                        setLanguage(option.value);
                        setIsLanguageMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`ssc__actions ${compactHeader ? 'is-hidden' : ''}`} ref={actionsRef}>
              {!user ? (
                <div className="ssc__auth-buttons">
                  <button
                    type="button"
                    className="ssc__cta-btn"
                    onClick={() => {
                      setIsRegistering(true);
                      setShowLoginModal(true);
                      setAuthError('');
                    }}
                  >
                    {translate('nav.join', 'Join us')}
                  </button>
                  <button
                    type="button"
                    className="ssc__signin"
                    onClick={() => {
                      setIsRegistering(false);
                      setShowLoginModal(true);
                      setAuthError('');
                    }}
                  >
                    {translate('nav.signIn', 'Sign in')}
                  </button>
                </div>
              ) : (
                <div className="ssc__user-chip">
                  <button
                    type="button"
                    className="ssc__user-menu-toggle"
                    onClick={() => setShowUserMenu((prev) => !prev)}
                  >
                    <div className="ssc__avatar-small">
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt={userDisplayName || translate('accountMenu.memberFallback', 'Member')} />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div className="ssc__user-meta">
                      <span className="ssc__user-name">{userDisplayName}</span>
                      <span className="ssc__user-role">{user.type}</span>
                    </div>
                    <ChevronDown className={`ssc__caret ${showUserMenu ? 'is-open' : ''}`} size={16} />
                  </button>
                  {showUserMenu && (
                    <div className="ssc__user-menu">
                      <header className="ssc__user-menu-header">
                        <div className="ssc__avatar-medium">
                          {userAvatarUrl ? (
                            <img
                              src={userAvatarUrl}
                              alt={userDisplayName || translate('accountMenu.memberFallback', 'Member')}
                            />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>
                        <div>
                          <strong>{userDisplayName}</strong>
                          <span className="ssc__user-menu-role">{user.type}</span>
                        </div>
                      </header>
                      <button type="button" onClick={() => { setProfileModalOpen(true); setShowUserMenu(false); }}>
                        {translate('accountMenu.profile', 'Profile')}
                      </button>
                      {user.type === 'student' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('messages');
                            setShowUserMenu(false);
                          }}
                        >
                          {translate('accountMenu.messages', 'Messages')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSecurityEmail(user.email || '');
                          setSecurityEmailMessage('');
                          setSecurityEmailSaving(false);
                          setSecurityModalOpen(true);
                          setShowUserMenu(false);
                        }}
                      >
                        {translate('accountMenu.security', 'Privacy & security')}
                      </button>
                      {user.type === 'student' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('saved');
                            setShowUserMenu(false);
                          }}
                        >
                          {translate('accountMenu.savedRoles', 'Saved roles')}
                        </button>
                      )}
                      {user.type === 'startup' && (
                        <>
                          <button type="button" onClick={() => { setActiveTab('my-jobs'); setShowUserMenu(false); }}>
                            {translate('accountMenu.myJobs', 'My jobs')}
                          </button>
                          <button type="button" onClick={() => { setStartupModalOpen(true); setShowUserMenu(false); }}>
                            {translate('accountMenu.companyProfile', 'Company profile')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              openPostJobFlow();
                            }}
                          >
                            {translate('accountMenu.postVacancy', 'Post vacancy')}
                          </button>
                          <button type="button" onClick={() => { setActiveTab('applications'); setShowUserMenu(false); }}>
                            {translate('accountMenu.viewApplicants', 'View applicants')}
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                        {translate('accountMenu.logout', 'Log out')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ssc__main">
        {user && !emailVerified && (
          <div className="ssc__notice">
            <p>
              {translate(
                'authModal.notice.confirmEmail',
                'Please confirm your email address to unlock all features. Once confirmed, refresh this page and you can apply to roles.'
              )}
            </p>
            <button type="button" onClick={resendVerificationEmail} disabled={resendingEmail}>
              {resendingEmail
                ? translate('authModal.notice.sending', 'Sending…')
                : translate('authModal.notice.resend', 'Resend verification email')}
            </button>
          </div>
        )}

        {activeTab === 'general' && (
          <section className="ssc__hero">
            <div className="ssc__max">
              <div className="ssc__hero-badge">
                <Sparkles size={18} />
                <span>{translate('hero.badge', 'Trusted by Swiss startups & universities')}</span>
              </div>
              <h1 className="ssc__hero-title">{translate('hero.title', 'Shape the next Swiss startup success story')}</h1>
              <p className="ssc__hero-lede">{translate(
                'hero.subtitle',
                'Discover paid internships, part-time roles, and graduate opportunities with founders who want you in the room from day one.'
              )}</p>

              {feedback && (
                <div className={`ssc__feedback ${feedback.type === 'success' ? 'is-success' : ''}`}>
                  {feedback.message}
                </div>
              )}

              <form
                className="ssc__search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setActiveTab('jobs');
                }}
              >
                <div className="ssc__search-field">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder={translate('hero.searchPlaceholder', 'Search startup, role, or skill')}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label={translate('hero.searchPlaceholder', 'Search startup, role, or skill')}
                  />
                </div>
                <button type="submit" className="ssc__search-btn">
                  {translate('hero.searchButton', 'Find matches')}
                </button>
              </form>

              <div className="ssc__stats">
                {stats.map((stat) => (
                  <article key={stat.id} className="ssc__stat-card">
                    <span className="ssc__stat-value">
                      {translate(`stats.${stat.id}.value`, stat.value)}
                    </span>
                    <span className="ssc__stat-label">
                      {translate(`stats.${stat.id}.label`, stat.label)}
                    </span>
                    <p>{translate(`stats.${stat.id}.detail`, stat.detail)}</p>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className={`ssc__hero-scroll-indicator${hasScrolledPastHero ? ' is-hidden' : ''}`}
                onClick={scrollToFilters}
                aria-label={translate('hero.scrollAria', 'Scroll to filters')}
              >
                <ChevronDown size={22} />
              </button>
            </div>
          </section>
        )}

        {(activeTab === 'general' || activeTab === 'jobs') && (
          <section className="ssc__filters" ref={filtersSectionRef}>
            <div className="ssc__max">
              <div className="ssc__filters-header">
                <div>
                  <h2>{translate('filters.title', 'Tailor your results')}</h2>
                  <p>
                    {translate(
                      'filters.subtitle',
                      'Pick the active cities, role focus, and the compensation mix that fits you best.'
                    )}
                  </p>
                </div>
                {filtersActive && (
                  <button type="button" className="ssc__clear-filters" onClick={clearFilters}>
                    {translate('filters.clear', 'Clear filters')}
                  </button>
                )}
              </div>
              <div className="ssc__filters-grid">
                <div className="ssc__filter-group">
                  <span className="ssc__filter-label">{translate('filters.activeCities', 'Active cities')}</span>
                  <div className="ssc__filter-chips">
                    {activeCityFilters.map((filter) => {
                      const isSelected = selectedFilters.includes(filter.id);
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          className={`ssc__chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => (isSelected ? removeFilter(filter.id) : addFilter(filter.id))}
                        >
                          {translate(filter.labelKey, filter.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="ssc__filter-group">
                  <div className="ssc__filter-label-row">
                    <span className="ssc__filter-label">{translate('filters.roleFocus', 'Role focus')}</span>
                  </div>
                  <div className="ssc__filter-chips">
                    {roleFocusFilters.map((filter) => {
                      const isSelected = selectedFilters.includes(filter.id);
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          className={`ssc__chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => (isSelected ? removeFilter(filter.id) : addFilter(filter.id))}
                        >
                          {translate(filter.labelKey, filter.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="ssc__filter-group ssc__filter-group--salary">
                  <div className="ssc__filter-label-row">
                    <div className="ssc__filter-label-group">
                      <span className="ssc__filter-label">{translate('filters.salaryRange', 'Salary range')}</span>
                      <span className="ssc__filter-helper">{salaryFilterHelperText}</span>
                    </div>
                    <div
                      className="ssc__cadence-toggle"
                      role="group"
                      aria-label={translate('filters.salaryAriaGroup', 'Salary cadence')}
                    >
                      {SALARY_FILTER_CADENCE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`ssc__cadence-btn ${salaryFilterCadence === option.value ? 'is-active' : ''}`}
                          onClick={() => setSalaryFilterCadence(option.value)}
                          aria-pressed={salaryFilterCadence === option.value}
                        >
                          {translate(`filters.salaryCadence.${option.value}`, option.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ssc__salary-slider" style={salarySliderStyle}>
                    <input
                      type="range"
                      min={salarySliderMinBoundDisplay}
                      max={salarySliderMaxBoundDisplay}
                      step={salarySliderStep}
                      value={salarySliderMinDisplay}
                      onChange={handleSalarySliderChange('min')}
                      onInput={handleSalarySliderChange('min')}
                      onPointerDown={() => handleSalaryThumbActivate('min')}
                      onPointerUp={handleSalaryThumbRelease}
                      onPointerCancel={handleSalaryThumbRelease}
                      onFocus={() => handleSalaryThumbActivate('min')}
                      onBlur={handleSalaryThumbRelease}
                      style={{ zIndex: activeSalaryThumb === 'min' ? 2 : 1 }}
                      disabled={salarySliderDisabled}
                      aria-label={translate('filters.salaryAriaMin', 'Minimum {{cadence}} salary', {
                        cadence: salaryFilterCadenceLabel,
                      })}
                    />
                    <input
                      type="range"
                      min={salarySliderMinBoundDisplay}
                      max={salarySliderMaxBoundDisplay}
                      step={salarySliderStep}
                      value={salarySliderMaxDisplay}
                      onChange={handleSalarySliderChange('max')}
                      onInput={handleSalarySliderChange('max')}
                      onPointerDown={() => handleSalaryThumbActivate('max')}
                      onPointerUp={handleSalaryThumbRelease}
                      onPointerCancel={handleSalaryThumbRelease}
                      onFocus={() => handleSalaryThumbActivate('max')}
                      onBlur={handleSalaryThumbRelease}
                      style={{ zIndex: activeSalaryThumb === 'max' ? 2 : 1 }}
                      disabled={salarySliderDisabled}
                      aria-label={translate('filters.salaryAriaMax', 'Maximum {{cadence}} salary', {
                        cadence: salaryFilterCadenceLabel,
                      })}
                    />
                  </div>
                  <div className="ssc__salary-inputs">
                    <label className="ssc__salary-input">
                      <span>{translate('filters.min', 'Min')}</span>
                      <div className="ssc__salary-input-wrapper">
                        <span>CHF</span>
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={salaryInputValues.min}
                          onChange={(event) => handleSalaryInputChange('min', event.target.value)}
                          aria-label={translate(
                            'filters.salaryAriaMinCurrency',
                            'Minimum {{cadence}} salary in Swiss francs',
                            { cadence: salaryFilterCadenceLabel }
                          )}
                          disabled={salarySliderDisabled}
                        />
                      </div>
                    </label>
                    <div className="ssc__salary-divider" aria-hidden="true">
                      –
                    </div>
                    <label className="ssc__salary-input">
                      <span>{translate('filters.max', 'Max')}</span>
                      <div className="ssc__salary-input-wrapper">
                        <span>CHF</span>
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={salaryInputValues.max}
                          onChange={(event) => handleSalaryInputChange('max', event.target.value)}
                          aria-label={translate(
                            'filters.salaryAriaMaxCurrency',
                            'Maximum {{cadence}} salary in Swiss francs',
                            { cadence: salaryFilterCadenceLabel }
                          )}
                          disabled={salarySliderDisabled}
                        />
                      </div>
                    </label>
                  </div>
                </div>
                <div className="ssc__filter-group ssc__filter-group--equity">
                  <div className="ssc__filter-label-row">
                    <span className="ssc__filter-label">{translate('filters.equityRange', 'Equity range')}</span>
                    <span className="ssc__filter-helper">{translate('filters.equityHelper', 'Percent ownership')}</span>
                  </div>
                  <div className="ssc__equity-slider" style={equitySliderStyle}>
                    <input
                      type="range"
                      min={normalizedEquityMinBound}
                      max={equitySliderMinThumbMax}
                      step={EQUITY_STEP}
                      value={equitySliderMinValue}
                      onChange={handleEquitySliderChange('min')}
                      onInput={handleEquitySliderChange('min')}
                      onPointerDown={() => handleEquityThumbActivate('min')}
                      onPointerUp={handleEquityThumbRelease}
                      onPointerCancel={handleEquityThumbRelease}
                      onFocus={() => handleEquityThumbActivate('min')}
                      onBlur={handleEquityThumbRelease}
                      style={{ zIndex: activeEquityThumb === 'min' ? 2 : 1 }}
                      disabled={equitySliderDisabled}
                      aria-label={translate('filters.equityAriaMin', 'Minimum equity')}
                    />
                    <input
                      type="range"
                      min={equitySliderMaxThumbMin}
                      max={normalizedEquityMaxBound}
                      step={EQUITY_STEP}
                      value={equitySliderMaxValue}
                      onChange={handleEquitySliderChange('max')}
                      onInput={handleEquitySliderChange('max')}
                      onPointerDown={() => handleEquityThumbActivate('max')}
                      onPointerUp={handleEquityThumbRelease}
                      onPointerCancel={handleEquityThumbRelease}
                      onFocus={() => handleEquityThumbActivate('max')}
                      onBlur={handleEquityThumbRelease}
                      style={{ zIndex: activeEquityThumb === 'max' ? 2 : 1 }}
                      disabled={equitySliderDisabled}
                      aria-label={translate('filters.equityAriaMax', 'Maximum equity')}
                    />
                  </div>
                  <div className="ssc__equity-inputs">
                    <label className="ssc__equity-input">
                      <span>{translate('filters.min', 'Min')}</span>
                      <div className="ssc__filter-input-wrapper">
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={equityInputValues.min}
                          onChange={(event) => handleEquityInputChange('min', event.target.value)}
                          onFocus={handleEquityInputFocus('min')}
                          onBlur={handleEquityInputBlur('min')}
                          aria-label={translate('filters.equityAriaMin', 'Minimum equity')}
                          disabled={equitySliderDisabled}
                        />
                        <span>%</span>
                      </div>
                    </label>
                    <div className="ssc__filter-divider" aria-hidden="true">
                      –
                    </div>
                    <label className="ssc__equity-input">
                      <span>{translate('filters.max', 'Max')}</span>
                      <div className="ssc__filter-input-wrapper">
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={equityInputValues.max}
                          onChange={(event) => handleEquityInputChange('max', event.target.value)}
                          onFocus={handleEquityInputFocus('max')}
                          onBlur={handleEquityInputBlur('max')}
                          aria-label={translate('filters.equityAriaMax', 'Maximum equity')}
                          disabled={equitySliderDisabled}
                        />
                        <span>%</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'general' || activeTab === 'jobs') && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('jobs.heading', 'Open opportunities')}</h2>
                  <p>
                    {translate(
                      'jobs.subheading',
                      'Curated roles from Swiss startups that welcome student talent and emerging professionals.'
                    )}
                  </p>
                </div>
                <div className="ssc__job-toolbar">
                  <span className="ssc__pill">
                    {translate('jobs.rolesCount', '{{count}} role{{plural}}', {
                      count: filteredJobs.length,
                      plural: buildPluralSuffix(filteredJobs.length),
                    })}
                  </span>
                  <div
                    className="ssc__sort-control"
                    role="group"
                    aria-label={translate('jobs.sortLabel', 'Sort opportunities')}
                  >
                    <span className="ssc__sort-label">{translate('jobs.sortLabel', 'Sort by')}</span>
                    <div className="ssc__sort-options">
                      {jobSortOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`ssc__sort-button ${jobSort === option.value ? 'is-active' : ''}`}
                            onClick={() => setJobSort(option.value)}
                            aria-pressed={jobSort === option.value}
                          >
                            <Icon size={16} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {normalizedJobs.length > 0 && (
                <div
                  className={`ssc__calculator-anchor ${
                    salaryCalculatorRevealed ? 'is-revealed' : ''
                  } ${salaryCalculatorOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className={`ssc__calculator-toggle ${salaryCalculatorOpen ? 'is-open' : ''}`}
                    onClick={() => setSalaryCalculatorOpen((prev) => !prev)}
                    aria-expanded={salaryCalculatorOpen}
                    aria-controls={SALARY_CALCULATOR_PANEL_ID}
                    aria-label={translate('calculator.toggleLabel', 'Toggle salary calculator')}
                    disabled={!salaryCalculatorRevealed}
                  >
                    <Calculator size={22} />
                  </button>
                  {shouldRenderSalaryCalculatorPanel ? (
                    <aside
                      id={SALARY_CALCULATOR_PANEL_ID}
                      className={`ssc__calculator-panel ${salaryCalculatorOpen ? 'is-open' : ''}`}
                      aria-hidden={!salaryCalculatorOpen}
                    >
                      <div className="ssc__calculator-head">
                        <div className="ssc__calculator-title">
                          <span className="ssc__calculator-chip">
                            {translate('calculator.chip', 'Compensation insights')}
                          </span>
                          <h3>{translate('calculator.title', 'Salary calculator')}</h3>
                        </div>
                        <button
                          type="button"
                          className="ssc__calculator-close"
                          onClick={() => setSalaryCalculatorOpen(false)}
                          aria-label={translate('calculator.closeLabel', 'Close salary calculator')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {calculatorCompanies.length === 0 ? (
                        <p className="ssc__calculator-empty">
                          {translate('calculator.empty', 'No roles available to convert yet.')}
                        </p>
                      ) : (
                        <>
                          <div className="ssc__calculator-fields">
                            <label htmlFor="calculator-company">
                              <span>{translate('calculator.company', 'Company')}</span>
                              <div className="ssc__select-wrapper">
                                <select
                                  id="calculator-company"
                                  className="ssc__select"
                                  value={salaryCalculatorCompany}
                                  onChange={(event) => setSalaryCalculatorCompany(event.target.value)}
                                >
                                  {calculatorCompanies.map((company) => (
                                    <option key={company.key} value={company.key}>
                                      {company.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="ssc__select-caret" size={18} aria-hidden="true" />
                              </div>
                            </label>
                            <label htmlFor="calculator-role">
                              <span>{translate('calculator.role', 'Role')}</span>
                              <div className="ssc__select-wrapper">
                                <select
                                  id="calculator-role"
                                  className="ssc__select"
                                  value={salaryCalculatorJobId}
                                  onChange={(event) => setSalaryCalculatorJobId(event.target.value)}
                                  disabled={calculatorJobs.length === 0}
                                >
                                  {calculatorJobs.length === 0 ? (
                                    <option value="" disabled>
                                      {translate('calculator.noRoles', 'No roles available')}
                                    </option>
                                  ) : (
                                    calculatorJobs.map((job) => (
                                      <option key={job.id} value={job.id}>
                                        {getLocalizedJobText(job, 'title') || job.title}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <ChevronDown className="ssc__select-caret" size={18} aria-hidden="true" />
                              </div>
                            </label>
                          </div>
                          <div className="ssc__calculator-results">
                            {salaryCalculatorSummary.rows.map((row) => (
                              <div key={row.key} className="ssc__calculator-row">
                                <span>{row.label}</span>
                                <strong>{row.value}</strong>
                              </div>
                            ))}
                          </div>
                          {salaryCalculatorSummary.note && (
                            <p className="ssc__calculator-note">{salaryCalculatorSummary.note}</p>
                          )}
                        </>
                      )}
                    </aside>
                  ) : (
                    <aside
                      id={SALARY_CALCULATOR_PANEL_ID}
                      className="ssc__calculator-panel"
                      aria-hidden="true"
                      hidden
                    />
                  )}
                </div>
              )}

              {jobsLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="ssc__grid">
                  {jobsForDisplay.map((job) => {
                    const isSaved = savedJobs.includes(job.id);
                    const jobIdKey = getJobIdKey(job.id);
                    const hasApplied = jobIdKey ? appliedJobSet.has(jobIdKey) : false;
                    const timingText = buildTimingText(job);
                    const jobTitle = getLocalizedJobText(job, 'title');
                    const jobDescription = getLocalizedJobText(job, 'description');
                    const jobLanguages = getJobLanguages(job);
                    const jobArrangementLabel = buildWorkArrangementLabel(translate, job.work_arrangement);
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{jobTitle}</h3>
                            <p>{job.company_name}</p>
                          </div>
                          <button
                            type="button"
                            className={`ssc__save-btn ${isSaved ? 'is-active' : ''}`}
                            onClick={() => toggleSavedJob(job.id)}
                            aria-label={isSaved
                              ? translate('jobs.saveRemove', 'Remove from saved jobs')
                              : translate('jobs.saveAdd', 'Save job')}
                            aria-disabled={!canSaveJobs}
                            title={!canSaveJobs
                              ? translate('jobs.saveTooltip', 'Sign in as a student to save roles')
                              : undefined}
                          >
                            <Heart size={18} strokeWidth={isSaved ? 0 : 1.5} fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="ssc__job-summary">{jobDescription}</p>

                        <div className="ssc__job-meta">
                          <span>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          {jobArrangementLabel && (
                            <span>
                              <Building2 size={16} />
                              {jobArrangementLabel}
                            </span>
                          )}
                          <span>
                            <Clock size={16} />
                            {timingText}
                          </span>
                          <span>
                            <Users size={16} />
                            {translate('jobs.applicants', '{{count}} applicant{{plural}}', {
                              count: job.applicants,
                              plural: buildPluralSuffix(job.applicants),
                            })}
                          </span>
                          {jobLanguages.length > 0 && (
                            <span>
                              <Languages size={16} />
                              {jobLanguages.join(' · ')}
                            </span>
                          )}
                        </div>

                        {(job.company_team || job.company_fundraising) && (
                          <div className="ssc__job-company-insights">
                            {job.company_team && (
                              <span className="ssc__company-pill ssc__company-pill--team">
                                <Users size={14} />
                                {job.company_team}
                              </span>
                            )}
                            {job.company_fundraising && (
                              <span className="ssc__company-pill ssc__company-pill--funding">
                                <Sparkles size={14} />
                                {job.company_fundraising}
                              </span>
                            )}
                          </div>
                        )}

                        {job.includes_thirteenth_salary && (
                          <div className="ssc__thirteenth-note">
                            <Star size={14} /> {translate('jobs.thirteenth', '13th salary')}
                          </div>
                        )}

                        <div className="ssc__job-tags">
                          {filterLanguageTags(job.tags).map((tag) => (
                            <span key={tag} className="ssc__tag">
                              {tag}
                            </span>
                          ))}
                          <span className="ssc__tag ssc__tag--soft">{job.stage || 'Seed'}</span>
                          {job.motivational_letter_required && (
                            <span className="ssc__tag ssc__tag--required">
                              {translate('jobs.motivationalTag', 'Motivational letter')}
                            </span>
                          )}
                        </div>

                        <div className="ssc__job-footer">
                          <div className="ssc__salary">
                            <span>{job.salary}</span>
                            {job.equity && job.equity !== 'No equity disclosed' ? (
                              <small>+ {job.equity}</small>
                            ) : null}
                          </div>
                          <div className="ssc__job-actions">
                            <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                              {translate('jobs.viewRole', 'View role')}
                            </button>
                            <button 
                              type="button" 
                              className="ssc__ghost-btn ssc__map-btn" 
                              onClick={() => {
                                setMapFocusJobId(job.id);
                                setActiveTab('map');
                                // Scroll to map section
                                setTimeout(() => {
                                  const mapSection = document.querySelector('[data-tab="map"]');
                                  if (mapSection) {
                                    mapSection.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }}
                              title={translate('jobs.showOnMap', 'Show this job on the map')}
                            >
                              <MapPin size={16} />
                              {translate('jobs.showOnMap', 'Show on map')}
                            </button>
                            {canApply ? (
                              <button
                                type="button"
                                className={`ssc__primary-btn ${hasApplied ? 'is-disabled' : ''}`}
                                onClick={() => openApplyModal(job)}
                                disabled={hasApplied}
                              >
                                {hasApplied
                                  ? translate('jobs.applied', 'Applied')
                                  : translate('jobs.apply', 'Apply now')}
                              </button>
                            ) : (
                              <span className="ssc__job-note">{applyRestrictionMessage}</span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {showSeeMoreOpportunities && (
                    <article className="ssc__job-card ssc__job-card--see-more">
                      <div className="ssc__job-see-more-copy">
                        <h3>{translate('jobs.seeMoreHeading', 'See more opportunities')}</h3>
                        <p>
                          {translate('jobs.seeMoreBody', 'Browse all {{count}} open roles on the Opportunities page.', {
                            count: filteredJobs.length,
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ssc__primary-btn"
                        onClick={() => setActiveTab('jobs')}
                      >
                        {translate('jobs.seeMoreButton', 'Explore roles')}
                        <ArrowRight size={18} />
                      </button>
                    </article>
                  )}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Building2 size={40} />
                  <h3>No startups listed yet</h3>
                  <p>Check back soon or invite your favourite Swiss startup to join.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'companies' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('companies.heading', 'Startups to discover')}</h2>
                  <p>
                    {translate(
                      'companies.subheading',
                      'Meet the founders building the next generation of Swiss companies.'
                    )}
                  </p>
                </div>
                <div className="ssc__company-toolbar">
                  <span className="ssc__pill">
                    {translate('companies.count', '{{count}} startup{{plural}}', {
                      count: sortedCompanies.length,
                      plural: buildPluralSuffix(sortedCompanies.length),
                    })}
                  </span>
                  <div
                    className="ssc__sort-control"
                    role="group"
                    aria-label={translate('companies.sortAria', 'Sort startups')}
                  >
                    <span className="ssc__sort-label">{translate('companies.sortLabel', 'Sort by')}</span>
                    <div className="ssc__sort-options">
                      {companySortOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = companySort === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`ssc__sort-button ${isActive ? 'is-active' : ''}`}
                            onClick={() => setCompanySort(option.value)}
                            aria-pressed={isActive}
                          >
                            <Icon size={16} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {showCompanySkeleton ? (
                <div className="ssc__company-grid" aria-hidden="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <article key={`company-skeleton-${index}`} className="ssc__company-card ssc__company-card--loading">
                      <div className="ssc__company-logo">
                        <span className="ssc__skeleton ssc__skeleton--icon" />
                      </div>
                      <div className="ssc__company-content">
                        <span className="ssc__skeleton ssc__skeleton--title" />
                        <span className="ssc__skeleton ssc__skeleton--text" />
                        <ul className="ssc__company-meta">
                          <li>
                            <span className="ssc__skeleton ssc__skeleton--chip" />
                          </li>
                          <li>
                            <span className="ssc__skeleton ssc__skeleton--chip" />
                          </li>
                        </ul>
                        <div className="ssc__company-insights">
                          <span className="ssc__skeleton ssc__skeleton--pill" />
                          <span className="ssc__skeleton ssc__skeleton--pill" />
                        </div>
                        <div className="ssc__company-foot">
                          <span className="ssc__skeleton ssc__skeleton--text" />
                          <div className="ssc__company-actions">
                            <span className="ssc__skeleton ssc__skeleton--button" />
                            <span className="ssc__skeleton ssc__skeleton--button" />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : sortedCompanies.length > 0 ? (
                <div className="ssc__company-grid">
                  {sortedCompanies.map((company, index) => {
                    const companyName =
                      getLocalizedCompanyText(company, 'name')?.trim() ||
                      company.name?.trim() ||
                      translate('companies.defaultName', 'Verified startup');
                    const companyTagline = getLocalizedCompanyText(company, 'tagline');
                    const companyLocation = getLocalizedCompanyText(company, 'location');
                    const companyIndustry = getLocalizedCompanyText(company, 'industry');
                    const companyTeam = getLocalizedCompanyText(company, 'team');
                    const companyFundraising = getLocalizedCompanyText(company, 'fundraising');
                    const companyCulture = getLocalizedCompanyText(company, 'culture');
                    const followKey = company.followKey;
                    const isFollowed = Boolean(followKey && followedCompanies.includes(followKey));
                    const jobCount = Number.isFinite(company.jobCount) ? company.jobCount : 0;
                    const jobCountLabel = translate(
                      jobCount === 1 ? 'companies.jobCount.one' : 'companies.jobCount.other',
                      jobCount === 1 ? '1 open role' : `${jobCount} open roles`,
                      { count: jobCount }
                    );
                    const metaItems = [
                      companyLocation && { icon: MapPin, label: companyLocation },
                      companyIndustry && { icon: Layers, label: companyIndustry },
                    ].filter(Boolean);
                    const insightPills = [
                      companyTeam && {
                        icon: Users,
                        label: companyTeam,
                        className: 'ssc__company-pill--team',
                      },
                      companyFundraising && {
                        icon: Sparkles,
                        label: companyFundraising,
                        className: 'ssc__company-pill--funding',
                      },
                    ].filter(Boolean);
                    const canFollow = Boolean(followKey);
                    const reactKey = followKey || companyName || `company-${index}`;
                    return (
                      <article key={reactKey} className="ssc__company-card">
                        <div className="ssc__company-logo">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={`${companyName} logo`} />
                          ) : (
                            <Rocket size={22} />
                          )}
                        </div>
                        <div className="ssc__company-content">
                          <div className="ssc__company-header">
                            <h3 className="ssc__company-name">{companyName}</h3>
                            {company.verification_status === 'verified' && (
                              <span className="ssc__badge verified">
                                <CheckCircle2 size={14} />
                                {translate('companies.verifiedBadge', 'Verified')}
                              </span>
                            )}
                          </div>
                          {companyTagline && <p className="ssc__company-tagline">{companyTagline}</p>}
                          {metaItems.length > 0 && (
                            <ul className="ssc__company-meta">
                              {metaItems.map((item) => {
                                const MetaIcon = item.icon;
                                return (
                                  <li key={`${companyName}-${item.label}`}>
                                    <MetaIcon size={14} />
                                    {item.label}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {(insightPills.length > 0 || company.info_link) && (
                            <div className="ssc__company-insights">
                              {insightPills.map((pill) => {
                                const PillIcon = pill.icon;
                                return (
                                  <span key={`${companyName}-${pill.label}`} className={`ssc__company-pill ${pill.className}`}>
                                    <PillIcon size={14} />
                                    {pill.label}
                                  </span>
                                );
                              })}
                              {company.info_link && (
                                <a
                                  href={company.info_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ssc__company-pill ssc__company-pill--link"
                                >
                                  <ArrowRight size={14} />
                                  {translate('companies.moreInfo', 'More about us')}
                                </a>
                              )}
                            </div>
                          )}
                          {companyCulture && (
                            <p className="ssc__company-culture">{companyCulture}</p>
                          )}
                          <div className="ssc__company-foot">
                            <span className="ssc__company-jobs">{jobCountLabel}</span>
                            <div className="ssc__company-actions">
                              <button
                                type="button"
                                className={`ssc__follow-btn ${isFollowed ? 'is-active' : ''}`}
                                onClick={() => toggleFollowCompany(followKey)}
                                aria-pressed={isFollowed}
                                disabled={!canFollow}
                              >
                                {isFollowed
                                  ? translate('companies.following', 'Following')
                                  : translate('companies.follow', 'Follow')}
                              </button>
                              <button
                                type="button"
                                className="ssc__outline-btn"
                                onClick={() => openCompanyProfile(company)}
                              >
                                {translate('companies.viewProfile', 'View profile')}
                              </button>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ssc__outline-btn"
                                >
                                  {translate('companies.visitWebsite', 'Visit website')}
                                </a>
                              )}
                              {company.id && (
                                <button
                                  type="button"
                                  className="ssc__link-button"
                                  onClick={() => openReviewsModal(company)}
                                >
                                  {translate('companies.reviews', 'Reviews')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Building2 size={40} />
                  <h3>{translate('companies.emptyTitle', 'No startups to show yet')}</h3>
                  <p>
                    {translate(
                      'companies.emptyDescription',
                      'Check back soon to meet the next wave of Swiss startup teams hiring here.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'my-jobs' && user?.type === 'startup' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>Your job posts</h2>
                  <p>Track live opportunities, keep them up to date, and follow applicant interest at a glance.</p>
                </div>
                <div className="ssc__section-header-actions">
                <span className="ssc__pill">
                  {translate('companies.postingsCount', '{{count}} active posting{{plural}}', {
                    count: startupJobs.length,
                    plural: buildPluralSuffix(startupJobs.length),
                  })}
                </span>
                {isStartupVerified ? (
                  <button type="button" className="ssc__primary-btn" onClick={openPostJobFlow}>
                    {translate('companies.postVacancy', 'Post vacancy')}
                  </button>
                ) : (
                  <span className="ssc__pill ssc__pill--muted">
                    {translate('companies.verificationRequired', 'Verification required')}
                  </span>
                )}
              </div>
            </div>

              {!isStartupVerified && (
                <div className="ssc__notice">
                  <span>
                    {translate(
                      'companies.verifyPrompt',
                      'Verify your startup to unlock job postings. Add your commercial register details and logo.'
                    )}
                  </span>
                  <button type="button" onClick={() => setStartupModalOpen(true)}>
                    {translate('companies.completeVerification', 'Complete verification')}
                  </button>
                </div>
              )}

              {startupJobs.length > 0 ? (
                <div className="ssc__grid">
                  {startupJobs.map((job) => {
                    const postedAt = job.created_at ? new Date(job.created_at) : null;
                    const postedLabel = postedAt
                      ? postedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : job.posted || translate('companies.recentlyPosted', 'Recently posted');
                    const jobTitle = getLocalizedJobText(job, 'title');
                    const jobDescription = getLocalizedJobText(job, 'description');
                    const jobLanguages = getJobLanguages(job);
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{jobTitle}</h3>
                            <p>{job.company_name}</p>
                          </div>
                          <span className="ssc__pill ssc__pill--muted">{postedLabel}</span>
                        </div>
                        <p className="ssc__job-summary">{jobDescription}</p>
                        <div className="ssc__job-meta">
                          <span>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span>
                            <Clock size={16} />
                            {job.employment_type}
                          </span>
                          <span>
                            <Users size={16} />
                            {translate('jobs.applicants', '{{count}} applicant{{plural}}', {
                              count: job.applicants,
                              plural: buildPluralSuffix(job.applicants),
                            })}
                          </span>
                          {jobLanguages.length > 0 && (
                            <span>
                              <Languages size={16} />
                              {jobLanguages.join(' · ')}
                            </span>
                          )}
                        </div>
                        <div className="ssc__job-actions">
                          <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                            {translate('jobs.viewRole', 'View role')}
                          </button>
                          <button
                            type="button"
                            className="ssc__primary-btn"
                            onClick={() => setActiveTab('applications')}
                          >
                            {translate('jobs.viewApplicants', 'View applicants')}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Briefcase size={40} />
                  <h3>{translate('jobs.noJobsTitle', 'No job posts yet')}</h3>
                  <p>
                    {isStartupVerified
                      ? translate(
                          'jobs.noJobsVerified',
                          'Share your first opportunity to start meeting candidates.'
                        )
                      : translate(
                          'jobs.noJobsUnverified',
                          'Get verified to unlock job posting and start attracting talent.'
                        )}
                  </p>
                  {isStartupVerified && (
                    <button type="button" className="ssc__primary-btn" onClick={openPostJobFlow}>
                      {translate('jobs.postFirstRole', 'Post your first role')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'applications' && user?.type === 'startup' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('jobs.applicantsTabHeading', 'Applicants')}</h2>
                  <p>
                    {translate(
                      'companies.applicantsSubheading',
                      'Track progress, review motivational letters, and manage your hiring pipeline.'
                    )}
                  </p>
                </div>
                <span className="ssc__pill">
                  {translate('jobs.applicants', '{{count}} applicant{{plural}}', {
                    count: applications.length,
                    plural: buildPluralSuffix(applications.length),
                  })}
                </span>
              </div>

              {applicationsLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="ssc__applications-grid">
                  <div className="ssc__applications-header">
                    <span>{translate('applications.listHeaders.name', 'Name')}</span>
                    <span>{translate('applications.listHeaders.university', 'University')}</span>
                    <span>{translate('applications.listHeaders.status', 'Status')}</span>
                    <span>{translate('applications.listHeaders.applied', 'Applied')}</span>
                    <span aria-hidden="true" />
                  </div>
                  <ul className="ssc__applications-rows">
                    {applications.map((application) => {
                      const candidate = application.profiles;
                      const job = application.jobs;
                      const jobTitle = getLocalizedJobText(job, 'title');
                      const cvLink = application.cv_override_url || candidate?.cv_url;
                      const candidateName =
                        candidate?.full_name || translate('applications.candidateFallback', 'Candidate');
                      const candidateUniversity =
                        candidate?.university ||
                        translate('applications.universityFallback', 'University not provided');
                      const appliedAt = application.created_at ? new Date(application.created_at) : null;
                      const appliedAtValid = appliedAt && !Number.isNaN(appliedAt.valueOf());
                      const appliedDateSummary = appliedAtValid
                        ? appliedAt.toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : translate('applications.appliedDateUnknown', 'Date unavailable');
                      const appliedDateDetail = appliedAtValid
                        ? appliedAt.toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : translate('applications.appliedDateUnknown', 'Date unavailable');
                      const threadKey = getApplicationThreadKey(application);
                      const legacyThreadKey = getJobIdKey(application.id);
                      const rawThreadState =
                        (threadKey && applicationThreads[threadKey]) ||
                        (legacyThreadKey && applicationThreads[legacyThreadKey]) ||
                        null;
                      const { entries: threadEntries } = normalizeThreadStateValue(rawThreadState);
                      const primaryThreadKey = threadKey || legacyThreadKey || String(application.id);
                      const cleanupThreadKey =
                        threadKey && legacyThreadKey && legacyThreadKey !== threadKey
                          ? legacyThreadKey
                          : undefined;
                      const resolvedType = resolveApplicationThreadType(
                        primaryThreadKey,
                        cleanupThreadKey
                      );
                      const statusKey =
                        application.status && applicationStatuses.includes(application.status)
                          ? application.status
                          : 'submitted';
                      const statusFallback = statusKey
                        .split('_')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ');
                      const statusLabel = translate(
                        `applications.status.${statusKey}`,
                        statusFallback
                      );
                      const scheduleDraftRaw =
                        pickThreadValue(
                          applicationThreadScheduleDrafts,
                          primaryThreadKey,
                          cleanupThreadKey
                        ) || '';
                      const scheduleDraftValue =
                        typeof scheduleDraftRaw === 'string' ? scheduleDraftRaw : String(scheduleDraftRaw);
                      const threadDraftRaw =
                        pickThreadValue(applicationThreadDrafts, primaryThreadKey, cleanupThreadKey) || '';
                      const threadDraftValue =
                        typeof threadDraftRaw === 'string' ? threadDraftRaw : String(threadDraftRaw);
                      const threadError =
                        pickThreadValue(applicationThreadErrors, primaryThreadKey, cleanupThreadKey) || '';
                      const isExpanded = expandedApplicationId === application.id;
                      const panelId = `ssc-application-panel-${application.id}`;
                      const buttonId = `ssc-application-toggle-${application.id}`;
                      return (
                        <li
                          key={application.id}
                          className={`ssc__applications-row ${isExpanded ? 'ssc__applications-row--expanded' : ''}`}
                        >
                          <button
                            type="button"
                            id={buttonId}
                            className="ssc__applications-toggle"
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            onClick={() => handleToggleApplicationRow(application.id)}
                          >
                            <span className="ssc__applications-cell ssc__applications-cell--primary">
                              {candidateName}
                            </span>
                            <span className="ssc__applications-cell ssc__applications-cell--secondary">
                              {candidateUniversity}
                            </span>
                            <span
                              className={`ssc__applications-cell ssc__applications-status ssc__applications-status--${statusKey}`}
                            >
                              {statusLabel}
                            </span>
                            <span className="ssc__applications-cell ssc__applications-cell--muted">
                              {appliedDateSummary}
                            </span>
                            <ChevronDown
                              className="ssc__applications-toggle-icon"
                              size={18}
                              aria-hidden="true"
                            />
                          </button>
                          <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className="ssc__applications-panel"
                            hidden={!isExpanded}
                          >
                            <article className="ssc__application-card">
                              <header className="ssc__application-header">
                                <div>
                                  <h3>{jobTitle}</h3>
                                  <p>{job?.company_name}</p>
                                </div>
                                <div className="ssc__status-select">
                                  <label>
                                    {translate('applications.statusLabel', 'Status')}
                                    <div className="ssc__select-wrapper">
                                      <select
                                        className="ssc__select"
                                        value={application.status}
                                        onChange={(event) =>
                                          updateApplicationStatus(application.id, event.target.value)
                                        }
                                        disabled={applicationStatusUpdating === application.id}
                                      >
                                        {applicationStatuses.map((status) => (
                                          <option key={status} value={status}>
                                            {translate(
                                              `applications.status.${status}`,
                                              formatStatusKeyLabel(status)
                                            )}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="ssc__select-caret" size={16} aria-hidden="true" />
                                    </div>
                                  </label>
                                </div>
                              </header>

                              <div className="ssc__candidate">
                                <div className="ssc__avatar-medium">
                                  {candidate?.avatar_url ? (
                                    <img
                                      src={candidate.avatar_url}
                                      alt={candidateName}
                                    />
                                  ) : (
                                    <span>
                                      {candidate?.full_name?.charAt(0) ||
                                        translate('applications.candidateInitialFallback', 'C')}
                                    </span>
                                  )}
                                </div>
                                <div className="ssc__candidate-body">
                                  <strong>{candidateName}</strong>
                                  <div className="ssc__candidate-details">
                                    <span>{candidateUniversity}</span>
                                    <span>
                                      {candidate?.program ||
                                        translate('applications.programFallback', 'Program not provided')}
                                    </span>
                                  </div>
                                  {cvLink ? (
                                    <a href={cvLink} target="_blank" rel="noreferrer">
                                      {translate('applications.viewCv', 'View CV')}
                                    </a>
                                  ) : (
                                    <span>{translate('applications.noCv', 'No CV provided')}</span>
                                  )}
                                </div>
                              </div>

                              {application.motivational_letter && (
                                <details className="ssc__letter">
                                  <summary>
                                    {translate('applications.motivationalHeading', 'Motivational letter')}
                                  </summary>
                                  {application.motivational_letter.startsWith('http') ? (
                                    <a href={application.motivational_letter} target="_blank" rel="noreferrer">
                                      {translate('applications.downloadLetter', 'Download motivational letter')}
                                    </a>
                                  ) : (
                                    <p>{application.motivational_letter}</p>
                                  )}
                                </details>
                              )}

                              <section className="ssc__application-thread">
                                <header className="ssc__thread-header">
                                  <span className="ssc__thread-icon" aria-hidden="true">
                                    <MessageCircle size={18} />
                                  </span>
                                  <h4>{translate('applications.threadTitle', 'Communication & scheduling')}</h4>
                                </header>

                                {threadEntries.length > 0 ? (
                                  <ul className="ssc__thread-list">
                                    {threadEntries.map((entry) => {
                                      const typeLabel = translate(
                                        `applications.threadTypes.${entry.type}`,
                                        entry.type === 'interview'
                                          ? 'Interview'
                                          : entry.type === 'note'
                                            ? 'Internal note'
                                            : 'Message'
                                      );
                                      const authorKey = (entry.author || 'startup') === 'student' ? 'student' : 'startup';
                                      const authorLabel =
                                        authorKey === 'student'
                                          ? candidateName ||
                                            translate('applications.threadAuthor.student', 'Candidate')
                                          : translate('applications.threadAuthor.you', 'You');
                                      return (
                                        <li key={entry.id} className="ssc__thread-item">
                                          <div className="ssc__thread-meta">
                                            <div className="ssc__thread-meta-left">
                                              <span className="ssc__thread-author">{authorLabel}</span>
                                              <span className={`ssc__badge ssc__badge--${entry.type}`}>{typeLabel}</span>
                                            </div>
                                            <time dateTime={entry.createdAt}>{formatThreadTimestamp(entry.createdAt)}</time>
                                          </div>
                                          <p>{entry.message}</p>
                                          {entry.scheduleAt ? (
                                            <div className="ssc__thread-schedule">
                                              <Calendar size={14} aria-hidden="true" />
                                              <span>
                                                {translate('applications.threadScheduledFor', 'Scheduled for {{date}}', {
                                                  date: formatThreadTimestamp(entry.scheduleAt),
                                                })}
                                              </span>
                                            </div>
                                          ) : null}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <p className="ssc__thread-empty">
                                    {translate(
                                      'applications.threadEmpty',
                                      'No conversation yet. Start by adding a note below.'
                                    )}
                                  </p>
                                )}

                                <form
                                  className="ssc__thread-form"
                                  onSubmit={(event) =>
                                    handleApplicationThreadSubmit(
                                      event,
                                      application,
                                      primaryThreadKey,
                                      cleanupThreadKey
                                    )
                                  }
                                >
                                  <div className="ssc__thread-form-row">
                                    <label className="ssc__thread-field">
                                      <span>{translate('applications.threadTypeLabel', 'Entry type')}</span>
                                      <div className="ssc__select-wrapper">
                                        <select
                                          className="ssc__select"
                                          value={resolvedType}
                                          onChange={(event) =>
                                            handleApplicationThreadTypeChange(
                                              primaryThreadKey,
                                              event.target.value,
                                              cleanupThreadKey
                                            )
                                          }
                                        >
                                          {APPLICATION_THREAD_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                              {translate(
                                                `applications.threadTypes.${type}`,
                                                type === 'interview'
                                                  ? 'Interview'
                                                  : type === 'note'
                                                    ? 'Internal note'
                                                    : 'Message'
                                              )}
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown className="ssc__select-caret" size={16} aria-hidden="true" />
                                      </div>
                                    </label>

                                    {resolvedType === 'interview' && (
                                      <label className="ssc__thread-field">
                                        <span>{translate('applications.threadScheduleLabel', 'Date & time')}</span>
                                        <input
                                          type="datetime-local"
                                          value={scheduleDraftValue}
                                          onChange={(event) =>
                                            handleApplicationThreadScheduleChange(
                                              primaryThreadKey,
                                              event.target.value,
                                              cleanupThreadKey
                                            )
                                          }
                                        />
                                        <small>
                                          {translate(
                                            'applications.threadScheduleHelper',
                                            'Share a proposed or confirmed slot.'
                                          )}
                                        </small>
                                      </label>
                                    )}
                                  </div>

                                  <label className="ssc__thread-field">
                                    <span className="ssc__thread-label">
                                      {translate('applications.threadMessageLabel', 'Message')}
                                    </span>
                                    <textarea
                                      value={threadDraftValue}
                                      onChange={(event) =>
                                        handleApplicationThreadDraftChange(
                                          primaryThreadKey,
                                          event.target.value,
                                          cleanupThreadKey
                                        )
                                      }
                                      placeholder={translate(
                                        'applications.threadPlaceholder',
                                        'Share an update, confirm an interview, or leave an internal note…'
                                      )}
                                    />
                                  </label>
                                  {threadError && <p className="ssc__thread-error">{threadError}</p>}
                                  <button type="submit" className="ssc__primary-btn">
                                    {translate('applications.threadSubmit', 'Add to thread')}
                                  </button>
                                </form>
                              </section>

                              <footer className="ssc__application-footer">
                                <span className="ssc__application-applied">
                                  {appliedAtValid
                                    ? translate('applications.appliedOn', 'Applied {{date}}', {
                                        date: appliedDateDetail,
                                      })
                                    : appliedDateDetail}
                                </span>
                                <button
                                  type="button"
                                  className="ssc__ghost-btn"
                                  onClick={() => handleApplicationRemoval(application.id)}
                                >
                                  {translate('applications.remove', 'Remove application')}
                                </button>
                              </footer>
                            </article>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Briefcase size={40} />
                  <h3>{translate('applications.emptyTitle', 'No applicants yet')}</h3>
                  <p>
                    {translate(
                      'applications.emptyBody',
                      'Share your job link or post a new role to start receiving applications.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'messages' && user?.type === 'student' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('applications.studentInboxTitle', 'Messages')}</h2>
                  <p>
                    {translate(
                      'applications.studentInboxSubtitle',
                      'Startups will reach out here after reviewing your applications.'
                    )}
                  </p>
                </div>
                {studentInboxThreads.length > 0 && (
                  <span className="ssc__pill">
                    {translate('applications.studentInboxCount', '{{count}} conversation{{plural}}', {
                      count: studentInboxThreads.length,
                      plural: buildPluralSuffix(studentInboxThreads.length, { de: ['', 'e'] }),
                    })}
                  </span>
                )}
              </div>

              {studentInboxThreads.length > 0 ? (
                <div className="ssc__student-inbox">
                  {studentInboxThreads.map((thread) => {
                    const jobTitle =
                      thread.meta.jobTitle ||
                      translate('applications.studentInboxJobFallback', 'Opportunity');
                    const companyName =
                      thread.meta.companyName ||
                      translate('applications.studentInboxCompanyFallback', 'Startup');
                    const draftRaw = pickThreadValue(applicationThreadDrafts, thread.key, null) || '';
                    const draftValue = typeof draftRaw === 'string' ? draftRaw : String(draftRaw);
                    const threadError = pickThreadValue(applicationThreadErrors, thread.key, null) || '';
                    return (
                      <article key={thread.key} className="ssc__student-thread">
                        <header className="ssc__student-thread-header">
                          <span className="ssc__thread-icon" aria-hidden="true">
                            <MessageCircle size={18} />
                          </span>
                          <div>
                            <h3>{jobTitle}</h3>
                            <p>{companyName}</p>
                          </div>
                        </header>

                        {thread.entries.length > 0 ? (
                          <ul className="ssc__thread-list">
                            {thread.entries.map((entry) => {
                              const typeLabel = translate(
                                `applications.threadTypes.${entry.type}`,
                                entry.type === 'interview'
                                  ? 'Interview'
                                  : entry.type === 'note'
                                    ? 'Internal note'
                                    : 'Message'
                              );
                              const authorIsStudent = (entry.author || 'startup') === 'student';
                              const authorLabel = authorIsStudent
                                ? translate('applications.threadAuthor.you', 'You')
                                : companyName || translate('applications.threadAuthor.startup', 'Startup team');
                              return (
                                <li key={entry.id} className="ssc__thread-item">
                                  <div className="ssc__thread-meta">
                                    <div className="ssc__thread-meta-left">
                                      <span className="ssc__thread-author">{authorLabel}</span>
                                      <span className={`ssc__badge ssc__badge--${entry.type}`}>{typeLabel}</span>
                                    </div>
                                    <time dateTime={entry.createdAt}>{formatThreadTimestamp(entry.createdAt)}</time>
                                  </div>
                                  <p>{entry.message}</p>
                                  {entry.scheduleAt ? (
                                    <div className="ssc__thread-schedule">
                                      <Calendar size={14} aria-hidden="true" />
                                      <span>
                                        {translate('applications.threadScheduledFor', 'Scheduled for {{date}}', {
                                          date: formatThreadTimestamp(entry.scheduleAt),
                                        })}
                                      </span>
                                    </div>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="ssc__thread-empty">
                            {translate(
                              'applications.threadEmpty',
                              'No conversation yet. Start by adding a note below.'
                            )}
                          </p>
                        )}

                        <form
                          className="ssc__thread-form"
                          onSubmit={(event) =>
                            handleStudentThreadSubmit(
                              event,
                              thread.key,
                              thread.meta,
                              thread.employerHasMessaged
                            )
                          }
                        >
                          <label className="ssc__thread-field">
                            <span className="ssc__thread-label">
                              {translate('applications.threadMessageLabel', 'Message')}
                            </span>
                            <textarea
                              rows={3}
                              value={draftValue}
                              onChange={(event) =>
                                handleApplicationThreadDraftChange(thread.key, event.target.value)
                              }
                              placeholder={translate(
                                'applications.studentReplyPlaceholder',
                                'Write your reply…'
                              )}
                              disabled={!thread.employerHasMessaged}
                            />
                          </label>
                          {threadError && <p className="ssc__thread-error">{threadError}</p>}

                          <button
                            type="submit"
                            className="ssc__primary-btn ssc__thread-submit"
                            disabled={!thread.employerHasMessaged}
                          >
                            <Send size={16} />
                            <span>{translate('applications.studentReplyCta', 'Send reply')}</span>
                          </button>

                          {!thread.employerHasMessaged && (
                            <p className="ssc__student-reply-lock">
                              {translate(
                                'applications.studentReplyLocked',
                                'Startups send the first message. You’ll be able to respond here once they reach out.'
                              )}
                            </p>
                          )}
                        </form>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <MessageCircle size={40} />
                  <h3>{translate('applications.studentInboxEmptyTitle', 'No messages yet')}</h3>
                  <p>
                    {translate(
                      'applications.studentInboxEmptyDescription',
                      'Apply to roles and keep an eye out for startup replies here.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'map' && (
          <section className="ssc__section" data-tab="map">
            <div className="ssc__max">
              <JobMapView
                jobs={normalizedJobs}
                events={events}
                onJobClick={(job) => {
                  setSelectedJob(job);
                }}
                translate={translate}
                focusJobId={mapFocusJobId}
                onFocusHandled={() => setMapFocusJobId(null)}
              />
            </div>
          </section>
        )}

        {activeTab === 'events' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('events.title', 'Events')}</h2>
                  <p>
                    {translate(
                      'events.subtitle',
                      'Share events you organize or attend to connect with the community.'
                    )}
                  </p>
                </div>
                <div className="ssc__section-header-actions">
                  {canPostEvents ? (
                    <button
                      type="button"
                      className="ssc__primary-btn"
                      onClick={() => setEventModalOpen(true)}
                    >
                      {translate('events.postEvent', 'Post Event')}
                    </button>
                  ) : !isLoggedIn ? (
                    <>
                      <span className="ssc__info">
                        {translate(
                          'events.signInNotice',
                          'Sign in with your startup account to post an event.'
                        )}
                      </span>
                      <button
                        type="button"
                        className="ssc__ghost-btn"
                        onClick={() => {
                          setIsRegistering(false);
                          setShowLoginModal(true);
                        }}
                      >
                        {translate('events.signInCta', 'Sign in')}
                      </button>
                    </>
                  ) : isStartupUser ? (
                    <span className="ssc__info">
                      {translate(
                        'events.completeProfileHint',
                        'Complete your startup profile to post events.'
                      )}
                    </span>
                  ) : (
                    <span className="ssc__info">
                      {translate(
                        'events.startupOnlyPosting',
                        'Only startup accounts can post events.'
                      )}
                    </span>
                  )}
                </div>
              </div>

              {eventsLoading ? (
                <div className="ssc__loading">Loading events...</div>
              ) : events.length > 0 ? (
                <div className="ssc__grid">
                  {events.map((event) => {
                    const eventDate = event.event_date ? new Date(event.event_date) : null;
                    const dateLocale =
                      language === 'fr' ? 'fr-CH' : language === 'de' ? 'de-CH' : 'en-GB';
                    const formattedDate = eventDate
                      ? eventDate.toLocaleDateString(dateLocale, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '';
                    const timeValue = event.event_time ? String(event.event_time) : '';
                    const formattedTime = timeValue
                      ? timeValue.length > 5
                        ? timeValue.slice(0, 5)
                        : timeValue
                      : '';
                    const fullAddressSegments = [
                      event.street_address,
                      [event.postal_code, event.city].filter(Boolean).join(' '),
                    ].filter(Boolean);
                    const fullAddress = fullAddressSegments.join(', ');

                    return (
                      <article key={event.id} className="ssc__event-card">
                        {event.poster_url && (
                          <div className="ssc__event-poster">
                            <img
                              src={event.poster_url}
                              alt={`${event.title} poster`}
                              className="ssc__event-poster-image"
                            />
                          </div>
                        )}
                        <div className="ssc__event-content">
                          <div className="ssc__event-header">
                            <h3>{event.title}</h3>
                            <div className="ssc__event-meta">
                              {event.location && (
                                <div className="ssc__event-venue">
                                  <Building2 size={16} />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="ssc__event-date">
                                <Calendar size={16} />
                                <span>{formattedDate}</span>
                              </div>
                              {formattedTime && (
                                <div className="ssc__event-time">
                                  <Clock size={16} />
                                  <span>{formattedTime}</span>
                                </div>
                              )}
                              {fullAddress && (
                                <div className="ssc__event-location">
                                  <MapPin size={16} />
                                  <span>{fullAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {event.description && (
                            <p className="ssc__event-description">{event.description}</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Calendar size={40} />
                  <h3>{translate('events.emptyTitle', 'No events yet')}</h3>
                  <p>
                    {translate(
                      'events.emptyDescription',
                      'Be the first to share an event with the community!'
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'saved' && (
          <section className="ssc__section">
            <div className="ssc__max">
              <div className="ssc__section-header">
                <div>
                  <h2>{translate('jobs.savedHeading', 'Saved roles')}</h2>
                  <p>
                    {translate(
                      'jobs.savedSubheading',
                      'Keep tabs on opportunities you want to revisit or apply to later.'
                    )}
                  </p>
                </div>
                <span className="ssc__pill">
                  {translate('jobs.savedCount', '{{count}} saved', {
                    count: savedJobList.length,
                    plural: buildPluralSuffix(savedJobList.length),
                  })}
                </span>
              </div>

              {!canSaveJobs ? (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>{translate('jobs.savedOnlyStudents', 'Student accounts only')}</h3>
                  <p>
                    {isLoggedIn
                      ? translate('jobs.savedSwitch', 'Switch to a student account to save roles.')
                      : translate(
                          'jobs.savedSignInPrompt',
                          'Sign in with your student account to save opportunities for later.'
                        )}
                  </p>
                  {!isLoggedIn && (
                    <button
                      type="button"
                      className="ssc__primary-btn"
                      onClick={() => {
                        setIsRegistering(false);
                        setShowLoginModal(true);
                      }}
                    >
                      {translate('nav.signIn', 'Sign in')}
                    </button>
                  )}
                </div>
              ) : savedJobList.length > 0 ? (
                <div className="ssc__grid">
                  {savedJobList.map((job) => {
                    const timingText = buildTimingText(job);
                    const jobTitle = getLocalizedJobText(job, 'title');
                    const jobDescription = getLocalizedJobText(job, 'description');
                    const jobLanguages = getJobLanguages(job);
                    const jobIdKey = getJobIdKey(job.id);
                    const hasApplied = jobIdKey ? appliedJobSet.has(jobIdKey) : false;
                    const jobArrangementLabel = buildWorkArrangementLabel(translate, job.work_arrangement);
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{jobTitle}</h3>
                            <p>{job.company_name}</p>
                          </div>
                          <button
                            type="button"
                            className="ssc__save-btn is-active"
                            onClick={() => toggleSavedJob(job.id)}
                          >
                            <Heart size={18} strokeWidth={0} fill="currentColor" />
                          </button>
                        </div>
                        <p className="ssc__job-summary">{jobDescription}</p>
                        <div className="ssc__job-meta">
                          <span>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          {jobArrangementLabel && (
                            <span>
                              <Building2 size={16} />
                              {jobArrangementLabel}
                            </span>
                          )}
                          <span>
                            <Clock size={16} />
                            {timingText}
                          </span>
                          <span>
                            <Users size={16} />
                            {translate('jobs.applicants', '{{count}} applicant{{plural}}', {
                              count: job.applicants,
                              plural: buildPluralSuffix(job.applicants),
                            })}
                          </span>
                          {jobLanguages.length > 0 && (
                            <span>
                              <Languages size={16} />
                              {jobLanguages.join(' · ')}
                            </span>
                          )}
                        </div>
                        {(job.company_team || job.company_fundraising) && (
                          <div className="ssc__job-company-insights">
                            {job.company_team && (
                              <span className="ssc__company-pill ssc__company-pill--team">
                                <Users size={14} />
                                {job.company_team}
                              </span>
                            )}
                            {job.company_fundraising && (
                              <span className="ssc__company-pill ssc__company-pill--funding">
                                <Sparkles size={14} />
                                {job.company_fundraising}
                              </span>
                            )}
                          </div>
                        )}
                        {job.includes_thirteenth_salary && (
                          <div className="ssc__thirteenth-note">
                            <Star size={14} /> {translate('jobs.thirteenth', '13th salary')}
                          </div>
                        )}
                        <div className="ssc__job-tags">
                          {filterLanguageTags(job.tags).map((tag) => (
                            <span key={tag} className="ssc__tag">
                              {tag}
                            </span>
                          ))}
                          <span className="ssc__tag ssc__tag--soft">{job.stage || 'Seed'}</span>
                          {job.motivational_letter_required && (
                            <span className="ssc__tag ssc__tag--required">
                              {translate('jobs.motivationalTag', 'Motivational letter')}
                            </span>
                          )}
                        </div>
                        <div className="ssc__job-footer">
                          <div className="ssc__salary">
                            <span>{job.salary}</span>
                            {job.equity && job.equity !== 'No equity disclosed' ? (
                              <small>+ {job.equity}</small>
                            ) : null}
                          </div>
                          <div className="ssc__job-actions">
                            <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                              {translate('jobs.viewRole', 'View role')}
                            </button>
                            <button 
                              type="button" 
                              className="ssc__ghost-btn ssc__map-btn" 
                              onClick={() => {
                                setMapFocusJobId(job.id);
                                setActiveTab('map');
                                // Scroll to map section
                                setTimeout(() => {
                                  const mapSection = document.querySelector('[data-tab="map"]');
                                  if (mapSection) {
                                    mapSection.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              }}
                              title={translate('jobs.showOnMap', 'Show this job on the map')}
                            >
                              <MapPin size={16} />
                              {translate('jobs.showOnMap', 'Show on map')}
                            </button>
                            {canApply ? (
                            <button
                              type="button"
                              className={`ssc__primary-btn ${hasApplied ? 'is-disabled' : ''}`}
                              onClick={() => openApplyModal(job)}
                              disabled={hasApplied}
                            >
                              {hasApplied
                                ? translate('jobs.applied', 'Applied')
                                : translate('jobs.apply', 'Apply now')}
                            </button>
                            ) : (
                              <span className="ssc__job-note">{applyRestrictionMessage}</span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>{translate('jobs.savedEmptyTitle', 'No saved roles yet')}</h3>
                  <p>{translate('jobs.savedEmptyDescription', 'Tap the heart on an opportunity to keep it here for later.')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'general' && (
          <>
            <section className="ssc__section">
              <div className="ssc__max ssc__two-column">
                <div className="ssc__steps">
                  <h2>{translate('steps.heading', 'How it works')}</h2>
                  <p>
                    {translate(
                      'steps.description',
                      'Six steps to land a role with a Swiss startup that shares your ambition.'
                    )}
                  </p>
                  <div className="ssc__step-grid">
                    {steps.map((step) => (
                      <article key={step.id} className="ssc__step-card">
                        <div className="ssc__step-icon">
                          <step.icon size={18} />
                        </div>
                        <div>
                          <h3>
                            {translate(`steps.items.${step.id}.title`, step.title)}
                          </h3>
                          <p>
                            {translate(`steps.items.${step.id}.description`, step.description)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="ssc__testimonials">
                  <aside className="ssc__featured-corner">
                    <div className="ssc__featured-header">
                      <h3>{translate('featured.heading', 'Featured companies')}</h3>
                      <button type="button" className="ssc__link-button" onClick={() => setActiveTab('companies')}>
                        {translate('featured.viewAll', 'View all')}
                      </button>
                    </div>
                    <ul className="ssc__featured-list">
                      {featuredCompanies.length > 0 ? (
                        featuredCompanies.map((company, index) => {
                          const followKey = company.followKey;
                          const reactKey = followKey || company.name || `featured-${index}`;
                          const companyName =
                            getLocalizedCompanyText(company, 'name')?.trim() ||
                            company.name ||
                            translate('companies.defaultName', 'Verified startup');
                          const jobCount = Number.isFinite(company.jobCount) ? company.jobCount : 0;
                          const jobCountLabel = translate(
                            jobCount === 1
                              ? 'featured.singleRole'
                              : 'featured.multipleRoles',
                            jobCount === 1 ? '1 open role' : `${jobCount} open roles`,
                            {
                              count: jobCount,
                            }
                          );
                          return (
                            <li key={reactKey} className="ssc__featured-item">
                              <div>
                                <span className="ssc__featured-name">{companyName}</span>
                                <span className="ssc__featured-meta">{jobCountLabel}</span>
                              </div>
                              <button
                                type="button"
                                className={`ssc__follow-chip ${company.isFollowed ? 'is-active' : ''}`}
                                onClick={() => toggleFollowCompany(followKey)}
                                disabled={!followKey}
                              >
                                {company.isFollowed
                                  ? translate('featured.following', 'Following')
                                  : translate('featured.follow', 'Follow')}
                              </button>
                            </li>
                          );
                        })
                      ) : (
                        <li className="ssc__featured-empty">
                          {translate('featured.empty', 'New startups are being curated—check back soon.')}
                        </li>
                      )}
                    </ul>
                  </aside>
                  <h2>{translate('community.heading', 'Stories from our community')}</h2>
                  <div className="ssc__testimonial-grid">
                    {testimonials.map((testimonial) => (
                      <blockquote key={testimonial.id} className="ssc__testimonial-card">
                        <p>“{translate(`testimonials.${testimonial.id}.quote`, testimonial.quote)}”</p>
                        <footer>
                          <strong>{testimonial.name}</strong>
                          <span>{translate(`testimonials.${testimonial.id}.role`, testimonial.role)}</span>
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="ssc__section ssc__career-tips">
              <div className="ssc__max">
                <div className="ssc__section-header">
                  <div>
                    <h2 className="ssc__career-tips-title">
                      <Lightbulb size={20} />
                      <span>{translate('tips.heading', 'Startup Career Tips')}</span>
                    </h2>
                    <p>
                      {translate(
                        'tips.description',
                        'Level up your startup search with quick advice founders share most often.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="ssc__tips-grid">
                  {careerTips.map((tip) => (
                    <article key={tip.id} className="ssc__tip-card">
                      <div className="ssc__tip-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3>{translate(`tips.items.${tip.id}.title`, tip.title)}</h3>
                        <p>{translate(`tips.items.${tip.id}.description`, tip.description)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="ssc__section">
              <div className="ssc__max">
                <div className="ssc__section-header">
                  <div>
                    <h2>{translate('resources.heading', 'Resources to get you started')}</h2>
                    <p>
                      {translate(
                        'resources.description',
                        'Templates, benchmarks, and guides designed with Swiss founders.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="ssc__resource-grid">
                  {resourceLinks.map((resource) => (
                    <article key={resource.id} className="ssc__resource-card">
                      <div className="ssc__resource-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3>{translate(`resources.items.${resource.id}.title`, resource.title)}</h3>
                        <p>{translate(`resources.items.${resource.id}.description`, resource.description)}</p>
                        {resource.action === 'external' ? (
                          <a href={resource.href} target="_blank" rel="noreferrer">
                            {translate('resources.visitSite', 'Visit official site')}
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="ssc__link-button"
                            onClick={() => setResourceModal(resource.modalId)}
                          >
                            {translate('resources.viewDetails', 'View details')}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="ssc__cta">
              <div className="ssc__max ssc__cta-inner">
                <div>
                  <h2>{translate('cta.heading', 'Ready to co-create the next Swiss success story?')}</h2>
                  <p>
                    {translate(
                      'cta.description',
                      'Join a curated community of founders, operators, and students building across Switzerland.'
                    )}
                  </p>
                </div>
                <div className="ssc__cta-actions">
                  <button
                    type="button"
                    className="ssc__primary-btn"
                    onClick={() => {
                      setIsRegistering(true);
                      setShowLoginModal(true);
                      setAuthError('');
                    }}
                  >
                    {translate('cta.primary', 'Create profile')}
                    <ArrowRight size={18} />
                  </button>
                  <button type="button" className="ssc__ghost-btn" onClick={() => setActiveTab('companies')}>
                    {translate('cta.secondary', 'Explore startups')}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="ssc__footer">
        <div className="ssc__max">
          <span>
            {translate('footer.madeIn', `© ${currentYear} SwissStartup Connect. Built in Switzerland.`, {
              year: currentYear,
            })}
          </span>
          <div className="ssc__footer-links">
            <a href="/privacy.html" target="_blank" rel="noreferrer">
              {translate('footer.privacy', 'Privacy')}
            </a>
            <a href="/terms.html" target="_blank" rel="noreferrer">
              {translate('footer.terms', 'Terms')}
            </a>
            <a href="/contact.html" target="_blank" rel="noreferrer">
              {translate('footer.contact', 'Contact')}
            </a>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={resourceModal === 'compensation'}
        onRequestClose={closeResourceModal}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.compensation}
      >
        <button type="button" className="ssc__modal-close" onClick={closeResourceModal}>
          <X size={18} />
        </button>
        <header className="ssc__modal-header">
          <h2 id={MODAL_TITLE_IDS.compensation}>
            {translate('modals.compensation.title', 'Median internship pay by canton')}
          </h2>
          <p>
            {translate(
              'modals.compensation.subtitle',
              'Source: swissuniversities internship barometer 2024 + public salary postings (January 2025). Figures are midpoints for internships lasting 3–12 months.'
            )}
          </p>
        </header>
        <div className="ssc__modal-body">
          <div className="ssc__table-wrapper">
            <table className="ssc__table">
              <thead>
                <tr>
                  <th>{translate('modals.compensation.table.canton', 'Canton')}</th>
                  <th>{translate('modals.compensation.table.median', 'Median stipend')}</th>
                  <th>{translate('modals.compensation.table.expectation', 'What to expect')}</th>
                </tr>
              </thead>
              <tbody>
                {cantonInternshipSalaries.map((entry) => (
                  <tr key={entry.canton}>
                    <td>{entry.canton}</td>
                    <td>{entry.median}</td>
                    <td>{translate(`modals.compensation.notes.${entry.canton}`, entry.note)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ssc__modal-footnote">
            {translate(
              'modals.compensation.footnote',
              'Companies may add transport passes, lunch stipends, or housing support. Always confirm the latest package with the startup before signing the agreement.'
            )}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={resourceModal === 'cvTemplates'}
        onRequestClose={closeResourceModal}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.cvTemplates}
      >
        <button type="button" className="ssc__modal-close" onClick={closeResourceModal}>
          <X size={18} />
        </button>
        <header className="ssc__modal-header">
          <h2 id={MODAL_TITLE_IDS.cvTemplates}>
            {translate('modals.cv.title', 'Founder-ready CV templates')}
          </h2>
          <p>
            {translate(
              'modals.cv.subtitle',
              'Start with these layouts that Swiss hiring teams recommend, then tailor them with the tips below.'
            )}
          </p>
        </header>
        <div className="ssc__modal-body">
          <ul className="ssc__link-list">
            {cvTemplates.map((template) => (
              <li key={template.name}>
                <a href={template.url} target="_blank" rel="noreferrer">
                  {template.name}
                </a>
                <span>{translate(`modals.cv.templates.${template.id}`, template.reason)}</span>
              </li>
            ))}
          </ul>

          <h3 className="ssc__modal-subtitle">
            {translate('modals.cv.tipsTitle', 'How to make your CV stand out')}
          </h3>
          <ul className="ssc__bullet-list">
            {localizedCvTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
          <p className="ssc__modal-footnote">
            <CvFootnote
              text={translate(
                'modals.cv.footnote',
                'Pro tip: export as PDF named <code>firstname-lastname-cv.pdf</code>. Keep versions in English and the local language of the canton you target (French, German, or Italian) to speed up interviews.'
              )}
            />
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(reviewsModal)}
        onRequestClose={closeReviewsModal}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.reviews}
      >
        <button type="button" className="ssc__modal-close" onClick={closeReviewsModal}>
          <X size={18} />
        </button>
        <header className="ssc__modal-header">
          <h2 id={MODAL_TITLE_IDS.reviews}>{reviewsModal?.name} · Reviews</h2>
          <p>Hear from verified team members about culture, learning pace, and hiring experience.</p>
        </header>
        <div className="ssc__modal-body">
          {reviewsLoading ? (
            <p>Loading reviews…</p>
          ) : reviews.length > 0 ? (
            <div className="ssc__reviews">
              {reviews.map((review) => {
                const reviewerName = review.profiles?.full_name?.trim() ||
                  translate('accountMenu.memberFallback', 'Member');
                const reviewerInitial = reviewerName.charAt(0).toUpperCase();
                return (
                  <article key={review.id} className="ssc__review-card">
                    <div className="ssc__review-heading">
                      <div className="ssc__review-avatar">
                        {review.profiles?.avatar_url ? (
                          <img src={review.profiles.avatar_url} alt={review.profiles.full_name} />
                        ) : (
                          <span>{reviewerInitial}</span>
                        )}
                      </div>
                      <div>
                        <strong>{review.title}</strong>
                        <div className="ssc__review-meta">
                          <span>{reviewerName}</span>
                          <span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={14} className={star <= review.rating ? 'is-filled' : ''} />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p>{review.body}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>No reviews yet. Be the first to share your experience.</p>
          )}

          {canReview ? (
            <form className="ssc__form" onSubmit={submitReview}>
              <h3 className="ssc__modal-subtitle">Share your experience</h3>
              <label className="ssc__field">
                <span>Rating</span>
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} ★
                    </option>
                  ))}
                </select>
              </label>
              <label className="ssc__field">
                <span>Headline</span>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>
              <label className="ssc__field">
                <span>What made the culture unique?</span>
                <textarea
                  rows={4}
                  value={reviewForm.body}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, body: event.target.value }))}
                  required
                />
              </label>
              <button type="submit" className="ssc__primary-btn">
                Submit review
              </button>
            </form>
          ) : (
            <p className="ssc__modal-footnote">
              Only verified current or former team members can leave reviews. Ask your founder or admin to mark you as
              verified in the startup dashboard.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(localizedSelectedJob)}
        onRequestClose={() => setSelectedJob(null)}
        aria-labelledby={MODAL_TITLE_IDS.jobDetails}
      >
        {localizedSelectedJob && (
          <>
            <button type="button" className="ssc__modal-close" onClick={() => setSelectedJob(null)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2 id={MODAL_TITLE_IDS.jobDetails}>{localizedSelectedJob.localizedTitle}</h2>
              <p>{localizedSelectedJob.company_name}</p>
              <div className="ssc__modal-meta">
                <span>
                  <MapPin size={16} />
                  {localizedSelectedJob.location}
                </span>
                {selectedJobArrangementLabel && (
                  <span>
                    <Building2 size={16} />
                    {selectedJobArrangementLabel}
                  </span>
                )}
                <span>
                  <Clock size={16} />
                  {buildTimingText(localizedSelectedJob)}
                </span>
                <span>
                  <Users size={16} />
                  {translate('jobs.applicants', '{{count}} applicant{{plural}}', {
                    count: localizedSelectedJob.applicants,
                    plural: buildPluralSuffix(localizedSelectedJob.applicants),
                  })}
                </span>
                {localizedSelectedJob.localizedLanguages.length > 0 && (
                  <span>
                    <Languages size={16} />
                    {localizedSelectedJob.localizedLanguages.join(' · ')}
                  </span>
                )}
              </div>
              {(localizedSelectedJob.company_team ||
                localizedSelectedJob.company_fundraising ||
                localizedSelectedJob.company_info_link) && (
                <div className="ssc__modal-company-insights">
                  {localizedSelectedJob.company_team && (
                    <span className="ssc__company-pill ssc__company-pill--team">
                      <Users size={14} />
                      {localizedSelectedJob.company_team}
                    </span>
                  )}
                  {localizedSelectedJob.company_fundraising && (
                    <span className="ssc__company-pill ssc__company-pill--funding">
                      <Sparkles size={14} />
                      {localizedSelectedJob.company_fundraising}
                    </span>
                  )}
                  {localizedSelectedJob.company_info_link && (
                    <a
                      className="ssc__company-pill ssc__company-pill--link"
                      href={localizedSelectedJob.company_info_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ArrowRight size={14} />
                      {translate('jobs.companyInfoLink', 'See team & funding details')}
                    </a>
                  )}
                </div>
              )}
              {localizedSelectedJob.includes_thirteenth_salary && (
                <div className="ssc__thirteenth-note">
                  <Star size={14} /> {translate('jobs.thirteenth', '13th salary')}
                </div>
              )}
            </header>
            <div className="ssc__modal-body">
              <p>{localizedSelectedJob.localizedDescription}</p>

              {localizedSelectedJob.localizedLanguages.length > 0 && (
                <div className="ssc__modal-section">
                  <h3>{translate('jobs.languagesLabel', 'Languages required')}</h3>
                  <p className="ssc__modal-languages">
                    {localizedSelectedJob.localizedLanguages.join(' · ')}
                  </p>
                </div>
              )}

              <div className="ssc__modal-section">
                <h3>{translate('jobs.requirementsHeading', 'Requirements')}</h3>
                <ul className="ssc__modal-list">
                  {localizedSelectedJob.localizedRequirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="ssc__modal-section">
                <h3>{translate('jobs.benefitsHeading', 'Benefits')}</h3>
                <ul className="ssc__modal-list">
                  {localizedSelectedJob.localizedBenefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ssc__modal-actions">
              <button type="button" className="ssc__ghost-btn" onClick={() => toggleSavedJob(selectedJob.id)}>
                {savedJobs.includes(selectedJob.id)
                  ? translate('jobs.savedLabel', 'Saved')
                  : translate('jobs.saveForLater', 'Save for later')}
              </button>
              {canApply ? (
                <button
                  type="button"
                  className={`ssc__primary-btn ${selectedJobApplied ? 'is-disabled' : ''}`}
                  onClick={() => openApplyModal(selectedJob)}
                  disabled={selectedJobApplied}
                >
                  {selectedJobApplied
                    ? translate('jobs.applied', 'Applied')
                    : translate('jobs.applyNow', 'Apply now')}
                </button>
              ) : (
                <span className="ssc__job-note">{applyRestrictionMessage}</span>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={eventModalOpen && canPostEvents}
        onRequestClose={closeEventModal}
        overlayClassName="ssc__modal-overlay"
        aria-labelledby={MODAL_TITLE_IDS.postEvent}
      >
        <div className="ssc__modal-header">
          <h2 id={MODAL_TITLE_IDS.postEvent}>{translate('events.postEvent', 'Post Event')}</h2>
          <button type="button" className="ssc__modal-close" onClick={closeEventModal}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleEventSubmit} className="ssc__modal-form">
          <div className="ssc__form-group">
            <label htmlFor="event-title">{translate('events.form.title', 'Event Title')} *</label>
            <input
              id="event-title"
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder={translate('events.form.titlePlaceholder', 'Enter event title')}
            />
          </div>

          <div className="ssc__form-group">
            <label htmlFor="event-description">{translate('events.form.description', 'Description')}</label>
            <textarea
              id="event-description"
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder={translate('events.form.descriptionPlaceholder', 'Describe your event')}
            />
          </div>

          <div className="ssc__form-row">
            <div className="ssc__form-group">
              <label htmlFor="event-date">{translate('events.form.date', 'Date')} *</label>
              <input
                id="event-date"
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                required
              />
            </div>
            <div className="ssc__form-group">
              <label htmlFor="event-time">{translate('events.form.time', 'Time')}</label>
              <input
                id="event-time"
                type="time"
                value={eventForm.event_time}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="ssc__form-group">
            <label htmlFor="event-location">{translate('events.form.location', 'Location Name')} *</label>
            <input
              id="event-location"
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
              required
              placeholder={translate('events.form.locationPlaceholder', 'e.g., Zurich Convention Center')}
            />
          </div>

          <div className="ssc__form-group">
            <label htmlFor="event-street">{translate('events.form.street', 'Street Address')} *</label>
            <input
              id="event-street"
              type="text"
              value={eventForm.street_address}
              onChange={(e) => setEventForm(prev => ({ ...prev, street_address: e.target.value }))}
              required
              placeholder={translate('events.form.streetPlaceholder', 'e.g., Messeplatz 1')}
            />
          </div>

          <div className="ssc__form-row">
            <div className="ssc__form-group">
              <label htmlFor="event-city">{translate('events.form.city', 'City')} *</label>
              <input
                id="event-city"
                type="text"
                value={eventForm.city}
                onChange={(e) => setEventForm(prev => ({ ...prev, city: e.target.value }))}
                required
                placeholder={translate('events.form.cityPlaceholder', 'e.g., Zurich')}
              />
            </div>
            <div className="ssc__form-group">
              <label htmlFor="event-postal">{translate('events.form.postal', 'Postal Code')} *</label>
              <input
                id="event-postal"
                type="text"
                value={eventForm.postal_code}
                onChange={(e) => setEventForm(prev => ({ ...prev, postal_code: e.target.value }))}
                required
                placeholder={translate('events.form.postalPlaceholder', 'e.g., 8005')}
              />
            </div>
          </div>

          <div className="ssc__form-group">
            <label htmlFor="event-poster">{translate('events.form.poster', 'Event Poster')}</label>
            <input
              id="event-poster"
              type="file"
              accept="image/*"
              onChange={(e) => setEventForm(prev => ({ ...prev, poster_file: e.target.files[0] }))}
            />
            <small className="ssc__form-help">
              {translate('events.form.posterHelp', 'Upload an image for your event poster')}
            </small>
          </div>

          <div className="ssc__modal-actions">
            <button type="button" className="ssc__ghost-btn" onClick={closeEventModal}>
              {translate('events.form.cancel', 'Cancel')}
            </button>
            <button type="submit" className="ssc__primary-btn" disabled={eventFormSaving}>
              {eventFormSaving
                ? translate('events.form.posting', 'Posting...')
                : translate('events.form.post', 'Post Event')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(localizedApplicationModal)}
        onRequestClose={closeApplicationModal}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.application}
      >
        {localizedApplicationModal && (
          <>
            <button type="button" className="ssc__modal-close" onClick={closeApplicationModal}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2 id={MODAL_TITLE_IDS.application}>Submit your application</h2>
              <p>
                {localizedApplicationModal.localizedTitle} · {localizedApplicationModal.company_name}
              </p>
              {localizedApplicationModal.localizedLanguages.length > 0 && (
                <p className="ssc__modal-languages">
                  {localizedApplicationModal.localizedLanguages.join(' · ')}
                </p>
              )}
            </header>
            <div className="ssc__modal-body">
              <div className="ssc__application-summary">
                <div className="ssc__summary-card">
                  <h3>Your profile</h3>
                  <ul>
                    <li>
                      <strong>Name:</strong> {profileForm.full_name || profile?.full_name || user?.name}
                    </li>
                    <li>
                      <strong>University:</strong> {profileForm.university || 'Add this in your profile'}
                    </li>
                    <li>
                      <strong>Programme:</strong> {profileForm.program || 'Add this in your profile'}
                    </li>
                  </ul>
                </div>
                <div className="ssc__summary-card">
                  <h3>Shared documents</h3>
                  <ul>
                    <li>
                      <strong>CV:</strong>{' '}
                      {profileForm.cv_url ? (
                        <span className="ssc__cv-meta">
                          <a href={profileForm.cv_url} target="_blank" rel="noreferrer">
                            View profile CV
                          </a>
                          <span
                            className={`ssc__cv-privacy ${profileForm.cv_public ? 'is-public' : 'is-private'}`}
                          >
                            {profileForm.cv_public
                              ? 'Public on your profile.'
                              : 'Private until you apply.'}
                          </span>
                        </span>
                      ) : (
                        'No CV stored in profile yet'
                      )}
                    </li>
                    <li>
                      <strong>Profile photo:</strong>{' '}
                      {profileForm.avatar_url ? 'Will be visible to the employer' : 'Upload a photo in profile settings'}
                    </li>
                  </ul>
                  <div className="ssc__cv-options">
                    {profileForm.cv_url && (
                      <label className="ssc__radio">
                        <input
                          type="radio"
                          name="cv-option"
                          checked={useExistingCv}
                          onChange={() => setUseExistingCv(true)}
                        />
                        <span>Use profile CV</span>
                      </label>
                    )}
                    <label className="ssc__radio">
                      <input
                        type="radio"
                        name="cv-option"
                        checked={!useExistingCv || !profileForm.cv_url}
                        onChange={() => setUseExistingCv(false)}
                      />
                      <span>Upload a CV for this application</span>
                    </label>
                    {!useExistingCv || !profileForm.cv_url ? (
                      <div className="ssc__upload-inline">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.tex"
                          onChange={handleApplicationCvUpload}
                        />
                        {applicationCvName && <small>{applicationCvName}</small>}
                      </div>
                    ) : null}
                    <small className="ssc__field-note">Accepted formats: PDF, Word (.doc/.docx), TeX.</small>
                  </div>
                </div>
              </div>

              <label className="ssc__field">
                <span>
                  Motivational letter {localizedApplicationModal.motivational_letter_required ? '(required)' : '(optional)'}
                </span>
                <div className="ssc__upload-inline">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.tex"
                    onChange={handleMotivationalLetterUpload}
                  />
                  {motivationalLetterName && <small>{motivationalLetterName}</small>}
                </div>
                <small className="ssc__field-note">Upload your letter as PDF, Word, or TeX.</small>
              </label>

              <label className="ssc__checkbox">
                <input
                  type="checkbox"
                  checked={acknowledgeShare}
                  onChange={(event) => setAcknowledgeShare(event.target.checked)}
                />
                <span>{acknowledgeMessage}</span>
              </label>

              {applicationError && <p className="ssc__form-error">{applicationError}</p>}
            </div>
            <div className="ssc__modal-actions">
              <button type="button" className="ssc__ghost-btn" onClick={closeApplicationModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ssc__primary-btn"
                onClick={submitApplication}
                disabled={applicationSaving}
              >
                {applicationSaving ? 'Submitting…' : 'Confirm application'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={profileModalOpen}
        onRequestClose={() => setProfileModalOpen(false)}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.profile}
      >
        <button type="button" className="ssc__modal-close" onClick={() => setProfileModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2 id={MODAL_TITLE_IDS.profile}>{translate('profileModal.title', 'Update your profile')}</h2>
              <p>
                {translate(
                  'profileModal.subtitle',
                  'Keep startups in the loop with your latest projects, studies, and documents.'
                )}
              </p>
            </header>
            <form className="ssc__modal-body" onSubmit={handleProfileSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>{translate('profileModal.fields.fullName', 'Full name')}</span>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    required
                  />
                </label>

                {isStudent ? (
                  <>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.school', 'University or school')}</span>
                      <input
                        type="text"
                        value={profileForm.university}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, university: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.school',
                          'ETH Zürich, EPFL, HSG, ZHAW…'
                        )}
                        required
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.program', 'Programme')}</span>
                      <input
                        type="text"
                        value={profileForm.program}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, program: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.program',
                          'BSc Computer Science'
                        )}
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.experience', 'Experience highlights')}</span>
                      <textarea
                        rows={3}
                        value={profileForm.experience}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, experience: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.experience',
                          'Intern at AlpTech—built supply dashboards; Student project: Smart energy router…'
                        )}
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.bio', 'Short bio')}</span>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.bio',
                          'Describe what you’re passionate about and the kind of team you thrive in.'
                        )}
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.portfolio', 'Portfolio or LinkedIn')}</span>
                      <input
                        type="url"
                        value={profileForm.portfolio_url}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, portfolio_url: event.target.value }))}
                        placeholder={translate('profileModal.placeholders.portfolio', 'https://')}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.schoolOptional', 'School / University (optional)')}</span>
                      <input
                        type="text"
                        value={profileForm.university}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, university: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.schoolOptional',
                          'Where did you graduate from?'
                        )}
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.role', 'Role in this startup')}</span>
                      <input
                        type="text"
                        value={profileForm.experience}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, experience: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.role',
                          'Founder & CEO, Head of Growth…'
                        )}
                      />
                    </label>
                    <label className="ssc__field">
                      <span>{translate('profileModal.fields.hobbies', 'Skills & hobbies (optional)')}</span>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder={translate(
                          'profileModal.placeholders.hobbies',
                          'Design sprints, skiing, product storytelling…'
                        )}
                      />
                    </label>
                  </>
                )}

                <label className="ssc__field">
                  <span>{translate('profileModal.fields.photo', 'Upload profile photo')}</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  {profileForm.avatar_url && (
                    <img
                      className="ssc__avatar-preview"
                      src={profileForm.avatar_url}
                      alt={translate('profileModal.avatarAlt', 'Profile avatar')}
                    />
                  )}
                </label>

                {isStudent && (
                  <div className="ssc__field ssc__field--cv">
                    <span>{translate('profileModal.fields.cv', 'Upload CV')}</span>
                    <div className={`ssc__cv-upload ${isCvUploading ? 'is-uploading' : ''}`}>
                      <input
                        ref={cvFileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.tex"
                        onChange={handleCvUpload}
                        className="ssc__cv-upload__input"
                      />
                      <div className="ssc__cv-upload__top">
                        <div className="ssc__cv-upload__details">
                          {cvLocalName ? (
                            <>
                              <span className="ssc__cv-upload__filename">{cvLocalName}</span>
                              <span className="ssc__cv-upload__status">
                                {isCvUploading
                                  ? translate('profileModal.cvStatus.uploading', 'Uploading…')
                                  : translate(
                                      'profileModal.cvStatus.ready',
                                      'Uploaded — save your profile to keep it.',
                                    )}
                              </span>
                            </>
                          ) : (
                            <span className="ssc__cv-upload__status">
                              {translate('profileModal.cvStatus.empty', 'No CV on file yet.')}
                            </span>
                          )}
                          {profileForm.cv_url && (
                            <a
                              href={profileForm.cv_url}
                              target="_blank"
                              rel="noreferrer"
                              className="ssc__cv-upload__link"
                            >
                              {translate('profileModal.viewCurrentCv', 'View current CV')}
                            </a>
                          )}
                        </div>
                        <div className="ssc__cv-upload__actions">
                          <button
                            type="button"
                            className="ssc__cv-upload__button"
                            onClick={() => cvFileInputRef.current?.click()}
                            disabled={isCvUploading}
                          >
                            {cvLocalName
                              ? translate('profileModal.cvActions.replace', 'Replace CV')
                              : translate('profileModal.cvActions.upload', 'Select CV')}
                          </button>
                          {profileForm.cv_url && (
                            <button
                              type="button"
                              className="ssc__cv-upload__remove"
                              onClick={handleCvRemove}
                              disabled={isCvUploading}
                            >
                              {translate('profileModal.cvActions.remove', 'Remove')}
                            </button>
                          )}
                        </div>
                      </div>
                      {profileForm.cv_url && (
                        <div className="ssc__cv-visibility">
                          {cvVisibilitySupported ? (
                            <label className="ssc__switch">
                              <input
                                type="checkbox"
                                checked={profileForm.cv_public}
                                onChange={(event) =>
                                  setProfileForm((prev) => ({ ...prev, cv_public: event.target.checked }))
                                }
                              />
                              <span>
                                {profileForm.cv_public
                                  ? translate('profileModal.cvVisibilityOn', 'CV visible to startups')
                                  : translate('profileModal.cvVisibilityOff', 'Keep CV private until you apply')}
                              </span>
                            </label>
                          ) : (
                            <span className="ssc__cv-visibility--locked">
                              {translate('profileModal.cvVisibilityOff', 'Keep CV private until you apply')}
                            </span>
                          )}
                        </div>
                      )}
                      {cvUploadError && <p className="ssc__form-error">{cvUploadError}</p>}
                      <small className="ssc__field-note">
                        {translate('profileModal.cvAccepted', 'Accepted: PDF, Word (.doc/.docx), TeX.')}
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setProfileModalOpen(false)}>
                  {translate('profileModal.buttons.cancel', 'Cancel')}
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={profileSaving}>
                  {profileSaving
                    ? translate('profileModal.buttons.saving', 'Saving…')
                    : translate('profileModal.buttons.save', 'Save profile')}
                </button>
              </div>
            </form>
      </Modal>

      <Modal
        isOpen={startupModalOpen}
        onRequestClose={() => setStartupModalOpen(false)}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.startup}
      >
        <button type="button" className="ssc__modal-close" onClick={() => setStartupModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2 id={MODAL_TITLE_IDS.startup}>{translate('startupModal.title', 'Your startup profile')}</h2>
              <p>
                {translate(
                  'startupModal.subtitle',
                  'Share official details so students know they’re speaking with a verified team.'
                )}
              </p>
            </header>
            <form className="ssc__modal-body" onSubmit={handleStartupSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.companyName', 'Company name')}</span>
                  <input
                    type="text"
                    value={startupForm.name}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.registryId', 'Commercial register ID')}</span>
                  <input
                    type="text"
                    value={startupForm.registry_number}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, registry_number: event.target.value }))}
                    placeholder={translate('startupModal.placeholders.registryId', 'CHE-123.456.789')}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.website', 'Website')}</span>
                  <input
                    type="url"
                    value={startupForm.website}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, website: event.target.value }))}
                    placeholder={translate('startupModal.placeholders.website', 'https://')}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.description', 'Description')}</span>
                  <textarea
                    rows={4}
                    value={startupForm.description}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder={translate(
                      'startupModal.placeholders.description',
                      'Explain your product, traction, hiring focus, and what interns will learn.'
                    )}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.teamSize', 'Team size')}</span>
                  <input
                    type="text"
                    value={startupForm.team_size}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, team_size: event.target.value }))}
                    placeholder={translate('startupModal.placeholders.teamSize', 'e.g. 12 people')}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.fundraising', 'Funding raised')}</span>
                  <input
                    type="text"
                    value={startupForm.fundraising}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, fundraising: event.target.value }))}
                    placeholder={translate(
                      'startupModal.placeholders.fundraising',
                      'CHF 2M seed, CHF 5M Series A…'
                    )}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.infoLink', 'More info link')}</span>
                  <input
                    type="url"
                    value={startupForm.info_link}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, info_link: event.target.value }))}
                    placeholder={translate(
                      'startupModal.placeholders.infoLink',
                      'https://linkedin.com/company/yourstartup'
                    )}
                  />
                  <small className="ssc__field-note">
                    {translate(
                      'startupModal.notes.infoLink',
                      'Share a public link with team or funding details (LinkedIn, Crunchbase, GoFundMe…).'
                    )}
                  </small>
                </label>
                <label className="ssc__field">
                  <span>{translate('startupModal.fields.logo', 'Upload logo')}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  {startupForm.logo_url && (
                    <img
                      className="ssc__avatar-preview"
                      src={startupForm.logo_url}
                      alt={translate('startupModal.logoAlt', 'Startup logo')}
                    />
                  )}
                </label>
                <div className="ssc__status-card">
                  <strong>{translate('startupModal.verification.label', 'Verification status:')}</strong>{' '}
                  <span className={`ssc__badge ${startupForm.verification_status}`}>
                    {startupVerificationStatusLabel}
                  </span>
                  {startupForm.verification_note && <p>{startupForm.verification_note}</p>}
                  <p className="ssc__modal-footnote">
                    {translate(
                      'startupModal.verification.note',
                      'Provide a registry ID and link to official documentation. Our team will review submissions weekly.'
                    )}
                  </p>
                </div>
              </div>

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setStartupModalOpen(false)}>
                  {translate('startupModal.buttons.cancel', 'Cancel')}
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={startupSaving}>
                  {startupSaving
                    ? translate('startupModal.buttons.submitting', 'Submitting…')
                    : translate('startupModal.buttons.save', 'Save startup profile')}
                </button>
              </div>
            </form>
      </Modal>

      <Modal
        isOpen={postJobModalOpen}
        onRequestClose={() => setPostJobModalOpen(false)}
        dialogClassName="ssc__modal--wide"
        aria-labelledby={MODAL_TITLE_IDS.postJob}
      >
        <button type="button" className="ssc__modal-close" onClick={() => setPostJobModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2 id={MODAL_TITLE_IDS.postJob}>{translate('jobForm.modal.title', 'Post a new vacancy')}</h2>
              <p>{translate('jobForm.modal.subtitle', 'Share the essentials so students and graduates understand the opportunity.')}</p>
            </header>
            <form className="ssc__modal-body" onSubmit={handlePostJobSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.title', 'Role title')}</span>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.location', 'Location')}</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.location}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        {translate('jobForm.placeholders.location', 'Select a Swiss location')}
                      </option>
                      {SWISS_LOCATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {translate(option.translationKey, option.label)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.workArrangement', 'Work arrangement')}</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.work_arrangement}
                      onChange={(event) =>
                        setJobForm((prev) => ({ ...prev, work_arrangement: event.target.value }))
                      }
                      required
                    >
                      <option value="">
                        {translate('jobForm.options.workArrangement.select', 'Select arrangement')}
                      </option>
                      {WORK_ARRANGEMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {translate(
                            `jobForm.options.workArrangement.${option.translationKey}`,
                            option.label,
                          )}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.employmentType', 'Employment type')}</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.employment_type}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          employment_type: event.target.value,
                          weekly_hours: event.target.value === 'Part-time' ? prev.weekly_hours : '',
                          internship_duration_months:
                            event.target.value === 'Internship' ? prev.internship_duration_months : '',
                        }))
                      }
                    >
                      <option value="Full-time">
                        {translate('jobForm.options.employmentType.fullTime', 'Full-time')}
                      </option>
                      <option value="Part-time">
                        {translate('jobForm.options.employmentType.partTime', 'Part-time')}
                      </option>
                      <option value="Internship">
                        {translate('jobForm.options.employmentType.internship', 'Internship')}
                      </option>
                      <option value="Contract">
                        {translate('jobForm.options.employmentType.contract', 'Contract')}
                      </option>
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                {jobForm.employment_type === 'Part-time' && (
                  <label className="ssc__field">
                    <span>{translate('jobForm.labels.weeklyHours', 'Weekly hours')}</span>
                    <input
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={jobForm.weekly_hours}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          weekly_hours: sanitizeDecimalInput(event.target.value),
                        }))
                      }
                      placeholder={translate('jobForm.placeholders.weeklyHours', 'e.g. 24')}
                      onBlur={handleJobWeeklyHoursBlur}
                      required
                    />
                    <small className="ssc__field-note">
                      {translate('jobForm.notes.weeklyHours', 'Used to scale monthly and yearly salary. Max 40h/week.')}
                    </small>
                  </label>
                )}
                {jobForm.employment_type === 'Internship' && (
                  <label className="ssc__field">
                    <span>{translate('jobForm.labels.internshipLength', 'Internship length (months)')}</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={jobForm.internship_duration_months}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          internship_duration_months: event.target.value.replace(/[^0-9]/g, ''),
                        }))
                      }
                      placeholder={translate('jobForm.placeholders.internshipMonths', 'e.g. 6')}
                      onBlur={handleInternshipDurationBlur}
                      required
                    />
                    <small className="ssc__field-note">
                      {translate('jobForm.notes.internshipLength', 'Internships must last between 1 and 12 months.')}
                    </small>
                  </label>
                )}
                <div className="ssc__field">
                  <span>{translate('jobForm.labels.languages', 'Languages required')}</span>
                  <div className="ssc__field-pill-group ssc__field-pill-group--start">
                    {LANGUAGE_OPTIONS.map((option) => {
                      const isSelected = jobLanguageSelection.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`ssc__field-pill ${isSelected ? 'is-active' : ''}`}
                          onClick={() => handleJobLanguageToggle(option.value)}
                        >
                          {translate(`jobForm.options.languages.${option.value}`, option.label)}
                        </button>
                      );
                    })}
                  </div>
                  <small className="ssc__field-note">
                    {translate(
                      'jobForm.notes.languages',
                      'Choose each language applicants must be comfortable using.',
                    )}
                  </small>
                </div>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.salaryCadence', 'Salary cadence')}</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.salary_cadence}
                      onChange={(event) => handleJobSalaryCadenceChange(event.target.value)}
                      required
                    >
                      <option value="">
                        {translate('jobForm.options.salaryCadence.select', 'Select cadence')}
                      </option>
                      <option value="hour">
                        {translate('jobForm.options.salaryCadence.hour', 'Hourly')}
                      </option>
                      <option value="week">
                        {translate('jobForm.options.salaryCadence.week', 'Weekly')}
                      </option>
                      <option value="month">
                        {translate('jobForm.options.salaryCadence.month', 'Monthly')}
                      </option>
                      <option value="year">
                        {translate('jobForm.options.salaryCadence.year', 'Yearly / total')}
                      </option>
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                <label className="ssc__field ssc__field-equity ssc__field-equity--stacked">
                  <span>{translate('jobForm.labels.equity', 'Equity (%)')}</span>
                  <input
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={jobForm.equity}
                    onChange={(event) =>
                      setJobForm((prev) => ({ ...prev, equity: sanitizeDecimalInput(event.target.value) }))
                    }
                    onBlur={handleJobEquityBlur}
                    placeholder={translate('jobForm.placeholders.equity', 'Optional (e.g. 0.5)')}
                  />
                  <small className="ssc__field-note">
                    {translate('jobForm.notes.equityRange', 'Allowed range: 0.1 – 100. Leave blank if none.')}
                  </small>
                </label>
                <div className="ssc__field ssc__field--comp">
                  <div className="ssc__field-range">
                    <div className="ssc__field-label-row">
                      <span className="ssc__field-label">{jobSalaryLabel}</span>
                      <div className="ssc__field-pill-group">
                        {SALARY_CADENCE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`ssc__field-pill ${jobSalaryCadence === option.value ? 'is-active' : ''}`}
                            onClick={() => handleJobSalaryCadenceChange(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ssc__field-range-toggle">
                      <label className="ssc__switch">
                        <input
                          type="checkbox"
                          checked={jobSalaryIsBracket}
                          onChange={(event) => handleJobSalaryBracketChange(event.target.checked)}
                        />
                        <span>{translate('jobForm.salary.toggle', 'Show salary bracket')}</span>
                      </label>
                    </div>
                    <div className={`ssc__field-range-row ${jobSalaryIsBracket ? '' : 'ssc__field-range-row--single'}`}>
                      <label className="ssc__field-range-input">
                        <span>{jobSalaryMinLabel}</span>
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={jobForm.salary_min}
                          onChange={(event) =>
                            setJobForm((prev) => ({ ...prev, salary_min: sanitizeDecimalInput(event.target.value) }))
                          }
                          onBlur={() => handleJobSalaryBlur('salary_min')}
                          placeholder={jobSalaryPlaceholderText}
                          disabled={!jobSalaryCadence}
                        />
                      </label>
                      {jobSalaryIsBracket && (
                        <>
                          <div className="ssc__field-range-divider" aria-hidden="true">
                            –
                          </div>
                          <label className="ssc__field-range-input">
                            <span>{jobSalaryMaxLabel}</span>
                            <input
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              value={jobForm.salary_max}
                              onChange={(event) =>
                                setJobForm((prev) => ({
                                  ...prev,
                                  salary_max: sanitizeDecimalInput(event.target.value),
                                }))
                              }
                              onBlur={() => handleJobSalaryBlur('salary_max')}
                              placeholder={jobSalaryPlaceholderText}
                              disabled={!jobSalaryCadence}
                            />
                          </label>
                        </>
                      )}
                    </div>
                    <small className="ssc__field-note">{jobSalaryHelperText}</small>
                    {jobSalaryPreview && (
                      <small className="ssc__field-note ssc__field-note--muted">
                        {jobForm.employment_type === 'Full-time'
                          ? translate('jobForm.salary.preview.fullTime', 'Full-time equivalent: {{value}}', {
                              value: jobSalaryPreview,
                            })
                          : translate('jobForm.salary.preview.partTime', 'Approximate: {{value}}', {
                              value: jobSalaryPreview,
                            })}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <label className="ssc__field">
                <span>{translate('jobForm.labels.description', 'Role description')}</span>
                <textarea
                  rows={4}
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={translate('jobForm.placeholders.description', 'What will the candidate work on?')}
                  required
                />
              </label>

              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.requirements', 'Requirements (one per line)')}</span>
                  <textarea
                    rows={3}
                    value={jobForm.requirements}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, requirements: event.target.value }))}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.benefits', 'Benefits (one per line)')}</span>
                  <textarea
                    rows={3}
                    value={jobForm.benefits}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, benefits: event.target.value }))}
                  />
                </label>
                <label className="ssc__field">
                  <span>{translate('jobForm.labels.tags', 'Tags (comma separated)')}</span>
                  <input
                    type="text"
                    value={jobForm.tags}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder={translate('jobForm.placeholders.tags', 'React, Growth, Fintech')}
                  />
                </label>
                <label className="ssc__checkbox">
                  <input
                    type="checkbox"
                    checked={jobForm.motivational_letter_required}
                    onChange={(event) =>
                      setJobForm((prev) => ({ ...prev, motivational_letter_required: event.target.checked }))
                    }
                  />
                  <span>{translate('jobForm.labels.motivationalLetter', 'Require motivational letter for this role')}</span>
                </label>
              </div>

              {postJobError && <p className="ssc__form-error">{postJobError}</p>}

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setPostJobModalOpen(false)}>
                  {translate('jobForm.actions.cancel', 'Cancel')}
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={postingJob}>
                  {postingJob
                    ? translate('jobForm.actions.posting', 'Posting…')
                    : translate('jobForm.actions.submit', 'Publish job')}
                </button>
              </div>
            </form>
      </Modal>

      <Modal
        isOpen={showLoginModal}
        onRequestClose={() => {
          setShowLoginModal(false);
          setForgotPasswordMessage('');
        }}
        dialogClassName="ssc__modal--auth"
        aria-labelledby={MODAL_TITLE_IDS.auth}
      >
        <button
          type="button"
          className="ssc__modal-close"
          onClick={() => {
            setShowLoginModal(false);
            setForgotPasswordMessage('');
          }}
        >
              <X size={18} />
            </button>
            <h2 id={MODAL_TITLE_IDS.auth}>
              {isRegistering
                ? translate('authModal.titleRegister', 'Create your profile')
                : translate('authModal.titleLogin', 'Welcome back')}
            </h2>
            <p>
              {isRegistering
                ? translate(
                    'authModal.bodyRegister',
                    'Tell us a little about yourself so we can surface the right matches.'
                  )
                : translate(
                    'authModal.bodyLogin',
                    'Sign in to access your saved roles, applications, and profile.'
                  )}
            </p>

            {authError && <div className="ssc__alert">{authError}</div>}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="ssc__form">
              {isRegistering && (
                <>
                  <label className="ssc__field">
                    <span>{translate('authModal.fields.fullName', 'Full name')}</span>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="ssc__field">
                    <span>{translate('authModal.fields.type', 'I am a')}</span>
                    <select
                      value={registerForm.type}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="student">
                        {translate('authModal.typeOptions.student', 'Student')}
                      </option>
                      <option value="startup">
                        {translate('authModal.typeOptions.startup', 'Startup')}
                      </option>
                    </select>
                  </label>
                </>
              )}

              <label className="ssc__field">
                <span>{translate('authModal.fields.email', 'Email')}</span>
                <input
                  type="email"
                  value={isRegistering ? registerForm.email : loginForm.email}
                  onChange={(event) =>
                    isRegistering
                      ? setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                      : setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="ssc__field">
                <span>{translate('authModal.fields.password', 'Password')}</span>
                <div className="ssc__password-input">
                  <input
                    type={isRegistering ? (showRegisterPassword ? 'text' : 'password') : showLoginPassword ? 'text' : 'password'}
                    value={isRegistering ? registerForm.password : loginForm.password}
                    onChange={(event) =>
                      isRegistering
                        ? setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                        : setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                  <button
                    type="button"
                    className="ssc__link-button"
                    onClick={() =>
                      isRegistering
                        ? setShowRegisterPassword((prev) => !prev)
                        : setShowLoginPassword((prev) => !prev)
                    }
                  >
                    {isRegistering
                      ? showRegisterPassword
                        ? translate('authModal.actions.hide', 'Hide')
                        : translate('authModal.actions.show', 'Show')
                      : showLoginPassword
                      ? translate('authModal.actions.hide', 'Hide')
                      : translate('authModal.actions.show', 'Show')}
                  </button>
                </div>
              </label>

              {isRegistering && (
                <label className="ssc__field">
                  <span>{translate('authModal.fields.confirmPassword', 'Confirm password')}</span>
                  <div className="ssc__password-input">
                    <input
                      type={showRegisterConfirm ? 'text' : 'password'}
                      value={registerConfirm}
                      onChange={(event) => setRegisterConfirm(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ssc__link-button"
                      onClick={() => setShowRegisterConfirm((prev) => !prev)}
                    >
                      {showRegisterConfirm
                        ? translate('authModal.actions.hide', 'Hide')
                        : translate('authModal.actions.show', 'Show')}
                    </button>
                  </div>
                </label>
              )}

              {!isRegistering && (
                <div className="ssc__forgot">
                  <button type="button" className="ssc__link-button" onClick={handleForgotPassword}>
                    {translate('authModal.actions.forgotPassword', 'Forgot password?')}
                  </button>
                  {forgotPasswordMessage && <small>{forgotPasswordMessage}</small>}
                </div>
              )}

              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full">
                {isRegistering
                  ? translate('authModal.actions.createAccount', 'Create account')
                  : translate('authModal.actions.signIn', 'Sign in')}
              </button>
            </form>

            <div className="ssc__auth-switch">
              {isRegistering
                ? translate('authModal.switch.haveAccount', 'Already have an account?')
                : translate('authModal.switch.newHere', 'New to SwissStartup Connect?')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                  setForgotPasswordMessage('');
                  setRegisterConfirm('');
                }}
              >
                {isRegistering
                  ? translate('authModal.switch.signInInstead', 'Sign in instead')
                  : translate('authModal.switch.createProfile', 'Create a profile')}
              </button>
            </div>
      </Modal>

      <Modal
        isOpen={resetPasswordModalOpen}
        onRequestClose={closeResetPasswordModal}
        dialogClassName="ssc__modal--auth"
        aria-labelledby={MODAL_TITLE_IDS.resetPassword}
      >
        <button type="button" className="ssc__modal-close" onClick={closeResetPasswordModal}>
              <X size={18} />
            </button>
            <h2 id={MODAL_TITLE_IDS.resetPassword}>Set a new password</h2>
            <p>Enter and confirm your new password to complete the reset.</p>

            {passwordResetError && <div className="ssc__alert">{passwordResetError}</div>}

            <form className="ssc__form" onSubmit={handlePasswordReset}>
              <label className="ssc__field">
                <span>
                  {translate('security.passwordReset.fields.newPassword', 'New password')}
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </label>
              <label className="ssc__field">
                <span>
                  {translate('security.passwordReset.fields.confirmPassword', 'Confirm password')}
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={passwordResetSaving}>
                {passwordResetSaving
                  ? translate('security.passwordReset.buttons.submitting', 'Updating…')
                  : translate('security.passwordReset.buttons.submit', 'Update password')}
              </button>
            </form>
      </Modal>

      <Modal
        isOpen={securityModalOpen}
        onRequestClose={closeSecurityModal}
        dialogClassName="ssc__modal--auth"
        aria-labelledby={MODAL_TITLE_IDS.security}
      >
        <button type="button" className="ssc__modal-close" onClick={closeSecurityModal}>
              <X size={18} />
            </button>
            <h2 id={MODAL_TITLE_IDS.security}>{translate('security.modal.title', 'Privacy & security')}</h2>
            <p>
              {translate(
                'security.modal.description',
                'Keep your contact email up to date and rotate your password regularly for extra safety.'
              )}
            </p>

            <form className="ssc__form" onSubmit={handleSecurityEmailChange}>
              <h3 className="ssc__modal-subtitle">
                {translate('security.modal.sections.email', 'Change email')}
              </h3>
              <label className="ssc__field">
                <span>{translate('security.modal.fields.email', 'Email')}</span>
                <input
                  type="email"
                  value={securityEmail}
                  onChange={(event) => setSecurityEmail(event.target.value)}
                  required
                />
              </label>
              {securityEmailMessage && <div className="ssc__info">{securityEmailMessage}</div>}
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={securityEmailSaving}>
                {securityEmailSaving
                  ? translate('security.modal.buttons.savingEmail', 'Saving…')
                  : translate('security.modal.buttons.saveEmail', 'Save email')}
              </button>
            </form>

            <form className="ssc__form" onSubmit={handleSecurityPasswordChange}>
              <h3 className="ssc__modal-subtitle">
                {translate('security.modal.sections.password', 'Change password')}
              </h3>
              {securityError && <div className="ssc__alert">{securityError}</div>}
              <label className="ssc__field">
                <span>{translate('security.modal.fields.currentPassword', 'Current password')}</span>
                <div className="ssc__password-input">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={securityOldPassword}
                    onChange={(event) => setSecurityOldPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    className="ssc__link-button"
                  >
                    {showOldPassword
                      ? translate('authModal.actions.hide', 'Hide')
                      : translate('authModal.actions.show', 'Show')}
                  </button>
                </div>
              </label>
              <label className="ssc__field">
                <span>{translate('security.modal.fields.newPassword', 'New password')}</span>
                <div className="ssc__password-input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={securityNewPassword}
                    onChange={(event) => setSecurityNewPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="ssc__link-button"
                  >
                    {showNewPassword
                      ? translate('authModal.actions.hide', 'Hide')
                      : translate('authModal.actions.show', 'Show')}
                  </button>
                </div>
              </label>
              <label className="ssc__field">
                <span>{translate('security.modal.fields.confirmNewPassword', 'Confirm new password')}</span>
                <div className="ssc__password-input">
                  <input
                    type={showNewConfirm ? 'text' : 'password'}
                    value={securityConfirmPassword}
                    onChange={(event) => setSecurityConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirm((prev) => !prev)}
                    className="ssc__link-button"
                  >
                    {showNewConfirm
                      ? translate('authModal.actions.hide', 'Hide')
                      : translate('authModal.actions.show', 'Show')}
                  </button>
                </div>
              </label>
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={securitySaving}>
                {securitySaving
                  ? translate('security.modal.buttons.savingPassword', 'Updating…')
                  : translate('security.modal.buttons.savePassword', 'Save password')}
              </button>
            </form>
      </Modal>

      {activeCompanyProfile && (
        <CompanyProfilePage
          company={activeCompanyProfile}
          onClose={closeCompanyProfile}
          translate={translate}
        />
      )}

      {loadingSpinner && <div className="ssc__loading" aria-hidden="true" />}
    </div>
  );
};

export default SwissStartupConnect;
