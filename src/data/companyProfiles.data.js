export const companyProfiles = [
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
    jobCount: 3,
    translations: {
      fr: {
        tagline: 'Intelligence de liquidité pour les PME suisses',
        industry: 'Fintech',
        team: '65 personnes',
        fundraising: 'CHF 28M levés',
        culture: 'Axé produit, hybride par défaut, opérations neutres en carbone.',
      },
      de: {
        tagline: 'Liquiditätsintelligenz für Schweizer KMU',
        industry: 'Fintech',
        team: '65 Personen',
        fundraising: 'CHF 28 Mio. aufgenommen',
        culture: 'Produktgetrieben, hybrid-first, CO₂-neutrale Abläufe.',
      },
    },
    profile: {
      hero: {
        imageUrl:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
        headline: 'Empowering CFOs with predictive treasury automation',
        subheadline: 'Building the neural network for SME liquidity planning across Europe.',
      },
      about:
        'TechFlow builds real-time liquidity intelligence for Swiss SMEs. Our predictive treasury tools integrate with over 45 ERP and banking platforms to generate forward-looking cash scenarios and automate FX hedging.',
      metrics: [
        { label: 'Founded', value: '2019' },
        { label: 'Headcount', value: '65 (Zurich & Zug)' },
        { label: 'Total funding', value: 'CHF 28M' },
        { label: 'Customers', value: '220 active SMEs' },
      ],
      openRoles: [
        {
          id: 'techflow-role-1',
          title: 'Senior Machine Learning Engineer',
          location: 'Zurich · Hybrid',
          type: 'Full-time',
          description:
            'Own our credit risk models, partnering with product squads to ship predictive liquidity insights across our CFO dashboard.',
          applyUrl: '#jobs',
        },
        {
          id: 'techflow-role-2',
          title: 'Lead Product Designer',
          location: 'Zurich · Hybrid',
          type: 'Full-time',
          description:
            'Craft the next generation of TreasuryOS, leading discovery with CFO councils and translating insights into elegant user journeys.',
          applyUrl: '#jobs',
        },
        {
          id: 'techflow-role-3',
          title: 'Growth Marketing Manager DACH',
          location: 'Zurich · Remote friendly',
          type: 'Full-time',
          description:
            'Design multi-channel acquisition programs, orchestrating webinars, CFO roundtables, and localized content for the DACH region.',
          applyUrl: '#jobs',
        },
      ],
      team: [
        {
          name: 'Lara Meier',
          title: 'Co-founder & CEO',
          bio: 'Former UBS treasury lead bringing a decade of structured finance expertise to SME automation.',
          avatar: 'https://i.pravatar.cc/160?img=47',
        },
        {
          name: 'Jonas Keller',
          title: 'CTO',
          bio: 'Previously built predictive underwriting systems at Avaloq and drives our ML platform architecture.',
          avatar: 'https://i.pravatar.cc/160?img=12',
        },
        {
          name: 'Mira Fankhauser',
          title: 'VP Customer Strategy',
          bio: 'Ex-McKinsey engagement manager specializing in CFO transformations for industrial clients.',
          avatar: 'https://i.pravatar.cc/160?img=28',
        },
      ],
      updates: [
        {
          id: 'techflow-update-1',
          date: '2024-08-21',
          title: 'Series B led by Helvetia Ventures',
          summary:
            'Closed a CHF 20M round to scale predictive liquidity modules and expand into Austria and Southern Germany.',
        },
        {
          id: 'techflow-update-2',
          date: '2024-06-04',
          title: 'Launch of TreasuryOS Automations',
          summary:
            'Released 12 new automation recipes that help CFOs orchestrate payments, FX hedges, and scenario planning.',
        },
      ],
    },
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
    jobCount: 2,
    translations: {
      fr: {
        tagline: 'Parcours de soins numériques pour cliniques et télésanté',
        industry: 'Healthtech',
        team: '32 personnes',
        fundraising: 'CHF 12M levés',
        culture: 'Humain, informé par la clinique, confiance dans les données.',
      },
      de: {
        tagline: 'Digitale Versorgungspfade für Kliniken und Telemedizin',
        industry: 'Healthtech',
        team: '32 Personen',
        fundraising: 'CHF 12 Mio. aufgenommen',
        culture: 'Menschenzentriert, klinisch fundiert, datenbasiertes Vertrauen.',
      },
    },
    profile: {
      hero: {
        imageUrl:
          'https://images.unsplash.com/photo-1580281657521-4e438ca2f65b?auto=format&fit=crop&w=1600&q=80',
        headline: 'Clinician-led pathways for hybrid hospitals',
        subheadline:
          'Designing data-informed patient journeys that bridge in-person and telehealth experiences for chronic care.',
      },
      about:
        'Alpine Health empowers Swiss clinics with digital care pathways that combine telehealth triage, remote monitoring, and clinician dashboards. We focus on chronic care programs in cardiology and oncology.',
      metrics: [
        { label: 'Founded', value: '2020' },
        { label: 'Clinical partners', value: '18 hospitals' },
        { label: 'Patients supported', value: '12k active' },
        { label: 'Care team', value: '32 specialists' },
      ],
      openRoles: [
        {
          id: 'alpine-role-1',
          title: 'Senior Clinical Product Manager',
          location: 'Geneva · Hybrid',
          type: 'Full-time',
          description:
            'Shape cardiology and oncology care pathways by collaborating with clinicians, patients, and our regulatory team.',
          applyUrl: '#jobs',
        },
        {
          id: 'alpine-role-2',
          title: 'Full-Stack Engineer (Patient Experience)',
          location: 'Geneva · Remote within CH',
          type: 'Full-time',
          description:
            'Build responsive patient applications and ensure seamless integration with EMR partners across Switzerland.',
          applyUrl: '#jobs',
        },
      ],
      team: [
        {
          name: 'Dr. Sophie Laurent',
          title: 'Co-founder & Chief Medical Officer',
          bio: 'Cardiologist with 12 years at HUG, leading evidence-based care design.',
          avatar: 'https://i.pravatar.cc/160?img=52',
        },
        {
          name: 'Marc Gauthier',
          title: 'CEO',
          bio: 'Previously scaled telehealth operations for Doctolib in Switzerland and France.',
          avatar: 'https://i.pravatar.cc/160?img=14',
        },
        {
          name: 'Nina Roth',
          title: 'Head of Regulatory Affairs',
          bio: 'Ensures MDR compliance and co-leads our quality management system.',
          avatar: 'https://i.pravatar.cc/160?img=31',
        },
      ],
      updates: [
        {
          id: 'alpine-update-1',
          date: '2024-07-30',
          title: 'Partnership with Hirslanden Group',
          summary:
            'Expanding our cardiac rehab pathway across five Hirslanden clinics with integrated remote monitoring.',
        },
        {
          id: 'alpine-update-2',
          date: '2024-05-16',
          title: 'ISO 13485 recertification achieved',
          summary:
            'Successfully completed our annual surveillance audit with zero non-conformities.',
        },
      ],
    },
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
    jobCount: 4,
    translations: {
      fr: {
        tagline: 'Outils ML pour des percées scientifiques',
        industry: 'Deep Tech',
        team: '48 personnes',
        fundraising: 'CHF 35M levés',
        culture: 'Ancrée dans la recherche, expert·e·s humbles, expérimentation rapide.',
      },
      de: {
        tagline: 'ML-Tools für wissenschaftliche Durchbrüche',
        industry: 'Deep Tech',
        team: '48 Personen',
        fundraising: 'CHF 35 Mio. aufgenommen',
        culture: 'Forschungsbasiert, bodenständige Expert:innen, schnelle Experimente.',
      },
    },
    profile: {
      hero: {
        imageUrl:
          'https://images.unsplash.com/photo-1526378722484-cc2c6d2493d6?auto=format&fit=crop&w=1600&q=80',
        headline: 'Accelerating lab discovery with explainable AI',
        subheadline: 'Combining wet-lab automation with ML copilots for life science teams.',
      },
      about:
        'Cognivia Labs builds ML tooling that augments lab scientists with hypothesis generation, experiment planning, and real-time analysis for bio and materials research.',
      metrics: [
        { label: 'Founded', value: '2018' },
        { label: 'Labs supported', value: '90 globally' },
        { label: 'Platform modules', value: '12 explainable AI copilots' },
        { label: 'Funding', value: 'CHF 35M (Series B)' },
      ],
      openRoles: [
        {
          id: 'cognivia-role-1',
          title: 'Staff Applied Scientist',
          location: 'Lausanne · Onsite',
          type: 'Full-time',
          description:
            'Lead research partnerships with pharma labs, delivering explainable modeling for complex experiment data.',
          applyUrl: '#jobs',
        },
        {
          id: 'cognivia-role-2',
          title: 'Platform Engineer (Automation)',
          location: 'Lausanne · Hybrid',
          type: 'Full-time',
          description:
            'Scale our robotics integration layer to support new assays and lab equipment vendors.',
          applyUrl: '#jobs',
        },
        {
          id: 'cognivia-role-3',
          title: 'Product Marketing Lead',
          location: 'Remote within Switzerland',
          type: 'Full-time',
          description:
            'Translate complex ML features into stories that resonate with research directors and innovation leads.',
          applyUrl: '#jobs',
        },
        {
          id: 'cognivia-role-4',
          title: 'Customer Success Scientist',
          location: 'Lausanne · Hybrid',
          type: 'Full-time',
          description:
            'Partner with lab teams to onboard our platform and ensure scientific impact through tailored playbooks.',
          applyUrl: '#jobs',
        },
      ],
      team: [
        {
          name: 'Anika Bieri',
          title: 'CEO',
          bio: 'Ex-EPFL researcher focused on explainable ML for materials science.',
          avatar: 'https://i.pravatar.cc/160?img=56',
        },
        {
          name: 'Felix Oberlin',
          title: 'Chief Scientist',
          bio: 'Former Novartis discovery lead driving lab partnerships and validation.',
          avatar: 'https://i.pravatar.cc/160?img=18',
        },
        {
          name: 'Priya Narayan',
          title: 'VP Engineering',
          bio: 'Built large-scale data platforms at DeepMind and now leads our automation stack.',
          avatar: 'https://i.pravatar.cc/160?img=36',
        },
      ],
      updates: [
        {
          id: 'cognivia-update-1',
          date: '2024-09-05',
          title: 'Launch of Reaction Copilot 3.0',
          summary:
            'New module offers explainability layers and integrates with Hamilton STAR robotics for automated workflows.',
        },
        {
          id: 'cognivia-update-2',
          date: '2024-07-11',
          title: 'Strategic partnership with Roche Innovation Labs',
          summary:
            'Three-year collaboration to accelerate early discovery programs with Cognivia copilots.',
        },
      ],
    },
  },
];
