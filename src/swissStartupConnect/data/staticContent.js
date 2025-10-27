import {
  GraduationCap,
  Layers,
  Handshake,
  Rocket,
  ClipboardList,
  Trophy,
} from 'lucide-react';

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
      'Startup Connect made it effortless to discover startups that matched my values. I shipped production code in week two.',
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
    id: 'impact',
    title: 'Real Impact',
    description: 'Work directly with founders to shape products used across Switzerland.',
  },
  {
    id: 'language',
    title: 'Language Boost',
    description: 'Use your multilingual skills to stand out in international teams.',
  },
];

export const cantonInternshipSalaries = [
  { canton: 'Zurich', median: 'CHF 2,200', note: 'Highest demand for software and product roles.' },
  { canton: 'Geneva', median: 'CHF 2,050', note: 'Multilingual roles across finance and NGOs.' },
  { canton: 'Vaud', median: 'CHF 1,950', note: 'Deep tech clusters near EPFL and startup campuses.' },
  { canton: 'Basel-Stadt', median: 'CHF 2,100', note: 'Biotech and pharma internships with lab access.' },
  { canton: 'Bern', median: 'CHF 1,800', note: 'Government innovation labs and civic tech projects.' },
  { canton: 'Ticino', median: 'CHF 1,600', note: 'Growing fintech and cross-border commerce roles.' },
];

export const cvTemplates = [
  {
    id: 'eth',
    name: 'ETH Career Center Template',
    url: 'https://ethz.ch/en/industry/industry-relations/career-services/students-alumni/application-documents.html',
    reason: 'Optimised for Swiss recruiters with bilingual headings and structured achievements.',
  },
  {
    id: 'epfl',
    name: 'EPFL Innovation CV',
    url: 'https://www.epfl.ch/campus/services/careers/cv-cover-letter/',
    reason: 'Highlights projects, prototypes, and research outcomes on a single page.',
  },
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
