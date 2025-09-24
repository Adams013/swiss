import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Building2,
  Clock,
  GraduationCap,
  Heart,
  Layers,
  MapPin,
  Rocket,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import './SwissStartupConnect.css';
import { supabase } from './supabaseClient';

const mockJobs = [
  {
    id: 1,
    title: 'Frontend Engineer',
    company: 'TechFlow AG',
    location: 'Zurich, Switzerland',
    type: 'Full-time',
    posted: '2 days ago',
    applicants: 18,
    salary: '80k – 110k CHF',
    equity: '0.2% – 0.4%',
    summary: 'Build delightful fintech experiences for 12k+ SMB customers.',
    description:
      'Join a product-led team redefining liquidity management for Swiss SMEs. You will partner with design and product to ship pixel-perfect interfaces that feel effortless.',
    tags: ['React', 'TypeScript', 'Fintech', 'Product'],
    stage: 'Series A',
    requirements: [
      '3+ years building modern web applications',
      'Fluent with React and state management patterns',
      'Focus on accessibility, performance, and polish',
    ],
    benefits: [
      'Hybrid work in Zurich or remote within Switzerland',
      'Learning stipend & conference budget',
      'Employee stock option plan',
    ],
  },
  {
    id: 2,
    title: 'Product Manager',
    company: 'Alpine Health',
    location: 'Geneva, Switzerland',
    type: 'Full-time',
    posted: '5 days ago',
    applicants: 11,
    salary: '95k – 125k CHF',
    equity: '0.3% – 0.5%',
    summary: 'Lead digital patient journeys for Swiss clinics and telehealth partners.',
    description:
      'Own discovery through delivery for connected healthcare experiences that reach 50k+ patients. Collaborate with clinicians, engineers, and design to craft lovable products.',
    tags: ['Product', 'Healthcare', 'UX Research', 'Analytics'],
    stage: 'Seed',
    requirements: [
      'Proven track-record shipping product in health or regulated spaces',
      'Data fluency and experimentation mindset',
      'Skilled communicator across disciplines',
    ],
    benefits: [
      'Founding team equity & mentorship',
      'Wellness budget and private health insurance',
      'Quarterly team retreats in the Alps',
    ],
  },
  {
    id: 3,
    title: 'Machine Learning Intern',
    company: 'Cognivia Labs',
    location: 'Lausanne, Switzerland (Hybrid)',
    type: 'Internship',
    posted: '1 day ago',
    applicants: 24,
    salary: '3.5k CHF / month',
    equity: 'N/A',
    summary: 'Prototype models that power scientific discovery platforms.',
    description:
      'Work with a senior research pod to translate cutting-edge ML into production discovery tools. Expect rapid iteration, mentorship, and measurable impact.',
    tags: ['AI/ML', 'Python', 'Research'],
    stage: 'Series B',
    requirements: [
      'MSc or final-year BSc in CS, Math, or related field',
      'Hands-on experience with PyTorch or TensorFlow',
      'Comfort with MLOps tooling and experimentation',
    ],
    benefits: [
      'Dedicated research mentor',
      'Conference travel support',
      'Fast-track to full-time offer',
    ],
  },
  {
    id: 4,
    title: 'Growth Marketer',
    company: 'Helvetia Mobility',
    location: 'Remote (Bern HQ)',
    type: 'Full-time',
    posted: '3 days ago',
    applicants: 9,
    salary: '70k – 95k CHF',
    equity: '0.15% – 0.25%',
    summary: 'Scale the next-gen shared mobility network across Switzerland.',
    description:
      'Design and execute go-to-market experiments across campuses and Swiss cities. You will own lifecycle campaigns, partnerships, and community-led growth loops.',
    tags: ['Growth', 'Marketing', 'Go-to-market'],
    stage: 'Series A',
    requirements: [
      '2+ years in growth or lifecycle marketing',
      'Comfort with data, automation, and positioning',
      'Fluent in English; German or French is a plus',
    ],
    benefits: [
      'Quarterly coworking swaps across Switzerland',
      'Mobility stipend & climate-conscious perks',
      'Leadership coaching budget',
    ],
  },
  {
    id: 5,
    title: 'Backend Engineer',
    company: 'ClimaChain',
    location: 'Basel, Switzerland',
    type: 'Full-time',
    posted: '6 days ago',
    applicants: 7,
    salary: '90k – 120k CHF',
    equity: '0.25% – 0.45%',
    summary: 'Build resilient infrastructure for climate impact reporting.',
    description:
      'Architect and ship the data backbone that helps Swiss manufacturers measure emissions in real time. Collaborate with data partners and climate scientists.',
    tags: ['Backend', 'TypeScript', 'Climate'],
    stage: 'Series A',
    requirements: [
      'Strong experience with Node.js or Go microservices',
      'Background in data-intensive or event-driven systems',
      'Thoughtful about sustainable engineering practices',
    ],
    benefits: [
      'Hybrid schedule with 2 days in Basel HQ',
      'Sabbatical opportunity after 2 years',
      'Climate impact bonus linked to company goals',
    ],
  },
];

