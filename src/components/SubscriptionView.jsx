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
} from 'lucide-react';
import {
  getUserSubscription,
  getSubscriptionPlans,
  formatPrice,
  createCustomerPortalSession,
} from '../services/stripeService';
import SubscriptionPlans from './SubscriptionPlans';
import SubscriptionManager from './SubscriptionManager';

/**
 * SubscriptionView Component
 * Shows subscription status or upgrade options in profile settings
 */
const SubscriptionView = ({ user, translate }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);

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

      // Load plans if no subscription
      if (!sub) {
        const { plans: plansData } = await getSubscriptionPlans();
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    setShowPlans(true);
  };

  const handleClosePlans = () => {
    setShowPlans(false);
    // Reload subscription in case user subscribed
    loadSubscriptionData();
  };

  if (loading) {
    return (
      <div className="ssc__subscription-view ssc__subscription-view--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('subscription.loading', 'Loading subscription...')}</p>
      </div>
    );
  }

  // Show plans upgrade view if user clicked upgrade or if showing plans
  if (showPlans) {
    return (
      <div className="ssc__subscription-view">
        <button
          type="button"
          className="ssc__btn ssc__btn--ghost ssc__subscription-view__back"
          onClick={handleClosePlans}
        >
          ← {translate('subscription.back', 'Back to overview')}
        </button>
        <SubscriptionPlans user={user} translate={translate} />
      </div>
    );
  }

  // If user has a subscription, show manager
  if (subscription) {
    return (
      <div className="ssc__subscription-view">
        <SubscriptionManager user={user} translate={translate} onUpgrade={handleUpgrade} />
      </div>
    );
  }

  // No subscription - show benefits and upgrade options
  return (
    <div className="ssc__subscription-view ssc__subscription-view--no-sub">
      {/* Header */}
      <div className="ssc__subscription-view__header">
        <Crown size={48} color="#f59e0b" />
        <h2>{translate('subscription.upgrade.title', 'Upgrade to Premium')}</h2>
        <p className="ssc__subscription-view__subtitle">
          {translate(
            'subscription.upgrade.subtitle',
            'Unlock powerful features to boost your career or hiring success'
          )}
        </p>
      </div>

      {/* Benefits */}
      <div className="ssc__subscription-benefits">
        <h3>{translate('subscription.benefits.title', 'What You Get')}</h3>
        
        <div className="ssc__subscription-benefits__list">
          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#eff6ff' }}>
              <Eye size={24} color="#3b82f6" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.profileViews.title', 'See Who Viewed Your Profile')}</h4>
              <p>
                {translate(
                  'subscription.benefit.profileViews.desc',
                  'Get insights into who is interested in your profile and track your visibility'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#f0fdf4' }}>
              <Search size={24} color="#10b981" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.searches.title', 'Track Search Appearances')}</h4>
              <p>
                {translate(
                  'subscription.benefit.searches.desc',
                  'See when and where your profile appears in employer searches'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#fef3c7' }}>
              <TrendingUp size={24} color="#f59e0b" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.visibility.title', 'Enhanced Visibility')}</h4>
              <p>
                {translate(
                  'subscription.benefit.visibility.desc',
                  'Get priority placement in search results and stand out to employers'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#fef2f2' }}>
              <X size={24} color="#ef4444" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.noAds.title', 'Ad-Free Experience')}</h4>
              <p>
                {translate(
                  'subscription.benefit.noAds.desc',
                  'Browse jobs and companies without any distractions'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#fdf4ff' }}>
              <BarChart3 size={24} color="#a855f7" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.analytics.title', 'Advanced Analytics')}</h4>
              <p>
                {translate(
                  'subscription.benefit.analytics.desc',
                  'Get detailed insights into your job search performance and engagement'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__subscription-benefit">
            <div className="ssc__subscription-benefit__icon" style={{ background: '#eff6ff' }}>
              <Sparkles size={24} color="#3b82f6" />
            </div>
            <div className="ssc__subscription-benefit__content">
              <h4>{translate('subscription.benefit.premium.title', 'Premium Badge')}</h4>
              <p>
                {translate(
                  'subscription.benefit.premium.desc',
                  'Display a premium badge on your profile to show commitment to your career'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="ssc__subscription-pricing-preview">
        <h3>{translate('subscription.pricing.title', 'Flexible Pricing Plans')}</h3>
        
        {plans.length > 0 && (
          <div className="ssc__subscription-pricing-cards">
            {plans.slice(0, 3).map((plan) => {
              const monthlyPrice = plan.price_cents / plan.billing_interval;
              const isRecommended = plan.billing_interval === 3;

              return (
                <div
                  key={plan.id}
                  className={`ssc__subscription-pricing-card ${
                    isRecommended ? 'ssc__subscription-pricing-card--recommended' : ''
                  }`}
                >
                  {isRecommended && (
                    <div className="ssc__subscription-pricing-card__badge">
                      {translate('subscription.bestValue', 'Best Value')}
                    </div>
                  )}
                  
                  <h4>{plan.name}</h4>
                  
                  <div className="ssc__subscription-pricing-card__price">
                    <span className="ssc__subscription-pricing-card__amount">
                      {formatPrice(monthlyPrice, plan.currency)}
                    </span>
                    <span className="ssc__subscription-pricing-card__period">
                      /{translate('subscription.month', 'month')}
                    </span>
                  </div>

                  {plan.billing_interval > 1 && (
                    <div className="ssc__subscription-pricing-card__billing">
                      {formatPrice(plan.price_cents, plan.currency)}{' '}
                      {translate(
                        `subscription.billed${plan.billing_interval}Months`,
                        `billed every ${plan.billing_interval} months`
                      )}
                    </div>
                  )}

                  <ul className="ssc__subscription-pricing-card__features">
                    <li>
                      <Check size={14} />
                      <span>{translate('subscription.feature.allBenefits', 'All premium benefits')}</span>
                    </li>
                    <li>
                      <Check size={14} />
                      <span>{translate('subscription.feature.cancelAnytime', 'Cancel anytime')}</span>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="ssc__btn ssc__btn--primary ssc__btn--large"
          onClick={handleUpgrade}
        >
          <Crown size={20} />
          {translate('subscription.viewAllPlans', 'View All Plans & Upgrade')}
        </button>
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
  );
};

export default SubscriptionView;

