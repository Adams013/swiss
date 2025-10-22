import React, { useState } from 'react';
import { Crown, X, ExternalLink } from 'lucide-react';
import './AdContainer.css';

/**
 * AdContainer Component
 * Displays ads for free users, hidden for premium subscribers
 * 
 * @param {Object} props
 * @param {boolean} props.isPremium - Whether user has premium subscription
 * @param {string} props.placement - Ad placement identifier
 * @param {string} props.size - Ad size ('banner', 'square', 'sidebar')
 * @param {function} props.onUpgradeClick - Callback when upgrade link is clicked
 * @param {function} props.translate - Translation function
 */
const AdContainer = ({ 
  isPremium = false, 
  placement = 'default', 
  size = 'banner',
  onUpgradeClick,
  translate 
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Premium users don't see ads
  if (isPremium) {
    return null;
  }

  // User dismissed the ad
  if (dismissed) {
    return null;
  }

  const adConfigs = {
    banner: {
      width: '728px',
      height: '90px',
      className: 'ssc__ad--banner',
    },
    square: {
      width: '300px',
      height: '250px',
      className: 'ssc__ad--square',
    },
    sidebar: {
      width: '160px',
      height: '600px',
      className: 'ssc__ad--sidebar',
    },
    mobile: {
      width: '320px',
      height: '50px',
      className: 'ssc__ad--mobile',
    },
  };

  const config = adConfigs[size] || adConfigs.banner;

  return (
    <div className={`ssc__ad-container ${config.className}`}>
      {/* Ad Label */}
      <div className="ssc__ad-label">
        {translate?.('ad.label', 'Advertisement')}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        className="ssc__ad-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss ad"
        title={translate?.('ad.dismiss', 'Dismiss')}
      >
        <X size={14} />
      </button>

      {/* Ad Content */}
      <div 
        className="ssc__ad-content"
        style={{ 
          width: config.width, 
          height: config.height,
        }}
      >
        {/* Replace this with your actual ad network code */}
        {/* Example: Google AdSense, Carbon Ads, etc. */}
        <MockAd 
          placement={placement}
          size={size}
          translate={translate}
        />
      </div>

      {/* Upgrade Prompt */}
      <div className="ssc__ad-upgrade-prompt">
        <button
          type="button"
          className="ssc__ad-upgrade-link"
          onClick={onUpgradeClick}
        >
          <Crown size={12} />
          {translate?.('ad.removeAds', 'Remove ads with Premium')}
        </button>
      </div>
    </div>
  );
};

/**
 * MockAd Component
 * Placeholder for actual ad network integration
 * Replace this with your ad provider's code
 */
const MockAd = ({ placement, size, translate }) => {
  // This is a placeholder - replace with actual ad network integration
  // Examples:
  // - Google AdSense: <ins className="adsbygoogle" ...>
  // - Carbon Ads: <script async type="text/javascript" src="//cdn.carbonads.com/carbon.js?serve=..." id="_carbonads_js"></script>
  // - Custom ads from your database

  return (
    <div className="ssc__ad-mock">
      <div className="ssc__ad-mock__content">
        <h4>{translate?.('ad.mock.title', 'Your Ad Here')}</h4>
        <p>{translate?.('ad.mock.description', 'Advertise with Swiss Startup Connect')}</p>
        <button className="ssc__ad-mock__cta">
          {translate?.('ad.mock.cta', 'Learn More')}
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * PremiumAdFreeBanner Component
 * Shows a positive message to premium users about ad-free experience
 */
export const PremiumAdFreeBanner = ({ translate }) => {
  return (
    <div className="ssc__premium-ad-free-banner">
      <Crown size={20} color="#f59e0b" />
      <span>
        {translate?.('premium.adFree', 'Enjoying an ad-free experience')} ✨
      </span>
    </div>
  );
};

/**
 * AdBlocker Component
 * Utility component to conditionally render content based on premium status
 */
export const AdBlocker = ({ isPremium, children }) => {
  if (isPremium) {
    return null;
  }
  return <>{children}</>;
};

export default AdContainer;

