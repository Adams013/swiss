import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { getTestModeStatus } from '../services/stripeService';
import './TestModeBanner.css';

/**
 * TestModeBanner Component
 * Shows a banner when Stripe is in test mode
 */
const TestModeBanner = ({ translate }) => {
  const status = getTestModeStatus();

  if (!status.enabled) {
    return null;
  }

  return (
    <div className="ssc__test-mode-banner">
      <div className="ssc__test-mode-banner__icon">
        <AlertCircle size={20} />
      </div>
      <div className="ssc__test-mode-banner__content">
        <strong>{status.message}</strong>
        <p>{status.details}</p>
      </div>
      <div className="ssc__test-mode-banner__info">
        <Info size={16} />
      </div>
    </div>
  );
};

export default TestModeBanner;

