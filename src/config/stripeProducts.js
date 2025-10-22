/**
 * Stripe Product Configuration
 * Product IDs from Stripe Dashboard
 */

export const STRIPE_PRODUCTS = {
  // Student Premium Subscription
  STUDENT_PREMIUM: {
    productId: 'prod_THY4PLgnJZU3eE',
    name: 'Student Premium Subscription',
    description: 'Premium features for students including profile analytics, enhanced visibility, and more',
  },
  
  // Startup/Employer Products
  TALENT_SEARCH: {
    productId: 'prod_THY8CuZp5Mc98C',
    name: 'Talent Search Access',
    description: 'Search and connect with talented students',
  },
  
  ANALYTICS_DASHBOARD: {
    productId: 'prod_THY7szAmTkSWq3',
    name: 'Startup Analytics Dashboard',
    description: 'Advanced analytics for job postings and applications',
  },
  
  FEATURED_JOBS: {
    productId: 'prod_THY7tDZ9wkMN4Q',
    name: 'Startup Featured Jobs',
    description: 'Promote your job listings for maximum visibility',
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
      STRIPE_PRODUCTS.TALENT_SEARCH,
      STRIPE_PRODUCTS.ANALYTICS_DASHBOARD,
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

