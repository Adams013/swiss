import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Briefcase,
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
    id: 'mock-3',
    title: 'Machine Learning Intern',
    company_name: 'Cognivia Labs',
    location: 'Lausanne, Switzerland (Hybrid)',
    employment_type: 'Internship',
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
    culture: 'Product-driven, hybrid-first, carbon neutral operations.',
    website: 'https://techflow.example',
    verification_status: 'verified',
  },
  {
    id: 'mock-company-2',
    name: 'Alpine Health',
    tagline: 'Digital care pathways for clinics & telehealth',
    location: 'Geneva',
    industry: 'Healthtech',
    team: '32 people',
    culture: 'Human-centred, clinically informed, data trusted.',
    website: 'https://alpinehealth.example',
    verification_status: 'pending',
  },
  {
    id: 'mock-company-3',
    name: 'Cognivia Labs',
    tagline: 'ML tooling for scientific breakthroughs',
    location: 'Lausanne',
    industry: 'Deep Tech',
    team: '48 people',
    culture: 'Research-rooted, humble experts, fast experimentation.',
    website: 'https://cognivia.example',
    verification_status: 'verified',
  },
];

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

const quickFilters = [
  { id: 'loc-zurich', label: 'Zurich', category: 'Location', test: (job) => job.location?.toLowerCase().includes('zurich') },
  { id: 'loc-geneva', label: 'Geneva', category: 'Location', test: (job) => job.location?.toLowerCase().includes('geneva') },
  { id: 'loc-remote', label: 'Remote friendly', category: 'Location', test: (job) => job.location?.toLowerCase().includes('remote') },
  { id: 'type-full', label: 'Full-time', category: 'Role type', test: (job) => job.employment_type === 'Full-time' },
  { id: 'type-intern', label: 'Internship', category: 'Role type', test: (job) => job.employment_type === 'Internship' },
  { id: 'focus-engineering', label: 'Engineering', category: 'Focus', test: (job) => job.tags?.some((tag) => ['react', 'ai/ml', 'python', 'backend'].includes(tag.toLowerCase())) },
  { id: 'focus-product', label: 'Product', category: 'Focus', test: (job) => job.tags?.some((tag) => ['product', 'ux', 'research'].includes(tag.toLowerCase())) },
  { id: 'focus-growth', label: 'Growth', category: 'Focus', test: (job) => job.tags?.some((tag) => ['growth', 'marketing'].includes(tag.toLowerCase())) },
  { id: 'focus-climate', label: 'Climate', category: 'Focus', test: (job) => job.stage?.toLowerCase().includes('climate') || job.tags?.some((tag) => tag.toLowerCase().includes('climate')) },
];

const filterPredicates = quickFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.test;
  return acc;
}, {});

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

const acknowledgeMessage = 'By applying you agree that the startup will see your profile information, uploaded CV, and profile photo.';

