# Premium Subscription Integration Example

This guide shows how to integrate the premium subscription system into your SwissStartupConnect application.

## Table of Contents

1. [Overview](#overview)
2. [Main App Integration](#main-app-integration)
3. [Navigation & UI Updates](#navigation--ui-updates)
4. [Premium Feature Gating](#premium-feature-gating)
5. [Profile View Tracking](#profile-view-tracking)
6. [Featured Jobs](#featured-jobs)
7. [Ad-Free Experience](#ad-free-experience)

---

## Overview

The subscription system adds premium features while maintaining a great free tier experience. This guide shows practical integration examples.

---

## Main App Integration

### Step 1: Import Dependencies

```javascript
// In SwissStartupConnect.jsx or App.js
import { useState, useEffect } from 'react';
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionManager from './components/SubscriptionManager';
import PremiumBadge from './components/PremiumBadge';
import useSubscription from './hooks/useSubscription';
import './components/Subscription.css';
```

### Step 2: Add Subscription State

```javascript
function SwissStartupConnect() {
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  
  // Use subscription hook
  const { subscription, isPremium, loading: subscriptionLoading } = useSubscription(user?.id);

  // ... rest of your component
}
```

### Step 3: Add Subscription Modals

```javascript
return (
  <div className="ssc">
    {/* Existing app content */}
    
    {/* Subscription Plans Modal */}
    {showSubscriptionPlans && (
      <Modal onClose={() => setShowSubscriptionPlans(false)}>
        <SubscriptionPlans
          user={user}
          translate={translate}
          onClose={() => setShowSubscriptionPlans(false)}
        />
      </Modal>
    )}

    {/* Subscription Manager Modal */}
    {showSubscriptionManager && (
      <Modal onClose={() => setShowSubscriptionManager(false)}>
        <SubscriptionManager
          user={user}
          translate={translate}
          onUpgrade={() => {
            setShowSubscriptionManager(false);
            setShowSubscriptionPlans(true);
          }}
        />
      </Modal>
    )}
  </div>
);
```

---

## Navigation & UI Updates

### Add Premium Badge to User Profile

```javascript
// In user profile header or navbar
function UserProfileHeader({ user, isPremium }) {
  return (
    <div className="ssc__user-profile-header">
      <img src={user.avatar} alt={user.name} />
      <div>
        <h3>
          {user.name}
          {isPremium && <PremiumBadge translate={translate} />}
        </h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
}
```

### Add "Upgrade to Premium" CTA

```javascript
// In sidebar or prominent location
{!isPremium && user && (
  <div className="ssc__premium-upsell-card">
    <Crown size={32} color="#f59e0b" />
    <h3>{translate('premium.upsell.title', 'Unlock Premium Features')}</h3>
    <ul>
      <li>✓ {translate('premium.upsell.feature1', 'Ad-free experience')}</li>
      <li>✓ {translate('premium.upsell.feature2', 'See who viewed you')}</li>
      <li>✓ {translate('premium.upsell.feature3', 'Enhanced visibility')}</li>
    </ul>
    <button
      className="ssc__btn ssc__btn--primary"
      onClick={() => setShowSubscriptionPlans(true)}
    >
      <Crown size={16} />
      {translate('premium.upgrade', 'Upgrade Now')}
    </button>
  </div>
)}
```

### Add to User Menu

```javascript
function UserMenu({ user, isPremium }) {
  return (
    <div className="ssc__user-menu">
      <button onClick={() => navigate('/profile')}>
        <User size={16} />
        {translate('menu.profile', 'Profile')}
      </button>
      
      {isPremium ? (
        <button onClick={() => setShowSubscriptionManager(true)}>
          <Crown size={16} />
          {translate('menu.subscription', 'Manage Subscription')}
        </button>
      ) : (
        <button 
          onClick={() => setShowSubscriptionPlans(true)}
          className="ssc__user-menu__premium-cta"
        >
          <Crown size={16} />
          {translate('menu.upgrade', 'Upgrade to Premium')}
        </button>
      )}
      
      <button onClick={() => navigate('/settings')}>
        <Settings size={16} />
        {translate('menu.settings', 'Settings')}
      </button>
    </div>
  );
}
```

---

## Premium Feature Gating

### Profile Views (Premium Only)

```javascript
import { useProfileViews } from '../hooks/useSubscription';

function ProfileInsights({ user, isPremium }) {
  const { views, loading, isPremiumFeature, message } = useProfileViews(user?.id);

  if (loading) return <Spinner />;

  if (isPremiumFeature) {
    return (
      <div className="ssc__premium-feature-locked">
        <Eye size={48} className="ssc__icon--muted" />
        <h3>{translate('premium.profileViews.locked', 'Premium Feature')}</h3>
        <p>{message}</p>
        <button 
          className="ssc__btn ssc__btn--primary"
          onClick={() => setShowSubscriptionPlans(true)}
        >
          <Crown size={16} />
          {translate('premium.unlock', 'Unlock with Premium')}
        </button>
      </div>
    );
  }

  return (
    <div className="ssc__profile-views">
      <h3>
        <Eye size={20} />
        {translate('profileViews.title', 'Who Viewed Your Profile')}
      </h3>
      
      {views.length === 0 ? (
        <p>{translate('profileViews.empty', 'No views yet')}</p>
      ) : (
        <ul>
          {views.map(view => (
            <li key={view.id}>
              <strong>{view.viewer?.name || 'Anonymous'}</strong>
              <span>{formatTimeAgo(view.viewed_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Search Appearances (Premium Only)

```javascript
import { useProfileSearches } from '../hooks/useSubscription';

function SearchAppearances({ user }) {
  const { appearances, loading, isPremiumFeature } = useProfileSearches(user?.id);

  if (isPremiumFeature) {
    return (
      <PremiumFeatureUpsell
        icon={<Search size={48} />}
        title={translate('premium.searches.locked', 'See Your Search Appearances')}
        description={translate('premium.searches.desc', 'Find out when you appear in searches')}
      />
    );
  }

  return (
    <div className="ssc__search-appearances">
      <h3>
        <Search size={20} />
        {translate('searches.title', 'Search Appearances')}
      </h3>
      {/* Render appearances */}
    </div>
  );
}
```

### Detailed Student Profiles (Startups Only)

```javascript
function StudentProfile({ student, currentUser, isPremium }) {
  const isStartup = currentUser?.type === 'startup';
  const canViewDetails = isPremium && isStartup;

  return (
    <div className="ssc__student-profile">
      {/* Basic info visible to everyone */}
      <h2>{student.name}</h2>
      <p>{student.title}</p>

      {/* Premium-only detailed info */}
      {canViewDetails ? (
        <>
          <div className="ssc__student-profile__contact">
            <h3>{translate('profile.contact', 'Contact Information')}</h3>
            <p>Email: {student.email}</p>
            <p>Phone: {student.phone}</p>
            <p>LinkedIn: {student.linkedin}</p>
          </div>

          <div className="ssc__student-profile__resume">
            <h3>{translate('profile.resume', 'Resume')}</h3>
            <button onClick={() => downloadResume(student.resumeUrl)}>
              <Download size={16} />
              {translate('profile.downloadResume', 'Download Resume')}
            </button>
          </div>

          <div className="ssc__student-profile__preferences">
            <h3>{translate('profile.preferences', 'Job Preferences')}</h3>
            <p>Salary: {student.salaryExpectation}</p>
            <p>Availability: {student.availability}</p>
            <p>Locations: {student.preferredLocations.join(', ')}</p>
          </div>
        </>
      ) : (
        <div className="ssc__premium-feature-locked">
          <Lock size={48} />
          <h3>{translate('premium.detailedProfile.locked', 'Detailed Profile')}</h3>
          <p>
            {translate(
              'premium.detailedProfile.desc',
              'Upgrade to Premium to see contact info, resume, and preferences'
            )}
          </p>
          <button
            className="ssc__btn ssc__btn--primary"
            onClick={() => setShowSubscriptionPlans(true)}
          >
            <Crown size={16} />
            {translate('premium.unlock', 'Unlock Premium')}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Profile View Tracking

### Track Profile Views Automatically

```javascript
import { useTrackProfileView } from '../hooks/useSubscription';

function StudentProfilePage({ studentId }) {
  const currentUser = useAuth();
  
  // Automatically track view when component mounts
  useTrackProfileView(studentId, {
    viewerId: currentUser?.id,
    viewerType: currentUser?.type || 'anonymous',
    source: 'profile_page',
    companyName: currentUser?.companyName,
  });

  // Rest of component
}
```

### Track from Search Results

```javascript
function JobSearchResults({ jobs }) {
  const handleJobClick = async (job) => {
    // Track that profile appeared in search
    await supabase.from('profile_search_appearances').insert({
      profile_id: job.company_profile_id,
      searcher_id: currentUser?.id,
      search_query: searchQuery,
      search_position: index + 1,
    });

    // Navigate to job
    navigate(`/jobs/${job.id}`);
  };

  return (
    <div>
      {jobs.map((job, index) => (
        <JobCard 
          key={job.id} 
          job={job} 
          onClick={() => handleJobClick(job)} 
        />
      ))}
    </div>
  );
}
```

---

## Featured Jobs

### Display Featured Jobs Prominently

```javascript
import { getFeaturedJobs } from '../services/stripeService';

function JobsPage() {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [regularJobs, setRegularJobs] = useState([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    // Load featured jobs
    const { featuredJobs: featured } = await getFeaturedJobs(5);
    setFeaturedJobs(featured.map(f => f.job));

    // Load regular jobs
    const { jobs } = await getJobs();
    setRegularJobs(jobs);
  };

  return (
    <div className="ssc__jobs-page">
      {/* Featured Jobs Section */}
      {featuredJobs.length > 0 && (
        <section className="ssc__featured-jobs">
          <h2>
            <Sparkles size={24} />
            {translate('jobs.featured', 'Featured Jobs')}
          </h2>
          <div className="ssc__featured-jobs__grid">
            {featuredJobs.map(job => (
              <FeaturedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Regular Jobs */}
      <section className="ssc__regular-jobs">
        <h2>{translate('jobs.all', 'All Jobs')}</h2>
        {regularJobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </section>
    </div>
  );
}
```

### Featured Job Card

```javascript
function FeaturedJobCard({ job }) {
  return (
    <div className="ssc__job-card ssc__job-card--featured">
      <div className="ssc__job-card__featured-badge">
        <Sparkles size={14} />
        {translate('jobs.featured', 'Featured')}
      </div>
      
      <h3>{job.title}</h3>
      <p>{job.company}</p>
      <p>{job.location}</p>
      
      {/* Rest of job card */}
    </div>
  );
}
```

### Allow Startups to Feature Jobs

```javascript
import { featureJob } from '../services/stripeService';

function JobManagement({ job, subscription, isPremium }) {
  const [featuring, setFeaturing] = useState(false);

  const handleFeatureJob = async () => {
    if (!isPremium) {
      setShowSubscriptionPlans(true);
      return;
    }

    setFeaturing(true);
    try {
      await featureJob(job.id, subscription.id, 'premium', 30);
      alert(translate('jobs.featured.success', 'Job featured successfully!'));
    } catch (error) {
      alert(translate('jobs.featured.error', 'Failed to feature job'));
    }
    setFeaturing(false);
  };

  return (
    <div className="ssc__job-management">
      <h3>{job.title}</h3>
      
      {isPremium ? (
        <button 
          onClick={handleFeatureJob}
          disabled={featuring}
          className="ssc__btn ssc__btn--primary"
        >
          <Sparkles size={16} />
          {featuring 
            ? translate('jobs.featuring', 'Featuring...')
            : translate('jobs.featureJob', 'Feature This Job')
          }
        </button>
      ) : (
        <button
          onClick={() => setShowSubscriptionPlans(true)}
          className="ssc__btn ssc__btn--secondary"
        >
          <Crown size={16} />
          {translate('jobs.upgradeTo Feature', 'Upgrade to Feature Jobs')}
        </button>
      )}
    </div>
  );
}
```

---

## Ad-Free Experience

### Conditional Ad Display

```javascript
function AdContainer({ isPremium, placement }) {
  // Don't show ads to premium users
  if (isPremium) {
    return null;
  }

  return (
    <div className="ssc__ad-container">
      <span className="ssc__ad-label">
        {translate('ad.label', 'Advertisement')}
      </span>
      <Ad placement={placement} />
      
      {/* Upsell to remove ads */}
      <button
        className="ssc__ad-remove-link"
        onClick={() => setShowSubscriptionPlans(true)}
      >
        {translate('ad.remove', 'Remove ads with Premium')}
      </button>
    </div>
  );
}

// Usage
function JobsListPage({ isPremium }) {
  return (
    <div>
      <JobsList />
      
      {/* Show ad every 5 jobs for free users */}
      <AdContainer isPremium={isPremium} placement="jobs_list" />
      
      <JobsList />
    </div>
  );
}
```

### Ad-Free Banner

```javascript
function PremiumAdFreeBanner() {
  return (
    <div className="ssc__ad-free-banner">
      <Check size={20} color="#10b981" />
      <span>{translate('premium.adFree', 'Enjoying an ad-free experience')}</span>
    </div>
  );
}
```

---

## Complete Integration Example

Here's a complete example showing all features together:

```javascript
import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import Modal from './components/Modal';
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionManager from './components/SubscriptionManager';
import PremiumBadge from './components/PremiumBadge';
import useSubscription from './hooks/useSubscription';
import './components/Subscription.css';

function SwissStartupConnect() {
  const [user, setUser] = useState(null);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  
  // Subscription state
  const { subscription, isPremium, loading: subscriptionLoading } = useSubscription(user?.id);

  return (
    <div className="ssc">
      {/* Header with Premium Badge */}
      <header className="ssc__header">
        <h1>Swiss Startup Connect</h1>
        {user && (
          <div className="ssc__user-info">
            <span>{user.name}</span>
            {isPremium && <PremiumBadge translate={translate} />}
            
            <button onClick={() => setShowSubscriptionManager(true)}>
              <Crown size={16} />
              {isPremium ? 'Manage' : 'Upgrade'}
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="ssc__main">
        {/* Your existing app content */}
        
        {/* Conditionally show premium upsell */}
        {!isPremium && user && (
          <aside className="ssc__premium-sidebar">
            <Crown size={32} />
            <h3>Unlock Premium</h3>
            <button onClick={() => setShowSubscriptionPlans(true)}>
              Upgrade Now
            </button>
          </aside>
        )}
      </main>

      {/* Subscription Modals */}
      {showSubscriptionPlans && (
        <Modal onClose={() => setShowSubscriptionPlans(false)}>
          <SubscriptionPlans
            user={user}
            translate={translate}
            onClose={() => setShowSubscriptionPlans(false)}
          />
        </Modal>
      )}

      {showSubscriptionManager && (
        <Modal onClose={() => setShowSubscriptionManager(false)}>
          <SubscriptionManager
            user={user}
            translate={translate}
            onUpgrade={() => {
              setShowSubscriptionManager(false);
              setShowSubscriptionPlans(true);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default SwissStartupConnect;
```

---

## Summary

You now have:

✅ Premium subscription plans (monthly, quarterly, yearly)  
✅ Profile view tracking  
✅ Search appearance tracking  
✅ Featured jobs for startups  
✅ Ad-free experience  
✅ Premium badges  
✅ Subscription management  

Next: Follow the [PREMIUM_SUBSCRIPTION_SETUP.md](./PREMIUM_SUBSCRIPTION_SETUP.md) guide to configure Stripe and deploy!

