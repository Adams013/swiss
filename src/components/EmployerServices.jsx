import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  Sparkles,
  Check,
  ExternalLink,
  TrendingUp,
  Eye,
  Share2,
  MousePointerClick,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { STRIPE_PRODUCTS } from '../config/stripeProducts';
import TestModeBanner from './TestModeBanner';
import './TestModeBanner.css';
import './EmployerServices.css';

/**
 * EmployerServices Component
 * Displays available services for startups/employers
 */
const EmployerServices = ({ user, translate, language = 'en' }) => {
  const [isProcessing, setIsProcessing] = useState(null);

  const resolveServiceText = (service, field) => {
    if (!service) {
      return '';
    }

    if (language !== 'en') {
      const localized = service?.translations?.[language]?.[field];
      if (typeof localized === 'string' && localized.trim()) {
        return localized;
      }
    }

    const original = service?.[field];
    return typeof original === 'string' ? original : '';
  };

  const handlePurchaseService = async (service) => {
    if (!user) {
      alert(translate('services.loginRequired', 'Please log in to purchase services'));
      return;
    }

    setIsProcessing(service.productId);

    try {
      // Redirect to Stripe payment link
      window.location.href = service.paymentLink;
    } catch (error) {
      console.error('Payment error:', error);
      alert(translate('services.error', 'Failed to start payment. Please try again.'));
      setIsProcessing(null);
    }
  };

  const getServiceIcon = (productId) => {
    switch (productId) {
      case STRIPE_PRODUCTS.ANALYTICS_DASHBOARD.productId:
        return <BarChart3 size={32} color="#3b82f6" />;
      case STRIPE_PRODUCTS.TALENT_SEARCH.productId:
        return <Search size={32} color="#10b981" />;
      case STRIPE_PRODUCTS.FEATURED_JOBS.productId:
        return <Sparkles size={32} color="#f59e0b" />;
      default:
        return <Zap size={32} color="#6366f1" />;
    }
  };

  const getServiceFeatures = (productId) => {
    switch (productId) {
      case STRIPE_PRODUCTS.ANALYTICS_DASHBOARD.productId:
        return [
          {
            icon: <Eye size={18} />,
            text: translate('services.analytics.feature1', 'Track profile views on your job postings'),
          },
          {
            icon: <MousePointerClick size={18} />,
            text: translate('services.analytics.feature2', 'Monitor clicks and engagement metrics'),
          },
          {
            icon: <Share2 size={18} />,
            text: translate('services.analytics.feature3', 'See how many times your jobs are shared'),
          },
          {
            icon: <Users size={18} />,
            text: translate('services.analytics.feature4', 'Identify interested candidates'),
          },
          {
            icon: <TrendingUp size={18} />,
            text: translate('services.analytics.feature5', 'Performance insights and trends'),
          },
        ];
      case STRIPE_PRODUCTS.TALENT_SEARCH.productId:
        return [
          {
            icon: <Search size={18} />,
            text: translate('services.talent.feature1', 'Advanced search filters'),
          },
          {
            icon: <Users size={18} />,
            text: translate('services.talent.feature2', 'Access detailed student profiles'),
          },
          {
            icon: <TrendingUp size={18} />,
            text: translate('services.talent.feature3', 'Find best matches for your positions'),
          },
          {
            icon: <Eye size={18} />,
            text: translate('services.talent.feature4', 'View student experience and skills'),
          },
          {
            icon: <Zap size={18} />,
            text: translate('services.talent.feature5', 'Priority access to top candidates'),
          },
        ];
      case STRIPE_PRODUCTS.FEATURED_JOBS.productId:
        return [
          {
            icon: <Sparkles size={18} />,
            text: translate('services.featured.feature1', 'Featured placement on main menu'),
          },
          {
            icon: <TrendingUp size={18} />,
            text: translate('services.featured.feature2', 'Increased visibility and reach'),
          },
          {
            icon: <Eye size={18} />,
            text: translate('services.featured.feature3', 'Stand out from other postings'),
          },
          {
            icon: <Users size={18} />,
            text: translate('services.featured.feature4', 'Attract more qualified applicants'),
          },
          {
            icon: <Zap size={18} />,
            text: translate('services.featured.feature5', 'Boost your hiring success'),
          },
        ];
      default:
        return [];
    }
  };

  const formatServicePriceLabel = (service) => {
    if (!service) {
      return '';
    }

    const basePrice = `${service.currency} ${service.price.toFixed(2)}`;

    if (service.interval === 'one-time') {
      const perPostLabel = translate('services.perPostLabel', 'Per Post');
      return `${basePrice}/${perPostLabel}`;
    }

    const monthLabel = translate('services.periodLabel', 'Month');
    return `${basePrice}/${monthLabel}`;
  };

  const services = [
    STRIPE_PRODUCTS.ANALYTICS_DASHBOARD,
    STRIPE_PRODUCTS.TALENT_SEARCH,
    STRIPE_PRODUCTS.FEATURED_JOBS,
  ];

  return (
    <div className="ssc__employer-services">
      {/* Test Mode Banner */}
      <TestModeBanner translate={translate} />

      {/* Header */}
      <div className="ssc__employer-services__header">
        <Zap size={32} color="#6366f1" />
        <h2>{translate('services.title', 'Startup Services')}</h2>
        <p className="ssc__employer-services__subtitle">
          {translate(
            'services.subtitle',
            'Powerful tools to help you find and attract the best talent'
          )}
        </p>
      </div>

      {/* Services Grid */}
      <div className="ssc__employer-services__grid">
        {services.map((service) => {
          const isProcessingThis = isProcessing === service.productId;

          return (
            <div key={service.productId} className="ssc__service-card">
              {/* Service Icon */}
              <div className="ssc__service-card__icon">
                {getServiceIcon(service.productId)}
              </div>

              {/* Service Header */}
              <div className="ssc__service-card__header">
                <h3>{resolveServiceText(service, 'name')}</h3>
                <p className="ssc__service-card__description">
                  {resolveServiceText(service, 'description')}
                </p>
              </div>

              {/* Service Price */}
              <div className="ssc__service-card__price">
                <span className="ssc__service-card__price-value">
                  {formatServicePriceLabel(service)}
                </span>
                <span className="ssc__service-card__price-caption">
                  {service.interval === 'one-time'
                    ? translate('services.oneTimeCaption', 'One-time featured boost')
                    : translate('services.recurringCaption', 'Billed monthly via secure Stripe checkout')}
                </span>
              </div>

              {/* Service Features */}
              <ul className="ssc__service-card__features">
                {getServiceFeatures(service.productId).map((feature, index) => (
                  <li key={index}>
                    <Check size={16} className="ssc__service-card__check" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="ssc__service-card__actions">
                <button
                  type="button"
                  className="ssc__btn ssc__btn--primary ssc__service-card__cta"
                  onClick={() => handlePurchaseService(service)}
                  disabled={isProcessingThis}
                >
                  {isProcessingThis ? (
                    <>
                      <div className="ssc__spinner ssc__spinner--small"></div>
                      {translate('services.processing', 'Processing...')}
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      {translate('services.selectService', 'Select Service')}
                    </>
                  )}
                </button>

                {!isProcessingThis && (
                  <button
                    type="button"
                    className="ssc__btn ssc__btn--link ssc__service-card__link"
                    onClick={() => handlePurchaseService(service)}
                  >
                    <ExternalLink size={16} />
                    {translate('services.checkoutWithStripe', 'Checkout with Stripe')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="ssc__employer-services__info">
        <h3>{translate('services.infoTitle', 'How It Works')}</h3>
        <div className="ssc__employer-services__steps">
          <div className="ssc__service-step">
            <div className="ssc__service-step__number">1</div>
            <div className="ssc__service-step__content">
              <h4>{translate('services.step1.title', 'Choose a Service')}</h4>
              <p>
                {translate(
                  'services.step1.desc',
                  'Select the service that best fits your hiring needs'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__service-step">
            <div className="ssc__service-step__number">2</div>
            <div className="ssc__service-step__content">
              <h4>{translate('services.step2.title', 'Complete Payment')}</h4>
              <p>
                {translate(
                  'services.step2.desc',
                  'Securely pay through Stripe with your preferred payment method'
                )}
              </p>
            </div>
          </div>

          <div className="ssc__service-step">
            <div className="ssc__service-step__number">3</div>
            <div className="ssc__service-step__content">
              <h4>{translate('services.step3.title', 'Start Using')}</h4>
              <p>
                {translate(
                  'services.step3.desc',
                  'Access your service immediately and start finding talent'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="ssc__employer-services__footer">
        <p>
          {translate(
            'services.footer',
            'All payments are secure and processed by Stripe. Need help? Contact our support team.'
          )}
        </p>
      </div>
    </div>
  );
};

export default EmployerServices;

