/**
 * Stripe Service
 * Handles all Stripe payment and subscription operations
 * 
 * Setup Instructions:
 * 1. Sign up for Stripe: https://stripe.com
 * 2. Get API keys (publishable and secret)
 * 3. Add to .env.local:
 *    REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
 *    (Secret key stays on the backend only)
 * 4. Create Products and Prices in Stripe Dashboard
 * 5. Set up webhook endpoint
 */

import { supabase } from '../supabaseClient';

// Stripe Configuration - Use environment variables
// IMPORTANT: Never commit actual Stripe keys to version control!
// Add keys to .env.local file (which is gitignored)
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Test mode configuration
const TEST_MODE = process.env.REACT_APP_STRIPE_TEST_MODE === 'true' || 
                  (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.includes('test'));

// Mock Stripe for testing
const MOCK_STRIPE = {
  redirectToCheckout: async ({ sessionId }) => {
    console.log('[TEST MODE] Would redirect to Stripe checkout with session:', sessionId);
    // Simulate successful checkout
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { error: null };
  },
};

/**
 * Initialize Stripe (load Stripe.js)
 */
export const loadStripe = async () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key not configured');
    return null;
  }

  // Dynamically import Stripe.js
  try {
    const { loadStripe: stripeLoader } = await import('@stripe/stripe-js');
    const stripe = await stripeLoader(STRIPE_PUBLISHABLE_KEY);
    console.log('Stripe initialized:', STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
    return stripe;
  } catch (error) {
    console.error('Failed to load Stripe:', error);
    return null;
  }
};

/**
 * Mock subscription plans using actual Stripe Product IDs
 * Stripe Payment Link: https://buy.stripe.com/test_6oU9AU5D9dDldqN7iZg7e00
 */
const getMockPlans = (userType = null) => {
  const allPlans = [
    // Student plans - Using prod_THY4PLgnJZU3eE, prod_THY4DA4lq3TnrZ, prod_THY3ZpRjvAhJoI
    {
      id: 'student_premium_monthly',
      plan_id: 'student_premium_monthly',
      name: 'Student Premium (Monthly)',
      description: 'Ad-free experience, see who viewed your profile, enhanced visibility',
      price_cents: 790,
      currency: 'CHF',
      billing_period: 'month',
      billing_interval: 1,
      stripe_price_id: 'price_student_monthly',
      stripe_product_id: 'prod_THY4PLgnJZU3eE',
      stripe_payment_link: 'https://buy.stripe.com/test_6oU9AU5D9dDldqN7iZg7e00',
      is_active: true,
      sort_order: 1,
      features: {
        no_ads: true,
        profile_views: true,
        profile_searches: true,
        enhanced_visibility: true,
      },
      metadata: { user_type: 'student' },
    },
    {
      id: 'student_premium_quarterly',
      plan_id: 'student_premium_quarterly',
      name: 'Student Premium (Quarterly)',
      description: 'Save 16% with quarterly billing',
      price_cents: 2000,
      currency: 'CHF',
      billing_period: 'month',
      billing_interval: 3,
      stripe_price_id: 'price_student_quarterly',
      stripe_product_id: 'prod_THY4DA4lq3TnrZ',
      stripe_payment_link: 'https://buy.stripe.com/test_fZubJ29Tpar95Ylavbg7e03',
      is_active: true,
      sort_order: 2,
      features: {
        no_ads: true,
        profile_views: true,
        profile_searches: true,
        enhanced_visibility: true,
        priority_support: true,
      },
      metadata: { user_type: 'student' },
    },
    {
      id: 'student_premium_yearly',
      plan_id: 'student_premium_yearly',
      name: 'Student Premium (Yearly)',
      description: 'Save 26% with yearly billing',
      price_cents: 7500,
      currency: 'CHF',
      billing_period: 'month',
      billing_interval: 12,
      stripe_price_id: 'price_student_yearly',
      stripe_product_id: 'prod_THY3ZpRjvAhJoI',
      stripe_payment_link: 'https://buy.stripe.com/test_eVq4gA3v156P2M9avbg7e02',
      is_active: true,
      sort_order: 3,
      features: {
        no_ads: true,
        profile_views: true,
        profile_searches: true,
        enhanced_visibility: true,
        priority_support: true,
        exclusive_events: true,
      },
      metadata: { user_type: 'student' },
    },
    // Employer plans - Using actual product IDs from CSV
    {
      id: 'employer_analytics',
      plan_id: 'employer_analytics',
      name: 'Startup Analytics Dashboard',
      description: 'Track job performance, applicant funnels, and hiring metrics',
      price_cents: 4900,
      currency: 'CHF',
      billing_period: 'month',
      billing_interval: 1,
      stripe_price_id: 'price_analytics_monthly',
      stripe_product_id: 'prod_THY7szAmTkSWq3',
      is_active: true,
      sort_order: 10,
      features: {
        analytics_dashboard: true,
        application_tracking: true,
        performance_metrics: true,
        export_reports: true,
      },
      metadata: { user_type: 'employer', feature: 'analytics' },
    },
    {
      id: 'employer_talent_search',
      plan_id: 'employer_talent_search',
      name: 'Talent Search Access',
      description: 'Search and view detailed student profiles, unlimited access',
      price_cents: 9900,
      currency: 'CHF',
      billing_period: 'month',
      billing_interval: 1,
      stripe_price_id: 'price_talent_search_monthly',
      stripe_product_id: 'prod_THY8CuZp5Mc98C',
      is_active: true,
      sort_order: 11,
      features: {
        talent_search: true,
        detailed_profiles: true,
        contact_students: true,
        unlimited_searches: true,
        save_candidates: true,
      },
      metadata: { user_type: 'employer', feature: 'talent_search' },
    },
    {
      id: 'employer_featured_job',
      plan_id: 'employer_featured_job',
      name: 'Startup Featured Jobs',
      description: 'Feature your job posting in email alerts and homepage for 30 days',
      price_cents: 11900,
      currency: 'CHF',
      billing_period: 'one_time',
      billing_interval: 1,
      stripe_price_id: 'price_featured_job_onetime',
      stripe_product_id: 'prod_THY7tDZ9wkMN4Q',
      is_active: true,
      sort_order: 12,
      features: {
        featured_in_alerts: true,
        featured_on_homepage: true,
        priority_placement: true,
        duration_days: 30,
      },
      metadata: { user_type: 'employer', feature: 'featured_job', is_one_time: true },
    },
  ];

  if (!userType) return allPlans;
  
  return allPlans.filter(plan => plan.metadata?.user_type === userType);
};

