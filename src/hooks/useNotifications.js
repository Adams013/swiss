import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotificationPreferences,
  queueNotification,
} from '../services/supabaseNotifications';
import { sendApplicationStatusEmail } from '../services/emailService';

/**
 * useNotifications Hook
 * Manages notification state and provides helper functions
 */
export const useNotifications = (user) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load notification preferences
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { preferences: prefs } = await fetchNotificationPreferences(user.id);
    setPreferences(prefs);
    setLoading(false);
  }, [user?.id]);

  /**
   * Send application status update notification
   */
  const notifyApplicationStatusChange = useCallback(
    async (application, newStatus, message = '') => {
      if (!user?.id || !preferences) return;

      // Check if user has this notification enabled
      if (!preferences.application_status_updates) {
        return;
      }

      const jobTitle = application.jobs?.title || application.job_title || 'Job';
      const companyName = application.jobs?.company_name || application.company_name || 'Company';

      // Queue the notification
      await queueNotification(
        user.id,
        'application_status_update',
        {
          subject: `Application update: ${jobTitle} at ${companyName}`,
          jobTitle,
          companyName,
          status: newStatus,
          message,
          applicationId: application.id,
        },
        {
          priority: 2, // High priority
        }
      );

      // If email enabled, send immediately
      if (preferences.email_enabled && user.email) {
        await sendApplicationStatusEmail(
          user.email,
          jobTitle,
          companyName,
          newStatus,
          message
        );
      }
    },
    [user, preferences]
  );

  /**
   * Send new message notification
   */
  const notifyNewMessage = useCallback(
    async (application, message) => {
      if (!user?.id || !preferences) return;

      if (!preferences.application_messages) {
        return;
      }

      const jobTitle = application.jobs?.title || 'Job';
      const companyName = application.jobs?.company_name || 'Company';

      await queueNotification(
        user.id,
        'application_message',
        {
          subject: `New message from ${companyName}`,
          jobTitle,
          companyName,
          message,
          applicationId: application.id,
        },
        {
          priority: 2,
        }
      );
    },
    [user, preferences]
  );

  /**
   * Send new job from followed company
   */
  const notifyFollowedCompanyJob = useCallback(
    async (company, job) => {
      if (!user?.id || !preferences) return;

      if (!preferences.followed_company_jobs) {
        return;
      }

      await queueNotification(
        user.id,
        'company_new_job',
        {
          subject: `${company.name} posted a new job`,
          companyName: company.name,
          job: {
            id: job.id,
            title: job.title,
            location: job.location,
            description: job.description,
          },
        },
        {
          priority: 3,
        }
      );
    },
    [user, preferences]
  );

  return {
    preferences,
    loading,
    loadPreferences,
    notifyApplicationStatusChange,
    notifyNewMessage,
    notifyFollowedCompanyJob,
  };
};

export default useNotifications;

