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
    id: 'autonomous-routing',
    icon: Compass,
    title: 'Autonomous Routing',
    description: 'Neural pathfinding eliminates congestion by directing every trailer with millisecond precision.',
    accent: 'cobalt',
  },
  {
    id: 'predictive-orchestration',
    icon: Radar,
    title: 'Predictive Orchestration',
    description: 'Edge analytics predict choke points and balance crews before friction appears.',
    accent: 'magenta',
  },
  {
    id: 'adaptive-safety',
    icon: ShieldHalf,
    title: 'Adaptive Safety Mesh',
    description: 'Real-time compliance and failsafe protocols wrap each move in responsive protection.',
    accent: 'cyan',
  },
];

const industriesServed = [
  'Aerospace',
  'E-commerce',
  'Automotive',
  'Pharma',
  'Energy',
  'Retail',
  'Manufacturing',
  'Food Logistics',
];

const featureMoments = [
  {
    id: 'perception',
    title: 'Perception Grid',
    copy: 'Sensor fusion stitches an uninterrupted awareness grid across every gate and dock.',
  },
  {
    id: 'orchestration',
    title: 'Orchestration Engine',
    copy: 'AI agents negotiate dwell time, carrier priority, and live SLAs for fluid yard throughput.',
  },
  {
    id: 'integration',
    title: 'Integration Fabric',
    copy: 'APIs harmonize TMS, WMS, and fleet telemetry so decisions propagate instantly.',
  },
  {
    id: 'telemetry',
    title: 'Telemetry Memory',
    copy: 'Historic patterns replay in high fidelity to forecast delays before they surface.',
  },
];

const benefits = [
  {
    id: 'benefit-01',
    label: 'Benefit 01',
    headline: '60% faster gate turns',
    copy: 'Model-driven appointment windows slash idle time and keep inbound velocity compounding.',
  },
  {
    id: 'benefit-02',
    label: 'Benefit 02',
    headline: 'Unified control plane',
    copy: 'Command every yard in one pane with synchronized automations and human overrides.',
  },
  {
    id: 'benefit-03',
    label: 'Benefit 03',
    headline: 'Proven partner ecosystem',
    copy: 'Allied integrators and carriers rely on the platform to keep critical inventory moving.',
  },
];

const updates = [
  {
    id: 'update-01',
    date: 'Oct 02, 2024',
    title: 'Yard OS 4.0 expands multi-site cognition',
    excerpt: 'New adaptive site clusters let operators choreograph seasonal surges with one directive.',
  },
  {
    id: 'update-02',
    date: 'Sep 12, 2024',
    title: 'Terminal alliance announces transatlantic pilot',
    excerpt: 'European ports join the network to synchronize container staging with inland depots.',
  },
];

const credibilityBands = [
  {
    id: 'built-by',
    title: 'Built by the Industry',
    partners: ['Vector Logistics', 'RailSync Labs', 'Helix Freight', 'Northpoint Data'],
  },
  {
    id: 'trusted-by',
    title: 'Trusted by Operators',
    partners: ['Orion Warehousing', 'PrimeFleet', 'Everway', 'Continuum Freight'],
  },
];

const nodeCoordinates = [
  { x: 18, y: 42 },
  { x: 32, y: 28 },
  { x: 46, y: 36 },
  { x: 58, y: 24 },
  { x: 71, y: 42 },
  { x: 82, y: 30 },
  { x: 66, y: 56 },
  { x: 44, y: 64 },
  { x: 28, y: 60 },
];