const mockCompanies = [
  {
    id: 1,
    name: 'TechFlow AG',
    tagline: 'Liquidity intelligence for Swiss SMEs',
    location: 'Zurich',
    industry: 'Fintech',
    team: '65 people',
    hires: '11 open roles',
    culture: 'Product-driven, hybrid-first, carbon neutral operations.',
    website: 'https://techflow.example',
  },
  {
    id: 2,
    name: 'Alpine Health',
    tagline: 'Digital care pathways for clinics & telehealth',
    location: 'Geneva',
    industry: 'Healthtech',
    team: '32 people',
    hires: '6 open roles',
    culture: 'Human-centred, clinically informed, data trusted.',
    website: 'https://alpinehealth.example',
  },
  {
    id: 3,
    name: 'Cognivia Labs',
    tagline: 'ML tooling for scientific breakthroughs',
    location: 'Lausanne',
    industry: 'Deep Tech',
    team: '48 people',
    hires: '4 open roles',
    culture: 'Research-rooted, humble experts, fast experimentation.',
    website: 'https://cognivia.example',
  },
  {
    id: 4,
    name: 'ClimaChain',
    tagline: 'Chain-of-custody monitoring for industrial emissions',
    location: 'Basel',
    industry: 'Climate Tech',
    team: '28 people',
    hires: '5 open roles',
    culture: 'Impact-obsessed, transparent, sustainable pace.',
    website: 'https://climachain.example',
  },
];

const steps = [
  {
    id: 1,
    title: 'Create a standout profile',
    description: 'Showcase your skills, side projects, and what you want to learn next.',
    icon: GraduationCap,
  },
  {
    id: 2,
    title: 'Match with aligned startups',
    description: 'We surface curated roles based on your focus, availability, and ambitions.',
    icon: Layers,
  },
  {
    id: 3,
    title: 'Launch together',
    description: 'Go from first intro to signed offer in under three weeks on average.',
    icon: Rocket,
  },
];

const stats = [
  {
    id: 'startups',
    value: '2.3k',
    label: 'Swiss startups hiring',
    detail: 'Vetted teams across fintech, health, climate, deep tech, and more.',
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
    detail: 'Students who built ventures while interning with our partners.',
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
      "We filled two growth roles in record time. The candidates already understood the Swiss market and came ready to experiment.",
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
    description: 'Three proven templates plus writing tips that recruiters mention most.',
    action: 'modal',
    modalId: 'cvTemplates',
  },
  {
    id: 3,
    title: 'Visa & permit checklist',
    description: 'Step-by-step support for international students moving to Switzerland.',
    action: 'external',
    href: 'https://www.ch.ch/en/entering-switzerland-visa/',
  },
];

