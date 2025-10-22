import React, { useState, useEffect } from 'react';
import { Bell, Mail, Briefcase, Building2, Newspaper, Sparkles, Check, X } from 'lucide-react';
import {
  fetchNotificationPreferences,
  upsertNotificationPreferences,
} from '../services/supabaseNotifications';

/**
 * NotificationPreferences Component
 * Allows users to manage their notification settings
 */
const NotificationPreferences = ({ user, translate, setFeedback, onClose }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    setLoading(true);
    const { preferences: prefs, error } = await fetchNotificationPreferences(user.id);

    if (error) {
      setFeedback({
        type: 'error',
        message: translate(
          'notifications.preferences.loadError',
          'Failed to load notification preferences'
        ),
      });
    } else {
      setPreferences(prefs);
    }

    setLoading(false);
  };

  const handleToggle = (field) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await upsertNotificationPreferences(user.id, preferences);

    if (error) {
      setFeedback({
        type: 'error',
        message: translate(
          'notifications.preferences.saveError',
          'Failed to save notification preferences'
        ),
      });
    } else {
      setFeedback({
        type: 'success',
        message: translate(
          'notifications.preferences.saveSuccess',
          'Notification preferences saved!'
        ),
      });
      setHasChanges(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="ssc__notification-preferences ssc__notification-preferences--loading">
        <div className="ssc__notification-preferences__spinner">
          <div className="ssc__spinner"></div>
          <p>{translate('notifications.preferences.loading', 'Loading preferences...')}</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="ssc__notification-preferences ssc__notification-preferences--error">
        <p>{translate('notifications.preferences.notAvailable', 'Preferences not available')}</p>
      </div>
    );
  }

  const frequencyOptions = [
    { value: 'instant', label: translate('notifications.frequency.instant', 'Instant') },
    { value: 'daily', label: translate('notifications.frequency.daily', 'Daily digest') },
    { value: 'weekly', label: translate('notifications.frequency.weekly', 'Weekly digest') },
    { value: 'never', label: translate('notifications.frequency.never', 'Never') },
  ];

  return (
    <div className="ssc__notification-preferences">
      <div className="ssc__notification-preferences__header">
        <Bell className="ssc__icon" size={24} />
        <h2>{translate('notifications.preferences.title', 'Notification Preferences')}</h2>
      </div>

      <div className="ssc__notification-preferences__content">
        {/* Email Settings */}
        <div className="ssc__notification-section">
          <div className="ssc__notification-section__header">
            <Mail className="ssc__icon" size={20} />
            <h3>{translate('notifications.email.title', 'Email Notifications')}</h3>
          </div>
          
          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={() => handleToggle('email_enabled')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.email.enabled', 'Enable email notifications')}
                </strong>
                <small>
                  {translate(
                    'notifications.email.enabledDesc',
                    'Receive notifications via email'
                  )}
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Job Alerts */}
        <div className="ssc__notification-section">
          <div className="ssc__notification-section__header">
            <Briefcase className="ssc__icon" size={20} />
            <h3>{translate('notifications.jobAlerts.title', 'Job Alerts')}</h3>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.job_alerts_enabled}
                onChange={() => handleToggle('job_alerts_enabled')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.jobAlerts.enabled', 'Enable job alerts')}
                </strong>
                <small>
                  {translate(
                    'notifications.jobAlerts.enabledDesc',
                    'Get notified about new jobs matching your saved searches'
                  )}
                </small>
              </div>
            </label>
          </div>

          {preferences.job_alerts_enabled && (
            <div className="ssc__notification-setting ssc__notification-setting--indented">
              <label className="ssc__notification-frequency">
                <span>
                  {translate('notifications.jobAlerts.frequency', 'Alert frequency')}
                </span>
                <select
                  value={preferences.job_alert_frequency}
                  onChange={(e) => handleFrequencyChange('job_alert_frequency', e.target.value)}
                  className="ssc__select"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Application Updates */}
        <div className="ssc__notification-section">
          <div className="ssc__notification-section__header">
            <Sparkles className="ssc__icon" size={20} />
            <h3>{translate('notifications.applications.title', 'Application Updates')}</h3>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.application_status_updates}
                onChange={() => handleToggle('application_status_updates')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.applications.status', 'Status updates')}
                </strong>
                <small>
                  {translate(
                    'notifications.applications.statusDesc',
                    'Get notified when your application status changes'
                  )}
                </small>
              </div>
            </label>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.application_messages}
                onChange={() => handleToggle('application_messages')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.applications.messages', 'New messages')}
                </strong>
                <small>
                  {translate(
                    'notifications.applications.messagesDesc',
                    'Get notified about new messages from employers'
                  )}
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Company Notifications */}
        <div className="ssc__notification-section">
          <div className="ssc__notification-section__header">
            <Building2 className="ssc__icon" size={20} />
            <h3>{translate('notifications.companies.title', 'Companies')}</h3>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.followed_company_jobs}
                onChange={() => handleToggle('followed_company_jobs')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.companies.newJobs', 'New jobs from followed companies')}
                </strong>
                <small>
                  {translate(
                    'notifications.companies.newJobsDesc',
                    'Get notified when companies you follow post new jobs'
                  )}
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Marketing & Updates */}
        <div className="ssc__notification-section">
          <div className="ssc__notification-section__header">
            <Newspaper className="ssc__icon" size={20} />
            <h3>{translate('notifications.marketing.title', 'News & Updates')}</h3>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.product_updates}
                onChange={() => handleToggle('product_updates')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.marketing.productUpdates', 'Product updates')}
                </strong>
                <small>
                  {translate(
                    'notifications.marketing.productUpdatesDesc',
                    'Stay updated with new features and improvements'
                  )}
                </small>
              </div>
            </label>
          </div>

          <div className="ssc__notification-setting">
            <label className="ssc__notification-toggle">
              <input
                type="checkbox"
                checked={preferences.newsletter_enabled}
                onChange={() => handleToggle('newsletter_enabled')}
              />
              <span className="ssc__toggle-slider"></span>
              <div className="ssc__toggle-label">
                <strong>
                  {translate('notifications.marketing.newsletter', 'Career newsletter')}
                </strong>
                <small>
                  {translate(
                    'notifications.marketing.newsletterDesc',
                    'Receive career tips, startup insights, and industry news'
                  )}
                </small>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="ssc__notification-preferences__footer">
        {onClose && (
          <button
            type="button"
            className="ssc__btn ssc__btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            <X size={16} />
            {translate('common.cancel', 'Cancel')}
          </button>
        )}
        <button
          type="button"
          className="ssc__btn ssc__btn--primary"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <div className="ssc__spinner ssc__spinner--small"></div>
              {translate('common.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Check size={16} />
              {translate('common.save', 'Save Preferences')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;

