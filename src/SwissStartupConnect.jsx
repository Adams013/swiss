import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  ClipboardList,
  GraduationCap,
  Handshake,
  Heart,
  Lightbulb,
  Layers,
  MapPin,
  Percent,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
  Upload,
  CheckCircle2,
  Star,
} from 'lucide-react';
import './SwissStartupConnect.css';
import { supabase } from './supabaseClient';

const mockJobs = [
  {
    id: 'mock-1',
    title: 'Frontend Engineer',
    company_name: 'TechFlow AG',
    startup_id: 'mock-company-1',
    location: 'Zurich, Switzerland',
    employment_type: 'Full-time',
    salary: '80k – 110k CHF',
    equity: '0.2% – 0.4%',
    description:
      'Join a product-led team redefining liquidity management for Swiss SMEs. You will partner with design and product to ship pixel-perfect interfaces that feel effortless.',
    requirements: ['3+ years building modern web applications', 'Fluent with React and modern state management', 'Focus on accessibility and performance'],
    benefits: ['Half-fare travelcard reimbursement', 'Learning stipend & mentorship', 'Employee stock options'],
    posted: '2 days ago',
    applicants: 18,
    tags: ['React', 'UI Engineering'],
    stage: 'Series A',
    motivational_letter_required: false,
  },
  {
    id: 'mock-2',
    title: 'Product Manager',
    company_name: 'Alpine Health',
    startup_id: 'mock-company-2',
    location: 'Geneva, Switzerland',
    employment_type: 'Full-time',
    salary: '95k – 125k CHF',
    equity: '0.3% – 0.5%',
    description:
      'Own discovery through delivery for connected healthcare experiences serving 50k+ patients. Collaborate with clinicians, design, and engineering to ship lovable features.',
    requirements: ['Product discovery expertise', 'Healthcare or regulated market background', 'Strong analytics and storytelling'],
    benefits: ['Founding team equity', 'Wellness budget', 'Quarterly retreats in the Alps'],
    posted: '1 week ago',
    applicants: 11,
    tags: ['Product', 'Healthcare'],
    stage: 'Seed',
    motivational_letter_required: true,
  },
  {
    id: 'mock-4',
    title: 'Community & Partnerships Lead',
    company_name: 'Alpine Health',
    startup_id: 'mock-company-2',
    location: 'Remote within Switzerland',
    employment_type: 'Part-time',
    weekly_hours_value: 24,
    salary: '28 – 34 CHF / hour',
    equity: '0.1% – 0.2%',
    description:
      'Partner with founders to tell patient impact stories, grow our clinical community, and organise monthly events. Flexible schedule with remote-first collaboration.',
    requirements: ['3+ years in community or partnerships', 'Bilingual German/English', 'Comfort with remote collaboration'],
    benefits: ['Flexible hours', 'Wellness stipend', 'Annual team offsite'],
    posted: '4 days ago',
    applicants: 7,
    tags: ['Community', 'Partnerships'],
    stage: 'Seed',
    motivational_letter_required: false,
  },
  {
    id: 'mock-3',
    title: 'Machine Learning Intern',
    company_name: 'Cognivia Labs',
    startup_id: 'mock-company-3',
    location: 'Lausanne, Switzerland (Hybrid)',
    employment_type: 'Internship',
    internship_duration_months: 6,
    salary: '3.5k CHF / month',
    equity: 'N/A',
    description:
      'Work with a senior research pod to translate cutting-edge ML into production discovery tools. Expect rapid iteration, mentorship, and measurable impact.',
    requirements: ['MSc or final-year BSc in CS/Math', 'Hands-on with PyTorch or TensorFlow', 'Comfort with experimentation pipelines'],
    benefits: ['Research mentor', 'Conference travel support', 'Fast-track to full-time offer'],
    posted: '1 day ago',
    applicants: 24,
    tags: ['AI/ML', 'Python'],
    stage: 'Series B',
    motivational_letter_required: true,
  },
];

const mockCompanies = [
  {
    id: 'mock-company-1',
    name: 'TechFlow AG',
    tagline: 'Liquidity intelligence for Swiss SMEs',
    location: 'Zurich',
    industry: 'Fintech',
    team: '65 people',
    fundraising: 'CHF 28M raised',
    culture: 'Product-driven, hybrid-first, carbon neutral operations.',
    website: 'https://techflow.example',
    verification_status: 'verified',
    created_at: '2024-01-12T10:00:00Z',
  },
  {
    id: 'mock-company-2',
    name: 'Alpine Health',
    tagline: 'Digital care pathways for clinics & telehealth',
    location: 'Geneva',
    industry: 'Healthtech',
    team: '32 people',
    fundraising: 'CHF 12M raised',
    culture: 'Human-centred, clinically informed, data trusted.',
    website: 'https://alpinehealth.example',
    verification_status: 'pending',
    created_at: '2024-01-08T09:30:00Z',
  },
  {
    id: 'mock-company-3',
    name: 'Cognivia Labs',
    tagline: 'ML tooling for scientific breakthroughs',
    location: 'Lausanne',
    industry: 'Deep Tech',
    team: '48 people',
    fundraising: 'CHF 35M raised',
    culture: 'Research-rooted, humble experts, fast experimentation.',
    website: 'https://cognivia.example',
    verification_status: 'verified',
    created_at: '2024-01-18T14:45:00Z',
  },
];

const SWISS_LOCATION_OPTIONS = [
  { value: 'Zurich, Switzerland', label: 'Zurich' },
  { value: 'Geneva, Switzerland', label: 'Geneva' },
  { value: 'Basel, Switzerland', label: 'Basel' },
  { value: 'Bern, Switzerland', label: 'Bern' },
  { value: 'Lausanne, Switzerland', label: 'Lausanne' },
  { value: 'Lugano, Switzerland', label: 'Lugano' },
  { value: 'Lucerne, Switzerland', label: 'Lucerne' },
  { value: 'St. Gallen, Switzerland', label: 'St. Gallen' },
  { value: 'Fribourg, Switzerland', label: 'Fribourg' },
  { value: 'Neuchâtel, Switzerland', label: 'Neuchâtel' },
  { value: 'Winterthur, Switzerland', label: 'Winterthur' },
  { value: 'Zug, Switzerland', label: 'Zug' },
  { value: 'Sion, Switzerland', label: 'Sion' },
  { value: 'Chur, Switzerland', label: 'Chur' },
  { value: 'Biel/Bienne, Switzerland', label: 'Biel/Bienne' },
  { value: 'Schaffhausen, Switzerland', label: 'Schaffhausen' },
  { value: 'Thun, Switzerland', label: 'Thun' },
  { value: 'La Chaux-de-Fonds, Switzerland', label: 'La Chaux-de-Fonds' },
  { value: 'Locarno, Switzerland', label: 'Locarno' },
  { value: 'Bellinzona, Switzerland', label: 'Bellinzona' },
  { value: 'Aarau, Switzerland', label: 'Aarau' },
  { value: 'St. Moritz, Switzerland', label: 'St. Moritz' },
  { value: 'Canton of Zurich', label: 'Canton of Zurich' },
  { value: 'Canton of Bern', label: 'Canton of Bern' },
  { value: 'Canton of Lucerne', label: 'Canton of Lucerne' },
  { value: 'Canton of Uri', label: 'Canton of Uri' },
  { value: 'Canton of Schwyz', label: 'Canton of Schwyz' },
  { value: 'Canton of Obwalden', label: 'Canton of Obwalden' },
  { value: 'Canton of Nidwalden', label: 'Canton of Nidwalden' },
  { value: 'Canton of Glarus', label: 'Canton of Glarus' },
  { value: 'Canton of Zug', label: 'Canton of Zug' },
  { value: 'Canton of Fribourg', label: 'Canton of Fribourg' },
  { value: 'Canton of Solothurn', label: 'Canton of Solothurn' },
  { value: 'Canton of Basel-Stadt', label: 'Canton of Basel-Stadt' },
  { value: 'Canton of Basel-Landschaft', label: 'Canton of Basel-Landschaft' },
  { value: 'Canton of Schaffhausen', label: 'Canton of Schaffhausen' },
  { value: 'Canton of Appenzell Ausserrhoden', label: 'Canton of Appenzell Ausserrhoden' },
  { value: 'Canton of Appenzell Innerrhoden', label: 'Canton of Appenzell Innerrhoden' },
  { value: 'Canton of St. Gallen', label: 'Canton of St. Gallen' },
  { value: 'Canton of Graubünden', label: 'Canton of Graubünden' },
  { value: 'Canton of Aargau', label: 'Canton of Aargau' },
  { value: 'Canton of Thurgau', label: 'Canton of Thurgau' },
  { value: 'Canton of Ticino', label: 'Canton of Ticino' },
  { value: 'Canton of Vaud', label: 'Canton of Vaud' },
  { value: 'Canton of Valais', label: 'Canton of Valais' },
  { value: 'Canton of Neuchâtel', label: 'Canton of Neuchâtel' },
  { value: 'Canton of Geneva', label: 'Canton of Geneva' },
  { value: 'Canton of Jura', label: 'Canton of Jura' },
  { value: 'Remote within Switzerland', label: 'Remote within Switzerland' },
  { value: 'Hybrid (Zurich)', label: 'Hybrid – Zurich' },
  { value: 'Hybrid (Geneva)', label: 'Hybrid – Geneva' },
  { value: 'Hybrid (Lausanne)', label: 'Hybrid – Lausanne' },
  { value: 'Hybrid (Basel)', label: 'Hybrid – Basel' },
  { value: 'Across Switzerland', label: 'Across Switzerland' },
];