const TerminalExperience = ({ translate = (key, fallback) => fallback }) => {
  const canvasRef = useRef(null);
  const sequenceRef = useRef(null);
  const featureRefs = useRef([]);
  const benefitsRef = useRef([]);
  const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [headlineProgress, setHeadlineProgress] = useState(0);
  const [activeFeature, setActiveFeature] = useState(featureMoments[0].id);
  const [visibleBenefit, setVisibleBenefit] = useState(benefits[0].id);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const heroBadge = translate('terminal.hero.badge', 'PROGRESS IS AN ENDLESS TERMINAL');
  const heroHeadline = translate(
    'terminal.hero.headline',
    'We have reinvented the future of logistics through the yard'
  );
  const heroTagline = translate('terminal.hero.tagline', 'Moving the world by making goods flow.');
  const heroScrollPrompt = translate('terminal.hero.scrollPrompt', 'SCROLL TO EXPLORE');
  const heroCtaLabel = translate('terminal.hero.cta', 'GO');

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
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `rgba(${Math.floor(120 + progress * 100)}, ${50 + progress * 80}, 255, 0.8)`);
      gradient.addColorStop(1, `rgba(20, 20, 20, 0.9)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const layers = 6;
      for (let i = 0; i < layers; i += 1) {
        const intensity = progress * (i + 1) * 0.15;
        context.beginPath();
        context.strokeStyle = `rgba(${80 + i * 20}, ${40 + i * 10}, ${120 + i * 15}, ${0.15 + intensity})`;
        context.lineWidth = 12 - i * 1.5;
        const offset = (progress * 120 + i * 25) % canvas.width;
        context.moveTo(-100 + offset, 80 + i * 40);
        context.bezierCurveTo(
          canvas.width * 0.25 + offset,
          20 + i * 50,
          canvas.width * 0.65 - offset,
          140 + i * 25,
          canvas.width + offset,
          80 + i * 35
        );
        context.stroke();
      }

      const nodes = 8;
      for (let i = 0; i < nodes; i += 1) {
        const angle = (progress * Math.PI * 2 + (i * Math.PI) / nodes) % (Math.PI * 2);
        const x = canvas.width * (0.1 + 0.8 * (i / nodes));
        const y = canvas.height * (0.4 + 0.2 * Math.sin(angle));
        const radius = 10 + Math.sin(angle * 2) * 4;
        const alpha = 0.4 + 0.4 * Math.sin(angle + progress * 4);
        context.beginPath();
        context.fillStyle = `rgba(110, 220, 255, ${alpha})`;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
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
  }, []);

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

  return (
    <div className="terminal-experience">
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
          <button type="button" className="terminal-hero__cta">
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
          <span>Scroll-synced industrial narrative</span>
        </div>
      </section>

      <section className="terminal-technology">
        <header className="terminal-section-header">
          <h2>Technology Highlights</h2>
          <p>Engineered panels reveal the systems that make the yard adaptive.</p>
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
            Imagine the yard as an intelligent bridge seamlessly connecting highway to warehouse
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
            TO RE-IMAGINE EVERY YARD AS A CYBER-INDUSTRIAL TERMINAL WHERE DATA, MACHINES, AND OPERATORS MOVE AS ONE.
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
        <div className="terminal-yard-os__panel">
          <h2 aria-live="polite">
            {Array.from('Yard Operating System').map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ transitionDelay: `${index * 40}ms` }}>
                {letter}
              </span>
            ))}
          </h2>
          <p>
            A persistent intelligence that anchors site automation and releases when the journey advances.
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
          <h2>Global Presence</h2>
          <p>Worldwide signals pulse across critical logistics nodes.</p>
        </header>
        <div className="terminal-map__wrapper">
          <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(0, 255, 255, 0.45)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </radialGradient>
            </defs>
            <rect width="100" height="50" fill="#1a1a1a" />
            <path
              d="M6,32 C14,20 26,16 38,18 C46,24 58,22 64,18 C70,12 82,12 92,24 C90,30 84,36 74,38 C66,44 52,46 38,44 C28,42 14,40 6,32"
              fill="#2c2c2c"
              stroke="#3a3a3a"
              strokeWidth="0.6"
            />
            {nodeCoordinates.map(({ x, y }, index) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r={1.6} fill="url(#mapGlow)" />
                <circle cx={x} cy={y} r={0.5} fill="#7efaff">
                  <animate
                    attributeName="r"
                    values="0.5;1.2;0.5"
                    dur="2.6s"
                    begin={`${index * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
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
          <h2>Terminal Updates</h2>
          <p>Latest signals from the command center.</p>
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
          <p>Trace the choreography from arrival to departure with guided intelligence.</p>
        </header>
        <button type="button" className="terminal-finale__cta">
          TAKE A CLOSER LOOK
        </button>
      </section>

      <footer className="terminal-footer">
        <div className="terminal-footer__inner">
          <div className="terminal-footer__brand">Terminal Intelligence</div>
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
          <p>© {new Date().getFullYear()} Terminal Intelligence. All rights reserved.</p>
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