const SwissStartupConnect = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);

  const [jobs, setJobs] = useState(mockJobs);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [companies, setCompanies] = useState(mockCompanies);
  const [companiesLoading, setCompaniesLoading] = useState(false);

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
  const [motivationalLetter, setMotivationalLetter] = useState('');
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

  const clearFeedback = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(clearFeedback, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, clearFeedback]);

  useEffect(() => {
    const initialiseSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setUserType(mapped?.type ?? 'student');
      setEmailVerified(!!session?.user?.email_confirmed_at);
      setAuthLoading(false);
    };

    initialiseSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setUserType(mapped?.type ?? 'student');
      setEmailVerified(!!session?.user?.email_confirmed_at);
    });

    return () => subscription.unsubscribe();
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
        const { data, error } = await supabase
          .from('jobs')
          .select('id,title,company_name,location,employment_type,salary,equity,description,requirements,benefits,posted,applicants,tags,stage,motivational_letter_required,created_at');

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
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('id,name,tagline,location,industry,team,culture,website,verification_status');

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
              team: company.team,
              culture: company.culture,
              website: company.website,
              verification_status: company.verification_status || 'unverified',
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
    setActiveTab('jobs');
    setSelectedFilters((prev) => (prev.includes(filterId) ? prev : [...prev, filterId]));
  };

  const removeFilter = (filterId) => {
    setSelectedFilters((prev) => prev.filter((item) => item !== filterId));
  };

  const clearFilters = () => setSelectedFilters([]);

  const toggleSavedJob = (jobId) => {
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

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
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

      return matchesSearch && matchesFilters;
    });
  }, [jobs, searchTerm, selectedFilters]);

  const savedJobList = useMemo(() => jobs.filter((job) => savedJobs.includes(job.id)), [jobs, savedJobs]);

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
    setMotivationalLetter('');
    setApplicationError('');
    const hasProfileCv = !!profileForm.cv_url;
    setUseExistingCv(hasProfileCv);
    setApplicationCvUrl('');
    setApplicationCvName('');
  };

  const closeApplicationModal = () => {
    setApplicationModal(null);
    setMotivationalLetter('');
    setApplicationError('');
    setUseExistingCv(!!profileForm.cv_url);
    setApplicationCvUrl('');
    setApplicationCvName('');
  };

  const uploadFile = useCallback(
    async (bucket, file) => {
      if (!file) return null;
      const extension = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
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
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        setProfile(data);
        setFeedback({ type: 'success', message: 'Profile updated.' });
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
        setFeedback({
          type: 'success',
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
      setProfileForm((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      setFeedback({ type: 'error', message: `Avatar upload failed: ${error.message}` });
    }
  };

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('cvs', file);
      setProfileForm((prev) => ({ ...prev, cv_url: publicUrl }));
    } catch (error) {
      setFeedback({ type: 'error', message: `CV upload failed: ${error.message}` });
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('logos', file);
      setStartupForm((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (error) {
      setFeedback({ type: 'error', message: `Logo upload failed: ${error.message}` });
    }
  };

  const handleApplicationCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile('cvs', file);
      setApplicationCvUrl(publicUrl);
      setApplicationCvName(file.name);
      setUseExistingCv(false);
    } catch (error) {
      setApplicationError(`CV upload failed: ${error.message}`);
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
        setUserType(mapped.type);
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
        const mapped = mapSupabaseUser(data.user);
        setUser(mapped);
        setUserType(mapped.type);
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
    setUserType('student');
    setFeedback({ type: 'info', message: 'Signed out. Your saved roles stay here for you.' });
  };

  const submitApplication = async () => {
    if (!applicationModal || !user) return;
    if (!acknowledgeShare) {
      setApplicationError('Please acknowledge that your profile will be shared.');
      return;
    }
    if (applicationModal.motivational_letter_required && !motivationalLetter.trim()) {
      setApplicationError('A motivational letter is required for this role.');
      return;
    }

    setApplicationSaving(true);
    setApplicationError('');

    try {
      const selectedCvUrl = useExistingCv ? profileForm.cv_url : applicationCvUrl;

      if (!selectedCvUrl) {
        setApplicationError('Upload your CV or select the one saved in your profile before applying.');
        setApplicationSaving(false);
        return;
      }

      const payload = {
        job_id: applicationModal.id,
        profile_id: profile?.id,
        motivational_letter: motivationalLetter.trim(),
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

  const groupedFilters = useMemo(() => {
    return quickFilters.reduce((acc, filter) => {
      if (!acc[filter.category]) acc[filter.category] = [];
      acc[filter.category].push(filter);
      return acc;
    }, {});
  }, []);

  const closeResourceModal = () => setResourceModal(null);
  const closeReviewsModal = () => setReviewsModal(null);

  const loadingSpinner = jobsLoading || companiesLoading || authLoading;

  const navTabs = useMemo(() => {
    const baseTabs = ['general', 'jobs', 'companies'];
    if (user?.type === 'startup') {
      baseTabs.push('applications');
    }
    baseTabs.push('saved');
    return baseTabs;
  }, [user?.type]);

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
            {navTabs.map((tab) => {
              const labels = {
                general: 'General',
                jobs: 'Opportunities',
                companies: 'Startups',
                applications: 'Applicants',
                saved: `Saved (${savedJobs.length})`,
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
                <div className="ssc__avatar-small">{user.name.charAt(0)}</div>
                <div className="ssc__user-meta">
                  <span className="ssc__user-name">{user.name}</span>
                  <span className="ssc__user-role">{user.type}</span>
                </div>
                <button
                  type="button"
                  className="ssc__signout"
                  onClick={() => setProfileModalOpen(true)}
                >
                  Profile
                </button>
                {user.type === 'startup' && (
                  <button
                    type="button"
                    className="ssc__signout"
                    onClick={() => setStartupModalOpen(true)}
                  >
                    Startup
                  </button>
                )}
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
                          onClick={() => addFilter(filter.id)}
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
                  <p>
                    Curated roles from Swiss startups that welcome student talent and emerging
                    professionals.
                  </p>
                </div>
                <span className="ssc__pill">{filteredJobs.length} roles</span>
              </div>

              {jobsLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="ssc__grid">
                  {filteredJobs.map((job) => {
                    const isSaved = savedJobs.includes(job.id);
                    const hasApplied = appliedJobs.includes(job.id);
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
                            {job.employment_type} • {job.posted}
                          </span>
                          <span>
                            <Users size={16} />
                            {job.applicants} applicants
                          </span>
                        </div>

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
                            <small>+ {job.equity} equity</small>
                          </div>
                          <div className="ssc__job-actions">
                            <button type="button" className="ssc__ghost-btn" onClick={() => setSelectedJob(job)}>
                              View role
                            </button>
                            <button
                              type="button"
                              className={`ssc__primary-btn ${hasApplied ? 'is-disabled' : ''}`}
                              onClick={() => openApplyModal(job)}
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
              ) : (
                <div className="ssc__empty-state">
                  <BookmarkPlus size={40} />
                  <h3>No matches yet</h3>
                  <p>Try removing a filter or exploring another Swiss canton.</p>
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
              </div>

              {companiesLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="ssc__job-skeleton" />
                  ))}
                </div>
              ) : (
                <div className="ssc__company-grid">
                  {companies.map((company) => (
                    <article key={company.id} className="ssc__company-card">
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
                          <span>{company.location}</span>
                          <span>{company.industry}</span>
                          <span>{company.team}</span>
                        </div>
                        <p className="ssc__company-stats">{company.culture}</p>
                        <div className="ssc__company-actions">
                          <a className="ssc__outline-btn" href={company.website} target="_blank" rel="noreferrer">
                            Visit website
                          </a>
                          <button
                            type="button"
                            className="ssc__ghost-btn"
                            onClick={() => openReviewsModal(company)}
                          >
                            Reviews
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
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
                            <p>{application.motivational_letter}</p>
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

              {savedJobList.length > 0 ? (
                <div className="ssc__grid">
                  {savedJobList.map((job) => (
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
                            className="ssc__primary-btn"
                            onClick={() => openApplyModal(job)}
                          >
                            Apply now
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
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
                  {selectedJob.employment_type} • {selectedJob.posted}
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
              <button type="button" className="ssc__primary-btn" onClick={() => openApplyModal(selectedJob)}>
                Apply now
              </button>
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
                        <a href={profileForm.cv_url} target="_blank" rel="noreferrer">
                          View profile CV
                        </a>
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
                        <input type="file" accept="application/pdf" onChange={handleApplicationCvUpload} />
                        {applicationCvName && <small>{applicationCvName}</small>}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <label className="ssc__field">
                <span>
                  Motivational letter {applicationModal.motivational_letter_required ? '(required)' : '(optional)'}
                </span>
                <textarea
                  rows={5}
                  value={motivationalLetter}
                  onChange={(event) => setMotivationalLetter(event.target.value)}
                  placeholder={
                    applicationModal.motivational_letter_required
                      ? 'Explain why you are excited about this startup and role...'
                      : 'Add extra context (optional) if you want to stand out...'
                  }
                />
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

                <label className="ssc__field">
                  <span>Upload profile photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  {profileForm.avatar_url && (
                    <img className="ssc__avatar-preview" src={profileForm.avatar_url} alt="Profile avatar" />
                  )}
                </label>

                <label className="ssc__field">
                  <span>Upload CV (PDF)</span>
                  <input type="file" accept="application/pdf" onChange={handleCvUpload} />
                  {profileForm.cv_url && (
                    <a href={profileForm.cv_url} target="_blank" rel="noreferrer">
                      View current CV
                    </a>
                  )}
                </label>
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

      {showLoginModal && (
        <div className="ssc__modal-backdrop" role="dialog" aria-modal="true">
          <div className="ssc__modal ssc__modal--auth">
            <button type="button" className="ssc__modal-close" onClick={() => setShowLoginModal(false)}>
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
                <input
                  type="password"
                  value={isRegistering ? registerForm.password : loginForm.password}
                  onChange={(event) =>
                    isRegistering
                      ? setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                      : setLoginForm((prev) => ({ ...prev, password: event.target.value }))
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

      {loadingSpinner && <div className="ssc__loading" aria-hidden="true" />}
    </div>
  );
};

export default SwissStartupConnect;
