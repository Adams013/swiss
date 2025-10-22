# 🔗 Quick Integration Example

This guide shows how to integrate the notification system into your existing SwissStartupConnect app.

## Step 1: Update Main App Component

```javascript
// src/SwissStartupConnect.jsx
import React, { useState, useEffect } from 'react';
import NotificationCenter from './components/NotificationCenter';
import NotificationPreferences from './components/NotificationPreferences';
import SavedSearches from './components/SavedSearches';
import { useNotifications } from './hooks/useNotifications';
import './components/Notifications.css';

const SwissStartupConnect = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [currentFilters, setCurrentFilters] = useState({});
  const [feedback, setFeedback] = useState(null);
  
  // Initialize notifications
  const notifications = useNotifications(user);

  // ... rest of your existing state and logic

  return (
    <div className="ssc">
      {/* Header with Notification Center */}
      <header className="ssc__header">
        <div className="ssc__brand">Swiss Startup Connect</div>
        
        <nav className="ssc__nav">
          <button onClick={() => setActiveTab('jobs')}>Jobs</button>
          <button onClick={() => setActiveTab('companies')}>Companies</button>
          <button onClick={() => setActiveTab('saved')}>Saved Searches</button>
          {user && (
            <button onClick={() => setActiveTab('settings')}>Settings</button>
          )}
        </nav>

        {/* Add Notification Center to header */}
        {user && (
          <NotificationCenter 
            user={user} 
            translate={translate}
          />
        )}

        {/* User menu */}
        {user ? (
          <UserMenu user={user} onLogout={handleLogout} />
        ) : (
          <button onClick={() => setShowLoginModal(true)}>Login</button>
        )}
      </header>

      {/* Main Content */}
      <main className="ssc__main">
        {activeTab === 'jobs' && (
          <JobsTab 
            user={user}
            filters={currentFilters}
            onFiltersChange={setCurrentFilters}
            notifications={notifications}
          />
        )}

        {activeTab === 'saved' && user && (
          <SavedSearches
            user={user}
            translate={translate}
            setFeedback={setFeedback}
            currentFilters={currentFilters}
            onApplySearch={(filters) => {
              setCurrentFilters(filters);
              setActiveTab('jobs');
            }}
          />
        )}

        {activeTab === 'settings' && user && (
          <SettingsPage user={user} />
        )}
      </main>

      {/* Feedback Toast */}
      {feedback && (
        <Toast 
          type={feedback.type} 
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
};

export default SwissStartupConnect;
```

## Step 2: Update Jobs Tab Component

```javascript
// src/components/JobsTab.jsx
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { createSavedSearch } from '../services/supabaseNotifications';

const JobsTab = ({ user, filters, onFiltersChange, notifications }) => {
  const [jobs, setJobs] = useState([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

  const handleSaveSearch = async (name, alertSettings) => {
    if (!user) return;

    const { search, error } = await createSavedSearch(user.id, {
      name,
      filters,
      alert_enabled: alertSettings.enabled,
      alert_frequency: alertSettings.frequency,
    });

    if (!error) {
      setFeedback({
        type: 'success',
        message: 'Search saved! You\'ll get notifications for matching jobs.',
      });
      setShowSaveSearchModal(false);
    }
  };

  return (
    <div className="jobs-tab">
      {/* Filter Bar */}
      <div className="jobs-tab__filters">
        <SearchInput 
          value={filters.searchTerm} 
          onChange={(value) => onFiltersChange({ ...filters, searchTerm: value })}
        />
        
        {/* Location Filter */}
        <MultiSelect
          options={LOCATION_OPTIONS}
          value={filters.locations}
          onChange={(locations) => onFiltersChange({ ...filters, locations })}
          placeholder="Locations"
        />

        {/* Save Search Button */}
        {user && (
          <button
            className="ssc__btn ssc__btn--secondary"
            onClick={() => setShowSaveSearchModal(true)}
          >
            <Save size={16} />
            Save this search
          </button>
        )}
      </div>

      {/* Job Listings */}
      <div className="jobs-tab__list">
        {jobs.map((job) => (
          <JobCard 
            key={job.id} 
            job={job}
            onApply={async () => {
              // Handle application submission
              // Then notify
              await notifications.notifyApplicationStatusChange(
                application,
                'submitted',
                'Your application has been submitted'
              );
            }}
          />
        ))}
      </div>

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <SaveSearchModal
          filters={filters}
          onSave={handleSaveSearch}
          onClose={() => setShowSaveSearchModal(false)}
        />
      )}
    </div>
  );
};
```

## Step 3: Update Settings Page

```javascript
// src/components/SettingsPage.jsx
import React, { useState } from 'react';
import NotificationPreferences from './NotificationPreferences';

const SettingsPage = ({ user, translate, setFeedback }) => {
  const [activeSection, setActiveSection] = useState('notifications');

  return (
    <div className="settings-page">
      <aside className="settings-sidebar">
        <nav>
          <button
            className={activeSection === 'notifications' ? 'active' : ''}
            onClick={() => setActiveSection('notifications')}
          >
            Notifications
          </button>
          <button
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
          <button
            className={activeSection === 'privacy' ? 'active' : ''}
            onClick={() => setActiveSection('privacy')}
          >
            Privacy
          </button>
        </nav>
      </aside>

      <main className="settings-content">
        {activeSection === 'notifications' && (
          <NotificationPreferences
            user={user}
            translate={translate}
            setFeedback={setFeedback}
          />
        )}

        {activeSection === 'profile' && (
          <ProfileSettings user={user} />
        )}

        {activeSection === 'privacy' && (
          <PrivacySettings user={user} />
        )}
      </main>
    </div>
  );
};
```

