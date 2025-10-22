import React from 'react';
import { Crown } from 'lucide-react';
import './Subscription.css';

/**
 * PremiumBadge Component
 * Displays a premium badge for users with active subscriptions
 * 
 * @param {Object} props
 * @param {boolean} props.large - Whether to display a larger badge
 * @param {string} props.label - Custom label text
 * @param {function} props.translate - Translation function
 */
const PremiumBadge = ({ large = false, label, translate }) => {
  const badgeText = label || (translate ? translate('premium', 'Premium') : 'Premium');

  return (
    <span className={`ssc__premium-badge ${large ? 'ssc__premium-badge--large' : ''}`}>
      <Crown size={large ? 16 : 12} />
      {badgeText}
    </span>
  );
};

export default PremiumBadge;