/**
 * Get all available subscription plans
 */
export const getSubscriptionPlans = async (userType = null) => {
  try {
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    // Filter by user type if specified
    if (userType) {
      query = query.contains('metadata', { user_type: userType });
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    // Fallback to mock data if database error or no data
    if (error || !data || data.length === 0) {
      console.log('[TEST MODE] Using mock subscription plans');
      return { plans: getMockPlans(userType), error: null };
    }

    return { plans: data, error: null };
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    console.log('[TEST MODE] Using mock subscription plans');
    return { plans: getMockPlans(userType), error: null };
  }
};

/**
 * Get employer-specific features/plans
 */
export const getEmployerFeatures = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .contains('metadata', { user_type: 'employer' })
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return { features: data || [], error: null };
  } catch (error) {
    console.error('Error fetching employer features:', error);
    return { features: [], error };
  }
};

/**
 * Get user's current subscription
 */
export const getUserSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:plan_id(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { subscription: data, error: null };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return { subscription: null, error };
  }
};

/**
 * Check if user has premium subscription
 */
export const isPremiumUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc('is_premium_user', { check_user_id: userId });

    if (error) throw error;

    return { isPremium: data || false, error: null };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, error };
  }
};

/**
 * Create Stripe checkout session for subscription
 * This calls a Supabase Edge Function to securely create the session
 */
