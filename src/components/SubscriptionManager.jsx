import React, { useState, useEffect } from 'react';
import {
  Crown,
  CreditCard,
  Calendar,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  Search,
  Users,
} from 'lucide-react';
import {
  getUserSubscription,
  getPaymentTransactions,
  createCustomerPortalSession,
  getProfileViews,
  getProfileSearchAppearances,
  formatPrice,
} from '../services/stripeService';

/**
 * SubscriptionManager Component
 * Manage active subscription and view premium features
 */
const SubscriptionManager = ({ user, translate, onUpgrade }) => {
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profileViews, setProfileViews] = useState([]);
  const [searchAppearances, setSearchAppearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'billing', 'views', 'searches'

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    setLoading(true);

    // Load subscription
    const { subscription: sub } = await getUserSubscription(user.id);
    setSubscription(sub);

    // Load billing history
    const { transactions: trans } = await getPaymentTransactions(user.id);
    setTransactions(trans);

    // Load premium features if subscribed
    if (sub) {
      // Load profile views
      const { views } = await getProfileViews(user.id, 20);
      setProfileViews(views);

      // Load search appearances
      const { appearances } = await getProfileSearchAppearances(user.id, 20);
      setSearchAppearances(appearances);
    }

    setLoading(false);
  };

  const handleManageBilling = async () => {
    await createCustomerPortalSession(user.id);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#10b981', label: translate('subscription.status.active', 'Active') },
      canceled: { color: '#6b7280', label: translate('subscription.status.canceled', 'Canceled') },
      past_due: { color: '#ef4444', label: translate('subscription.status.pastDue', 'Past Due') },
      trialing: { color: '#3b82f6', label: translate('subscription.status.trialing', 'Trial') },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className="ssc__status-badge"
        style={{ background: `${config.color}20`, color: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return translate('subscription.today', 'Today');
    if (diffDays === 1) return translate('subscription.yesterday', 'Yesterday');
    if (diffDays < 7) return `${diffDays} ${translate('subscription.daysAgo', 'days ago')}`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${translate('subscription.weeksAgo', 'weeks ago')}`;
    return `${Math.floor(diffDays / 30)} ${translate('subscription.monthsAgo', 'months ago')}`;
  };

  if (loading) {
    return (
      <div className="ssc__subscription-manager ssc__subscription-manager--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('subscription.loading', 'Loading subscription...')}</p>
      </div>
    );
  }

  // No subscription - show upgrade prompt
  if (!subscription) {
    return (
      <div className="ssc__subscription-manager ssc__subscription-manager--no-sub">
        <Crown size={64} className="ssc__icon--muted" />
        <h3>{translate('subscription.noSub.title', 'No Active Subscription')}</h3>
        <p>
          {translate(
            'subscription.noSub.description',
            'Upgrade to Premium to unlock exclusive features and boost your visibility'
          )}
        </p>
        <button
          type="button"
          className="ssc__btn ssc__btn--primary"
          onClick={onUpgrade}
        >
          <Crown size={16} />
          {translate('subscription.viewPlans', 'View Premium Plans')}
        </button>
      </div>
    );
  }

  return (
    <div className="ssc__subscription-manager">
      {/* Header */}
      <div className="ssc__subscription-manager__header">
        <div>
          <h2>
            <Crown className="ssc__icon" size={24} color="#f59e0b" />
            {translate('subscription.manager.title', 'Premium Subscription')}
          </h2>
          <p className="ssc__subscription-manager__subtitle">
            {translate('subscription.manager.subtitle', 'Manage your premium features and billing')}
          </p>
        </div>
        {getStatusBadge(subscription.status)}
      </div>

      {/* Tabs */}
      <div className="ssc__subscription-manager__tabs">
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'overview' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <Crown size={16} />
          {translate('subscription.tabs.overview', 'Overview')}
        </button>
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'billing' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('billing')}
        >
          <CreditCard size={16} />
          {translate('subscription.tabs.billing', 'Billing')}
        </button>
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'views' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('views')}
        >
          <Eye size={16} />
          {translate('subscription.tabs.profileViews', 'Profile Views')}
        </button>
        <button
          type="button"
          className={`ssc__subscription-manager__tab ${
            activeTab === 'searches' ? 'ssc__subscription-manager__tab--active' : ''
          }`}
          onClick={() => setActiveTab('searches')}
        >
          <Search size={16} />
          {translate('subscription.tabs.searches', 'Searches')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="ssc__subscription-manager__content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="ssc__subscription-overview">
            {/* Subscription Card */}
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
                    <strong>{formatDate(subscription.current_period_end)}</strong>
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

              {subscription.cancel_at_period_end && (
                <div className="ssc__subscription-card__warning">
                  <AlertCircle size={16} />
                  <span>
                    {translate(
                      'subscription.canceledAtPeriodEnd',
                      'Your subscription will end on {date}'
                    ).replace('{date}', formatDate(subscription.current_period_end))}
                  </span>
                </div>
              )}

              <button
                type="button"
                className="ssc__btn ssc__btn--secondary ssc__subscription-card__manage"
                onClick={handleManageBilling}
              >
                <ExternalLink size={16} />
                {translate('subscription.manageBilling', 'Manage Billing')}
              </button>
            </div>

            {/* Features */}
            <div className="ssc__subscription-features-active">
              <h3>{translate('subscription.activeFeatures', 'Active Features')}</h3>
              <ul>
                {Object.entries(subscription.plan?.features || {})
                  .filter(([_, enabled]) => enabled)
                  .map(([feature, _]) => (
                    <li key={feature}>
                      <Check size={16} color="#10b981" />
                      <span>
                        {translate(
                          `subscription.feature.${feature}`,
                          feature.replace(/_/g, ' ')
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="ssc__subscription-billing">
            <h3>{translate('subscription.billingHistory', 'Billing History')}</h3>

            {transactions.length === 0 ? (
              <div className="ssc__subscription-billing__empty">
                <CreditCard size={48} className="ssc__icon--muted" />
                <p>{translate('subscription.noTransactions', 'No transactions yet')}</p>
              </div>
            ) : (
              <div className="ssc__subscription-billing__list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="ssc__subscription-billing__item">
                    <div className="ssc__subscription-billing__item-info">
                      <strong>{formatDate(transaction.created_at)}</strong>
                      <p>{transaction.description || 'Subscription payment'}</p>
                    </div>
                    <div className="ssc__subscription-billing__item-amount">
                      <strong>{formatPrice(transaction.amount_cents, transaction.currency)}</strong>
                      <span
                        className={`ssc__subscription-billing__status ssc__subscription-billing__status--${transaction.status}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Views Tab */}
        {activeTab === 'views' && (
          <div className="ssc__subscription-profile-views">
            <h3>{translate('subscription.profileViews.title', 'Who Viewed Your Profile')}</h3>
            <p className="ssc__subscription-profile-views__subtitle">
              {translate(
                'subscription.profileViews.subtitle',
                'See who viewed your profile in the last 30 days'
              )}
            </p>

            {profileViews.length === 0 ? (
              <div className="ssc__subscription-profile-views__empty">
                <Eye size={48} className="ssc__icon--muted" />
                <p>{translate('subscription.profileViews.empty', 'No profile views yet')}</p>
              </div>
            ) : (
              <div className="ssc__subscription-profile-views__list">
                {profileViews.map((view) => (
                  <div key={view.id} className="ssc__subscription-profile-view-item">
                    <div className="ssc__subscription-profile-view-item__avatar">
                      <Users size={24} />
                    </div>
                    <div className="ssc__subscription-profile-view-item__info">
                      <strong>
                        {view.viewer?.name || view.viewer_company_name || 'Anonymous'}
                      </strong>
                      <p>
                        {view.viewer_type === 'startup' && view.viewer_company_name ? (
                          <>{view.viewer_company_name}</>
                        ) : (
                          <>{view.viewer_type || 'Visitor'}</>
                        )}
                        {view.referrer_source && ` • ${view.referrer_source}`}
                      </p>
                    </div>
                    <div className="ssc__subscription-profile-view-item__time">
                      {getTimeAgo(view.viewed_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Searches Tab */}
        {activeTab === 'searches' && (
          <div className="ssc__subscription-search-appearances">
            <h3>{translate('subscription.searches.title', 'Search Appearances')}</h3>
            <p className="ssc__subscription-search-appearances__subtitle">
              {translate(
                'subscription.searches.subtitle',
                'See when and where your profile appeared in searches'
              )}
            </p>

            {searchAppearances.length === 0 ? (
              <div className="ssc__subscription-search-appearances__empty">
                <Search size={48} className="ssc__icon--muted" />
                <p>{translate('subscription.searches.empty', 'No search appearances yet')}</p>
              </div>
            ) : (
              <div className="ssc__subscription-search-appearances__list">
                {searchAppearances.map((appearance) => (
                  <div key={appearance.id} className="ssc__subscription-search-appearance-item">
                    <div className="ssc__subscription-search-appearance-item__position">
                      #{appearance.search_position}
                    </div>
                    <div className="ssc__subscription-search-appearance-item__info">
                      <strong>
                        {appearance.search_query || translate('subscription.searches.untitledSearch', 'Search')}
                      </strong>
                      <p>
                        {appearance.searcher?.name || translate('subscription.searches.anonymous', 'Anonymous searcher')}
                        {appearance.was_clicked && (
                          <span className="ssc__subscription-search-appearance-item__clicked">
                            <Check size={14} />
                            {translate('subscription.searches.clicked', 'Clicked')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="ssc__subscription-search-appearance-item__time">
                      {getTimeAgo(appearance.appeared_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;