## Step 4: Update Application Manager

```javascript
// src/components/ApplicationManager.jsx (for employers)
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../supabaseClient';

const ApplicationManager = ({ startup }) => {
  const [applications, setApplications] = useState([]);

  const handleStatusUpdate = async (applicationId, newStatus, message) => {
    // Update in database
    const { data: application, error } = await supabase
      .from('applications')
      .update({ 
        status: newStatus, 
        status_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select(`
        *,
        jobs(*),
        profiles(*)
      `)
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return;
    }

    // Send notification to applicant
    // This will be handled server-side via trigger or manually:
    const userId = application.profile_id;
    
    await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        notification_type: 'application_status_update',
        payload: {
          subject: `Application update: ${application.jobs.title}`,
          jobTitle: application.jobs.title,
          companyName: application.jobs.company_name,
          status: newStatus,
          message: message,
        },
        priority: 2,
      });

    // Refresh applications list
    loadApplications();
  };

  return (
    <div className="application-manager">
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          application={app}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
    </div>
  );
};
```

## Step 5: Add Translation Keys

```json
// src/locales/en.json
{
  "notifications": {
    "title": "Notifications",
    "toggleMenu": "Toggle notifications",
    "markAllRead": "Mark all read",
    "markRead": "Mark as read",
    "delete": "Delete",
    "viewAll": "View all notifications",
    "empty": "No notifications yet",
    "loading": "Loading...",
    
    "preferences": {
      "title": "Notification Preferences",
      "loading": "Loading preferences...",
      "loadError": "Failed to load notification preferences",
      "saveError": "Failed to save notification preferences",
      "saveSuccess": "Notification preferences saved!",
      "notAvailable": "Preferences not available"
    },

    "email": {
      "title": "Email Notifications",
      "enabled": "Enable email notifications",
      "enabledDesc": "Receive notifications via email"
    },

    "jobAlerts": {
      "title": "Job Alerts",
      "enabled": "Enable job alerts",
      "enabledDesc": "Get notified about new jobs matching your saved searches",
      "frequency": "Alert frequency"
    },

    "frequency": {
      "instant": "Instant",
      "daily": "Daily digest",
      "weekly": "Weekly digest",
      "never": "Never"
    }
  },

  "savedSearches": {
    "title": "Saved Searches",
    "subtitle": "Save your job searches and get notified about new matches",
    "saveCurrentSearch": "Save Current Search",
    "loadError": "Failed to load saved searches",
    "createError": "Failed to save search",
    "createSuccess": "Search saved successfully!",
    "updateError": "Failed to update search",
    "updateSuccess": "Search updated successfully!",
    "deleteError": "Failed to delete search",
    "deleteSuccess": "Search deleted",
    "confirmDelete": "Are you sure you want to delete this search?"
  }
}
```

## Step 6: Initialize on First Load

```javascript
// src/App.js or index.js
import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import { checkNotificationTablesExist } from './services/supabaseNotifications';

function App() {
  useEffect(() => {
    // Check if notification tables are set up
    checkNotificationTablesExist().then(({ allExist, missing }) => {
      if (!allExist) {
        console.warn('Notification tables not found:', missing);
        console.log('Run: psql -f supabase-notifications-schema.sql');
      }
    });
  }, []);

  return <SwissStartupConnect />;
}
```

## Step 7: Add Background Job Alert Processing

```javascript
// Create a utility to trigger job alert processing
// src/utils/processJobAlerts.js

import { queueJobAlertsForUser } from '../services/jobAlertMatcher';
import { supabase } from '../supabaseClient';

/**
 * Process job alerts for all active users
 * This should be called by a cron job or scheduled task
 */
export const processAllJobAlerts = async () => {
  try {
    // Get all users with active saved searches
    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select('user_id')
      .eq('is_active', true)
      .eq('alert_enabled', true);

    if (error) throw error;

    // Get unique user IDs
    const userIds = [...new Set(searches.map(s => s.user_id))];

    console.log(`Processing job alerts for ${userIds.length} users`);

    // Queue alerts for each user
    const results = await Promise.allSettled(
      userIds.map(userId => queueJobAlertsForUser(userId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Processed: ${successful} successful, ${failed} failed`);

    return { successful, failed };
  } catch (error) {
    console.error('Error processing job alerts:', error);
    return { successful: 0, failed: 0, error };
  }
};
```

## That's It! 🎉

Your notification system is now fully integrated. Users can:
- ✅ Get email notifications for matching jobs
- ✅ Save searches with custom alert frequencies
- ✅ Manage notification preferences
- ✅ View in-app notifications
- ✅ Track application status updates

Next steps:
1. Deploy the database schema
2. Configure email service API keys
3. Deploy the Supabase Edge Function
4. Set up cron jobs for scheduled processing
5. Test with real users!

