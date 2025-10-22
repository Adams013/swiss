import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Zap,
  Eye,
  Search,
  TrendingUp,
  BarChart3,
  Headphones,
  Sparkles,
  X,
  Calendar,
} from 'lucide-react';
import {
  getSubscriptionPlans,
  getUserSubscription,
  redirectToCheckout,
  formatPrice,
  calculateSavings,
} from '../services/stripeService';
import TestModeBanner from './TestModeBanner';
import './TestModeBanner.css';

/**
 * SubscriptionPlans Component
 * Displays premium subscription pricing and features
 */
const SubscriptionPlans = ({ user, translate, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);

    // Load plans
    const { plans: plansData } = await getSubscriptionPlans();
    setPlans(plansData);

    // Load current subscription if user is logged in
    if (user?.id) {
      const { subscription } = await getUserSubscription(user.id);
      setCurrentSubscription(subscription);
    }

    setLoading(false);
  };

  const handleSelectPlan = async (plan) => {
    if (!user) {
      // User needs to log in first
      alert(translate('subscription.loginRequired', 'Please log in to subscribe'));
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(plan.id);

    try {
      await redirectToCheckout(user.id, plan.id, user.email);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(translate('subscription.error', 'Failed to start checkout. Please try again.'));
    }

    setIsProcessing(false);
    setSelectedPlan(null);
  };

  const getPlanFeatures = (userType) => {
    if (userType === 'student') {
      return [
        {
          icon: <X size={20} />,
          text: translate('subscription.features.noAds', 'Ad-free experience'),
        },
        {
          icon: <Eye size={20} />,
          text: translate('subscription.features.profileViews', 'See who viewed your profile'),
        },
        {
          icon: <Search size={20} />,
          text: translate('subscription.features.searchAppearances', 'See who searched for you'),
        },
        {
          icon: <TrendingUp size={20} />,
          text: translate('subscription.features.enhancedVisibility', 'Enhanced profile visibility'),
        },
        {
          icon: <BarChart3 size={20} />,
          text: translate('subscription.features.analytics', 'Advanced analytics'),
        },
      ];
    } else {
      // Startup features
      return [
        {
          icon: <X size={20} />,
          text: translate('subscription.features.noAds', 'Ad-free experience'),
        },
        {
          icon: <Sparkles size={20} />,
          text: translate('subscription.features.featuredJobs', 'Promote job vacancies'),
        },
        {
          icon: <Eye size={20} />,
          text: translate('subscription.features.detailedProfiles', 'See detailed student profiles'),
        },
        {
          icon: <TrendingUp size={20} />,
          text: translate('subscription.features.priorityPlacement', 'Priority job placement'),
        },
        {
          icon: <BarChart3 size={20} />,
          text: translate('subscription.features.advancedAnalytics', 'Advanced hiring analytics'),
        },
      ];
    }
  };

  const getMonthlyPrice = (plan) => {
    const monthlyAmount = plan.price_cents / plan.billing_interval;
    return formatPrice(monthlyAmount, plan.currency);
  };

  const getTotalPrice = (plan) => {
    return formatPrice(plan.price_cents, plan.currency);
  };

  const getSavingsPercentage = (plan) => {
    if (plan.billing_interval === 1) return 0;
    
    // Find monthly plan for comparison
    const monthlyPlan = plans.find(p => p.billing_interval === 1);
    if (!monthlyPlan) return 0;

    return calculateSavings(
      monthlyPlan.price_cents,
      plan.price_cents,
      plan.billing_interval
    );
  };

  const isCurrentPlan = (plan) => {
    return currentSubscription && currentSubscription.plan_id === plan.id;
  };

  const isPlanRecommended = (plan) => {
    // Recommend the quarterly plan (best value)
    return plan.billing_interval === 3;
  };

  if (loading) {
    return (
      <div className="ssc__subscription-plans ssc__subscription-plans--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('subscription.loading', 'Loading plans...')}</p>
      </div>
    );
  }

  return (
    <div className="ssc__subscription-plans">
      {/* Test Mode Banner */}
      <TestModeBanner translate={translate} />

      {/* Header */}
      <div className="ssc__subscription-plans__header">
        <Crown className="ssc__icon" size={32} color="#f59e0b" />
        <h2>{translate('subscription.title', 'Upgrade to Premium')}</h2>
        <p className="ssc__subscription-plans__subtitle">
          {translate(
            'subscription.subtitle',
            'Get more visibility, insights, and features to accelerate your career or hiring'
          )}
        </p>
        {onClose && (
          <button
            type="button"
            className="ssc__subscription-plans__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription && (
        <div className="ssc__current-subscription-banner">
          <Crown size={20} />
          <div>
            <strong>{translate('subscription.currentPlan', 'Current Plan')}:</strong>{' '}
            {currentSubscription.plan?.name}
            <br />
            <small>
              {translate('subscription.renewsOn', 'Renews on')}{' '}
              {new Date(currentSubscription.current_period_end).toLocaleDateString()}
            </small>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="ssc__subscription-features-highlight">
        <h3>{translate('subscription.featuresTitle', 'Premium Features')}</h3>
        <div className="ssc__subscription-features-grid">
          {getPlanFeatures(user?.type).map((feature, index) => (
            <div key={index} className="ssc__subscription-feature-item">
              <div className="ssc__subscription-feature-icon">{feature.icon}</div>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="ssc__subscription-plans__grid">
        {plans.map((plan) => {
          const savings = getSavingsPercentage(plan);
          const recommended = isPlanRecommended(plan);
          const current = isCurrentPlan(plan);

          return (
            <div
              key={plan.id}
              className={`ssc__subscription-plan-card ${
                recommended ? 'ssc__subscription-plan-card--recommended' : ''
              } ${current ? 'ssc__subscription-plan-card--current' : ''}`}
            >
              {/* Recommended Badge */}
              {recommended && (
                <div className="ssc__subscription-plan-card__badge">
                  <Zap size={14} />
                  {translate('subscription.bestValue', 'Best Value')}
                </div>
              )}

              {/* Plan Name */}
              <h3 className="ssc__subscription-plan-card__name">{plan.name}</h3>

              {/* Savings Badge */}
              {savings > 0 && (
                <div className="ssc__subscription-plan-card__savings">
                  {translate('subscription.save', 'Save')} {savings}%
                </div>
              )}

              {/* Pricing */}
              <div className="ssc__subscription-plan-card__pricing">
                <div className="ssc__subscription-plan-card__price">
                  {getMonthlyPrice(plan)}
                  <span className="ssc__subscription-plan-card__period">
                    /{translate('subscription.month', 'month')}
                  </span>
                </div>

                {plan.billing_interval > 1 && (
                  <div className="ssc__subscription-plan-card__total">
                    {getTotalPrice(plan)}{' '}
                    {plan.billing_interval === 3
                      ? translate('subscription.perQuarter', 'per quarter')
                      : translate('subscription.perYear', 'per year')}
                  </div>
                )}
              </div>

              {/* Billing Period */}
              <div className="ssc__subscription-plan-card__billing">
                <Calendar size={16} />
                <span>
                  {translate('subscription.billedEvery', 'Billed every')}{' '}
                  {plan.billing_interval}{' '}
                  {plan.billing_interval === 1
                    ? translate('subscription.month', 'month')
                    : translate('subscription.months', 'months')}
                </span>
              </div>

              {/* Features List */}
              <ul className="ssc__subscription-plan-card__features">
                {Object.entries(plan.features || {})
                  .filter(([_, enabled]) => enabled)
                  .map(([feature, _]) => (
                    <li key={feature}>
                      <Check size={16} className="ssc__subscription-plan-card__check" />
                      <span>
                        {translate(
                          `subscription.feature.${feature}`,
                          feature.replace(/_/g, ' ')
                        )}
                      </span>
                    </li>
                  ))}
              </ul>

              {/* CTA Button */}
              <button
                type="button"
                className={`ssc__btn ${
                  recommended
                    ? 'ssc__btn--primary'
                    : 'ssc__btn--secondary'
                } ssc__subscription-plan-card__cta`}
                onClick={() => handleSelectPlan(plan)}
                disabled={isProcessing || current}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  <>
                    <div className="ssc__spinner ssc__spinner--small"></div>
                    {translate('subscription.processing', 'Processing...')}
                  </>
                ) : current ? (
                  translate('subscription.currentPlan', 'Current Plan')
                ) : (
                  <>
                    <Crown size={16} />
                    {translate('subscription.upgrade', 'Upgrade Now')}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Benefits */}
      <div className="ssc__subscription-benefits">
        <h3>{translate('subscription.moreInfo', 'Why Go Premium?')}</h3>
        <div className="ssc__subscription-benefits__grid">
          <div className="ssc__subscription-benefit">
            <Eye size={24} color="#3b82f6" />
            <h4>{translate('subscription.benefit1.title', 'Track Your Visibility')}</h4>
            <p>
              {translate(
                'subscription.benefit1.desc',
                'See exactly who viewed your profile and how you appeared in searches'
              )}
            </p>
          </div>

          <div className="ssc__subscription-benefit">
            <TrendingUp size={24} color="#10b981" />
            <h4>{translate('subscription.benefit2.title', 'Stand Out')}</h4>
            <p>
              {translate(
                'subscription.benefit2.desc',
                'Get enhanced visibility and priority placement in search results'
              )}
            </p>
          </div>

          <div className="ssc__subscription-benefit">
            <BarChart3 size={24} color="#f59e0b" />
            <h4>{translate('subscription.benefit3.title', 'Advanced Analytics')}</h4>
            <p>
              {translate(
                'subscription.benefit3.desc',
                'Gain insights into your job search or hiring performance with detailed analytics'
              )}
            </p>
          </div>

          <div className="ssc__subscription-benefit">
            <Headphones size={24} color="#6366f1" />
            <h4>{translate('subscription.benefit4.title', 'Priority Support')}</h4>
            <p>
              {translate(
                'subscription.benefit4.desc',
                'Get faster responses and dedicated support from our team'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="ssc__subscription-guarantee">
        <Check size={24} color="#10b981" />
        <div>
          <strong>{translate('subscription.guarantee.title', '30-Day Money-Back Guarantee')}</strong>
          <p>
            {translate(
              'subscription.guarantee.desc',
              "Not satisfied? We'll refund you, no questions asked."
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="ssc__subscription-plans__footer">
        <p>
          {translate(
            'subscription.footer',
            'All plans include a 7-day free trial. Cancel anytime, no commitment.'
          )}
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;