const cantonInternshipSalaries = [
  { canton: 'Zürich (ZH)', median: 'CHF 2,450', note: 'Highest stipends thanks to finance, pharma, and big-tech hubs.' },
  { canton: 'Bern (BE)', median: 'CHF 2,150', note: 'Federal administration and med-tech offer steady rates.' },
  { canton: 'Luzern (LU)', median: 'CHF 2,050', note: 'Tourism and health clusters; housing remains moderate.' },
  { canton: 'Uri (UR)', median: 'CHF 1,850', note: 'Engineering SMEs; travel subsidy often included.' },
  { canton: 'Schwyz (SZ)', median: 'CHF 2,050', note: 'Finance & industrial internships compete for talent.' },
  { canton: 'Obwalden (OW)', median: 'CHF 1,950', note: 'Smaller companies; many provide meal allowances.' },
  { canton: 'Nidwalden (NW)', median: 'CHF 2,000', note: 'Aviation suppliers pay above national average.' },
  { canton: 'Glarus (GL)', median: 'CHF 1,950', note: 'Manufacturing focused; stipends often paired with housing support.' },
  { canton: 'Zug (ZG)', median: 'CHF 2,600', note: 'Crypto/commodity scale-ups drive compensation up.' },
  { canton: 'Fribourg (FR)', median: 'CHF 2,000', note: 'Bilingual market; universities co-fund research internships.' },
  { canton: 'Solothurn (SO)', median: 'CHF 2,000', note: 'Precision engineering internships with salary plus transport.' },
  { canton: 'Basel-Stadt (BS)', median: 'CHF 2,450', note: 'Life sciences leaders keep stipends close to junior salaries.' },
  { canton: 'Basel-Landschaft (BL)', median: 'CHF 2,150', note: 'Chemical industry and logistics maintain strong ranges.' },
  { canton: 'Schaffhausen (SH)', median: 'CHF 2,050', note: 'International manufacturing HQs sit just across the border.' },
  { canton: 'Appenzell Ausserrhoden (AR)', median: 'CHF 1,900', note: 'Family-owned firms; frequent accommodation stipends.' },
  { canton: 'Appenzell Innerrhoden (AI)', median: 'CHF 1,850', note: 'Smaller cohort; salaries balanced with low living costs.' },
  { canton: 'St. Gallen (SG)', median: 'CHF 2,100', note: 'Fintech and textile innovation labs recruit heavily from HSG/OST.' },
  { canton: 'Graubünden (GR)', median: 'CHF 1,850', note: 'Tourism and outdoor brands add seasonal benefits.' },
  { canton: 'Aargau (AG)', median: 'CHF 2,100', note: 'Energy and industrial automation pay competitive stipends.' },
  { canton: 'Thurgau (TG)', median: 'CHF 1,950', note: 'Agri-food and med-tech blend salary with commuting aid.' },
  { canton: 'Ticino (TI)', median: 'CHF 1,900', note: 'Cross-border companies benchmark against Lombardy + Swiss averages.' },
  { canton: 'Vaud (VD)', median: 'CHF 2,250', note: 'EPFL ecosystem and med-tech scale-ups compete for engineers.' },
  { canton: 'Valais (VS)', median: 'CHF 1,900', note: 'Energy and tourism stipends with seasonal housing support.' },
  { canton: 'Neuchâtel (NE)', median: 'CHF 2,000', note: 'Watchmaking and microtech offer solid mid-range pay.' },
  { canton: 'Geneva (GE)', median: 'CHF 2,350', note: 'International organisations top up with travel & lunch subsidies.' },
  { canton: 'Jura (JU)', median: 'CHF 1,850', note: 'Advanced manufacturing focuses on skill development bonuses.' },
];

