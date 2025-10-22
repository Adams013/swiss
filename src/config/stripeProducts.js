/**
 * Stripe Product Configuration
 * Product IDs and Payment Links from Stripe Dashboard
 */

export const STRIPE_PRODUCTS = {
  // Student Premium Subscription
  STUDENT_PREMIUM: {
    productId: 'prod_THY4PLgnJZU3eE',
    name: 'Student Premium Subscription',
    description: 'Premium features for students including profile analytics, enhanced visibility, and more',
  },
  
  // Startup/Employer Products
  ANALYTICS_DASHBOARD: {
    productId: 'prod_THY7szAmTkSWq3',
    name: 'Analytics Dashboard',
    description: 'See who is interested in your jobs, track views, shares, and clicks',
    price: 49.00,
    currency: 'CHF',
    interval: 'month',
    paymentLink: 'https://buy.stripe.com/test_5kQ7sMaXtar9aeBfPvg7e04',
    translations: {
      fr: {
        name: 'Tableau de bord analytique',
        description: 'Voyez qui s’intéresse à vos offres, suivez les vues, partages et clics',
      },
      de: {
        name: 'Analytics-Dashboard',
        description: 'Sehen Sie, wer sich für Ihre Jobs interessiert, und verfolgen Sie Views, Shares und Klicks',
      },
    },
  },

  TALENT_SEARCH: {
    productId: 'prod_THY8CuZp5Mc98C',
    name: 'Talent Search Access',
    description: 'Find the best matches for your jobs and see detailed student profiles',
    price: 99.00,
    currency: 'CHF',
    interval: 'month',
    paymentLink: 'https://buy.stripe.com/test_14A3cwe9FgPx72peLrg7e05',
    translations: {
      fr: {
        name: 'Accès recherche de talents',
        description: 'Trouvez les meilleures correspondances pour vos postes et consultez des profils étudiants détaillés',
      },
      de: {
        name: 'Talent-Suche',
        description: 'Finden Sie die besten Matches für Ihre Stellen und sehen Sie detaillierte Studierendenprofile',
      },
    },
  },

  FEATURED_JOBS: {
    productId: 'prod_THY7tDZ9wkMN4Q',
    name: 'Featured Job Vacancies',
    description: 'Feature your job posting on the main menu for maximum visibility',
    price: 119.00,
    currency: 'CHF',
    interval: 'one-time',
    paymentLink: 'https://buy.stripe.com/test_28EcN60iP1UD86teLrg7e06',
    translations: {
      fr: {
        name: "Offres d'emploi mises en avant",
        description: "Mettez votre annonce en avant sur le menu principal pour un maximum de visibilité",
      },
      de: {
        name: 'Top-platzierte Stellenanzeigen',
        description: 'Platzieren Sie Ihre Stellenanzeige prominent im Hauptmenü für maximale Sichtbarkeit',
      },
    },
  },
};

/**
 * Get product by user type
 */
export const getProductsByUserType = (userType) => {
  if (userType === 'student') {
    return [STRIPE_PRODUCTS.STUDENT_PREMIUM];
  } else if (userType === 'startup' || userType === 'employer') {
    return [
      STRIPE_PRODUCTS.ANALYTICS_DASHBOARD,
      STRIPE_PRODUCTS.TALENT_SEARCH,
      STRIPE_PRODUCTS.FEATURED_JOBS,
    ];
  }
  return [];
};

/**
 * Get product by ID
 */
export const getProductById = (productId) => {
  return Object.values(STRIPE_PRODUCTS).find(p => p.productId === productId);
};

export default STRIPE_PRODUCTS;

