import {
  GraduationCap,
  Layers,
  Handshake,
  ClipboardList,
  Rocket,
  Trophy,
} from 'lucide-react';

export const STARTUP_TEAM_FIELDS = ['team', 'team_size', 'employees', 'headcount'];
export const STARTUP_FUNDRAISING_FIELDS = ['fundraising', 'total_funding', 'total_raised', 'funding'];
export const STARTUP_INFO_FIELDS = ['info_link', 'profile_link', 'external_profile', 'external_profile_url'];

export const MODAL_TITLE_IDS = {
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

export const SWISS_LOCATION_OPTIONS = [
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

export const WORK_ARRANGEMENT_OPTIONS = [
  { value: 'on_site', label: 'On-site', translationKey: 'onSite' },
  { value: 'hybrid', label: 'Hybrid', translationKey: 'hybrid' },
  { value: 'remote', label: 'Remote', translationKey: 'remote' },
];

export const WORK_ARRANGEMENT_VALUES = new Set(WORK_ARRANGEMENT_OPTIONS.map((option) => option.value));

export const WORK_ARRANGEMENT_LABEL_MAP = WORK_ARRANGEMENT_OPTIONS.reduce((accumulator, option) => {
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

export const buildWorkArrangementLabel = (translate, arrangement) => {
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

export const steps = [
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

export const stats = [
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

export const testimonials = [
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

export const resourceLinks = [
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

export const careerTips = [
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

export const cantonInternshipSalaries = [
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

export const cvTemplates = [
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

export const cvWritingTips = [
  'Open with a three-line summary that states your target role, your strongest skills, and what you want to build next.',
  'Use bullet points that start with strong verbs and quantify results (e.g. “reduced onboarding time by 30%”).',
  'Keep a dedicated skills/tools block—founders and CTOs skim for stack alignment first.',
  'Add entrepreneurial signals: side projects, hackathons, venture labs, or leadership roles.',
  'Stick to one page until you have 3+ years experience; save the detail for the interview.',
];

export const applicationStatuses = ['submitted', 'in_review', 'interviewing', 'offer', 'hired', 'rejected'];

export const formatStatusKeyLabel = (statusKey) => {
  if (!statusKey || typeof statusKey !== 'string') {
    return '';
  }

  return statusKey
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export const activeCityFilters = [
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

export const roleFocusFilters = [
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

export const quickFilters = [...activeCityFilters, ...roleFocusFilters];

export const filterPredicates = quickFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.test;
  return acc;
}, {});

export const normalizeLocationValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const isAllowedSwissLocation = (value) => {
  if (!value) {
    return false;
  }

  const normalized = normalizeLocationValue(value);
  if (ALLOWED_SWISS_LOCATIONS.has(normalized)) {
    return true;
  }

  return Array.from(ALLOWED_SWISS_LOCATIONS).some((candidate) => normalized.includes(candidate));
};
