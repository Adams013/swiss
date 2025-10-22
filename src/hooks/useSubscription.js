/**
 * useSubscription Hook
 * Manage subscription state and premium features
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserSubscription,
  isPremiumUser,
  getProfileViews,
  getProfileSearchAppearances,
  trackProfileView,
} from '../services/stripeService';

export const useSubscription = (userId) => {
  const [subscription, setSubscription] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscription data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subResult, premiumResult] = await Promise.all([
        getUserSubscription(userId),
        isPremiumUser(userId),
      ]);

      if (subResult.error) throw subResult.error;
      if (premiumResult.error) throw premiumResult.error;

      setSubscription(subResult.subscription);
      setIsPremium(premiumResult.isPremium);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = useCallback(() => {
    loadSubscription();
  }, [userId]);

  return {
    subscription,
    isPremium,
    loading,
    error,
    refresh,
  };
};

export const useProfileViews = (userId, limit = 20) => {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumFeature, setIsPremiumFeature] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadViews();
  }, [userId, limit]);

  const loadViews = async () => {
    try {
      setLoading(true);
      const result = await getProfileViews(userId, limit);

      setViews(result.views || []);
      setIsPremiumFeature(result.isPremiumFeature || false);
      setMessage(result.message || '');
    } catch (err) {
      console.error('Error loading profile views:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    views,
    loading,
    isPremiumFeature,
    message,
    refresh: loadViews,
  };
};

export const useProfileSearches = (userId, limit = 20) => {
  const [appearances, setAppearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremiumFeature, setIsPremiumFeature] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadSearches();
  }, [userId, limit]);

  const loadSearches = async () => {
    try {
      setLoading(true);
      const result = await getProfileSearchAppearances(userId, limit);

      setAppearances(result.appearances || []);
      setIsPremiumFeature(result.isPremiumFeature || false);
      setMessage(result.message || '');
    } catch (err) {
      console.error('Error loading search appearances:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    appearances,
    loading,
    isPremiumFeature,
    message,
    refresh: loadSearches,
  };
};

/**
 * Hook to track profile views automatically
 */
export const useTrackProfileView = (profileId, viewerData) => {
  useEffect(() => {
    if (!profileId) return;

    // Track view with a small delay to avoid tracking accidental clicks
    const timer = setTimeout(() => {
      trackProfileView(profileId, viewerData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [profileId, viewerData]);
};

export default useSubscription;

