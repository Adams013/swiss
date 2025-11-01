import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CircuitBoard,
  RadioTower,
  Radar,
  ShieldHalf,
  Compass,
} from 'lucide-react';
import './TerminalExperience.css';

const HERO_REVEAL_INTERVAL_MS = 12;

const technologyCards = [
  {
    id: 'talent-graph',
    icon: Compass,
    title: 'Curated Talent Graph',
    description: 'Swiss Startup Connect maps verified founders, teams, and talent for precise, values-led matches.',
    accent: 'cobalt',
  },
  {
    id: 'signal-intelligence',
    icon: Radar,
    title: 'Signal Intelligence',
    description: 'Live hiring signals surface the roles, skills, and salary ranges rising across Swiss innovation hubs.',
    accent: 'magenta',
  },
  {
    id: 'studio-briefings',
    icon: ShieldHalf,
    title: 'Founder Studio Briefings',
    description: 'Guided onboarding keeps candidates and startup teams aligned on expectations before the first call.',
    accent: 'cyan',
  },
];

const industriesServed = [
  'Climate Tech',
  'Fintech',
  'Healthtech',
  'Robotics',
  'Mobility',
  'Food Innovation',
  'AI & Data',
  'Cybersecurity',
];

const featureMoments = [
  {
    id: 'signal-intake',
    title: 'Signal Intake',
    copy: 'We gather venture, university, and community signals to understand who is hiring and what skills unlock offers.',
  },
  {
    id: 'match-studio',
    title: 'Match Studio',
    copy: 'Human curators and product intelligence pair talent with founders through transparent briefs and expectations.',
  },
  {
    id: 'launch-support',
    title: 'Launch Support',
    copy: 'Calendar tooling, interview prep, and compensation insights help candidates step into roles with confidence.',
  },
  {
    id: 'momentum-memory',
    title: 'Momentum Memory',
    copy: 'We learn from every placement to recommend next steps and surface alumni willing to mentor the next cohort.',
  },
];

const benefits = [
  {
    id: 'benefit-01',
    label: 'Benefit 01',
    headline: 'Faster hiring cycles',
    copy: 'Startups cut weeks from their process by meeting applicants who already understand founder pace.',
  },
  {
    id: 'benefit-02',
    label: 'Benefit 02',
    headline: 'One connected workspace',
    copy: 'Talent pipelines, saved roles, and feedback loops live in one interface for teams and candidates.',
  },
  {
    id: 'benefit-03',
    label: 'Benefit 03',
    headline: 'Community proof',
    copy: 'Universities, accelerators, and alumni validate every story so trust travels with every introduction.',
  },
];

const updates = [
  {
    id: 'update-01',
    date: 'Oct 02, 2024',
    title: 'Talent Graph adds campus cohorts',
    excerpt: 'ETH, EPFL, and HSG student groups now showcase live projects for founders scouting emerging skills.',
  },
  {
    id: 'update-02',
    date: 'Sep 12, 2024',
    title: 'Founder Studio debuts Swiss scaleup track',
    excerpt: 'Growth-stage teams unlock dedicated curators to co-design briefs for mission-critical hires.',
  },
];

const credibilityBands = [
  {
    id: 'built-by',
    title: 'Built with the Ecosystem',
    partners: ['ETH Entrepreneur Club', 'EPFL Innovation Park', 'Fongit', 'Swissnex'],
  },
  {
    id: 'trusted-by',
    title: 'Trusted by Operators',
    partners: ['Climeworks', 'Planted Foods', 'Wingtra', 'Beekeeper'],
  },
];

const swissCities = [
  { id: 'geneva', name: 'Geneva', x: 18, y: 46 },
  { id: 'lausanne', name: 'Lausanne', x: 26, y: 40 },
  { id: 'bern', name: 'Bern', x: 40, y: 34 },
  { id: 'basel', name: 'Basel', x: 38, y: 24 },
  { id: 'zurich', name: 'Zurich', x: 56, y: 28 },
  { id: 'lucerne', name: 'Lucerne', x: 48, y: 40 },
  { id: 'st-gallen', name: 'St. Gallen', x: 70, y: 26 },
  { id: 'chur', name: 'Chur', x: 64, y: 36 },
  { id: 'lugano', name: 'Lugano', x: 66, y: 54 },
];