const ALLOWED_SWISS_LOCATIONS = new Set(
  SWISS_LOCATION_OPTIONS.map((option) =>
    option.value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  ),
);

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
    name: 'Europass Classic',
    url: 'https://europa.eu/europass/en/create-europass-cv',
    reason: 'Standardised sections help recruiters compare profiles quickly; bilingual version ready for French/German submissions.',
  },
  {
    name: 'Novorésumé Basic (Free)',
    url: 'https://novoresume.com/resume-templates',
    reason: 'Clean single-page layout praised by Swiss scale-ups for student and graduate applications.',
  },
  {
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

const activeCityFilters = [
  { id: 'city-zurich', label: 'Zurich', category: 'Active cities', test: (job) => job.location?.toLowerCase().includes('zurich') },
  { id: 'city-geneva', label: 'Geneva', category: 'Active cities', test: (job) => job.location?.toLowerCase().includes('geneva') },
  { id: 'city-lausanne', label: 'Lausanne', category: 'Active cities', test: (job) => job.location?.toLowerCase().includes('lausanne') },
];

const roleFocusFilters = [
  {
    id: 'focus-engineering',
    label: 'Engineering',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['react', 'ai/ml', 'python', 'backend'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-product',
    label: 'Product',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['product', 'ux', 'research'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-growth',
    label: 'Growth',
    category: 'Role focus',
    test: (job) => job.tags?.some((tag) => ['growth', 'marketing'].includes(tag.toLowerCase())),
  },
  {
    id: 'focus-climate',
    label: 'Climate',
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

const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts.pop().toLowerCase();
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

const defaultSalaryBounds = deriveSalaryBoundsFromJobs(mockJobs);
const defaultEquityBounds = deriveEquityBoundsFromJobs(mockJobs);

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'Member',
    type: supabaseUser.user_metadata?.type || 'student',
  };
};

const acknowledgeMessage =
  'By applying you agree that the startup will see your profile information, uploaded CV, motivational letter, and profile photo.';

const SwissStartupConnect = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [salaryRange, setSalaryRange] = useState(defaultSalaryBounds);
  const [salaryBounds, setSalaryBounds] = useState(defaultSalaryBounds);
  const [salaryRangeDirty, setSalaryRangeDirty] = useState(false);
  const [salaryFilterCadence, setSalaryFilterCadence] = useState('month');
  const [salaryInputValues, setSalaryInputValues] = useState(() => ({
    min: formatSalaryValue(defaultSalaryBounds[0], 'month'),
    max: formatSalaryValue(defaultSalaryBounds[1], 'month'),
  }));
  const [equityRange, setEquityRange] = useState(defaultEquityBounds);
  const [equityBounds, setEquityBounds] = useState(defaultEquityBounds);
  const [equityRangeDirty, setEquityRangeDirty] = useState(false);
  const [equityInputValues, setEquityInputValues] = useState(() => ({
    min: formatEquityValue(defaultEquityBounds[0]),
    max: formatEquityValue(defaultEquityBounds[1]),
  }));

  const [salaryMin, salaryMax] = salaryRange;
  const [equityMin, equityMax] = equityRange;

  const [jobs, setJobs] = useState(mockJobs);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [companies, setCompanies] = useState(mockCompanies);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [jobSort, setJobSort] = useState('recent');
  const jobSortOptions = useMemo(
    () => [
      { value: 'recent', label: 'Most recent', icon: Clock },
      { value: 'salary_desc', label: 'Highest salary', icon: TrendingUp },
      { value: 'equity_desc', label: 'Highest equity', icon: Percent },
    ],
    []
  );

  const [savedJobs, setSavedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('ssc_saved_jobs');
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedJob, setSelectedJob] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', type: 'student' });
  const [appliedJobs, setAppliedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('ssc_applied_jobs');
    return stored ? JSON.parse(stored) : [];
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);

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
    avatar_url: '',
    cv_public: false,
  });
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
  });
  const [startupSaving, setStartupSaving] = useState(false);

  const [resourceModal, setResourceModal] = useState(null);
  const [reviewsModal, setReviewsModal] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [canReview, setCanReview] = useState(false);

  const [applicationModal, setApplicationModal] = useState(null);
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
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetSaving, setPasswordResetSaving] = useState(false);
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
    employment_type: 'Full-time',
    weekly_hours: '',
    internship_duration_months: '',
    salary_min: '',
    salary_max: '',
    salary_cadence: '',
    salary_is_bracket: false,
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

  const clearFeedback = useCallback(() => setFeedback(null), []);
  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
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
    window.localStorage.setItem('ssc_saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_applied_jobs', JSON.stringify(appliedJobs));
  }, [appliedJobs]);

  const loadProfile = useCallback(
    async (supabaseUser) => {
      if (!supabaseUser) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Profile fetch error', error);
          return;
        }

        let profileRecord = data;

        if (!profileRecord) {
          const baseProfile = {
            user_id: supabaseUser.id,
            full_name: supabaseUser.name,
            type: supabaseUser.type,
            university: '',
            program: '',
            experience: '',
            bio: '',
            portfolio_url: '',
            cv_url: '',
            avatar_url: '',
            cv_public: false,
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(baseProfile)
            .select('*')
            .single();

          if (insertError) {
            console.error('Profile insert error', insertError);
            return;
          }

          profileRecord = inserted;
        }

        setProfile(profileRecord);
        setProfileForm({
          full_name: profileRecord.full_name || supabaseUser.name,
          university: profileRecord.university || '',
          program: profileRecord.program || '',
          experience: profileRecord.experience || '',
          bio: profileRecord.bio || '',
          portfolio_url: profileRecord.portfolio_url || '',
          cv_url: profileRecord.cv_url || '',
          avatar_url: profileRecord.avatar_url || '',
          cv_public: !!profileRecord.cv_public,
        });
      } catch (error) {
        console.error('Profile load error', error);
      }
    },
    []
  );

  const loadStartupProfile = useCallback(async (supabaseUser) => {
    if (!supabaseUser || supabaseUser.type !== 'startup') {
      setStartupProfile(null);
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

      setStartupProfile(startupRecord);
      setStartupForm({
        name: startupRecord.name || supabaseUser.name,
        registry_number: startupRecord.registry_number || '',
        description: startupRecord.description || '',
        website: startupRecord.website || '',
        logo_url: startupRecord.logo_url || '',
        verification_status: startupRecord.verification_status || 'unverified',
        verification_note: startupRecord.verification_note || '',
      });
    } catch (error) {
      console.error('Startup load error', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadProfile(user);
    loadStartupProfile(user);
  }, [authLoading, loadProfile, loadStartupProfile, user]);

  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const { data, error } = await supabase.from('jobs').select('*');

        if (error) {
          console.info('Falling back to mock jobs', error.message);
          setJobs(mockJobs);
        } else if (data && data.length > 0) {
          const mapped = data.map((job) => ({
            ...job,
            applicants: job.applicants ?? 0,
            tags: job.tags ?? [],
            requirements: job.requirements ?? [],
            benefits: job.benefits ?? [],
            posted: job.posted || 'Recently posted',
            motivational_letter_required: job.motivational_letter_required ?? false,
          }));
          setJobs(mapped);
        } else {
          setJobs(mockJobs);
        }
      } catch (error) {
        console.error('Job load error', error);
        setJobs(mockJobs);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [jobsVersion]);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const { data, error } = await supabase.from('startups').select('*');

        if (error) {
          console.info('Falling back to mock companies', error.message);
          setCompanies(mockCompanies);
        } else if (data && data.length > 0) {
          setCompanies(
            data.map((company) => ({
              id: company.id,
              name: company.name,
              tagline: company.tagline,
              location: company.location,
              industry: company.industry,
              team:
                company.team ||
                company.team_size ||
                company.employees ||
                company.headcount ||
                '',
              fundraising:
                company.fundraising ||
                company.total_funding ||
                company.total_raised ||
                company.funding ||
                '',
              culture: company.culture,
              website: company.website,
              verification_status: company.verification_status || 'unverified',
              created_at: company.created_at,
            }))
          );
        } else {
          setCompanies(mockCompanies);
        }
      } catch (error) {
        console.error('Company load error', error);
        setCompanies(mockCompanies);
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || user.type !== 'startup') {
        setApplications([]);
        return;
      }

      setApplicationsLoading(true);
      try {
        let query = supabase
          .from('job_applications')
          .select(
            `id, status, motivational_letter, created_at, cv_override_url,
             profiles ( id, full_name, university, program, avatar_url, cv_url ),
             jobs ( id, title, company_name, startup_id )`
          )
          .order('created_at', { ascending: false });

        if (startupProfile?.id) {
          query = query.eq('jobs.startup_id', startupProfile.id);
        }

        const { data, error } = await query;

        if (!error && data) {
          setApplications(data);
        } else if (error) {
          console.error('Applications load error', error);
          setApplications([]);
        }
      } catch (error) {
        console.error('Applications load error', error);
        setApplications([]);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [user, startupProfile?.id, applicationsVersion]);

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
    (computeNext) => {
      setEquityRangeDirty(true);
      let resolvedValues = null;
      setEquityRange((prev) => {
        const [boundMin, boundMax] = equityBounds;
        const next = typeof computeNext === 'function' ? computeNext(prev, boundMin, boundMax) : computeNext;

        if (!next || !Array.isArray(next) || next.length < 2) {
          return prev;
        }

        let [nextMin, nextMax] = next;

        if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
          return prev;
        }

        nextMin = clamp(roundToStep(nextMin, EQUITY_STEP), boundMin, boundMax);
        nextMax = clamp(roundToStep(nextMax, EQUITY_STEP), boundMin, boundMax);

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
        return [Math.min(monthlyValue, prev[1]), prev[1]];
      }

      return [prev[0], Math.max(monthlyValue, prev[0])];
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
        return [Math.min(monthlyValue, prev[1]), prev[1]];
      }

      return [prev[0], Math.max(monthlyValue, prev[0])];
    });
  };

  const handleEquitySliderChange = (bound) => (event) => {
    const rawValue = Number(event.target.value);
    if (!Number.isFinite(rawValue)) {
      return;
    }

    updateEquityRange((prev) => {
      if (bound === 'min') {
        return [Math.min(rawValue, prev[1]), prev[1]];
      }

      return [prev[0], Math.max(rawValue, prev[0])];
    });
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

    updateEquityRange((prev) => {
      if (bound === 'min') {
        const nextMin = Math.min(numeric, prev[1]);
        return [nextMin, prev[1]];
      }

      const nextMax = Math.max(numeric, prev[0]);
      return [prev[0], nextMax];
    });
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

    updateEquityRange((prev) => {
      if (bound === 'min') {
        const nextMin = Math.min(numeric, prev[1]);
        return [nextMin, prev[1]];
      }

      const nextMax = Math.max(numeric, prev[0]);
      return [prev[0], nextMax];
    });
  };


  const toggleSavedJob = (jobId) => {
    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({ type: 'info', message: 'Sign in as a student to save roles.' });
      return;
    }

    if (user.type !== 'student') {
      setFeedback({ type: 'info', message: 'Switch to a student account to save roles.' });
      return;
    }

    setSavedJobs((prev) => {
      const exists = prev.includes(jobId);
      if (exists) {
        setFeedback({ type: 'info', message: 'Removed from saved roles.' });
        return prev.filter((id) => id !== jobId);
      }
      setFeedback({ type: 'success', message: 'Added to your saved roles.' });
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
      const meta = {
        team: teamLabel ? String(teamLabel) : '',
        fundraising: fundraisingLabel ? String(fundraisingLabel) : '',
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
      const includesThirteenthSalary = Boolean(
        job.has_thirteenth_salary ??
          job.includes_thirteenth_salary ??
          (salaryCadence === 'month' || salaryCadence === 'year')
      );
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

    const formatRowValue = (cadence) => {
      const convertValue = (value) =>
        cadence === 'month' ? value : convertMonthlyValueToCadence(value, cadence, weeklyHours);

      const minConverted = Number.isFinite(monthlyMin) ? convertValue(monthlyMin) : null;
      const maxConverted = Number.isFinite(monthlyMax) ? convertValue(monthlyMax) : null;
      const formattedMin = formatCalculatorCurrency(minConverted, cadence);
      const formattedMax = formatCalculatorCurrency(maxConverted, cadence);

      if (!formattedMin && !formattedMax) {
        return 'Not disclosed';
      }

      const range = formattedMin && formattedMax
        ? formattedMin === formattedMax
          ? formattedMin
          : `${formattedMin} – ${formattedMax}`
        : formattedMin || formattedMax;

      return `CHF ${range}`;
    };

    const monthLabel = formatDurationLabel(durationMonths);

    const rowDefinitions = [
      { key: 'hour', label: 'Hourly', suffix: ' / hour' },
      { key: 'week', label: 'Weekly', suffix: ' / week' },
      { key: 'month', label: 'Monthly', suffix: ' / month' },
      { key: 'year', label: isFullTimeRole ? 'Yearly' : 'Total', suffix: isFullTimeRole ? ' / year' : '' },
    ];

    const rows = rowDefinitions.map((definition) => {
      if (definition.key === 'year' && shouldShowTotal) {
        const monthsForTotal = hasFiniteDuration ? durationMonths : THIRTEENTH_MONTHS_PER_YEAR;
        const totalMin = Number.isFinite(monthlyMin) ? monthlyMin * monthsForTotal : null;
        const totalMax = Number.isFinite(monthlyMax) ? monthlyMax * monthsForTotal : null;
        const formattedMin = formatCalculatorCurrency(totalMin, 'year');
        const formattedMax = formatCalculatorCurrency(totalMax, 'year');

        if (!formattedMin && !formattedMax) {
          return { key: definition.key, label: definition.label, value: 'Not disclosed' };
        }

        const range = formattedMin && formattedMax
          ? formattedMin === formattedMax
            ? formattedMin
            : `${formattedMin} – ${formattedMax}`
          : formattedMin || formattedMax;

        const suffix = hasFiniteDuration && monthLabel ? ` (${monthLabel})` : '';
        return {
          key: definition.key,
          label: definition.label,
          value: `CHF ${range} total${suffix}`,
        };
      }

      const value = formatRowValue(definition.key);
      if (value === 'Not disclosed') {
        return { key: definition.key, label: definition.label, value };
      }

      return { key: definition.key, label: definition.label, value: `${value}${definition.suffix}` };
    });

    const hoursLabel = selectedCalculatorJob.weekly_hours_label
      ? selectedCalculatorJob.weekly_hours_label.replace(/\s+/g, ' ')
      : `${weeklyHours} hours/week`;
    const noteParts = ['Based on the posted salary range'];
    if (hoursLabel) {
      noteParts.push(`Converted with ${hoursLabel}`);
    }
    if (shouldShowTotal) {
      if (hasFiniteDuration && monthLabel) {
        noteParts.push(`Contract lasts ${monthLabel}`);
      }
    } else if (selectedCalculatorJob.includes_thirteenth_salary) {
      noteParts.push('Yearly amounts include a 13th salary');
    }

    return { rows, note: `${noteParts.join(' · ')}.` };
  }, [selectedCalculatorJob]);

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
      const key = String(job.startup_id || job.company_name || '');
      if (!key) return;
      if (!map[key]) map[key] = 0;
      map[key] += 1;
    });
    return map;
  }, [normalizedJobs]);

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
      setFeedback({ type: 'info', message: 'Complete your startup profile before posting a job.' });
      setStartupModalOpen(true);
      return;
    }

    if (!isStartupVerified) {
      setFeedback({
        type: 'info',
        message: 'Verification is required before publishing job offers. Submit your documents to get verified.',
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
      setFeedback({ type: 'info', message: 'Create a profile to apply to roles.' });
      return;
    }

    if (user.type !== 'student') {
      setFeedback({ type: 'info', message: 'Switch to a student account to apply.' });
      return;
    }

    if (!emailVerified) {
      setFeedback({ type: 'info', message: 'Please verify your email address before applying.' });
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
        throw new Error('Sign in to upload files before trying again.');
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
        const normalizedPrefix = prefix ? `${prefix.replace(/\/+$/, '')}/` : '';
        const filePath = `${user.id}/${normalizedPrefix}${Date.now()}-${baseName}.${extension}`;
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
          throw new Error('Upload did not return a public URL.');
        }
        return uploadedUrl;
      } catch (error) {
        const message = error?.message?.toLowerCase?.() ?? '';
        if (message.includes('row-level security') && sanitizedPrefix && !sanitizedPrefix.startsWith('profiles')) {
          const fallbackUrl = await attemptUpload(`profiles/${sanitizedPrefix}`);
          if (!fallbackUrl) {
            throw new Error('Upload did not return a public URL.');
          }
          return fallbackUrl;
        }
        throw error;
      }
    },
    [user?.id]
  );

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    try {
      const updates = {
        user_id: user.id,
        full_name: profileForm.full_name,
        university: profileForm.university,
        program: profileForm.program,
        experience: profileForm.experience,
        bio: profileForm.bio,
        portfolio_url: profileForm.portfolio_url,
        cv_url: profileForm.cv_url,
        avatar_url: profileForm.avatar_url,
        type: user.type,
        cv_public: profileForm.cv_public,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        const mergedProfile = data
          ? { ...(profile ?? {}), ...data }
          : { ...(profile ?? {}), ...updates };

        setProfile(mergedProfile);
        setProfileForm({
          full_name: mergedProfile.full_name || '',
          university: mergedProfile.university || '',
          program: mergedProfile.program || '',
          experience: mergedProfile.experience || '',
          bio: mergedProfile.bio || '',
          portfolio_url: mergedProfile.portfolio_url || '',
          cv_url: mergedProfile.cv_url || '',
          avatar_url: mergedProfile.avatar_url || '',
          cv_public: !!mergedProfile.cv_public,
        });
        await loadProfile({
          id: user.id,
          name: user.name,
          type: user.type,
        });
        showToast('Saved successfully!');
        clearFeedback();
        setProfileModalOpen(false);
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleStartupSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setStartupSaving(true);
    try {
      const updates = {
        owner_id: user.id,
        name: startupForm.name,
        registry_number: startupForm.registry_number,
        description: startupForm.description,
        website: startupForm.website,
        logo_url: startupForm.logo_url,
      };

      const { data, error } = await supabase
        .from('startups')
        .upsert(updates, { onConflict: 'owner_id' })
        .select('*')
        .single();

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        setStartupProfile(data);
        showToast('Saved successfully!');
        setFeedback({
          type: 'info',
          message: 'Startup profile submitted. Verification updates will appear here.',
        });
        setStartupModalOpen(false);
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
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
        throw new Error('Profile photo upload did not return a URL.');
      }
      setProfileForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      setFeedback({ type: 'success', message: 'Profile photo uploaded. Save your profile to keep it.' });
    } catch (error) {
      setFeedback({ type: 'error', message: `Avatar upload failed: ${error.message}` });
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedDocumentFile(file)) {
      setFeedback({
        type: 'error',
        message: 'Upload CV as .pdf, .doc, .docx, or .tex only.',
      });
      return;
    }
    try {
      const publicUrl = await uploadFile('cvs', file, { prefix: 'profiles' });
      if (!publicUrl) {
        throw new Error('CV upload did not return a URL.');
      }
      setProfileForm((prev) => ({ ...prev, cv_url: publicUrl }));
      setProfile((prev) => (prev ? { ...prev, cv_url: publicUrl } : prev));
      setFeedback({ type: 'success', message: 'CV uploaded. Save your profile to keep it updated.' });
    } catch (error) {
      const message = error?.message?.toLowerCase?.().includes('row-level security')
        ? 'CV upload failed: your account is not allowed to store documents in that folder. Please try again or update your profile CV instead.'
        : `CV upload failed: ${error.message}`;
      setFeedback({ type: 'error', message });
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('logos', file);
      if (!publicUrl) {
        throw new Error('Logo upload did not return a URL.');
      }
      setStartupForm((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (error) {
      setFeedback({ type: 'error', message: `Logo upload failed: ${error.message}` });
    }
  };

  const jobSalaryCadence = normalizeSalaryCadence(jobForm.salary_cadence);
  const jobSalaryIsBracket = Boolean(jobForm.salary_is_bracket);
  const jobSalaryLabel = jobSalaryIsBracket ? 'Salary range' : 'Salary';
  const jobSalaryMinLabel = jobSalaryIsBracket ? 'Min' : 'Amount';
  const jobSalaryMinimum = jobSalaryCadence ? SALARY_MINIMUMS_BY_CADENCE[jobSalaryCadence] : null;
  const jobIsPartTime = jobForm.employment_type === 'Part-time';
  const jobWeeklyHoursInput = jobIsPartTime ? parseWeeklyHoursValue(jobForm.weekly_hours) : null;
  const jobWeeklyHoursLabel = jobIsPartTime && Number.isFinite(jobWeeklyHoursInput)
    ? formatWeeklyHoursLabel(jobWeeklyHoursInput)
    : '';
  const jobSalaryHelperExtra = jobIsPartTime
    ? Number.isFinite(jobWeeklyHoursInput)
      ? ` Calculations will use ${jobWeeklyHoursLabel}.`
      : ' Add weekly hours so we can convert part-time pay.'
    : '';
  const jobSalaryHelperText = jobSalaryCadence
    ? `Enter CHF ${SALARY_CADENCE_LABELS[jobSalaryCadence]} ${
        jobSalaryIsBracket ? 'amounts for your bracket' : 'amount'
      } (minimum CHF ${jobSalaryMinimum}).${jobSalaryHelperExtra}`
    : 'Choose the salary cadence before entering amounts.';
  const jobSalaryPlaceholder = jobSalaryCadence ? SALARY_PLACEHOLDER_BY_CADENCE[jobSalaryCadence] : '';
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
      setFeedback({ type: 'info', message: 'Part-time roles over 40h/week switch to full-time automatically.' });
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
      setFeedback({ type: 'info', message: 'Internships can run for a maximum of 12 months.' });
    }
  };

  const handlePostJobSubmit = async (event) => {
    event.preventDefault();
    if (!startupProfile?.id || !user) {
      setPostJobError('Complete your startup profile before posting a job.');
      return;
    }

    if (!isStartupVerified) {
      setPostJobError('Only verified startups can publish job opportunities.');
      return;
    }

    setPostingJob(true);
    setPostJobError('');

    try {
      const locationSelection = jobForm.location?.trim() ?? '';
      if (!isAllowedSwissLocation(locationSelection)) {
        setPostJobError('Choose a Swiss city, canton, or remote option from the list.');
        setPostingJob(false);
        return;
      }

      const locationOption = SWISS_LOCATION_OPTIONS.find(
        (option) => normalizeLocationValue(option.value) === normalizeLocationValue(locationSelection),
      );
      const locationValue = locationOption ? locationOption.value : locationSelection;

      const cadenceSelection = normalizeSalaryCadence(jobForm.salary_cadence) || null;
      if (!cadenceSelection) {
        setPostJobError('Select whether the salary is hourly, weekly, monthly, or yearly.');
        setPostingJob(false);
        return;
      }

      const salaryIsBracket = Boolean(jobForm.salary_is_bracket);
      const salaryMinRaw = jobForm.salary_min?.trim() ?? '';
      const salaryMaxRaw = salaryIsBracket ? jobForm.salary_max?.trim() ?? '' : salaryMinRaw;

      const salaryMinValue = Number.parseFloat(salaryMinRaw.replace(',', '.'));
      const salaryMaxValueInput = Number.parseFloat(salaryMaxRaw.replace(',', '.'));

      if (!Number.isFinite(salaryMinValue)) {
        setPostJobError('Enter the minimum salary before posting the role.');
        setPostingJob(false);
        return;
      }

      const cadenceMinimum = SALARY_MINIMUMS_BY_CADENCE[cadenceSelection] ?? 0;
      const cadenceLabel = SALARY_CADENCE_LABELS[cadenceSelection] || cadenceSelection;

      if (salaryMinValue < cadenceMinimum) {
        setPostJobError(`Minimum ${cadenceLabel} salary must be at least CHF ${cadenceMinimum}.`);
        setPostingJob(false);
        return;
      }

      let salaryMaxValue = salaryMinValue;

      if (salaryIsBracket) {
        if (!Number.isFinite(salaryMaxValueInput)) {
          setPostJobError('Enter the maximum salary for the bracket.');
          setPostingJob(false);
          return;
        }

        salaryMaxValue = salaryMaxValueInput;

        if (salaryMaxValue < salaryMinValue) {
          setPostJobError('Maximum salary cannot be lower than the minimum salary.');
          setPostingJob(false);
          return;
        }

        if (salaryMaxValue < cadenceMinimum) {
          setPostJobError(`Maximum ${cadenceLabel} salary must be at least CHF ${cadenceMinimum}.`);
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
          setPostJobError('Enter the weekly working hours for part-time roles.');
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
          setPostJobError('Share how many months the internship will last.');
          setPostingJob(false);
          return;
        }

        if (parsedDuration > 12) {
          setPostJobError('Internships can run for a maximum of 12 months.');
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
        setPostJobError('Could not derive CHF salary values from the provided cadence.');
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
          setPostJobError('Equity must be a number between 0.1 and 100.');
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

      const payload = {
        startup_id: startupProfile.id,
        title: jobForm.title.trim(),
        company_name: startupProfile.name || startupForm.name,
        location: locationValue,
        employment_type: employmentTypeForPayload,
        salary: salaryDisplay,
        salary_cadence: cadenceSelection,
        salary_min_value: Math.round(monthlyMin),
        salary_max_value: Math.round(monthlyMax),
        equity: equityNumericValue != null ? equityDisplay : null,
        description: jobForm.description.trim(),
        requirements: jobForm.requirements
          ? jobForm.requirements.split('\n').map((item) => item.trim()).filter(Boolean)
          : [],
        benefits: jobForm.benefits
          ? jobForm.benefits.split('\n').map((item) => item.trim()).filter(Boolean)
          : [],
        tags: jobForm.tags
          ? jobForm.tags.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
        motivational_letter_required: jobForm.motivational_letter_required,
        posted: 'Just now',
        weekly_hours_value: employmentTypeForPayload === 'Part-time' ? weeklyHoursNumeric : null,
        weekly_hours: weeklyHoursLabel,
        internship_duration_months: employmentTypeForPayload === 'Internship' ? internshipDurationNumeric : null,
      };

      const { error } = await supabase.from('jobs').insert(payload);
      if (error) {
        setPostJobError(error.message);
        return;
      }

      showToast('Job published successfully!');
      if (convertedToFullTime) {
        setFeedback({
          type: 'info',
          message: 'Job posted as a full-time role because it exceeds 40 hours per week.',
        });
      } else {
        clearFeedback();
      }
      setPostJobModalOpen(false);
      setJobForm({
        title: '',
        location: '',
        employment_type: 'Full-time',
        weekly_hours: '',
        internship_duration_months: '',
        salary_min: '',
        salary_max: '',
        salary_cadence: '',
        salary_is_bracket: false,
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
          message: 'Verification email sent. Check your inbox and spam folder.',
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
      setAuthError('Enter your email above so we can send reset instructions.');
      return;
    }

    setForgotPasswordMessage('Sending reset email…');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
      });

      if (error) {
        setForgotPasswordMessage(`Reset failed: ${error.message}`);
      } else {
        setForgotPasswordMessage('Check your inbox for a password reset link.');
      }
    } catch (error) {
      setForgotPasswordMessage(`Reset failed: ${error.message}`);
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
            message: 'Check your inbox and confirm your email to unlock all features.',
          });
        }
        setFeedback({ type: 'success', message: `Welcome back, ${mapped.name}!` });
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
    await supabase.auth.signOut();
    setUser(null);
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

      const payload = {
        job_id: applicationModal.id,
        profile_id: profile.id,
        motivational_letter: motivationalLetterUrl || null,
        status: 'submitted',
        acknowledged: true,
        cv_override_url: useExistingCv ? null : selectedCvUrl,
      };

      const { error } = await supabase.from('job_applications').insert(payload);

      if (error) {
        setApplicationError(error.message);
      } else {
        setAppliedJobs((prev) => (prev.includes(applicationModal.id) ? prev : [...prev, applicationModal.id]));
        setFeedback({ type: 'success', message: 'Application submitted! 🎉' });
        closeApplicationModal();
      }
    } catch (error) {
      setApplicationError(error.message);
    } finally {
      setApplicationSaving(false);
    }
  };

  const updateApplicationStatus = async (applicationId, nextStatus) => {
    setApplicationStatusUpdating(applicationId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: nextStatus })
        .eq('id', applicationId);

      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      setFeedback({ type: 'success', message: `Application marked as ${nextStatus}.` });
      setApplicationsVersion((prev) => prev + 1);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setApplicationStatusUpdating(null);
    }
  };

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

  const toggleFollowCompany = (companyId) => {
    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({ type: 'info', message: 'Sign in to follow startups.' });
      return;
    }

    const key = String(companyId);
    setFollowedCompanies((prev) => {
      if (prev.includes(key)) {
        return prev.filter((id) => id !== key);
      }
      return [...prev, key];
    });
  };

  const closeResourceModal = () => setResourceModal(null);
  const closeReviewsModal = () => setReviewsModal(null);

  const loadingSpinner = jobsLoading || companiesLoading || authLoading;

  const navTabs = useMemo(() => {
    const baseTabs = ['general', 'jobs', 'companies'];
    if (user?.type === 'startup') {
      baseTabs.push('my-jobs', 'applications');
    }
    baseTabs.push('saved');
    return baseTabs;
  }, [user?.type]);

  const isStudent = user?.type === 'student';
  const isLoggedIn = Boolean(user);
  const canApply = isLoggedIn && isStudent;
  const canSaveJobs = isLoggedIn && isStudent;
  const applyRestrictionMessage = isLoggedIn ? 'Student applicants only' : 'Sign in as a student to apply';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
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
      { value: 'recent', label: 'Most recent', icon: Clock },
      { value: 'jobs_desc', label: 'Most roles', icon: Briefcase },
    ],
    []
  );
  const [followedCompanies, setFollowedCompanies] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('ssc_followed_companies');
    return stored ? JSON.parse(stored).map(String) : [];
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_followed_companies', JSON.stringify(followedCompanies));
  }, [followedCompanies]);

  const sortedCompanies = useMemo(() => {
    const enriched = companies.map((company) => {
      const idKey = company.id ? String(company.id) : null;
      const nameKey = company.name ? String(company.name) : null;
      const jobCount = (idKey && companyJobCounts[idKey]) || (nameKey && companyJobCounts[nameKey]) || 0;
      return {
        ...company,
        jobCount,
        isFollowed: followedCompanies.includes(String(company.id || company.name)),
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
  }, [companies, companyJobCounts, companySort, followedCompanies]);

  const featuredCompanies = useMemo(() => {
    return [...sortedCompanies]
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 3);
  }, [sortedCompanies]);

  const safeSalaryBoundMin = Number.isFinite(salaryBounds[0]) ? salaryBounds[0] : defaultSalaryBounds[0];
  const safeSalaryBoundMax = Number.isFinite(salaryBounds[1]) ? salaryBounds[1] : defaultSalaryBounds[1];
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

  const salarySliderStyle = {
    '--range-min': `${calculateSliderPercent(
      Number.isFinite(salaryDisplayMinValue) ? salaryDisplayMinValue : salaryDisplayMinBound
    )}%`,
    '--range-max': `${calculateSliderPercent(
      Number.isFinite(salaryDisplayMaxValue) ? salaryDisplayMaxValue : salaryDisplayMaxBound
    )}%`,
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
  const salaryFilterHelperText = SALARY_FILTER_HELPERS[salaryFilterCadence] || 'CHF monthly';
  const salaryFilterCadenceLabel = SALARY_CADENCE_LABELS[salaryFilterCadence] || 'monthly';

  const safeEquityBoundMin = Number.isFinite(equityBounds[0]) ? equityBounds[0] : defaultEquityBounds[0];
  const safeEquityBoundMax = Number.isFinite(equityBounds[1]) ? equityBounds[1] : defaultEquityBounds[1];
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
  const equitySliderStyle = {
    '--range-min': `${Math.min(
      Math.max(((equitySliderMinValue - normalizedEquityMinBound) / equitySliderRangeSpan) * 100, 0),
      100
    )}%`,
    '--range-max': `${Math.min(
      Math.max(((equitySliderMaxValue - normalizedEquityMinBound) / equitySliderRangeSpan) * 100, 0),
      100
    )}%`,
  };
  const equitySliderDisabled = normalizedEquityMinBound === normalizedEquityMaxBound;
  const equityRangeAtDefault =
    equitySliderMinValue === normalizedEquityMinBound && equitySliderMaxValue === normalizedEquityMaxBound;
  const filtersActive =
    selectedFilters.length > 0 || !salaryRangeAtDefault || !equityRangeAtDefault;


  return (
    <div className="ssc">
      {toast && (
        <div className="ssc__toast" role="status" aria-live="polite">
          <CheckCircle2 size={20} />
          <span className="ssc__toast-message">{toast.message}</span>
        </div>
      )}
      <header className={`ssc__header ${compactHeader ? 'is-compact' : ''}`}>
        <div className="ssc__max ssc__header-inner">
          <div className="ssc__brand">
            <div className="ssc__brand-badge">⌁</div>
            <div className="ssc__brand-text">
              <span className="ssc__brand-name">SwissStartup Connect</span>
            </div>
          </div>

          <nav className="ssc__nav">
            {navTabs.map((tab) => {
              const labels = {
                general: 'General',
                jobs: 'Opportunities',
                companies: 'Startups',
                'my-jobs': 'My jobs',
                applications: 'Applicants',
                saved: 'Saved',
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`ssc__nav-button ${activeTab === tab ? 'is-active' : ''}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </nav>

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
                  Join us
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
                  Sign in
                </button>
              </div>
            ) : (
              <div className="ssc__user-chip">
                <button
                  type="button"
                  className="ssc__user-menu-toggle"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                >
                  <div className="ssc__avatar-small">{user.name.charAt(0)}</div>
                  <div className="ssc__user-meta">
                    <span className="ssc__user-name">{user.name}</span>
                    <span className="ssc__user-role">{user.type}</span>
                  </div>
                  <ChevronDown className={`ssc__caret ${showUserMenu ? 'is-open' : ''}`} size={16} />
                </button>
                {showUserMenu && (
                  <div className="ssc__user-menu">
                    <header className="ssc__user-menu-header">
                      <div className="ssc__avatar-medium">{user.name.charAt(0)}</div>
                      <div>
                        <strong>{user.name}</strong>
                        <span className="ssc__user-menu-role">{user.type}</span>
                      </div>
                    </header>
                    <button type="button" onClick={() => { setProfileModalOpen(true); setShowUserMenu(false); }}>
                      Profile
                    </button>
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
                      Privacy & security
                    </button>
                    {user.type === 'startup' && (
                      <>
                        <button type="button" onClick={() => { setActiveTab('my-jobs'); setShowUserMenu(false); }}>
                          My jobs
                        </button>
                        <button type="button" onClick={() => { setStartupModalOpen(true); setShowUserMenu(false); }}>
                          Company profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            openPostJobFlow();
                          }}
                        >
                          Post vacancy
                        </button>
                        <button type="button" onClick={() => { setActiveTab('applications'); setShowUserMenu(false); }}>
                          View applicants
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {user && !emailVerified && (
          <div className="ssc__notice">
            <p>
              Please confirm your email address to unlock all features. Once confirmed, refresh this page and you can
              apply to roles.
            </p>
            <button type="button" onClick={resendVerificationEmail} disabled={resendingEmail}>
              {resendingEmail ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}

        {activeTab === 'general' && (
          <section className="ssc__hero">
            <div className="ssc__max">
              <div className="ssc__hero-badge">
                <Sparkles size={18} />
                <span>Trusted by Swiss startups & universities</span>
              </div>
              <h1 className="ssc__hero-title">Shape the next Swiss startup success story</h1>
              <p className="ssc__hero-lede">
                Discover paid internships, part-time roles, and graduate opportunities with
                founders who want you in the room from day one.
              </p>

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
                    placeholder="Search startup, role, or skill"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Search roles"
                  />
                </div>
                <button type="submit" className="ssc__search-btn">
                  Find matches
                </button>
              </form>

              <div className="ssc__stats">
                {stats.map((stat) => (
                  <article key={stat.id} className="ssc__stat-card">
                    <span className="ssc__stat-value">{stat.value}</span>
                    <span className="ssc__stat-label">{stat.label}</span>
                    <p>{stat.detail}</p>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="ssc__hero-scroll-indicator"
                onClick={scrollToFilters}
                aria-label="Scroll to filters"
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
                  <h2>Tailor your results</h2>
                  <p>Pick the active cities, role focus, and the compensation mix that fits you best.</p>
                </div>
                {filtersActive && (
                  <button type="button" className="ssc__clear-filters" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
              <div className="ssc__filters-grid">
                <div className="ssc__filter-group">
                  <span className="ssc__filter-label">Active cities</span>
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
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="ssc__filter-group">
                  <div className="ssc__filter-label-row">
                    <span className="ssc__filter-label">Role focus</span>
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
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="ssc__filter-group ssc__filter-group--salary">
                  <div className="ssc__filter-label-row">
                    <div className="ssc__filter-label-group">
                      <span className="ssc__filter-label">Salary range</span>
                      <span className="ssc__filter-helper">{salaryFilterHelperText}</span>
                    </div>
                    <div className="ssc__cadence-toggle" role="group" aria-label="Salary cadence">
                      {SALARY_FILTER_CADENCE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`ssc__cadence-btn ${salaryFilterCadence === option.value ? 'is-active' : ''}`}
                          onClick={() => setSalaryFilterCadence(option.value)}
                          aria-pressed={salaryFilterCadence === option.value}
                        >
                          {option.label}
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
                      disabled={salarySliderDisabled}
                      aria-label={`Minimum ${salaryFilterCadenceLabel} salary`}
                    />
                    <input
                      type="range"
                      min={salarySliderMinBoundDisplay}
                      max={salarySliderMaxBoundDisplay}
                      step={salarySliderStep}
                      value={salarySliderMaxDisplay}
                      onChange={handleSalarySliderChange('max')}
                      disabled={salarySliderDisabled}
                      aria-label={`Maximum ${salaryFilterCadenceLabel} salary`}
                    />
                  </div>
                  <div className="ssc__salary-inputs">
                    <label className="ssc__salary-input">
                      <span>Min</span>
                      <div className="ssc__salary-input-wrapper">
                        <span>CHF</span>
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={salaryInputValues.min}
                          onChange={(event) => handleSalaryInputChange('min', event.target.value)}
                          aria-label={`Minimum ${salaryFilterCadenceLabel} salary in Swiss francs`}
                          disabled={salarySliderDisabled}
                        />
                      </div>
                    </label>
                    <div className="ssc__salary-divider" aria-hidden="true">
                      –
                    </div>
                    <label className="ssc__salary-input">
                      <span>Max</span>
                      <div className="ssc__salary-input-wrapper">
                        <span>CHF</span>
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={salaryInputValues.max}
                          onChange={(event) => handleSalaryInputChange('max', event.target.value)}
                          aria-label={`Maximum ${salaryFilterCadenceLabel} salary in Swiss francs`}
                          disabled={salarySliderDisabled}
                        />
                      </div>
                    </label>
                  </div>
                </div>
                <div className="ssc__filter-group ssc__filter-group--equity">
                  <div className="ssc__filter-label-row">
                    <span className="ssc__filter-label">Equity range</span>
                    <span className="ssc__filter-helper">Percent ownership</span>
                  </div>
                  <div className="ssc__equity-slider" style={equitySliderStyle}>
                    <input
                      type="range"
                      min={normalizedEquityMinBound}
                      max={normalizedEquityMaxBound}
                      step={EQUITY_STEP}
                      value={equitySliderMinValue}
                      onChange={handleEquitySliderChange('min')}
                      disabled={equitySliderDisabled}
                      aria-label="Minimum equity"
                    />
                    <input
                      type="range"
                      min={normalizedEquityMinBound}
                      max={normalizedEquityMaxBound}
                      step={EQUITY_STEP}
                      value={equitySliderMaxValue}
                      onChange={handleEquitySliderChange('max')}
                      disabled={equitySliderDisabled}
                      aria-label="Maximum equity"
                    />
                  </div>
                  <div className="ssc__equity-inputs">
                    <label className="ssc__equity-input">
                      <span>Min</span>
                      <div className="ssc__filter-input-wrapper">
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={equityInputValues.min}
                          onChange={(event) => handleEquityInputChange('min', event.target.value)}
                          onFocus={handleEquityInputFocus('min')}
                          onBlur={handleEquityInputBlur('min')}
                          aria-label="Minimum equity percentage"
                          disabled={equitySliderDisabled}
                        />
                        <span>%</span>
                      </div>
                    </label>
                    <div className="ssc__filter-divider" aria-hidden="true">
                      –
                    </div>
                    <label className="ssc__equity-input">
                      <span>Max</span>
                      <div className="ssc__filter-input-wrapper">
                        <input
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={equityInputValues.max}
                          onChange={(event) => handleEquityInputChange('max', event.target.value)}
                          onFocus={handleEquityInputFocus('max')}
                          onBlur={handleEquityInputBlur('max')}
                          aria-label="Maximum equity percentage"
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
                  <h2>Open opportunities</h2>
                  <p>
                    Curated roles from Swiss startups that welcome student talent and emerging
                    professionals.
                  </p>
                </div>
                <div className="ssc__job-toolbar">
                  <span className="ssc__pill">{filteredJobs.length} roles</span>
                  <div className="ssc__sort-control" role="group" aria-label="Sort opportunities">
                    <span className="ssc__sort-label">Sort by</span>
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
                    aria-label="Toggle salary calculator"
                    disabled={!salaryCalculatorRevealed}
                  >
                    <Calculator size={22} />
                  </button>
                  <aside
                    id={SALARY_CALCULATOR_PANEL_ID}
                    className={`ssc__calculator-panel ${salaryCalculatorOpen ? 'is-open' : ''}`}
                    aria-hidden={!salaryCalculatorOpen}
                  >
                    <div className="ssc__calculator-head">
                      <div className="ssc__calculator-title">
                        <span className="ssc__calculator-chip">Compensation insights</span>
                        <h3>Salary calculator</h3>
                      </div>
                      <button
                        type="button"
                        className="ssc__calculator-close"
                        onClick={() => setSalaryCalculatorOpen(false)}
                        aria-label="Close salary calculator"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {calculatorCompanies.length === 0 ? (
                      <p className="ssc__calculator-empty">No roles available to convert yet.</p>
                    ) : (
                      <>
                        <div className="ssc__calculator-fields">
                          <label htmlFor="calculator-company">
                            <span>Company</span>
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
                            <span>Role</span>
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
                                    No roles available
                                  </option>
                                ) : (
                                  calculatorJobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                      {job.title}
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
                    const hasApplied = appliedJobs.includes(job.id);
                    const timingText = buildTimingText(job);
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{job.title}</h3>
                            <p>{job.company_name}</p>
                          </div>
                          <button
                            type="button"
                            className={`ssc__save-btn ${isSaved ? 'is-active' : ''}`}
                            onClick={() => toggleSavedJob(job.id)}
                            aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
                            aria-disabled={!canSaveJobs}
                            title={!canSaveJobs ? 'Sign in as a student to save roles' : undefined}
                          >
                            <Heart size={18} strokeWidth={isSaved ? 0 : 1.5} fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="ssc__job-summary">{job.description}</p>

                        <div className="ssc__job-meta">
                          <span>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span>
                            <Clock size={16} />
                            {timingText}
                          </span>
                          <span>
                            <Users size={16} />
                            {job.applicants} applicants
                          </span>
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
                            <Star size={14} /> 13th salary
                          </div>
                        )}

                        <div className="ssc__job-tags">
                          {job.tags?.map((tag) => (
                            <span key={tag} className="ssc__tag">
                              {tag}
                            </span>
                          ))}
                          <span className="ssc__tag ssc__tag--soft">{job.stage || 'Seed'}</span>
                          {job.motivational_letter_required && (
                            <span className="ssc__tag ssc__tag--required">Motivational letter</span>
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
                              View role
                            </button>
                            {canApply ? (
                              <button
                                type="button"
                                className={`ssc__primary-btn ${hasApplied ? 'is-disabled' : ''}`}
                                onClick={() => openApplyModal(job)}
                                disabled={hasApplied}
                              >
                                {hasApplied ? 'Applied' : 'Apply now'}
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
                        <h3>See more opportunities</h3>
                        <p>Browse all {filteredJobs.length} open roles on the Opportunities page.</p>
                      </div>
                      <button
                        type="button"
                        className="ssc__primary-btn"
                        onClick={() => setActiveTab('jobs')}
                      >
                        Explore roles
                        <ArrowRight size={18} />
                      </button>
                    </article>
                  )}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>No matches yet</h3>
                  <p>Try removing a filter or widening your salary range.</p>
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
                  <h2>Featured startups</h2>
                  <p>Meet the founders building Switzerland’s next generation of companies.</p>
                </div>
                <div className="ssc__company-toolbar">
                  <div className="ssc__sort-control" role="group" aria-label="Sort startups">
                    <span className="ssc__sort-label">Sort by</span>
                    <div className="ssc__sort-options">
                      {companySortOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`ssc__sort-button ${companySort === option.value ? 'is-active' : ''}`}
                            onClick={() => setCompanySort(option.value)}
                            aria-pressed={companySort === option.value}
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

              {companiesLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : sortedCompanies.length > 0 ? (
                <div className="ssc__company-grid">
                  {sortedCompanies.map((company) => {
                    const followKey = String(company.id || company.name);
                    const jobCountLabel =
                      company.jobCount === 1 ? '1 open role' : `${company.jobCount} open roles`;
                    return (
                      <article key={followKey} className="ssc__company-card">
                        <div className="ssc__company-logo">
                          <Building2 size={20} />
                        </div>
                        <div className="ssc__company-content">
                          <div className="ssc__company-header">
                            <h3 className="ssc__company-name">{company.name}</h3>
                            {company.verification_status === 'verified' && (
                              <span className="ssc__badge">
                                <CheckCircle2 size={14} /> Verified
                              </span>
                            )}
                          </div>
                          <p className="ssc__company-tagline">{company.tagline}</p>
                          <div className="ssc__company-meta">
                            {company.location && <span>{company.location}</span>}
                            {company.industry && <span>{company.industry}</span>}
                          </div>
                          {(company.team || company.fundraising) && (
                            <div className="ssc__company-insights">
                              {company.team && (
                                <span className="ssc__company-pill ssc__company-pill--team">
                                  <Users size={14} />
                                  {company.team}
                                </span>
                              )}
                              {company.fundraising && (
                                <span className="ssc__company-pill ssc__company-pill--funding">
                                  <Sparkles size={14} />
                                  {company.fundraising}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="ssc__company-stats">{company.culture}</p>
                          <div className="ssc__company-foot">
                            <span className="ssc__company-jobs">{jobCountLabel}</span>
                            <div className="ssc__company-actions">
                              {company.website && (
                                <a
                                  className="ssc__outline-btn"
                                  href={company.website}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Visit website
                                </a>
                              )}
                              <button
                                type="button"
                                className={`ssc__follow-btn ${company.isFollowed ? 'is-active' : ''}`}
                                onClick={() => toggleFollowCompany(followKey)}
                              >
                                {company.isFollowed ? 'Following' : 'Follow'}
                              </button>
                              <button
                                type="button"
                                className="ssc__ghost-btn"
                                onClick={() => openReviewsModal(company)}
                              >
                                Reviews
                              </button>
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
                  <h3>No startups listed yet</h3>
                  <p>Check back soon or invite your favourite Swiss startup to join.</p>
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
                    {startupJobs.length} {startupJobs.length === 1 ? 'active posting' : 'active postings'}
                  </span>
                  {isStartupVerified ? (
                    <button type="button" className="ssc__primary-btn" onClick={openPostJobFlow}>
                      Post vacancy
                    </button>
                  ) : (
                    <span className="ssc__pill ssc__pill--muted">Verification required</span>
                  )}
                </div>
              </div>

              {!isStartupVerified && (
                <div className="ssc__notice">
                  <span>Verify your startup to unlock job postings. Add your commercial register details and logo.</span>
                  <button type="button" onClick={() => setStartupModalOpen(true)}>
                    Complete verification
                  </button>
                </div>
              )}

              {startupJobs.length > 0 ? (
                <div className="ssc__grid">
                  {startupJobs.map((job) => {
                    const postedAt = job.created_at ? new Date(job.created_at) : null;
                    const postedLabel = postedAt
                      ? postedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : job.posted || 'Recently posted';
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{job.title}</h3>
                            <p>{job.company_name}</p>
                          </div>
                          <span className="ssc__pill ssc__pill--muted">{postedLabel}</span>
                        </div>
                        <p className="ssc__job-summary">{job.description}</p>
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
                            {job.applicants} applicants
                          </span>
                        </div>
                        <div className="ssc__job-actions">
                          <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                            View role
                          </button>
                          <button
                            type="button"
                            className="ssc__primary-btn"
                            onClick={() => setActiveTab('applications')}
                          >
                            View applicants
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Briefcase size={40} />
                  <h3>No job posts yet</h3>
                  <p>
                    {isStartupVerified
                      ? 'Share your first opportunity to start meeting candidates.'
                      : 'Get verified to unlock job posting and start attracting talent.'}
                  </p>
                  {isStartupVerified && (
                    <button type="button" className="ssc__primary-btn" onClick={openPostJobFlow}>
                      Post your first role
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
                  <h2>Applicants</h2>
                  <p>Track progress, review motivational letters, and manage your hiring pipeline.</p>
                </div>
                <span className="ssc__pill">{applications.length} applicants</span>
              </div>

              {applicationsLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="ssc__applications-grid">
                    {applications.map((application) => {
                      const candidate = application.profiles;
                      const job = application.jobs;
                      const cvLink = application.cv_override_url || candidate?.cv_url;
                      return (
                        <article key={application.id} className="ssc__application-card">
                        <header className="ssc__application-header">
                          <div>
                            <h3>{job?.title}</h3>
                            <p>{job?.company_name}</p>
                          </div>
                          <div className="ssc__status-select">
                            <label>
                              Status
                              <select
                                value={application.status}
                                onChange={(event) => updateApplicationStatus(application.id, event.target.value)}
                                disabled={applicationStatusUpdating === application.id}
                              >
                                {applicationStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </header>

                        <div className="ssc__candidate">
                          <div className="ssc__avatar-medium">
                            {candidate?.avatar_url ? (
                              <img src={candidate.avatar_url} alt={candidate.full_name || 'Candidate'} />
                            ) : (
                              <span>{candidate?.full_name?.charAt(0) || 'C'}</span>
                            )}
                          </div>
                          <div>
                            <strong>{candidate?.full_name || 'Candidate'}</strong>
                            <ul>
                              <li>{candidate?.university || 'University not provided'}</li>
                              <li>{candidate?.program || 'Program not provided'}</li>
                            </ul>
                            {cvLink ? (
                              <a href={cvLink} target="_blank" rel="noreferrer">
                                View CV
                              </a>
                            ) : (
                              <span>No CV provided</span>
                            )}
                          </div>
                        </div>

                        {application.motivational_letter && (
                          <details className="ssc__letter">
                            <summary>Motivational letter</summary>
                            {application.motivational_letter.startsWith('http') ? (
                              <a href={application.motivational_letter} target="_blank" rel="noreferrer">
                                Download motivational letter
                              </a>
                            ) : (
                              <p>{application.motivational_letter}</p>
                            )}
                          </details>
                        )}

                        <footer className="ssc__application-footer">
                          <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Briefcase size={40} />
                  <h3>No applicants yet</h3>
                  <p>Share your job link or post a new role to start receiving applications.</p>
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
                  <h2>Saved roles</h2>
                  <p>Keep tabs on opportunities you want to revisit or apply to later.</p>
                </div>
                <span className="ssc__pill">{savedJobList.length} saved</span>
              </div>

              {!canSaveJobs ? (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>Student accounts only</h3>
                  <p>
                    {isLoggedIn
                      ? 'Switch to a student account to save and track roles.'
                      : 'Sign in with your student account to save opportunities for later.'}
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
                      Sign in
                    </button>
                  )}
                </div>
              ) : savedJobList.length > 0 ? (
                <div className="ssc__grid">
                  {savedJobList.map((job) => {
                    const timingText = buildTimingText(job);
                    return (
                      <article key={job.id} className="ssc__job-card">
                        <div className="ssc__job-header">
                          <div>
                            <h3>{job.title}</h3>
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
                        <p className="ssc__job-summary">{job.description}</p>
                        <div className="ssc__job-meta">
                          <span>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span>
                            <Clock size={16} />
                            {timingText}
                          </span>
                          <span>
                            <Users size={16} />
                            {job.applicants} applicants
                          </span>
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
                            <Star size={14} /> 13th salary
                          </div>
                        )}
                        <div className="ssc__job-tags">
                          {job.tags?.map((tag) => (
                            <span key={tag} className="ssc__tag">
                              {tag}
                            </span>
                          ))}
                          <span className="ssc__tag ssc__tag--soft">{job.stage || 'Seed'}</span>
                          {job.motivational_letter_required && (
                            <span className="ssc__tag ssc__tag--required">Motivational letter</span>
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
                              View role
                            </button>
                            {canApply ? (
                              <button
                                type="button"
                                className="ssc__primary-btn"
                                onClick={() => openApplyModal(job)}
                              >
                                Apply now
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
                  <h3>No saved roles yet</h3>
                  <p>Tap the heart on an opportunity to keep it here for later.</p>
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
                  <h2>How it works</h2>
                  <p>Six steps to land a role with a Swiss startup that shares your ambition.</p>
                  <div className="ssc__step-grid">
                    {steps.map((step) => (
                      <article key={step.id} className="ssc__step-card">
                        <div className="ssc__step-icon">
                          <step.icon size={18} />
                        </div>
                        <div>
                          <h3>{step.title}</h3>
                          <p>{step.description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="ssc__testimonials">
                  <aside className="ssc__featured-corner">
                    <div className="ssc__featured-header">
                      <h3>Featured companies</h3>
                      <button type="button" className="ssc__link-button" onClick={() => setActiveTab('companies')}>
                        View all
                      </button>
                    </div>
                    <ul className="ssc__featured-list">
                      {featuredCompanies.length > 0 ? (
                        featuredCompanies.map((company) => {
                          const followKey = String(company.id || company.name);
                          const jobCountLabel =
                            company.jobCount === 1 ? '1 open role' : `${company.jobCount} open roles`;
                          return (
                            <li key={followKey} className="ssc__featured-item">
                              <div>
                                <span className="ssc__featured-name">{company.name}</span>
                                <span className="ssc__featured-meta">{jobCountLabel}</span>
                              </div>
                              <button
                                type="button"
                                className={`ssc__follow-chip ${company.isFollowed ? 'is-active' : ''}`}
                                onClick={() => toggleFollowCompany(followKey)}
                              >
                                {company.isFollowed ? 'Following' : 'Follow'}
                              </button>
                            </li>
                          );
                        })
                      ) : (
                        <li className="ssc__featured-empty">New startups are being curated—check back soon.</li>
                      )}
                    </ul>
                  </aside>
                  <h2>Stories from our community</h2>
                  <div className="ssc__testimonial-grid">
                    {testimonials.map((testimonial) => (
                      <blockquote key={testimonial.id} className="ssc__testimonial-card">
                        <p>“{testimonial.quote}”</p>
                        <footer>
                          <strong>{testimonial.name}</strong>
                          <span>{testimonial.role}</span>
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
                      <span>Startup Career Tips</span>
                    </h2>
                    <p>Level up your startup search with quick advice founders share most often.</p>
                  </div>
                </div>
                <div className="ssc__tips-grid">
                  {careerTips.map((tip) => (
                    <article key={tip.id} className="ssc__tip-card">
                      <div className="ssc__tip-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3>{tip.title}</h3>
                        <p>{tip.description}</p>
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
                    <h2>Resources to get you started</h2>
                    <p>Templates, benchmarks, and guides designed with Swiss founders.</p>
                  </div>
                </div>
                <div className="ssc__resource-grid">
                  {resourceLinks.map((resource) => (
                    <article key={resource.id} className="ssc__resource-card">
                      <div className="ssc__resource-icon">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h3>{resource.title}</h3>
                        <p>{resource.description}</p>
                        {resource.action === 'external' ? (
                          <a href={resource.href} target="_blank" rel="noreferrer">
                            Visit official site
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="ssc__link-button"
                            onClick={() => setResourceModal(resource.modalId)}
                          >
                            View details
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
                  <h2>Ready to co-create the next Swiss success story?</h2>
                  <p>Join a curated community of founders, operators, and students building across Switzerland.</p>
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
                    Create profile
                    <ArrowRight size={18} />
                  </button>
                  <button type="button" className="ssc__ghost-btn" onClick={() => setActiveTab('companies')}>
                    Explore startups
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="ssc__footer">
        <div className="ssc__max">
          <span>© {new Date().getFullYear()} SwissStartup Connect. Built in Switzerland.</span>
          <div className="ssc__footer-links">
            <a href="/privacy.html" target="_blank" rel="noreferrer">
              Privacy
            </a>
            <a href="/terms.html" target="_blank" rel="noreferrer">
              Terms
            </a>
            <a href="/contact.html" target="_blank" rel="noreferrer">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {resourceModal === 'compensation' && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={closeResourceModal}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Median internship pay by canton</h2>
              <p>
                Source: swissuniversities internship barometer 2024 + public salary postings (January 2025).
                Figures are midpoints for internships lasting 3–12 months.
              </p>
            </header>
            <div className="ssc__modal-body">
              <div className="ssc__table-wrapper">
                <table className="ssc__table">
                  <thead>
                    <tr>
                      <th>Canton</th>
                      <th>Median stipend</th>
                      <th>What to expect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cantonInternshipSalaries.map((entry) => (
                      <tr key={entry.canton}>
                        <td>{entry.canton}</td>
                        <td>{entry.median}</td>
                        <td>{entry.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="ssc__modal-footnote">
                Companies may add transport passes, lunch stipends, or housing support. Always confirm the latest
                package with the startup before signing the agreement.
              </p>
            </div>
          </div>
        </div>
      )}

      {resourceModal === 'cvTemplates' && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={closeResourceModal}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Founder-ready CV templates</h2>
              <p>Start with these layouts that Swiss hiring teams recommend, then tailor them with the tips below.</p>
            </header>
            <div className="ssc__modal-body">
              <ul className="ssc__link-list">
                {cvTemplates.map((template) => (
                  <li key={template.name}>
                    <a href={template.url} target="_blank" rel="noreferrer">
                      {template.name}
                    </a>
                    <span>{template.reason}</span>
                  </li>
                ))}
              </ul>

              <h3 className="ssc__modal-subtitle">How to make your CV stand out</h3>
              <ul className="ssc__bullet-list">
                {cvWritingTips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
              <p className="ssc__modal-footnote">
                Pro tip: export as PDF named <code>firstname-lastname-cv.pdf</code>. Keep versions in English and the local
                language of the canton you target (French, German, or Italian) to speed up interviews.
              </p>
            </div>
          </div>
        </div>
      )}

      {reviewsModal && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={closeReviewsModal}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>{reviewsModal.name} · Reviews</h2>
              <p>Hear from verified team members about culture, learning pace, and hiring experience.</p>
            </header>
            <div className="ssc__modal-body">
              {reviewsLoading ? (
                <p>Loading reviews…</p>
              ) : reviews.length > 0 ? (
                <div className="ssc__reviews">
                  {reviews.map((review) => (
                    <article key={review.id} className="ssc__review-card">
                      <div className="ssc__review-heading">
                        <div className="ssc__review-avatar">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt={review.profiles.full_name} />
                          ) : (
                            <span>{review.profiles?.full_name?.charAt(0) || 'M'}</span>
                          )}
                        </div>
                        <div>
                          <strong>{review.title}</strong>
                          <div className="ssc__review-meta">
                            <span>{review.profiles?.full_name || 'Member'}</span>
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
                  ))}
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
          </div>
        </div>
      )}

      {selectedJob && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal">
            <button type="button" className="ssc__modal-close" onClick={() => setSelectedJob(null)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>{selectedJob.title}</h2>
              <p>{selectedJob.company_name}</p>
              <div className="ssc__modal-meta">
                <span>
                  <MapPin size={16} />
                  {selectedJob.location}
                </span>
                <span>
                  <Clock size={16} />
                  {buildTimingText(selectedJob)}
                </span>
                <span>
                  <Users size={16} />
                  {selectedJob.applicants} applicants
                </span>
              </div>
              {(selectedJob.company_team || selectedJob.company_fundraising) && (
                <div className="ssc__modal-company-insights">
                  {selectedJob.company_team && (
                    <span className="ssc__company-pill ssc__company-pill--team">
                      <Users size={14} />
                      {selectedJob.company_team}
                    </span>
                  )}
                  {selectedJob.company_fundraising && (
                    <span className="ssc__company-pill ssc__company-pill--funding">
                      <Sparkles size={14} />
                      {selectedJob.company_fundraising}
                    </span>
                  )}
                </div>
              )}
              {selectedJob.includes_thirteenth_salary && (
                <div className="ssc__thirteenth-note">
                  <Star size={14} /> 13th salary
                </div>
              )}
            </header>
            <div className="ssc__modal-body">
              <p>{selectedJob.description}</p>

              <div className="ssc__modal-section">
                <h3>Requirements</h3>
                <ul className="ssc__modal-list">
                  {selectedJob.requirements?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="ssc__modal-section">
                <h3>Benefits</h3>
                <ul className="ssc__modal-list">
                  {selectedJob.benefits?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ssc__modal-actions">
              <button type="button" className="ssc__ghost-btn" onClick={() => toggleSavedJob(selectedJob.id)}>
                {savedJobs.includes(selectedJob.id) ? 'Saved' : 'Save for later'}
              </button>
              {canApply ? (
                <button type="button" className="ssc__primary-btn" onClick={() => openApplyModal(selectedJob)}>
                  Apply now
                </button>
              ) : (
                <span className="ssc__job-note">{applyRestrictionMessage}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {applicationModal && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={closeApplicationModal}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Submit your application</h2>
              <p>
                {applicationModal.title} · {applicationModal.company_name}
              </p>
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
                  Motivational letter {applicationModal.motivational_letter_required ? '(required)' : '(optional)'}
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
          </div>
        </div>
      )}

      {profileModalOpen && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={() => setProfileModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Update your profile</h2>
              <p>Keep startups in the loop with your latest projects, studies, and documents.</p>
            </header>
            <form className="ssc__modal-body" onSubmit={handleProfileSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>Full name</span>
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
                      <span>University or school</span>
                      <input
                        type="text"
                        value={profileForm.university}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, university: event.target.value }))}
                        placeholder="ETH Zürich, EPFL, HSG, ZHAW…"
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Programme</span>
                      <input
                        type="text"
                        value={profileForm.program}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, program: event.target.value }))}
                        placeholder="BSc Computer Science"
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Experience highlights</span>
                      <textarea
                        rows={3}
                        value={profileForm.experience}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, experience: event.target.value }))}
                        placeholder="Intern at AlpTech—built supply dashboards; Student project: Smart energy router…"
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Short bio</span>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder="Describe what you’re passionate about and the kind of team you thrive in."
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Portfolio or LinkedIn</span>
                      <input
                        type="url"
                        value={profileForm.portfolio_url}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, portfolio_url: event.target.value }))}
                        placeholder="https://"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="ssc__field">
                      <span>School / University (optional)</span>
                      <input
                        type="text"
                        value={profileForm.university}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, university: event.target.value }))}
                        placeholder="Where did you graduate from?"
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Role in this startup</span>
                      <input
                        type="text"
                        value={profileForm.experience}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, experience: event.target.value }))}
                        placeholder="Founder & CEO, Head of Growth…"
                      />
                    </label>
                    <label className="ssc__field">
                      <span>Skills & hobbies (optional)</span>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder="Design sprints, skiing, product storytelling…"
                      />
                    </label>
                  </>
                )}

                <label className="ssc__field">
                  <span>Upload profile photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  {profileForm.avatar_url && (
                    <img className="ssc__avatar-preview" src={profileForm.avatar_url} alt="Profile avatar" />
                  )}
                </label>

                {isStudent && (
                  <label className="ssc__field">
                    <span>Upload CV</span>
                    <input type="file" accept=".pdf,.doc,.docx,.tex" onChange={handleCvUpload} />
                    <small className="ssc__field-note">Accepted: PDF, Word (.doc/.docx), TeX.</small>
                    {profileForm.cv_url && (
                      <div className="ssc__cv-visibility">
                        <a href={profileForm.cv_url} target="_blank" rel="noreferrer">
                          View current CV
                        </a>
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
                              ? 'CV visible to startups'
                              : 'Keep CV private until you apply'}
                          </span>
                        </label>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setProfileModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {startupModalOpen && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={() => setStartupModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Your startup profile</h2>
              <p>Share official details so students know they’re speaking with a verified team.</p>
            </header>
            <form className="ssc__modal-body" onSubmit={handleStartupSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>Company name</span>
                  <input
                    type="text"
                    value={startupForm.name}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
                <label className="ssc__field">
                  <span>Commercial register ID</span>
                  <input
                    type="text"
                    value={startupForm.registry_number}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, registry_number: event.target.value }))}
                    placeholder="CHE-123.456.789"
                  />
                </label>
                <label className="ssc__field">
                  <span>Website</span>
                  <input
                    type="url"
                    value={startupForm.website}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, website: event.target.value }))}
                    placeholder="https://"
                  />
                </label>
                <label className="ssc__field">
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={startupForm.description}
                    onChange={(event) => setStartupForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Explain your product, traction, hiring focus, and what interns will learn."
                  />
                </label>
                <label className="ssc__field">
                  <span>Upload logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  {startupForm.logo_url && (
                    <img className="ssc__avatar-preview" src={startupForm.logo_url} alt="Startup logo" />
                  )}
                </label>
                <div className="ssc__status-card">
                  <strong>Verification status:</strong>{' '}
                  <span className={`ssc__badge ${startupForm.verification_status}`}>
                    {startupForm.verification_status}
                  </span>
                  {startupForm.verification_note && <p>{startupForm.verification_note}</p>}
                  <p className="ssc__modal-footnote">
                    Provide a registry ID and link to official documentation. Our team will review submissions weekly.
                  </p>
                </div>
              </div>

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setStartupModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={startupSaving}>
                  {startupSaving ? 'Submitting…' : 'Save startup profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {postJobModalOpen && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--wide">
            <button type="button" className="ssc__modal-close" onClick={() => setPostJobModalOpen(false)}>
              <X size={18} />
            </button>
            <header className="ssc__modal-header">
              <h2>Post a new vacancy</h2>
              <p>Share the essentials so students and graduates understand the opportunity.</p>
            </header>
            <form className="ssc__modal-body" onSubmit={handlePostJobSubmit}>
              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>Role title</span>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="ssc__field">
                  <span>Location</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.location}
                      onChange={(event) => setJobForm((prev) => ({ ...prev, location: event.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        Select a Swiss location
                      </option>
                      {SWISS_LOCATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                <label className="ssc__field">
                  <span>Employment type</span>
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
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                {jobForm.employment_type === 'Part-time' && (
                  <label className="ssc__field">
                    <span>Weekly hours</span>
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
                      placeholder="e.g. 24"
                      onBlur={handleJobWeeklyHoursBlur}
                      required
                    />
                    <small className="ssc__field-note">Used to scale monthly and yearly salary. Max 40h/week.</small>
                  </label>
                )}
                {jobForm.employment_type === 'Internship' && (
                  <label className="ssc__field">
                    <span>Internship length (months)</span>
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
                      placeholder="e.g. 6"
                      onBlur={handleInternshipDurationBlur}
                      required
                    />
                    <small className="ssc__field-note">Internships must last between 1 and 12 months.</small>
                  </label>
                )}
                <label className="ssc__field">
                  <span>Salary cadence</span>
                  <div className="ssc__select-wrapper">
                    <select
                      className="ssc__select"
                      value={jobForm.salary_cadence}
                      onChange={(event) =>
                        setJobForm((prev) => ({
                          ...prev,
                          salary_cadence: event.target.value,
                          salary_min: '',
                          salary_max: '',
                        }))
                      }
                      required
                    >
                      <option value="">Select cadence</option>
                      <option value="hour">Hourly</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly / total</option>
                    </select>
                    <ChevronDown className="ssc__select-caret" size={16} />
                  </div>
                </label>
                <label className="ssc__field ssc__field-equity ssc__field-equity--stacked">
                  <span>Equity (%)</span>
                  <input
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={jobForm.equity}
                    onChange={(event) =>
                      setJobForm((prev) => ({ ...prev, equity: sanitizeDecimalInput(event.target.value) }))
                    }
                    onBlur={handleJobEquityBlur}
                    placeholder="Optional (e.g. 0.5)"
                  />
                  <small className="ssc__field-note">Allowed range: 0.1 – 100. Leave blank if none.</small>
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
                        <span>Show salary bracket</span>
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
                          placeholder={jobSalaryCadence ? `e.g. ${jobSalaryPlaceholder}` : 'Select cadence first'}
                          disabled={!jobSalaryCadence}
                        />
                      </label>
                      {jobSalaryIsBracket && (
                        <>
                          <div className="ssc__field-range-divider" aria-hidden="true">
                            –
                          </div>
                          <label className="ssc__field-range-input">
                            <span>Max</span>
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
                              placeholder={jobSalaryCadence ? `e.g. ${jobSalaryPlaceholder}` : 'Select cadence first'}
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
                          ? `Full-time equivalent: ${jobSalaryPreview}`
                          : `Approximate: ${jobSalaryPreview}`}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <label className="ssc__field">
                <span>Role description</span>
                <textarea
                  rows={4}
                  value={jobForm.description}
                  onChange={(event) => setJobForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="What will the candidate work on?"
                  required
                />
              </label>

              <div className="ssc__profile-grid">
                <label className="ssc__field">
                  <span>Requirements (one per line)</span>
                  <textarea
                    rows={3}
                    value={jobForm.requirements}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, requirements: event.target.value }))}
                  />
                </label>
                <label className="ssc__field">
                  <span>Benefits (one per line)</span>
                  <textarea
                    rows={3}
                    value={jobForm.benefits}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, benefits: event.target.value }))}
                  />
                </label>
                <label className="ssc__field">
                  <span>Tags (comma separated)</span>
                  <input
                    type="text"
                    value={jobForm.tags}
                    onChange={(event) => setJobForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="React, Growth, Fintech"
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
                  <span>Require motivational letter for this role</span>
                </label>
              </div>

              {postJobError && <p className="ssc__form-error">{postJobError}</p>}

              <div className="ssc__modal-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setPostJobModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ssc__primary-btn" disabled={postingJob}>
                  {postingJob ? 'Posting…' : 'Publish job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--auth">
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
            <h2>{isRegistering ? 'Create your profile' : 'Welcome back'}</h2>
            <p>
              {isRegistering
                ? 'Tell us a little about yourself so we can surface the right matches.'
                : 'Sign in to access your saved roles, applications, and profile.'}
            </p>

            {authError && <div className="ssc__alert">{authError}</div>}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="ssc__form">
              {isRegistering && (
                <>
                  <label className="ssc__field">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="ssc__field">
                    <span>I am a</span>
                    <select
                      value={registerForm.type}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="student">Student</option>
                      <option value="startup">Startup</option>
                    </select>
                  </label>
                </>
              )}

              <label className="ssc__field">
                <span>Email</span>
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
                <span>Password</span>
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
                        ? 'Hide'
                        : 'Show'
                      : showLoginPassword
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>
              </label>

              {isRegistering && (
                <label className="ssc__field">
                  <span>Confirm password</span>
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
                      {showRegisterConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
              )}

              {!isRegistering && (
                <div className="ssc__forgot">
                  <button type="button" className="ssc__link-button" onClick={handleForgotPassword}>
                    Forgot password?
                  </button>
                  {forgotPasswordMessage && <small>{forgotPasswordMessage}</small>}
                </div>
              )}

              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full">
                {isRegistering ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="ssc__auth-switch">
              {isRegistering ? 'Already have an account?' : 'New to SwissStartup Connect?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                  setForgotPasswordMessage('');
                  setRegisterConfirm('');
                }}
              >
                {isRegistering ? 'Sign in instead' : 'Create a profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetPasswordModalOpen && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--auth">
            <button type="button" className="ssc__modal-close" onClick={closeResetPasswordModal}>
              <X size={18} />
            </button>
            <h2>Set a new password</h2>
            <p>Enter and confirm your new password to complete the reset.</p>

            {passwordResetError && <div className="ssc__alert">{passwordResetError}</div>}

            <form className="ssc__form" onSubmit={handlePasswordReset}>
              <label className="ssc__field">
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </label>
              <label className="ssc__field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={passwordResetSaving}>
                {passwordResetSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {securityModalOpen && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--auth">
            <button type="button" className="ssc__modal-close" onClick={closeSecurityModal}>
              <X size={18} />
            </button>
            <h2>Privacy & security</h2>
            <p>Keep your contact email up to date and rotate your password regularly for extra safety.</p>

            <form className="ssc__form" onSubmit={handleSecurityEmailChange}>
              <h3 className="ssc__modal-subtitle">Change email</h3>
              <label className="ssc__field">
                <span>Email</span>
                <input
                  type="email"
                  value={securityEmail}
                  onChange={(event) => setSecurityEmail(event.target.value)}
                  required
                />
              </label>
              {securityEmailMessage && <div className="ssc__info">{securityEmailMessage}</div>}
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={securityEmailSaving}>
                {securityEmailSaving ? 'Saving…' : 'Save email'}
              </button>
            </form>

            <form className="ssc__form" onSubmit={handleSecurityPasswordChange}>
              <h3 className="ssc__modal-subtitle">Change password</h3>
              {securityError && <div className="ssc__alert">{securityError}</div>}
              <label className="ssc__field">
                <span>Current password</span>
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
                    {showOldPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              <label className="ssc__field">
                <span>New password</span>
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
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              <label className="ssc__field">
                <span>Confirm new password</span>
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
                    {showNewConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              <button type="submit" className="ssc__primary-btn ssc__primary-btn--full" disabled={securitySaving}>
                {securitySaving ? 'Updating…' : 'Save password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loadingSpinner && <div className="ssc__loading" aria-hidden="true" />}
    </div>
  );
};

export default SwissStartupConnect;
