import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Star,
  Sparkle,
} from 'lucide-react';
import {
  getUserSubscription,
  getSubscriptionPlans,
  formatPrice,
  calculateSavings,
  createCustomerPortalSession,
} from '../services/stripeService';
import TestModeBanner from './TestModeBanner';
import './Subscription.css';

const PLAN_VIEW_PREFIX = 'interval-';

const benefitCards = [
  {
    icon: Eye,
    titleKey: 'subscription.benefit.profileViews.title',
    titleFallback: 'See Profile Views',
    descriptionKey: 'subscription.benefit.profileViews.desc',
    descriptionFallback: 'Track who viewed your profile and when.'
  },
  {
    icon: Search,
    titleKey: 'subscription.benefit.searches.title',
    titleFallback: 'Search Appearances',
    descriptionKey: 'subscription.benefit.searches.desc',
    descriptionFallback: 'See when you appear in search results and how recruiters find you.'
  },
  {
    icon: TrendingUp,
    titleKey: 'subscription.benefit.visibility.title',
    titleFallback: 'Enhanced Visibility',
    descriptionKey: 'subscription.benefit.visibility.desc',
    descriptionFallback: 'Boost your ranking and stay ahead of other candidates.'
  },
  {
    icon: BarChart3,
    titleKey: 'subscription.benefit.analytics.title',
    titleFallback: 'Advanced Analytics',
    descriptionKey: 'subscription.benefit.analytics.desc',
    descriptionFallback: 'Get actionable insights, metrics, and personal recommendations.'
  },
  {
    icon: Star,
    titleKey: 'subscription.benefit.premium.title',
    titleFallback: 'Premium Badge',
    descriptionKey: 'subscription.benefit.premium.desc',
    descriptionFallback: 'Stand out with a glowing premium badge across the platform.'
  },
  {
    icon: Shield,
    titleKey: 'subscription.securePayment.title',
    titleFallback: 'Secure Stripe payments',
    descriptionKey: 'subscription.securePayment.description',
    descriptionFallback: 'Every plan is encrypted and backed by Stripe with a 30-day guarantee.'
  }
];

const planFeatureList = [
  {
    key: 'subscription.feature.allBenefits',
    fallback: 'All premium benefits included',
  },
  {
    key: 'subscription.feature.cancelAnytime',
    fallback: 'Cancel or switch anytime',
  },
  {
    key: 'subscription.feature.moneyBack',
    fallback: '30-day money back guarantee',
  },
];