const TerminalExperience = ({
  translate = (key, fallback) => fallback,
  onHeroCta,
  onFinalCta,
  isDarkMode = false,
}) => {
  const canvasRef = useRef(null);
  const sequenceRef = useRef(null);
  const featureRefs = useRef([]);
  const benefitsRef = useRef([]);
  const yardPanelRef = useRef(null);
  const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [headlineProgress, setHeadlineProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(featureMoments[0].id);
  const [visibleBenefit, setVisibleBenefit] = useState(benefits[0].id);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isYardPanelVisible, setIsYardPanelVisible] = useState(false);
  const heroBadge = translate('terminal.hero.badge', 'SWISS STARTUP CONNECT');
  const heroHeadline = translate(
    'terminal.hero.headline',
    'We have reinvented how Swiss startups and talent connect'
  );
  const heroTagline = translate('terminal.hero.tagline', 'Matching ambitious students with founders building what is next.');
  const heroScrollPrompt = translate('terminal.hero.scrollPrompt', 'SCROLL TO EXPLORE');
  const heroCtaLabel = translate('terminal.hero.cta', 'BROWSE ROLES');
  const yardOsLines = useMemo(() => ['Talent Operating', 'System'], []);

  useEffect(() => {
    const handle = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % industriesServed.length);
    }, 2400);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    setHeadlineProgress(0);
  }, [heroHeadline]);

  useEffect(() => {
    if (isTestEnvironment) {
      setHeadlineProgress(heroHeadline.length);
      return undefined;
    }

    if (headlineProgress >= heroHeadline.length) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setHeadlineProgress((prev) => Math.min(heroHeadline.length, prev + 1));
    }, HERO_REVEAL_INTERVAL_MS);
    return () => clearTimeout(timeout);
  }, [headlineProgress, heroHeadline, isTestEnvironment]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.CanvasRenderingContext2D === 'undefined') {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let context = null;
    try {
      context = canvas.getContext('2d');
    } catch (error) {
      context = null;
    }

    if (!context) {
      return undefined;
    }

    let animationFrame;

    const drawFrame = () => {
      if (!canvas) {
        return;
      }
      const rect = sequenceRef.current?.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      let progress = 0;
      if (rect) {
        const start = viewportHeight * 0.1;
        const end = viewportHeight * 0.9;
        const visible = Math.min(Math.max(end - rect.top, 0), end - start);
        progress = Math.min(Math.max((rect.height - rect.top - start) / (rect.height + viewportHeight), 0), 1);
        if (visible <= 0) {
          progress = 0;
        }
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      const backgroundTop = isDarkMode ? '#0b152c' : '#f2eee5';
      const backgroundBottom = isDarkMode ? '#132448' : '#e4d7c6';
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, backgroundTop);
      gradient.addColorStop(1, backgroundBottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const ridgeColors = isDarkMode
        ? ['rgba(215, 48, 42, 0.22)', 'rgba(108, 142, 181, 0.18)', 'rgba(255, 255, 255, 0.08)']
        : ['rgba(215, 48, 42, 0.22)', 'rgba(41, 82, 163, 0.18)', 'rgba(108, 142, 181, 0.16)'];

      ridgeColors.forEach((color, index) => {
        const baseY = canvas.height * (0.55 + index * 0.08);
        const amplitude = canvas.height * (0.08 + index * 0.02);
        const offset = progress * 120 + index * 60;
        context.beginPath();
        context.moveTo(-160, baseY + Math.sin(offset * 0.01) * amplitude);
        const ridgeSegments = 6;
        for (let segment = 0; segment <= ridgeSegments; segment += 1) {
          const t = segment / ridgeSegments;
          const x = canvas.width * t;
          const wave = Math.sin((t + progress) * Math.PI * (2 + index));
          const y = baseY + wave * amplitude * (0.6 - index * 0.1);
          context.lineTo(x, y);
        }
        context.lineTo(canvas.width + 40, canvas.height + 40);
        context.lineTo(-120, canvas.height + 40);
        context.closePath();
        context.fillStyle = color;
        context.fill();
      });

      const routeColor = isDarkMode ? 'rgba(215, 48, 42, 0.65)' : 'rgba(210, 50, 40, 0.55)';
      const accentColor = isDarkMode ? 'rgba(108, 142, 181, 0.45)' : 'rgba(41, 82, 163, 0.4)';
      const routes = 3;

      for (let i = 0; i < routes; i += 1) {
        context.beginPath();
        const phase = progress * (1.2 + i * 0.2);
        const startY = canvas.height * (0.28 + i * 0.12);
        const controlOffset = canvas.width * (0.25 + i * 0.06);
        context.moveTo(-120 + phase * 180, startY);
        context.bezierCurveTo(
          canvas.width * 0.25,
          startY - controlOffset * 0.12,
          canvas.width * 0.55,
          startY + controlOffset * 0.12,
          canvas.width + 120 - phase * 160,
          canvas.height * (0.42 + i * 0.08)
        );
        context.lineWidth = 3 - i * 0.4;
        context.strokeStyle = i === 0 ? routeColor : accentColor;
        context.globalAlpha = 0.65;
        context.stroke();
        context.globalAlpha = 1;

        const nodeCount = 6;
        for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
          const nodeProgress = (phase + nodeIndex / nodeCount + progress * 0.4) % 1;
          const x = canvas.width * nodeProgress;
          const y = startY + Math.sin(progress * Math.PI * 2 + nodeIndex) * (12 - i * 2) + i * 18;
          const radius = 4 + (1 - i * 0.2);
          context.beginPath();
          context.fillStyle = i === 0 ? routeColor : accentColor;
          context.globalAlpha = 0.6 + 0.3 * Math.sin(progress * 8 + nodeIndex);
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;
        }
      }

      animationFrame = requestAnimationFrame(drawFrame);
    };

    const handleResize = () => {
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    handleResize();
    drawFrame();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (isTestEnvironment) {
      setIsYardPanelVisible(true);
      return undefined;
    }

    if (typeof window === 'undefined') {
      return undefined;
    }

    const panel = yardPanelRef.current;
    if (!panel || typeof IntersectionObserver !== 'function') {
      setIsYardPanelVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsYardPanelVisible(true);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(panel);

    return () => observer.disconnect();
  }, [isTestEnvironment]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver !== 'function') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const { featureId } = entry.target.dataset;
            if (featureId) {
              setActiveFeature(featureId);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver !== 'function') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const { benefitId } = entry.target.dataset;
            if (benefitId) {
              setVisibleBenefit(benefitId);
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    benefitsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const displayedHeadline = useMemo(
    () => heroHeadline.slice(0, headlineProgress),
    [headlineProgress, heroHeadline]
  );

  const themeMode = isDarkMode ? 'dark' : 'light';

  const experienceClassName = useMemo(
    () => `terminal-experience ${isDarkMode ? 'terminal-experience--dark' : 'terminal-experience--light'}`,
    [isDarkMode]
  );

  return (
    <div className={experienceClassName} data-theme={themeMode}>
      <section className="terminal-hero">
        <video className="terminal-hero__video" autoPlay loop muted playsInline>
          <source src="https://cdn.coverr.co/videos/coverr-shimmering-oil-6498/1080p.mp4" type="video/mp4" />
        </video>
        <div className="terminal-hero__overlay" />
        <div className="terminal-hero__content">
          <p className="terminal-hero__badge">{heroBadge}</p>
          <h1 className="terminal-hero__headline" aria-live="polite">
            {displayedHeadline}
            <span className="terminal-hero__cursor" aria-hidden="true">
              {headlineProgress < heroHeadline.length ? '_' : ''}
            </span>
          </h1>
          {headlineProgress >= heroHeadline.length && (
            <p className="terminal-hero__tagline">{heroTagline}</p>
          )}
          <button
            type="button"
            className="terminal-hero__cta"
            onClick={() => {
              if (typeof onHeroCta === 'function') {
                onHeroCta();
              }
            }}
          >
            {heroCtaLabel}
          </button>
        </div>
        <div className="terminal-scroll-indicator" aria-hidden="true">
          <span>{heroScrollPrompt}</span>
        </div>
      </section>

      <section className="terminal-sequence" ref={sequenceRef}>
        <canvas ref={canvasRef} className="terminal-sequence__canvas" aria-hidden="true" />
        <div className="terminal-sequence__caption">
          <span>Scroll-synced Swiss startup journey</span>
        </div>
      </section>

      <section className="terminal-technology">
        <header className="terminal-section-header">
          <h2>Technology Highlights</h2>
          <p>Engineered panels reveal the systems that make Swiss Startup Connect feel personal at scale.</p>
        </header>
        <div className="terminal-technology__grid">
          {technologyCards.map(({ id, icon: Icon, title, description, accent }) => (
            <article key={id} className={`terminal-technology__card is-${accent}`}>
              <div className="terminal-technology__icon" aria-hidden="true">
                <Icon size={32} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="terminal-bridge">
        <div className="terminal-bridge__inner">
          <h2>
            Imagine the Swiss startup landscape as a bridge carrying talent from campus studios into venture floors
          </h2>
        </div>
      </section>

      <section className="terminal-industries">
        <div className="terminal-industries__badges">
          <header>
            <h3>Industries Served</h3>
          </header>
          <div className="terminal-industries__carousel" role="list">
            {industriesServed.map((industry, index) => {
              const offset = (index - carouselIndex + industriesServed.length) % industriesServed.length;
              const isActive = offset === 0;
              return (
                <span
                  key={industry}
                  className={`terminal-industries__badge ${isActive ? 'is-active' : ''}`}
                  role="listitem"
                  aria-hidden={!isActive}
                >
                  {industry}
                </span>
              );
            })}
          </div>
        </div>
        <div className="terminal-industries__mission">
          <h3>MISSION</h3>
          <p>
            TO CONNECT SWISS STUDENTS AND FOUNDERS THROUGH TRANSPARENT MATCHES THAT KEEP THE ECOSYSTEM BUILDING TOGETHER.
          </p>
        </div>
      </section>

      <section className="terminal-features">
        <aside className="terminal-features__rail">
          <div className="terminal-features__counter">
            {featureMoments.map((moment, index) => (
              <div
                key={moment.id}
                className={`terminal-features__tick ${activeFeature === moment.id ? 'is-active' : ''}`}
              >
                <span className="terminal-features__tick-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="terminal-features__tick-title">{moment.title}</span>
              </div>
            ))}
          </div>
        </aside>
        <div className="terminal-features__list">
          {featureMoments.map((moment, index) => (
            <article
              key={moment.id}
              className="terminal-features__item"
              data-feature-id={moment.id}
              ref={(element) => {
                featureRefs.current[index] = element;
              }}
            >
              <header>
                <span>{moment.title}</span>
              </header>
              <p>{moment.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="terminal-yard-os">
        <div
          className={`terminal-yard-os__panel ${isYardPanelVisible ? 'is-visible' : ''}`}
          ref={yardPanelRef}
        >
          <h2 aria-live="polite">
            {yardOsLines.map((word, wordIndex) => (
              <span
                key={word}
                className="terminal-yard-os__line"
                style={{ transitionDelay: `${wordIndex * 160}ms` }}
              >
                {word}
              </span>
            ))}
          </h2>
          <p>
            A persistent intelligence that keeps profiles, saved roles, and founder feedback in rhythm as you explore.
          </p>
        </div>
      </section>

      <section className="terminal-benefits">
        {benefits.map((benefit, index) => (
          <article
            key={benefit.id}
            className={`terminal-benefits__panel ${visibleBenefit === benefit.id ? 'is-active' : ''}`}
            data-benefit-id={benefit.id}
            ref={(element) => {
              benefitsRef.current[index] = element;
            }}
          >
            <span className="terminal-benefits__label">{benefit.label}</span>
            <h3>{benefit.headline}</h3>
            <p>{benefit.copy}</p>
          </article>
        ))}
      </section>

      <section className="terminal-map">
        <header className="terminal-section-header">
          <h2>National Presence</h2>
          <p>Swiss startup talent is active from Geneva to St. Gallen with coordinated hubs across the country.</p>
        </header>
        <div className="terminal-map__wrapper">
          <svg
            viewBox="0 0 100 64"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Swiss map with highlighted cities"
          >
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="var(--terminal-map-node)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--terminal-map-node)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100" height="64" fill="var(--terminal-map-surface)" />
            <path
              d="M8,34 C14,22 28,14 40,16 C48,20 58,16 66,20 C74,24 86,22 94,32 C90,40 82,46 70,50 C58,56 44,56 32,52 C24,48 14,44 8,34 Z"
              fill="var(--terminal-map-land)"
              stroke="var(--terminal-map-outline)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {swissCities.map(({ id, name, x, y }, index) => (
              <g key={id}>
                <circle cx={x} cy={y} r={2.8} fill="url(#mapGlow)" />
                <circle cx={x} cy={y} r={1.1} fill="var(--terminal-map-node)">
                  <animate
                    attributeName="r"
                    values="1.1;2;1.1"
                    dur="2.8s"
                    begin={`${index * 0.28}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <title>{name}</title>
              </g>
            ))}
          </svg>
        </div>
      </section>

      {credibilityBands.map((band) => (
        <section key={band.id} className="terminal-credibility">
          <header>
            <h3>{band.title}</h3>
          </header>
          <div className="terminal-credibility__grid">
            {band.partners.map((partner) => (
              <span key={partner} className="terminal-credibility__partner">
                {partner}
              </span>
            ))}
          </div>
        </section>
      ))}

      <section className="terminal-updates">
        <header className="terminal-section-header">
          <h2>Platform Updates</h2>
          <p>Fresh signals on how the community is evolving.</p>
        </header>
        <div className="terminal-updates__grid">
          {updates.map((update) => (
            <article key={update.id} className="terminal-updates__card">
              <time dateTime={update.date}>{update.date}</time>
              <h3>{update.title}</h3>
              <p>{update.excerpt}</p>
              <button type="button" className="terminal-updates__link" aria-label={`Read more about ${update.title}`}>
                <span>Read Update</span>
                <ArrowIcon />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="terminal-finale">
        <div className="terminal-finale__path" aria-hidden="true" />
        <header>
          <h2>How it Works</h2>
          <p>Trace how candidates move from discovery to offers with support at every moment.</p>
        </header>
        <button
          type="button"
          className="terminal-finale__cta"
          onClick={() => {
            if (typeof onFinalCta === 'function') {
              onFinalCta();
            }
          }}
        >
          TAKE A CLOSER LOOK
        </button>
      </section>

      <footer className="terminal-footer">
        <div className="terminal-footer__inner">
          <div className="terminal-footer__brand">Swiss Startup Connect</div>
          <div className="terminal-footer__links">
            <a href="#vision">Vision</a>
            <a href="#technology">Technology</a>
            <a href="#careers">Careers</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="terminal-footer__social">
            <a href="https://www.linkedin.com" aria-label="LinkedIn">
              <CircuitBoard size={18} />
            </a>
            <a href="https://www.twitter.com" aria-label="Twitter">
              <RadioTower size={18} />
            </a>
            <a href="https://www.youtube.com" aria-label="YouTube">
              <Activity size={18} />
            </a>
          </div>
          <p>© {new Date().getFullYear()} Swiss Startup Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const ArrowIcon = () => (
  <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="6" x2="24" y2="6" />
      <polyline points="19 1 25 6 19 11" />
    </g>
  </svg>
);

export default TerminalExperience;