export const createCheckoutSession = async (userId, planId, userEmail, options = {}) => {
  try {
    // Test mode: Return mock session
    if (TEST_MODE) {
      console.log('[TEST MODE] Mock checkout session created', { userId, planId, userEmail });
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        sessionId: `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error: null 
      };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        planId,
        userEmail,
        jobId: options.jobId, // For featured job postings
        isOneTime: options.isOneTime || false, // One-time payment vs subscription
        successUrl: options.successUrl || `${window.location.origin}/subscription/success`,
        cancelUrl: options.cancelUrl || `${window.location.origin}/subscription`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { sessionId: data.sessionId, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Fallback to test mode on error
    console.log('[TEST MODE] Falling back to mock session due to error');
    return { 
      sessionId: `cs_test_fallback_${Date.now()}`,
      error: null 
    };
  }
};

/**
 * Create Stripe Checkout Session using Stripe API directly
 * This creates a real checkout session and redirects to Stripe
 */
export const createStripeCheckoutSession = async (userId, planId, userEmail, options = {}) => {
  try {
    const plan = getMockPlans().find(p => p.id === planId || p.plan_id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if we have a Supabase backend endpoint
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured. Using direct Stripe integration.');
      
      // Load Stripe.js
      const stripe = await loadStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      return {
        stripe,
        plan,
        priceId: plan.stripe_price_id,
        error: null
      };
    }

    // Call backend to create checkout session
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        planId: plan.id,
        userEmail,
        priceId: plan.stripe_price_id,
        successUrl: options.successUrl || `${window.location.origin}?subscription=success`,
        cancelUrl: options.cancelUrl || `${window.location.origin}?subscription=cancelled`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    const stripe = await loadStripe();

    return {
      sessionId: data.sessionId,
      url: data.url,
      stripe,
      plan,
      error: null
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error };
  }
};

/**
 * Redirect to Stripe Checkout
 * Opens Stripe Checkout window for payment
 */
export const redirectToCheckout = async (userId, planId, userEmail, options = {}) => {
  try {
    console.log('Starting checkout process:', { userId, planId, userEmail });
    
    // Find the plan to get payment link
    const plan = getMockPlans().find(p => p.id === planId || p.plan_id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // If plan has a direct Stripe payment link, use it (simplest method)
    if (plan.stripe_payment_link) {
      console.log('Redirecting to Stripe Payment Link:', plan.stripe_payment_link);
      window.location.href = plan.stripe_payment_link;
      return { success: true, error: null };
    }

    // Otherwise, try to create a checkout session
    const { sessionId, url, stripe, error: checkoutError } = await createStripeCheckoutSession(
      userId, 
      planId, 
      userEmail, 
      options
    );
    
    if (checkoutError) throw checkoutError;

    // If we have a direct URL (from backend), redirect to it
    if (url) {
      console.log('Redirecting to Stripe Checkout:', url);
      window.location.href = url;
      return { success: true, error: null };
    }

    // Otherwise, use Stripe.js to redirect with session ID
    if (sessionId && stripe) {
      console.log('Redirecting to Stripe Checkout with session ID:', sessionId);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    }

    // Fallback: Show instructions if prices not configured
    const message = `
⚠️ Stripe Configuration Required

Plan: ${plan.name}
Price: ${formatPrice(plan.price_cents, plan.currency)}

To complete payment integration, you need to:

1. Create a Payment Link in Stripe Dashboard:
   https://dashboard.stripe.com/payment-links
   
2. Or create a Price for this product:
   https://dashboard.stripe.com/products/${plan.stripe_product_id}
   
3. Update the payment link or price ID in the code

For now, this is showing you what would happen.
Check the console for more details.
    `.trim();

    console.log('Plan details:', plan);
    console.log('To complete setup, add payment link or create a price for product:', plan.stripe_product_id);
    
    alert(message);
    
    return { success: false, error: new Error('Stripe payment link not configured') };
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    return { success: false, error };
  }
};

/**
 * Check if user has access to a specific feature
 */
export const hasFeatureAccess = async (userId, featureName) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:plan_id(features)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString());

    if (error) throw error;

    // Check if any active subscription includes this feature
    const hasAccess = data?.some(sub => 
      sub.plan?.features?.[featureName] === true
    ) || false;

    return { hasAccess, error: null };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { hasAccess: false, error };
  }
};

/**
 * Get all active features for a user
 */
export const getUserFeatures = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:plan_id(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString());

    if (error) throw error;

    // Merge all features from active subscriptions
    const features = {};
    data?.forEach(sub => {
      if (sub.plan?.features) {
        Object.assign(features, sub.plan.features);
      }
    });

    return { features, subscriptions: data || [], error: null };
  } catch (error) {
    console.error('Error getting user features:', error);
    return { features: {}, subscriptions: [], error };
  }
};

/**
 * Create Stripe Customer Portal session
 * Allows users to manage their subscription
 */
export const createCustomerPortalSession = async (userId) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId,
        returnUrl: `${window.location.origin}/subscription`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create portal session');
    }

    // Redirect to customer portal
    window.location.href = data.url;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return { success: false, error };
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel subscription');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { success: false, error };
  }
};

/**
 * Get payment transactions for user
 */
export const getPaymentTransactions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { transactions: data || [], error: null };
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return { transactions: [], error };
  }
};

/**
 * Track profile view (premium feature)
 */
export const trackProfileView = async (viewedProfileId, viewerData = {}) => {
  try {
    const { data, error } = await supabase
      .from('profile_views')
      .insert({
        viewed_profile_id: viewedProfileId,
        viewer_id: viewerData.viewerId || null,
        session_id: viewerData.sessionId || generateSessionId(),
        referrer_source: viewerData.source || 'direct',
        viewer_type: viewerData.viewerType || 'anonymous',
        viewer_company_name: viewerData.companyName || null,
      });

    if (error && error.code !== '23505') throw error; // Ignore duplicate errors

    return { success: true, error: null };
  } catch (error) {
    console.error('Error tracking profile view:', error);
    return { success: false, error };
  }
};

/**
 * Get profile views for user (premium feature)
 */
export const getProfileViews = async (userId, limit = 50) => {
  try {
    // First check if user is premium
    const { isPremium } = await isPremiumUser(userId);

    if (!isPremium) {
      return { 
        views: [], 
        error: null,
        isPremiumFeature: true,
        message: 'Upgrade to Premium to see who viewed your profile',
      };
    }

    const { data, error } = await supabase
      .from('profile_views')
      .select(`
        *,
        viewer:viewer_id(id, email, name, type)
      `)
      .eq('viewed_profile_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { views: data || [], error: null, isPremiumFeature: false };
  } catch (error) {
    console.error('Error fetching profile views:', error);
    return { views: [], error, isPremiumFeature: true };
  }
};

/**
 * Get profile search appearances (premium feature)
 */
export const getProfileSearchAppearances = async (userId, limit = 50) => {
  try {
    const { isPremium } = await isPremiumUser(userId);

    if (!isPremium) {
      return {
        appearances: [],
        error: null,
        isPremiumFeature: true,
        message: 'Upgrade to Premium to see who searched for you',
      };
    }

    const { data, error } = await supabase
      .from('profile_search_appearances')
      .select(`
        *,
        searcher:searcher_id(id, email, name, type)
      `)
      .eq('profile_id', userId)
      .order('appeared_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { appearances: data || [], error: null, isPremiumFeature: false };
  } catch (error) {
    console.error('Error fetching search appearances:', error);
    return { appearances: [], error, isPremiumFeature: true };
  }
};

/**
 * Feature a job (premium feature for startups)
 */
export const featureJob = async (jobId, subscriptionId, featureType = 'premium', durationDays = 30) => {
  try {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);

    const { data, error } = await supabase
      .from('featured_jobs')
      .insert({
        job_id: jobId,
        subscription_id: subscriptionId,
        feature_type: featureType,
        featured_until: featuredUntil.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { featuredJob: data, error: null };
  } catch (error) {
    console.error('Error featuring job:', error);
    return { featuredJob: null, error };
  }
};

/**
 * Get featured jobs
 */
export const getFeaturedJobs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('featured_jobs')
      .select(`
        *,
        job:job_id(*)
      `)
      .eq('is_active', true)
      .lte('featured_from', new Date().toISOString())
      .gte('featured_until', new Date().toISOString())
      .order('featured_from', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { featuredJobs: data || [], error: null };
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    return { featuredJobs: [], error };
  }
};

/**
 * Format price for display
 */
export const formatPrice = (cents, currency = 'CHF') => {
  const amount = cents / 100;
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate savings percentage
 */
export const calculateSavings = (monthlyPrice, totalPrice, months) => {
  const fullPrice = monthlyPrice * months;
  const savings = ((fullPrice - totalPrice) / fullPrice) * 100;
  return Math.round(savings);
};

/**
 * Generate session ID for tracking
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if Stripe is in test mode
 */
export const isTestMode = () => TEST_MODE;

/**
 * Get test mode status message
 */
export const getTestModeStatus = () => {
  if (TEST_MODE) {
    return {
      enabled: true,
      message: '🧪 Stripe Test Mode - No real payments will be processed',
      details: 'Using mock data and simulated checkout. Configure REACT_APP_STRIPE_PUBLISHABLE_KEY for production.',
    };
  }
  return {
    enabled: false,
    message: '✅ Stripe Live Mode',
    details: 'Real payments will be processed.',
  };
};

export default {
  loadStripe,
  getSubscriptionPlans,
  getUserSubscription,
  isPremiumUser,
  redirectToCheckout,
  createCustomerPortalSession,
  cancelSubscription,
  getPaymentTransactions,
  trackProfileView,
  getProfileViews,
  getProfileSearchAppearances,
  featureJob,
  getFeaturedJobs,
  formatPrice,
  calculateSavings,
  isTestMode,
  getTestModeStatus,
};