const SubscriptionView = ({ user, translate }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(null);
  const [activeTab, setActiveTab] = useState('subscribe');
  const [activePlanInterval, setActivePlanInterval] = useState(null);
  const [activePlanView, setActivePlanView] = useState('benefits');

  const planGrouping = useMemo(() => {
    const grouped = new Map();

    plans.forEach((plan) => {
      const interval = Number(plan?.billing_interval) || 1;
      if (!grouped.has(interval)) {
        grouped.set(interval, []);
      }
      grouped.get(interval).push(plan);
    });

    const order = Array.from(grouped.keys()).sort((a, b) => a - b);
    return { grouped, order };
  }, [plans]);

  useEffect(() => {
    if (planGrouping.order.length === 0) {
      if (activePlanInterval !== null) {
        setActivePlanInterval(null);
      }
      return;
    }

    if (!planGrouping.grouped.has(activePlanInterval)) {
      setActivePlanInterval(planGrouping.order[0]);
    }
  }, [planGrouping, activePlanInterval]);

  useEffect(() => {
    if (activeTab !== 'subscribe') {
      return;
    }

    if (activePlanView === 'benefits') {
      return;
    }

    if (!activePlanView.startsWith(PLAN_VIEW_PREFIX)) {
      setActivePlanView('benefits');
      return;
    }

    const interval = Number(activePlanView.replace(PLAN_VIEW_PREFIX, ''));
    if (Number.isNaN(interval) || !planGrouping.grouped.has(interval)) {
      const fallback = planGrouping.order[0];
      setActivePlanView(fallback ? `${PLAN_VIEW_PREFIX}${fallback}` : 'benefits');
    }
  }, [activePlanView, activeTab, planGrouping]);

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!redirecting) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setRedirecting(null);
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [redirecting]);

  const loadSubscriptionData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);

    try {
      const { subscription: sub } = await getUserSubscription(user.id);
      setSubscription(sub);

      const { plans: plansData } = await getSubscriptionPlans(user?.type);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.type]);

  const handleSelectPlan = (plan) => {
    if (!user) {
      alert(translate('subscription.loginRequired', 'Please log in to subscribe'));
      return;
    }

    setRedirecting(plan.id);

    if (plan.stripe_payment_link) {
      setTimeout(() => {
        window.location.href = plan.stripe_payment_link;
      }, 600);
    } else {
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

  const getIntervalLabel = useCallback(
    (interval) => {
      switch (interval) {
        case 1:
          return translate('subscription.interval.monthly', 'Monthly');
        case 3:
          return translate('subscription.interval.quarterly', 'Quarterly');
        case 12:
          return translate('subscription.interval.yearly', 'Yearly');
        default:
          return translate('subscription.interval.months', 'Every {{count}} months', {
            count: interval,
          });
      }
    },
    [translate]
  );

  const formatPricePerMonth = useCallback(
    (amount, currency) => {
      const price = formatPrice(amount, currency);
      const monthLabel = translate('subscription.periodLabel', 'Mo');
      return `${price}/${monthLabel}`;
    },
    [translate]
  );

  const resolveDisplayPrice = useCallback(
    (interval) => {
      const plansForInterval = planGrouping.grouped.get(interval);
      if (plansForInterval && plansForInterval.length > 0) {
        const samplePlan = plansForInterval[0];
        const monthlyPrice = samplePlan.price_cents / samplePlan.billing_interval;
        return formatPricePerMonth(monthlyPrice, samplePlan.currency);
      }

      switch (interval) {
        case 1:
          return translate('subscription.displayPrice.monthly', 'CHF 7.90/Mo');
        case 3:
          return translate('subscription.displayPrice.quarterly', 'CHF 20.00/Mo');
        case 12:
          return translate('subscription.displayPrice.yearly', 'CHF 75.00/Mo');
        default:
          return translate('subscription.displayPrice.generic', 'CHF {{amount}}/Mo', { amount: interval });
      }
    },
    [planGrouping, translate, formatPricePerMonth]
  );

  const getSavingsPercentage = (plan) => {
    if (plan.billing_interval === 1) return 0;

    const monthlyPlan = plans.find((p) => p.billing_interval === 1);
    if (!monthlyPlan) return 0;

    return calculateSavings(monthlyPlan.price_cents, plan.price_cents, plan.billing_interval);
  };

  const isCurrentPlan = (plan) => subscription && subscription.plan_id === plan.id;

  const isPlanRecommended = (plan) => plan.billing_interval === 3;

  const parsedPlanViewInterval = useMemo(() => {
    if (!activePlanView.startsWith(PLAN_VIEW_PREFIX)) {
      return null;
    }
    const interval = Number(activePlanView.replace(PLAN_VIEW_PREFIX, ''));
    return Number.isFinite(interval) ? interval : null;
  }, [activePlanView]);

  const activePlans = useMemo(() => {
    if (!parsedPlanViewInterval) {
      return [];
    }

    const plansForInterval = planGrouping.grouped.get(parsedPlanViewInterval);
    return Array.isArray(plansForInterval) ? plansForInterval : [];
  }, [planGrouping, parsedPlanViewInterval]);

  if (loading) {
    return (
      <div className="ssc__subscription-view ssc__subscription-view--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('subscription.loading', 'Loading subscription...')}</p>
      </div>
    );
  }

  const subscribeTabId = 'subscription-tab-subscribe';
  const benefitsTabId = 'subscription-tab-benefits';
  const manageTabId = 'subscription-tab-manage';
  const subscribePanelId = 'subscription-panel-subscribe';
  const benefitsPanelId = 'subscription-panel-benefits';
  const managePanelId = 'subscription-panel-manage';

  return (
    <div className="ssc__subscription-view">
      {redirecting && (
        <div className="ssc__subscription-redirect-notification">
          <div className="ssc__subscription-redirect-notification__content">
            <div className="ssc__subscription-redirect-notification__spinner">
              <Loader size={20} className="ssc__spinner-icon" />
            </div>
            <div className="ssc__subscription-redirect-notification__text">
              <strong>{translate('subscription.redirecting.title', 'Redirecting to Stripe...')}</strong>
              <p>
                {translate(
                  'subscription.redirecting.message',
                  'You will be securely redirected to complete your payment'
                )}
              </p>
            </div>
            <Sparkles size={24} color="#f59e0b" />
          </div>
        </div>
      )}

      <TestModeBanner translate={translate} />

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

      <div
        className="ssc__profile-tabs ssc__subscription-tabs"
        role="tablist"
        aria-label={translate('subscription.tabs.ariaLabel', 'Subscription sections')}
      >
        <button
          type="button"
          role="tab"
          id={subscribeTabId}
          aria-controls={subscribePanelId}
          aria-selected={activeTab === 'subscribe'}
          className={`ssc__profile-tab ${activeTab === 'subscribe' ? 'ssc__profile-tab--active' : ''}`}
          onClick={() => setActiveTab('subscribe')}
        >
          <Crown size={16} />
          {translate('subscription.tabs.subscribe', 'Subscribe')}
        </button>
        <button
          type="button"
          role="tab"
          id={benefitsTabId}
          aria-controls={benefitsPanelId}
          aria-selected={activeTab === 'benefits'}
          className={`ssc__profile-tab ${activeTab === 'benefits' ? 'ssc__profile-tab--active' : ''}`}
          onClick={() => setActiveTab('benefits')}
        >
          <Sparkles size={16} />
          {translate('subscription.tabs.benefits', 'Benefits')}
        </button>
        {subscription && (
          <button
            type="button"
            role="tab"
            id={manageTabId}
            aria-controls={managePanelId}
            aria-selected={activeTab === 'manage'}
            className={`ssc__profile-tab ${activeTab === 'manage' ? 'ssc__profile-tab--active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <CreditCard size={16} />
            {translate('subscription.tabs.manage', 'Manage')}
          </button>
        )}
      </div>

      <div className="ssc__subscription-content">
        {activeTab === 'subscribe' && (
          <div
            id={subscribePanelId}
            role="tabpanel"
            aria-labelledby={subscribeTabId}
            className="ssc__subscription-subscribe-tab"
            tabIndex={0}
          >
            {subscription && (
              <div className="ssc__current-subscription-banner">
                <div className="ssc__current-subscription-banner__content">
                  <Crown size={24} color="#fff" />
                  <div>
                    <strong>
                      {translate('subscription.currentPlan', 'Current Plan')}: {subscription.plan?.name}
                    </strong>
                    <p>
                      {translate('subscription.renewsOn', 'Renews on')}{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className="ssc__subscription-plan-switcher"
              role="tablist"
              aria-label={translate('subscription.planTabs.label', 'Select a billing option')}
            >
              <button
                type="button"
                role="tab"
                className={`ssc__subscription-plan-switcher__button ${
                  activePlanView === 'benefits' ? 'is-active' : ''
                }`}
                aria-selected={activePlanView === 'benefits'}
                onClick={() => setActivePlanView('benefits')}
              >
                <span className="ssc__subscription-plan-switcher__icon">
                  <Sparkle size={18} />
                </span>
                <span className="ssc__subscription-plan-switcher__text">
                  {translate('subscription.planSwitcher.benefits', 'Benefits overview')}
                </span>
              </button>

              {planGrouping.order.map((interval) => {
                const viewKey = `${PLAN_VIEW_PREFIX}${interval}`;
                const isActive = activePlanView === viewKey;
                return (
                  <button
                    key={interval}
                    type="button"
                    role="tab"
                    className={`ssc__subscription-plan-switcher__button ${isActive ? 'is-active' : ''}`}
                    aria-selected={isActive}
                    onClick={() => {
                      setActivePlanInterval(interval);
                      setActivePlanView(viewKey);
                    }}
                  >
                    <span className="ssc__subscription-plan-switcher__label">{getIntervalLabel(interval)}</span>
                    <span className="ssc__subscription-plan-switcher__price">{resolveDisplayPrice(interval)}</span>
                  </button>
                );
              })}
            </div>

            <div className="ssc__subscription-plan-view">
              {activePlanView === 'benefits' ? (
                <div className="ssc__subscription-benefits-showcase">
                  <div className="ssc__subscription-benefits-showcase__intro">
                    <span className="ssc__subscription-benefits-showcase__badge">
                      <Sparkles size={16} />
                      {translate('subscription.overview.badge', 'Premium benefits')}
                    </span>
                    <h3>{translate('subscription.choosePlan', 'Choose Your Plan')}</h3>
                    <p>
                      {translate(
                        'subscription.overview.description',
                        'Unlock the Swiss Startup Connect premium experience with every option below.'
                      )}
                    </p>
                  </div>

                  <div className="ssc__subscription-benefits-showcase__grid">
                    {benefitCards.map(({ icon: Icon, titleKey, titleFallback, descriptionKey, descriptionFallback }) => (
                      <article className="ssc__subscription-benefit-card" key={titleKey}>
                        <div className="ssc__subscription-benefit-card__icon" aria-hidden="true">
                          <Icon size={20} />
                        </div>
                        <h4>{translate(titleKey, titleFallback)}</h4>
                        <p>{translate(descriptionKey, descriptionFallback)}</p>
                      </article>
                    ))}
                  </div>

                  <div className="ssc__subscription-benefits-showcase__footer">
                    <div className="ssc__subscription-guarantee">
                      <Check size={20} />
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
                    <div className="ssc__subscription-secure">
                      <CreditCard size={18} />
                      <span>
                        {translate(
                          'subscription.securePayment.label',
                          'Secure payment powered by Stripe. Your information stays encrypted.'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ssc__subscription-plan-cards" role="tabpanel">
                  {parsedPlanViewInterval && activePlans.length > 0 ? (
                    activePlans.map((plan) => {
                      const monthlyPrice = plan.price_cents / plan.billing_interval;
                      const monthlyDisplay = formatPricePerMonth(monthlyPrice, plan.currency);
                      const savings = getSavingsPercentage(plan);
                      const recommended = isPlanRecommended(plan);
                      const current = isCurrentPlan(plan);
                      const isRedirecting = redirecting === plan.id;
                      const intervalLabel = getIntervalLabel(plan.billing_interval);

                      return (
                        <article
                          key={plan.id}
                          className={`ssc__subscription-plan-card ${
                            recommended ? 'ssc__subscription-plan-card--recommended' : ''
                          } ${current ? 'ssc__subscription-plan-card--current' : ''}`}
                        >
                          <header className="ssc__subscription-plan-card__header">
                            <span className="ssc__subscription-plan-card__interval">{intervalLabel}</span>
                            <h4 className="ssc__subscription-plan-card__name">{plan.name}</h4>
                          </header>

                          <div className="ssc__subscription-plan-card__pricing">
                            <span className="ssc__subscription-plan-card__amount">{monthlyDisplay}</span>
                          </div>

                          {plan.billing_interval > 1 && (
                            <div className="ssc__subscription-plan-card__total">
                              {formatPrice(plan.price_cents, plan.currency)}{' '}
                              {plan.billing_interval === 3
                                ? translate('subscription.perQuarter', 'per quarter')
                                : translate('subscription.perYear', 'per year')}
                            </div>
                          )}

                          <ul className="ssc__subscription-plan-card__features">
                            {planFeatureList.map(({ key, fallback }) => (
                              <li key={key}>
                                <Check size={16} />
                                {translate(key, fallback)}
                              </li>
                            ))}
                          </ul>

                          {savings > 0 && (
                            <span className="ssc__subscription-plan-card__badge">
                              <Zap size={14} />
                              {translate('subscription.save', 'Save')} {savings}%
                            </span>
                          )}

                          {current && (
                            <span className="ssc__subscription-plan-card__badge is-current">
                              <Check size={14} />
                              {translate('subscription.currentPlan', 'Current Plan')}
                            </span>
                          )}

                          <div className="ssc__subscription-plan-card__actions">
                            <button
                              type="button"
                              className={`ssc__btn ssc__btn--primary ${isRedirecting ? 'is-loading' : ''}`}
                              onClick={() => handleSelectPlan(plan)}
                              disabled={isRedirecting}
                            >
                              {isRedirecting ? (
                                <>
                                  <Loader size={16} className="ssc__spinner-icon" />
                                  {translate('subscription.redirecting.short', 'Redirecting...')}
                                </>
                              ) : current ? (
                                <>
                                  <Check size={16} />
                                  {translate('subscription.currentPlan', 'Current Plan')}
                                </>
                              ) : (
                                <>
                                  <ArrowRight size={16} />
                                  {translate('subscription.selectPlan', 'Select Plan')}
                                </>
                              )}
                            </button>

                            {!current && (
                              <button
                                type="button"
                                className="ssc__btn ssc__btn--link"
                                onClick={() => handleSelectPlan(plan)}
                              >
                                <CreditCard size={16} />
                                {translate('subscription.payWithStripe', 'Checkout with Stripe')}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="ssc__subscription-no-plans">
                      <p>{translate('subscription.noPlans', 'No plans available at the moment.')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div
            id={benefitsPanelId}
            role="tabpanel"
            aria-labelledby={benefitsTabId}
            className="ssc__subscription-benefits-tab"
            tabIndex={0}
          >
            <div className="ssc__subscription-benefits-hero">
              <div className="ssc__subscription-benefits-hero__copy">
                <span className="ssc__subscription-benefits-hero__eyebrow">
                  <Sparkles size={16} />
                  {translate('subscription.benefits.eyebrow', 'Premium advantages')}
                </span>
                <h3>{translate('subscription.benefits.title', 'Everything premium unlocks for you')}</h3>
                <p>
                  {translate(
                    'subscription.benefits.lead',
                    'Premium keeps your profile in the spotlight, delivers insights in real time and accelerates hiring connections.'
                  )}
                </p>
              </div>
              <div className="ssc__subscription-benefits-hero__cta">
                <button
                  type="button"
                  className="ssc__btn ssc__btn--primary"
                  onClick={() => setActiveTab('subscribe')}
                >
                  <ArrowRight size={16} />
                  {translate('subscription.benefits.cta', 'Pick your plan')}
                </button>
                <span>{translate('subscription.benefits.backed', 'Backed by secure Stripe checkout')}</span>
              </div>
            </div>

            <div className="ssc__subscription-benefits-cards">
              {benefitCards.map(({ icon: Icon, titleKey, titleFallback, descriptionKey, descriptionFallback }) => (
                <article className="ssc__subscription-benefits-card" key={`benefit-${titleKey}`}>
                  <Icon size={24} />
                  <h4>{translate(titleKey, titleFallback)}</h4>
                  <p>{translate(descriptionKey, descriptionFallback)}</p>
                </article>
              ))}
            </div>

            <div className="ssc__subscription-benefits-footer">
              <div className="ssc__subscription-guarantee">
                <Check size={24} />
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
              <div className="ssc__subscription-secure">
                <CreditCard size={18} />
                <span>
                  {translate(
                    'subscription.securePayment.label',
                    'Secure payment powered by Stripe. Your information stays encrypted.'
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && subscription && (
          <div
            id={managePanelId}
            role="tabpanel"
            aria-labelledby={manageTabId}
            className="ssc__subscription-manage-tab"
            tabIndex={0}
          >
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