const cvTemplates = [
  {
    name: 'Europass Classic',
    url: 'https://europa.eu/europass/en/create-europass-cv',
    reason: 'Widely accepted by Swiss corporates and universities; bilingual sections make it easy to duplicate in French/German.',
  },
  {
    name: 'Novorésumé Basic (Free)',
    url: 'https://novoresume.com/resume-templates',
    reason: 'Clean single-page template that hiring teams at Swiss scale-ups often recommend for junior roles.',
  },
  {
    name: 'Google Docs – Swiss Minimal',
    url: 'https://docs.google.com/document/d/1dxJ4SWI2Pa3uFY6uhAT0t5gE_zp0oGOPbsT_t-jSfo0/preview',
    reason: 'Two-column layout promoted by ETH Career Center; quick to duplicate and customise.',
  },
];

const cvWritingTips = [
  'Open with a three-line summary that states your target role, key strengths, and what you want to learn next.',
  'Use bullet points that start with strong verbs and quantify impact (e.g. “reduced onboarding time by 30%”).',
  'Highlight technical stack and tool proficiency in their own section; founders skim for this first.',
  'Include extracurriculars, hackathons, or venture projects—Swiss founders value entrepreneurial signals.',
  'Keep it to one page unless you have 3+ years of experience; recruiters spend ~45 seconds on the first scan.',
];

const quickFilters = [
  {
    id: 'loc-zurich',
    label: 'Zurich',
    category: 'Location',
    test: (job) => job.location.toLowerCase().includes('zurich'),
  },
  {
    id: 'loc-geneva',
    label: 'Geneva',
    category: 'Location',
    test: (job) => job.location.toLowerCase().includes('geneva'),
  },
  {
    id: 'loc-remote',
    label: 'Remote friendly',
    category: 'Location',
    test: (job) => job.location.toLowerCase().includes('remote'),
  },
  {
    id: 'type-full',
    label: 'Full-time',
    category: 'Role type',
    test: (job) => job.type === 'Full-time',
  },
  {
    id: 'type-intern',
    label: 'Internship',
    category: 'Role type',
    test: (job) => job.type === 'Internship',
  },
  {
    id: 'focus-engineering',
    label: 'Engineering',
    category: 'Focus',
    test: (job) => job.tags.some((tag) => ['React', 'TypeScript', 'Backend', 'AI/ML'].includes(tag)),
  },
  {
    id: 'focus-product',
    label: 'Product',
    category: 'Focus',
    test: (job) => job.tags.some((tag) => ['Product', 'UX Research'].includes(tag)),
  },
  {
    id: 'focus-growth',
    label: 'Growth',
    category: 'Focus',
    test: (job) => job.tags.some((tag) => ['Growth', 'Marketing', 'Go-to-market'].includes(tag)),
  },
  {
    id: 'focus-climate',
    label: 'Climate',
    category: 'Focus',
    test: (job) => job.tags.some((tag) => ['Climate', 'Sustainability'].includes(tag)),
  },
];

const filterPredicates = quickFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.test;
  return acc;
}, {});

