import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Sparkles,
  Check,
  Crown,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  getEmployerFeatures,
  getUserFeatures,
  redirectToCheckout,
  formatPrice,
} from '../services/stripeService';
import TestModeBanner from './TestModeBanner';
import './TestModeBanner.css';
import './Subscription.css';

/**
 * EmployerFeatures Component
 * Displays à la carte features for employers/startups
 */
const EmployerFeatures = ({ user, translate, onClose }) => {
  const [features, setFeatures] = useState([]);
  const [userFeatures, setUserFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);

    // Load available features
    const { features: availableFeatures } = await getEmployerFeatures();
    setFeatures(availableFeatures);

    // Load user's current features
    if (user?.id) {
      const { features: currentFeatures } = await getUserFeatures(user.id);
      setUserFeatures(currentFeatures);
    }

    setLoading(false);
  };

  const handlePurchase = async (feature) => {
    if (!user) {
      alert(translate('features.loginRequired', 'Please log in to purchase'));
      return;
    }

    setPurchasing(feature.id);

    try {
      const isOneTime = feature.metadata?.is_one_time || false;
      
      await redirectToCheckout(user.id, feature.id, user.email, {
        isOneTime,
        successUrl: `${window.location.origin}/employer/dashboard`,
        cancelUrl: `${window.location.origin}/employer/features`,
      });
    } catch (error) {
      console.error('Purchase error:', error);
      alert(translate('features.error', 'Failed to start checkout. Please try again.'));
      setPurchasing(null);
    }
  };

  const getFeatureIcon = (featureType) => {
    const icons = {
      analytics: <BarChart3 size={32} color="#3b82f6" />,
      talent_search: <Search size={32} color="#10b981" />,
      featured_job: <Sparkles size={32} color="#f59e0b" />,
    };
    return icons[featureType] || <Crown size={32} />;
  };

  const getFeatureDetails = (featureName) => {
    const details = {
      employer_analytics: {
        icon: getFeatureIcon('analytics'),
        title: translate('features.analytics.title', 'Analytics Dashboard'),
        shortDesc: translate('features.analytics.short', 'Track your hiring performance'),
        benefits: [
          translate('features.analytics.benefit1', 'Job performance metrics'),
          translate('features.analytics.benefit2', 'Applicant funnel tracking'),
          translate('features.analytics.benefit3', 'Source attribution'),
          translate('features.analytics.benefit4', 'Export detailed reports'),
          translate('features.analytics.benefit5', 'Competitor insights'),
        ],
        cta: translate('features.analytics.cta', 'Enable Analytics'),
        color: '#3b82f6',
      },
      employer_talent_search: {
        icon: getFeatureIcon('talent_search'),
        title: translate('features.talentSearch.title', 'Talent Search Access'),
        shortDesc: translate('features.talentSearch.short', 'Find perfect candidates'),
        benefits: [
          translate('features.talentSearch.benefit1', 'Search unlimited student profiles'),
          translate('features.talentSearch.benefit2', 'View detailed profiles & resumes'),
          translate('features.talentSearch.benefit3', 'Contact students directly'),
          translate('features.talentSearch.benefit4', 'Save candidate lists'),
          translate('features.talentSearch.benefit5', 'Advanced filters & matching'),
        ],
        cta: translate('features.talentSearch.cta', 'Unlock Talent Search'),
        color: '#10b981',
      },
      employer_featured_job: {
        icon: getFeatureIcon('featured_job'),
        title: translate('features.featuredJob.title', 'Featured Job in Alerts'),
        shortDesc: translate('features.featuredJob.short', 'Maximum visibility for your posting'),
        benefits: [
          translate('features.featuredJob.benefit1', 'Featured in email alerts to candidates'),
          translate('features.featuredJob.benefit2', 'Priority placement on homepage'),
          translate('features.featuredJob.benefit3', 'Highlighted in search results'),
          translate('features.featuredJob.benefit4', '30-day feature duration'),
          translate('features.featuredJob.benefit5', '3-5x more applications'),
        ],
        cta: translate('features.featuredJob.cta', 'Feature a Job'),
        color: '#f59e0b',
        isOneTime: true,
      },
    };
    return details[featureName] || {};
  };

  const hasFeature = (featureName) => {
    // Check if user has any of the features from this plan
    const plan = features.find(f => f.plan_id === featureName);
    if (!plan?.features) return false;

    return Object.keys(plan.features).some(key => userFeatures[key] === true);
  };

  if (loading) {
    return (
      <div className="ssc__employer-features ssc__employer-features--loading">
        <div className="ssc__spinner"></div>
        <p>{translate('features.loading', 'Loading features...')}</p>
      </div>
    );
  }

  return (
    <div className="ssc__employer-features">
      {/* Test Mode Banner */}
      <TestModeBanner translate={translate} />

      {/* Header */}
      <div className="ssc__employer-features__header">
        <TrendingUp className="ssc__icon" size={32} color="#3b82f6" />
        <h2>{translate('features.title', 'Employer Features')}</h2>
        <p className="ssc__employer-features__subtitle">
          {translate(
            'features.subtitle',
            'Choose the features that help you find and hire the best talent'
          )}
        </p>
      </div>

      {/* À la carte Features */}
      <div className="ssc__employer-features__grid">
        {features.map((feature) => {
          const details = getFeatureDetails(feature.plan_id);
          const active = hasFeature(feature.plan_id);
          const isOneTime = feature.metadata?.is_one_time || false;

          return (
            <div
              key={feature.id}
              className={`ssc__employer-feature-card ${
                active ? 'ssc__employer-feature-card--active' : ''
              }`}
              style={{ borderColor: active ? details.color : undefined }}
            >
              {/* Active Badge */}
              {active && (
                <div
                  className="ssc__employer-feature-card__badge"
                  style={{ background: details.color }}
                >
                  <Check size={14} />
                  {translate('features.active', 'Active')}
                </div>
              )}

              {/* Icon */}
              <div className="ssc__employer-feature-card__icon">{details.icon}</div>

              {/* Title */}
              <h3 className="ssc__employer-feature-card__title">{feature.name}</h3>

              {/* Short Description */}
              <p className="ssc__employer-feature-card__desc">{details.shortDesc}</p>

              {/* Pricing */}
              <div className="ssc__employer-feature-card__pricing">
                <div className="ssc__employer-feature-card__price">
                  {formatPrice(feature.price_cents, feature.currency)}
                </div>
                <div className="ssc__employer-feature-card__period">
                  {isOneTime ? (
                    <>
                      <Zap size={14} />
                      {translate('features.oneTime', 'per posting')}
                    </>
                  ) : (
                    <>
                      <Calendar size={14} />
                      {translate('features.perMonth', 'per month')}
                    </>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <ul className="ssc__employer-feature-card__benefits">
                {details.benefits?.map((benefit, index) => (
                  <li key={index}>
                    <Check size={16} color={details.color} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                type="button"
                className={`ssc__btn ${
                  active ? 'ssc__btn--secondary' : 'ssc__btn--primary'
                } ssc__employer-feature-card__cta`}
                style={{
                  background: !active ? details.color : undefined,
                }}
                onClick={() => handlePurchase(feature)}
                disabled={purchasing === feature.id || active}
              >
                {purchasing === feature.id ? (
                  <>
                    <div className="ssc__spinner ssc__spinner--small"></div>
                    {translate('features.processing', 'Processing...')}
                  </>
                ) : active ? (
                  <>
                    <Check size={16} />
                    {translate('features.subscribed', 'Active')}
                  </>
                ) : (
                  <>
                    {isOneTime ? <Sparkles size={16} /> : <Crown size={16} />}
                    {details.cta}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Why Upgrade Section */}
      <div className="ssc__employer-features__why">
        <h3>{translate('features.why.title', 'Why invest in premium features?')}</h3>
        <div className="ssc__employer-features__why-grid">
          <div className="ssc__employer-features__why-item">
            <Users size={24} color="#3b82f6" />
            <h4>{translate('features.why.quality.title', 'Better Candidates')}</h4>
            <p>
              {translate(
                'features.why.quality.desc',
                'Reach qualified candidates faster with targeted features'
              )}
            </p>
          </div>

          <div className="ssc__employer-features__why-item">
            <TrendingUp size={24} color="#10b981" />
            <h4>{translate('features.why.faster.title', 'Hire Faster')}</h4>
            <p>
              {translate(
                'features.why.faster.desc',
                'Reduce time-to-hire with enhanced visibility and analytics'
              )}
            </p>
          </div>

          <div className="ssc__employer-features__why-item">
            <BarChart3 size={24} color="#f59e0b" />
            <h4>{translate('features.why.insights.title', 'Data-Driven Decisions')}</h4>
            <p>
              {translate(
                'features.why.insights.desc',
                'Make informed hiring decisions with detailed analytics'
              )}
            </p>
          </div>

          <div className="ssc__employer-features__why-item">
            <FileText size={24} color="#6366f1" />
            <h4>{translate('features.why.roi.title', 'Better ROI')}</h4>
            <p>
              {translate(
                'features.why.roi.desc',
                'Get more applications per job posting with featured placements'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Bundle Offer (Optional) */}
      <div className="ssc__employer-features__bundle">
        <h3>
          <Sparkles size={24} />
          {translate('features.bundle.title', 'Save with Complete Bundle')}
        </h3>
        <p>
          {translate(
            'features.bundle.desc',
            'Get all features together and save 20% - Coming Soon!'
          )}
        </p>
      </div>
    </div>
  );
};

export default EmployerFeatures;

