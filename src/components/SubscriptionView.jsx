import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  CreditCard,
  Calendar,
  ExternalLink,
  Sparkles,
  Eye,
  Search,
  TrendingUp,
  BarChart3,
  Zap,
  Loader,
  CheckCircle2,
} from 'lucide-react';
import {
  getUserSubscription,
  getSubscriptionPlans,
  formatPrice,
  createCustomerPortalSession,
  redirectToCheckout,
  calculateSavings,
} from '../services/stripeService';
import TestModeBanner from './TestModeBanner';

/**
 * SubscriptionView Component
 * Shows subscription status or upgrade options in profile settings
 */
const SubscriptionView = ({ user, translate }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState('overview'); // 'overview' or 'manage'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [planToSubscribe, setPlanToSubscribe] = useState(null);

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

    // Show confirmation dialog
    setPlanToSubscribe(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubscription = async () => {
    if (!planToSubscribe) return;

    setIsProcessing(true);
    setSelectedPlan(planToSubscribe.id);
    setShowConfirmDialog(false);

    try {
      await redirectToCheckout(user.id, planToSubscribe.id, user.email);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(translate('subscription.error', 'Failed to start checkout. Please try again.'));
    }

    setIsProcessing(false);
    setSelectedPlan(null);
    setPlanToSubscribe(null);
  };

  const handleCancelSubscription = () => {
    setShowConfirmDialog(false);
    setPlanToSubscribe(null);
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

  // If user has a subscription, show current subscription info at the top
  return (
    <div className="ssc__subscription-view">
      {/* Test Mode Banner */}
      <TestModeBanner translate={translate} />

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
          <button
            type="button"
            className="ssc__btn ssc__btn--secondary ssc__btn--small"
            onClick={handleManageBilling}
          >
            <ExternalLink size={16} />
            {translate('subscription.manageBilling', 'Manage Billing')}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="ssc__subscription-view__header">
        <Crown size={40} color="#f59e0b" />
        <h2>
          {subscription 
            ? translate('subscription.upgrade.changeTitle', 'Change Your Plan')
            : translate('subscription.upgrade.title', 'Upgrade to Premium')}
        </h2>
        <p className="ssc__subscription-view__subtitle">
          {translate(
            'subscription.upgrade.subtitle',
            'Unlock powerful features to boost your career or hiring success'
          )}
        </p>
      </div>

      {/* Premium Features Overview */}
      <div className="ssc__subscription-benefits-compact">
        <div className="ssc__subscription-benefit-compact">
          <Eye size={20} color="#3b82f6" />
          <span>{translate('subscription.benefit.profileViews.short', 'See profile views')}</span>
        </div>
        <div className="ssc__subscription-benefit-compact">
          <Search size={20} color="#10b981" />
          <span>{translate('subscription.benefit.searches.short', 'Track search appearances')}</span>
        </div>
        <div className="ssc__subscription-benefit-compact">
          <TrendingUp size={20} color="#f59e0b" />
          <span>{translate('subscription.benefit.visibility.short', 'Enhanced visibility')}</span>
        </div>
        <div className="ssc__subscription-benefit-compact">
          <X size={20} color="#ef4444" />
          <span>{translate('subscription.benefit.noAds.short', 'Ad-free experience')}</span>
        </div>
        <div className="ssc__subscription-benefit-compact">
          <BarChart3 size={20} color="#a855f7" />
          <span>{translate('subscription.benefit.analytics.short', 'Advanced analytics')}</span>
        </div>
        <div className="ssc__subscription-benefit-compact">
          <Sparkles size={20} color="#3b82f6" />
          <span>{translate('subscription.benefit.premium.short', 'Premium badge')}</span>
        </div>
      </div>

      {/* Pricing Plans - Always Visible */}
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
                      recommended
                        ? 'ssc__btn--primary'
                        : 'ssc__btn--secondary'
                    } ssc__subscription-plan-card__cta`}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing || current}
                  >
                    {isProcessing && selectedPlan === plan.id ? (
                      <>
                        <Loader size={16} className="ssc__spinner-icon" />
                        {translate('subscription.processing', 'Processing...')}
                      </>
                    ) : current ? (
                      translate('subscription.currentPlan', 'Current Plan')
                    ) : (
                      <>
                        <Crown size={16} />
                        {subscription 
                          ? translate('subscription.changePlan', 'Switch to This Plan')
                          : translate('subscription.upgrade', 'Upgrade Now')}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && planToSubscribe && (
        <div className="ssc__subscription-confirm-overlay" onClick={handleCancelSubscription}>
          <div className="ssc__subscription-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ssc__subscription-confirm-header">
              <Crown size={32} color="#f59e0b" />
              <h3>{translate('subscription.confirm.title', 'Confirm Subscription')}</h3>
            </div>

            <div className="ssc__subscription-confirm-body">
              <p className="ssc__subscription-confirm-question">
                {translate(
                  'subscription.confirm.question',
                  'You are about to subscribe to:'
                )}
              </p>

              <div className="ssc__subscription-confirm-plan">
                <h4>{planToSubscribe.name}</h4>
                <div className="ssc__subscription-confirm-price">
                  <span className="ssc__subscription-confirm-amount">
                    {formatPrice(planToSubscribe.price_cents / planToSubscribe.billing_interval, planToSubscribe.currency)}
                  </span>
                  <span className="ssc__subscription-confirm-period">
                    /{translate('subscription.month', 'month')}
                  </span>
                </div>
                {planToSubscribe.billing_interval > 1 && (
                  <p className="ssc__subscription-confirm-billing">
                    {translate('subscription.billedAs', 'Billed as')}{' '}
                    {formatPrice(planToSubscribe.price_cents, planToSubscribe.currency)}{' '}
                    {translate('subscription.every', 'every')}{' '}
                    {planToSubscribe.billing_interval}{' '}
                    {translate('subscription.months', 'months')}
                  </p>
                )}
              </div>

              <div className="ssc__subscription-confirm-info">
                <CheckCircle2 size={16} color="#10b981" />
                <p>
                  {translate(
                    'subscription.confirm.redirect',
                    'You will be redirected to Stripe to complete your payment securely.'
                  )}
                </p>
              </div>

              <div className="ssc__subscription-confirm-info">
                <CheckCircle2 size={16} color="#10b981" />
                <p>
                  {translate(
                    'subscription.confirm.secure',
                    'Your payment information is processed securely by Stripe.'
                  )}
                </p>
              </div>
            </div>

            <div className="ssc__subscription-confirm-actions">
              <button
                type="button"
                className="ssc__btn ssc__btn--secondary"
                onClick={handleCancelSubscription}
              >
                {translate('subscription.confirm.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="ssc__btn ssc__btn--primary"
                onClick={handleConfirmSubscription}
              >
                <CreditCard size={16} />
                {translate('subscription.confirm.proceed', 'Proceed to Payment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionView;