const SwissStartupConnect = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [savedJobs, setSavedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('ssc_saved_jobs');
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('student');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    type: 'student',
  });
  const [appliedJobs, setAppliedJobs] = useState(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('ssc_applied_jobs');
    return stored ? JSON.parse(stored) : [];
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [resourceModal, setResourceModal] = useState(null);
  const loading = false;

  const mapSupabaseUser = (supabaseUser) => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      name:
        supabaseUser.user_metadata?.name ||
        supabaseUser.email?.split('@')[0] ||
        'Member',
      email: supabaseUser.email ?? '',
      type: supabaseUser.user_metadata?.type || 'student',
    };
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('ssc_applied_jobs', JSON.stringify(appliedJobs));
  }, [appliedJobs]);

  useEffect(() => {
    let isMounted = true;

    const initialiseSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session?.user) {
        const formatted = mapSupabaseUser(session.user);
        setUser(formatted);
        setUserType(formatted.type);
      } else {
        setUser(null);
        setUserType('student');
      }

      setAuthLoading(false);
    };

    initialiseSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const formatted = mapSupabaseUser(session.user);
        setUser(formatted);
        setUserType(formatted.type);
      } else {
        setUser(null);
        setUserType('student');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [feedback]);

  const groupedFilters = useMemo(() => {
    return quickFilters.reduce((acc, filter) => {
      if (!acc[filter.category]) {
        acc[filter.category] = [];
      }
      acc[filter.category].push(filter);
      return acc;
    }, {});
  }, []);

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      const matchesSearch =
        !searchTerm.trim() ||
        [job.title, job.company, job.location, job.summary]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

      const matchesFilters = selectedFilters.every((filterId) => {
        const predicate = filterPredicates[filterId];
        return predicate ? predicate(job) : true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [searchTerm, selectedFilters]);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return mockCompanies;

    return mockCompanies.filter((company) =>
      [company.name, company.tagline, company.location, company.industry]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [searchTerm]);

  const renderSearchForm = ({
    variant = 'default',
    placeholder = 'Search startup, role, or skill',
    targetTab,
  } = {}) => (
    <form
      className={`ssc__search ${variant === 'inline' ? 'ssc__search--inline' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (targetTab) {
          setActiveTab(targetTab);
        }
      }}
    >
      <div className="ssc__search-field">
        <Search size={18} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search"
        />
      </div>
      <button type="submit" className="ssc__search-btn">
        Find matches
      </button>
    </form>
  );

  const renderJobCards = (jobsList) => (
    <div className="ssc__grid">
      {jobsList.map((job) => {
        const isSaved = savedJobs.includes(job.id);
        const hasApplied = appliedJobs.includes(job.id);
        return (
          <article key={job.id} className="ssc__job-card">
            <div className="ssc__job-header">
              <div>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
              </div>
              <button
                type="button"
                className={`ssc__save-btn ${isSaved ? 'is-active' : ''}`}
                onClick={() => handleToggleSave(job.id)}
                aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
              >
                <Heart size={18} strokeWidth={isSaved ? 0 : 1.5} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>

            <p className="ssc__job-summary">{job.summary}</p>

            <div className="ssc__job-meta">
              <span>
                <MapPin size={16} />
                {job.location}
              </span>
              <span>
                <Clock size={16} />
                {job.type}
              </span>
              <span>
                <Users size={16} />
                {job.applicants} applicants
              </span>
            </div>

            <div className="ssc__job-tags">
              {job.tags.map((tag) => (
                <span key={tag} className="ssc__tag">
                  {tag}
                </span>
              ))}
              <span className="ssc__tag ssc__tag--soft">{job.stage}</span>
            </div>

            <div className="ssc__job-footer">
              <div className="ssc__salary">
                <span>{job.salary}</span>
                <small>+ {job.equity} equity</small>
              </div>
              <div className="ssc__job-actions">
                <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                  View role
                </button>
                <button
                  type="button"
                  className={`ssc__primary-btn ${hasApplied ? 'is-disabled' : ''}`}
                  onClick={() => handleApply(job)}
                  disabled={hasApplied}
                >
                  {hasApplied ? 'Applied' : 'Apply now'}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  const savedJobList = useMemo(() => {
    return mockJobs.filter((job) => savedJobs.includes(job.id));
  }, [savedJobs]);

  const toggleFilter = (filterId) => {
    setActiveTab('jobs');
    setSelectedFilters((prev) => {
      return prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId];
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const handleToggleSave = (jobId) => {
    setSavedJobs((prev) => {
      const isSaved = prev.includes(jobId);
      const next = isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      setFeedback({
        type: isSaved ? 'info' : 'success',
        message: isSaved ? 'Removed from saved roles.' : 'Added to your saved roles.',
      });
      return next;
    });
  };

  const handleApply = (job) => {
    if (!user) {
      setIsRegistering(false);
      setShowLoginModal(true);
      setFeedback({ type: 'info', message: 'Sign in or create a profile to apply.' });
      return;
    }

    if (!appliedJobs.includes(job.id)) {
      setAppliedJobs((prev) => [...prev, job.id]);
    }

    setFeedback({
      type: 'success',
      message: `We shared your profile with ${job.company}. They will reach out soon!`,
    });
    setSelectedJob(null);
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
        const formatted = mapSupabaseUser(data.user);
        setUser(formatted);
        setUserType(formatted.type);
        setFeedback({ type: 'success', message: `Welcome back, ${formatted.name}!` });
      }

      setLoginForm({ email: '', password: '' });
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

      if (data.user) {
        const formatted = mapSupabaseUser(data.user);
        setUser(formatted);
        setUserType(formatted.type);
        setFeedback({
          type: 'success',
          message: 'Profile created. Let’s find your first match.',
        });
        setShowLoginModal(false);
      } else {
        setFeedback({
          type: 'success',
          message: 'Registration complete. Check your email to confirm your account.',
        });
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType('student');
    setFeedback({ type: 'info', message: 'Signed out. Your saved roles stay here for you.' });
  };

  const closeResourceModal = () => setResourceModal(null);

  const closeAuthModal = () => {
    setShowLoginModal(false);
    setAuthError('');
    setLoginForm({ email: '', password: '' });
  };

  const activeTabDescription = useMemo(() => {
    switch (activeTab) {
      case 'general':
        return 'Explore the Swiss startup ecosystem and discover where you can make the biggest impact.';
      case 'jobs':
        return 'Browse vetted opportunities that match your skills, schedule, and ambitions.';
      case 'companies':
        return 'Meet the founders building Switzerland’s next generation of companies.';
      case 'saved':
        return 'Keep tabs on opportunities you want to revisit or apply to later.';
      default:
        return 'Curated roles from Swiss startups that welcome student talent and emerging professionals.';
    }
  }, [activeTab]);

  return (
    <div className="ssc">
      <header className="ssc__header">
        <div className="ssc__max ssc__header-inner">
          <div className="ssc__brand">
            <div className="ssc__brand-badge">⌁</div>
            <div className="ssc__brand-text">
              <span className="ssc__brand-name">SwissStartup Connect</span>
              <span className="ssc__brand-sub">Where Swiss founders meet ambitious students</span>
            </div>
          </div>

          <nav className="ssc__nav">
            {['general', 'jobs', 'companies', 'saved'].map((tab) => {
              const labelMap = {
                general: 'General',
                jobs: 'Opportunities',
                companies: 'Startups',
                saved: `Saved (${savedJobs.length})`,
              };

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`ssc__nav-button ${activeTab === tab ? 'is-active' : ''}`}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </nav>

          <div className="ssc__actions">
            {!user && (
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
            )}
            {user ? (
              <div className="ssc__user-chip">
                <div className="ssc__avatar">{user.name.charAt(0)}</div>
                <div className="ssc__user-meta">
                  <span className="ssc__user-name">{user.name}</span>
                  <span className="ssc__user-role">{user.type}</span>
                </div>
                <button type="button" className="ssc__signout" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ssc__cta-btn"
                onClick={() => {
                  setIsRegistering(true);
                  setShowLoginModal(true);
                  setAuthError('');
                }}
              >
                Join the network
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'general' && (
          <section className="ssc__hero">
            <div className="ssc__max">
              <div className="ssc__hero-badge">
                <Sparkles size={18} />
                <span>Trusted by Swiss startups & universities</span>
              </div>
              <h1 className="ssc__hero-title">
                Shape the next Swiss startup success story
              </h1>
              <p className="ssc__hero-lede">
                Discover paid internships, part-time roles, and graduate opportunities with
                founders who want you in the room from day one.
              </p>

              <div className="ssc__audience">
                <button
                  type="button"
                  className={userType === 'student' ? 'is-active' : ''}
                  onClick={() => setUserType('student')}
                >
                  I’m a student
                </button>
                <button
                  type="button"
                  className={userType === 'startup' ? 'is-active' : ''}
                  onClick={() => setUserType('startup')}
                >
                  I’m a startup
                </button>
              </div>

              {feedback && (
                <div className={`ssc__feedback ${feedback.type === 'success' ? 'is-success' : ''}`}>
                  {feedback.message}
                </div>
              )}

              {renderSearchForm({ targetTab: 'jobs' })}

              <div className="ssc__stats">
                {stats.map((stat) => (
                  <article key={stat.id} className="ssc__stat-card">
                    <span className="ssc__stat-value">{stat.value}</span>
                    <span className="ssc__stat-label">{stat.label}</span>
                    <p>{stat.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'general' || activeTab === 'jobs') && (
          <section className="ssc__filters">
            <div className="ssc__max">
              <div className="ssc__filters-header">
                <div>
                  <h2>Tailor your results</h2>
                  <p>Pick a combination of location, role type, and focus areas.</p>
                </div>
                {selectedFilters.length > 0 && (
                  <button type="button" className="ssc__clear-filters" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
              <div className="ssc__filters-grid">
                {Object.entries(groupedFilters).map(([category, filters]) => (
                  <div key={category} className="ssc__filter-group">
                    <span className="ssc__filter-label">{category}</span>
                    <div className="ssc__filter-chips">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          className={`ssc__chip ${selectedFilters.includes(filter.id) ? 'is-selected' : ''}`}
                          onClick={() => toggleFilter(filter.id)}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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
                  <p>{activeTabDescription}</p>
                </div>
                <span className="ssc__pill">{filteredJobs.length} roles</span>
              </div>

              {activeTab === 'jobs' && renderSearchForm({ variant: 'inline' })}

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="flex space-x-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                renderJobCards(filteredJobs)
              ) : (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>No matches yet</h3>
                  <p>Try removing a filter or exploring roles in another Swiss city.</p>
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
                  <p>{activeTabDescription}</p>
                </div>
              </div>

              {renderSearchForm({
                variant: 'inline',
                placeholder: 'Search startups, industries, or locations',
              })}

              {filteredCompanies.length > 0 ? (
                <div className="ssc__company-grid">
                  {filteredCompanies.map((company) => (
                    <article key={company.id} className="ssc__company-card">
                      <div className="ssc__company-logo">
                        <Building2 size={20} />
                      </div>
                      <div className="ssc__company-content">
                        <h3 className="ssc__company-name">{company.name}</h3>
                        <p className="ssc__company-tagline">{company.tagline}</p>
                        <div className="ssc__company-meta">
                          <span>{company.location}</span>
                          <span>{company.industry}</span>
                          <span>{company.team}</span>
                        </div>
                        <div className="ssc__company-stats">
                          <span>{company.hires}</span>
                          <span>{company.culture}</span>
                        </div>
                        <a className="ssc__outline-btn" href={company.website} target="_blank" rel="noreferrer">
                          Visit website
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ssc__empty-state">
                  <Building2 size={40} />
                  <h3>No startups found</h3>
                  <p>Try adjusting your search or clear the filters.</p>
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
                  <p>{activeTabDescription}</p>
                </div>
                <span className="ssc__pill">{savedJobList.length} saved</span>
              </div>

              {savedJobList.length > 0 ? (
                renderJobCards(savedJobList)
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
                  <p>Three steps to land a role with a Swiss startup that shares your ambition.</p>
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
                        {resource.action === 'external' && resource.href ? (
                          <a href={resource.href} target="_blank" rel="noreferrer">
                            Visit official site
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="ssc__link-button"
                            onClick={() => resource.modalId && setResourceModal(resource.modalId)}
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
                  <p>
                    Join a curated community of founders, operators, and students building across
                    Switzerland.
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
                    Create profile
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    className="ssc__ghost-btn"
                    onClick={() => setActiveTab('companies')}
                  >
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
              <p>Source: Swissuniversities internship barometer 2024 and public salary postings (Q1 2025).</p>
            </header>
            <div className="ssc__modal-body">
              <div className="ssc__table-wrapper">
                <table className="ssc__table">
                  <thead>
                    <tr>
                      <th>Canton</th>
                      <th>Median monthly stipend</th>
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
                Figures represent the midpoint of paid internships of 3–12 months for students in business, engineering,
                and design programmes. Packages may include public transport passes, meal stipends, or housing assistance.
                Always confirm the current offer with the host company.
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
              <p>Start with one of these high-feedback layouts, then tailor it to highlight your impact.</p>
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
                Pro tip: export as PDF with a filename like <code>firstname-lastname-cv.pdf</code> and keep a second
                version in English plus the local language of the canton you target.
              </p>
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
              <p>{selectedJob.company}</p>
              <div className="ssc__modal-meta">
                <span>
                  <MapPin size={16} />
                  {selectedJob.location}
                </span>
                <span>
                  <Clock size={16} />
                  {selectedJob.type}
                </span>
                <span>
                  <Users size={16} />
                  {selectedJob.applicants} applicants
                </span>
              </div>
            </header>
            <div className="ssc__modal-body">
              <p>{selectedJob.description}</p>

              <div className="ssc__modal-section">
                <h3>Requirements</h3>
                <ul className="ssc__modal-list">
                  {selectedJob.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="ssc__modal-section">
                <h3>Benefits</h3>
                <ul className="ssc__modal-list">
                  {selectedJob.benefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ssc__modal-actions">
              <button type="button" className="ssc__ghost-btn" onClick={() => handleToggleSave(selectedJob.id)}>
                {savedJobs.includes(selectedJob.id) ? 'Saved' : 'Save for later'}
              </button>
              <button type="button" className="ssc__primary-btn" onClick={() => handleApply(selectedJob)}>
                Apply now
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--auth">
            <button type="button" className="ssc__modal-close" onClick={closeAuthModal}>
              <X size={18} />
            </button>
            <h2>{isRegistering ? 'Create your profile' : 'Welcome back'}</h2>
            <p>
              {isRegistering
                ? 'Tell us a little about yourself so we can surface the right matches.'
                : 'Sign in with a demo account or your new profile details.'}
            </p>

            {authError && <div className="ssc__alert">{authError}</div>}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="ssc__form">
              {isRegistering && (
                <div className="ssc__form-grid">
                  <label className="ssc__field">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                      required
                    />
                  </label>
                  <label className="ssc__field">
                    <span>I am a</span>
                    <select
                      value={registerForm.type}
                      onChange={(event) => setRegisterForm({ ...registerForm, type: event.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="startup">Startup</option>
                    </select>
                  </label>
                </div>
              )}

              <label className="ssc__field">
                <span>Email</span>
                <input
                  type="email"
                  value={isRegistering ? registerForm.email : loginForm.email}
                  onChange={(event) =>
                    isRegistering
                      ? setRegisterForm({ ...registerForm, email: event.target.value })
                      : setLoginForm({ ...loginForm, email: event.target.value })
                  }
                  required
                />
              </label>

              <label className="ssc__field">
                <span>Password</span>
                <input
                  type="password"
                  value={isRegistering ? registerForm.password : loginForm.password}
                  onChange={(event) =>
                    isRegistering
                      ? setRegisterForm({ ...registerForm, password: event.target.value })
                      : setLoginForm({ ...loginForm, password: event.target.value })
                  }
                  required
                />
              </label>

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
                }}
              >
                {isRegistering ? 'Sign in instead' : 'Create a profile'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SwissStartupConnect;
