import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  Calendar,
  ExternalLink,
  Sparkles,
  Eye,
  Search,
  TrendingUp,
  BarChart3,
  Zap,
  Loader,
  ArrowRight,
  CreditCard,
  Shield,
} from 'lucide-react';
import {
  getUserSubscription,
  getSubscriptionPlans,
  formatPrice,
  calculateSavings,
  createCustomerPortalSession,
} from '../services/stripeService';
import TestModeBanner from './TestModeBanner';

/**
 * SubscriptionView Component
 * Tabbed interface for subscription management
 */
const SubscriptionView = ({ user, translate }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(null);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'benefits', 'manage'

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    setLoading(true);

    try {
      // Load subscription
      const { subscription: sub } = await getUserSubscription(user.id);
      setSubscription(sub);

      // Always load plans for comparison
      const { plans: plansData } = await getSubscriptionPlans(user?.type);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (!user) {
      alert(translate('subscription.loginRequired', 'Please log in to subscribe'));
      return;
    }

    // Directly redirect to Stripe checkout
    setRedirecting(plan.id);
    
    // Use the payment link if available
    if (plan.stripe_payment_link) {
      // Small delay to show the notification before redirecting
      setTimeout(() => {
        window.location.href = plan.stripe_payment_link;
      }, 800);
    } else {
      // Fallback: show alert if no payment link configured
      alert(
        translate(
          'subscription.noPaymentLink',
          'Payment link not configured for this plan. Please contact support.'
        )
      );
      setRedirecting(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      await createCustomerPortalSession(user.id);
    } catch (error) {
      console.error('Portal error:', error);
      alert(translate('subscription.portalError', 'Failed to open billing portal. Please try again.'));
    }
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
    return subscription && subscription.plan_id === plan.id;
  };

  const isPlanRecommended = (plan) => {
    // Recommend the quarterly plan (best value)
    return plan.billing_interval === 3;
  };

  if (loading) {
    return (
      <div className="ssc__subscription-view ssc__subscription-view--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('subscription.loading', 'Loading subscription...')}</p>
      </div>
    );
  }

  return (
    <div className="ssc__subscription-view">
      {/* Redirecting Notification */}
      {redirecting && (
        <div className="ssc__subscription-redirect-notification">
          <div className="ssc__subscription-redirect-notification__content">
            <div className="ssc__subscription-redirect-notification__spinner">
              <Loader size={20} className="ssc__spinner-icon" />
            </div>
            <div className="ssc__subscription-redirect-notification__text">
              <strong>{translate('subscription.redirecting.title', 'Redirecting to Stripe...')}</strong>
              <p>{translate('subscription.redirecting.message', 'You will be securely redirected to complete your payment')}</p>
            </div>
            <Sparkles size={24} color="#f59e0b" />
          </div>
        </div>
      )}

      {/* Test Mode Banner */}
      <TestModeBanner translate={translate} />

      {/* Header */}
      <div className="ssc__subscription-view__header">
        <Crown size={40} color="#f59e0b" />
        <h2>
          {subscription 
            ? translate('subscription.manage.title', 'Manage Premium')
            : translate('subscription.upgrade.title', 'Upgrade to Premium')}
        </h2>
        <p className="ssc__subscription-view__subtitle">
          {translate(
            'subscription.upgrade.subtitle',
            'Unlock powerful features to boost your career or hiring success'
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="ssc__subscription-manager__tabs">
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'plans' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('plans')}
        >
          <Crown size={16} />
          {translate('subscription.tabs.plans', 'Plans')}
        </button>
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'benefits' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('benefits')}
        >
          <Sparkles size={16} />
          {translate('subscription.tabs.benefits', 'Benefits')}
        </button>
        {subscription && (
          <button
            type="button"
            className={`ssc__subscription-manager__tab ${
              activeTab === 'manage' ? 'ssc__subscription-manager__tab--active' : ''
            }`}
            onClick={() => setActiveTab('manage')}
          >
            <CreditCard size={16} />
            {translate('subscription.tabs.manage', 'Manage')}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="ssc__subscription-manager__content">
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="ssc__subscription-plans-tab">
            {/* Current Subscription Banner */}
            {subscription && (
              <div className="ssc__current-subscription-banner">
                <div className="ssc__current-subscription-banner__content">
                  <Crown size={24} color="#fff" />
                  <div>
                    <strong>{translate('subscription.currentPlan', 'Current Plan')}: {subscription.plan?.name}</strong>
                    <p>
                      {translate('subscription.renewsOn', 'Renews on')}{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Plans */}
            <div className="ssc__subscription-plans-grid">
              <h3 className="ssc__subscription-section-title">
                {translate('subscription.choosePlan', 'Choose Your Plan')}
              </h3>
              
              {plans.length === 0 ? (
                <div className="ssc__subscription-no-plans">
                  <p>{translate('subscription.noPlans', 'No plans available at the moment.')}</p>
                </div>
              ) : (
                <div className="ssc__subscription-pricing-cards">
                  {plans.map((plan) => {
                    const monthlyPrice = plan.price_cents / plan.billing_interval;
                    const savings = getSavingsPercentage(plan);
                    const recommended = isPlanRecommended(plan);
                    const current = isCurrentPlan(plan);
                    const isRedirecting = redirecting === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={`ssc__subscription-plan-card ${
                          recommended ? 'ssc__subscription-plan-card--recommended' : ''
                        } ${current ? 'ssc__subscription-plan-card--current' : ''}`}
                      >
                        {/* Recommended Badge */}
                        {recommended && !current && (
                          <div className="ssc__subscription-plan-card__badge">
                            <Zap size={14} />
                            {translate('subscription.bestValue', 'Best Value')}
                          </div>
                        )}

                        {/* Current Plan Badge */}
                        {current && (
                          <div className="ssc__subscription-plan-card__current-badge">
                            <Check size={14} />
                            {translate('subscription.currentPlan', 'Current Plan')}
                          </div>
                        )}

                        {/* Plan Name */}
                        <h4 className="ssc__subscription-plan-card__name">{plan.name}</h4>

                        {/* Savings Badge */}
                        {savings > 0 && (
                          <div className="ssc__subscription-plan-card__savings">
                            {translate('subscription.save', 'Save')} {savings}%
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="ssc__subscription-plan-card__pricing">
                          <div className="ssc__subscription-plan-card__price">
                            <span className="ssc__subscription-plan-card__amount">
                              {formatPrice(monthlyPrice, plan.currency)}
                            </span>
                            <span className="ssc__subscription-plan-card__period">
                              /{translate('subscription.month', 'month')}
                            </span>
                          </div>

                          {plan.billing_interval > 1 && (
                            <div className="ssc__subscription-plan-card__total">
                              {formatPrice(plan.price_cents, plan.currency)}{' '}
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
                          <li>
                            <Check size={16} color="#10b981" />
                            <span>{translate('subscription.feature.allBenefits', 'All premium benefits')}</span>
                          </li>
                          <li>
                            <Check size={16} color="#10b981" />
                            <span>{translate('subscription.feature.cancelAnytime', 'Cancel anytime')}</span>
                          </li>
                          <li>
                            <Check size={16} color="#10b981" />
                            <span>{translate('subscription.feature.moneyBack', '30-day money back')}</span>
                          </li>
                        </ul>

                        {/* CTA Button */}
                        <button
                          type="button"
                          className={`ssc__btn ${
                            recommended && !current
                              ? 'ssc__btn--primary'
                              : 'ssc__btn--secondary'
                          } ssc__subscription-plan-card__cta`}
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isRedirecting || current}
                        >
                          {isRedirecting ? (
                            <>
                              <Loader size={16} className="ssc__spinner-icon" />
                              {translate('subscription.redirecting', 'Redirecting to Stripe...')}
                            </>
                          ) : current ? (
                            <>
                              <Check size={16} />
                              {translate('subscription.currentPlan', 'Current Plan')}
                            </>
                          ) : (
                            <>
                              <Crown size={16} />
                              {subscription 
                                ? translate('subscription.changePlan', 'Switch to This Plan')
                                : translate('subscription.upgrade', 'Upgrade Now')}
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secure Payment Info */}
            <div className="ssc__subscription-secure-info">
              <Shield size={20} color="#10b981" />
              <p>
                {translate(
                  'subscription.secure.info',
                  'Secure payment powered by Stripe. Your payment information is encrypted and never stored on our servers.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <div className="ssc__subscription-benefits-tab">
            {/* Premium Features Overview */}
            <div className="ssc__subscription-benefits-compact">
              <h3>{translate('subscription.benefits.title', 'Premium Benefits')}</h3>
              <div className="ssc__subscription-benefit-compact">
                <Eye size={24} color="#3b82f6" />
                <div>
                  <strong>{translate('subscription.benefit.profileViews.title', 'See Profile Views')}</strong>
                  <p>{translate('subscription.benefit.profileViews.desc', 'Track who viewed your profile and when')}</p>
                </div>
              </div>
              <div className="ssc__subscription-benefit-compact">
                <Search size={24} color="#10b981" />
                <div>
                  <strong>{translate('subscription.benefit.searches.title', 'Search Appearances')}</strong>
                  <p>{translate('subscription.benefit.searches.desc', 'See when you appear in search results')}</p>
                </div>
              </div>
              <div className="ssc__subscription-benefit-compact">
                <TrendingUp size={24} color="#f59e0b" />
                <div>
                  <strong>{translate('subscription.benefit.visibility.title', 'Enhanced Visibility')}</strong>
                  <p>{translate('subscription.benefit.visibility.desc', 'Get boosted in search rankings')}</p>
                </div>
              </div>
              <div className="ssc__subscription-benefit-compact">
                <X size={24} color="#ef4444" />
                <div>
                  <strong>{translate('subscription.benefit.noAds.title', 'Ad-Free Experience')}</strong>
                  <p>{translate('subscription.benefit.noAds.desc', 'Enjoy the platform without any ads')}</p>
                </div>
              </div>
              <div className="ssc__subscription-benefit-compact">
                <BarChart3 size={24} color="#a855f7" />
                <div>
                  <strong>{translate('subscription.benefit.analytics.title', 'Advanced Analytics')}</strong>
                  <p>{translate('subscription.benefit.analytics.desc', 'Get detailed insights and metrics')}</p>
                </div>
              </div>
              <div className="ssc__subscription-benefit-compact">
                <Sparkles size={24} color="#3b82f6" />
                <div>
                  <strong>{translate('subscription.benefit.premium.title', 'Premium Badge')}</strong>
                  <p>{translate('subscription.benefit.premium.desc', 'Stand out with a premium badge on your profile')}</p>
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
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && subscription && (
          <div className="ssc__subscription-manage-tab">
            <div className="ssc__subscription-card">
              <h3>{subscription.plan?.name}</h3>
              <p className="ssc__subscription-card__price">
                {formatPrice(subscription.plan?.price_cents, subscription.plan?.currency)}
                <span>
                  /{subscription.plan?.billing_interval}{' '}
                  {subscription.plan?.billing_interval === 1
                    ? translate('subscription.month', 'month')
                    : translate('subscription.months', 'months')}
                </span>
              </p>

              <div className="ssc__subscription-card__details">
                <div className="ssc__subscription-card__detail">
                  <Calendar size={16} />
                  <div>
                    <span>{translate('subscription.renewsOn', 'Renews on')}</span>
                    <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong>
                  </div>
                </div>

                {subscription.payment_method_brand && (
                  <div className="ssc__subscription-card__detail">
                    <CreditCard size={16} />
                    <div>
                      <span>{translate('subscription.paymentMethod', 'Payment method')}</span>
                      <strong>
                        {subscription.payment_method_brand} •••• {subscription.payment_method_last4}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="ssc__btn ssc__btn--secondary ssc__subscription-card__manage"
                onClick={handleManageBilling}
              >
                <ExternalLink size={16} />
                {translate('subscription.manageBilling', 'Manage Billing')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionView;
