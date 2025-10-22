# 🚀 Quick Start Guide - Swiss Startup Connect Phase 1

Get your new features up and running in 30 minutes!

---

## ⚡ 5-Minute Setup (Minimum Viable)

### Step 1: Database (2 minutes)

```bash
# Run both SQL files in Supabase SQL Editor
# 1. Copy contents of supabase-notifications-schema.sql
# 2. Run in SQL Editor
# 3. Copy contents of supabase-user-preferences-schema.sql
# 4. Run in SQL Editor
```

### Step 2: Email Service (2 minutes)

```bash
# Sign up for Resend: https://resend.com
# Get your API key
# Add to .env.local:
echo 'REACT_APP_EMAIL_PROVIDER=resend' >> .env.local
echo 'REACT_APP_RESEND_API_KEY=re_your_key_here' >> .env.local
echo 'REACT_APP_FROM_EMAIL=noreply@yourdomain.com' >> .env.local
```

### Step 3: Add to Your App (1 minute)

```javascript
// In your main SwissStartupConnect.jsx
import NotificationCenter from './components/NotificationCenter';
import './components/Notifications.css';
import './components/Recommendations.css';

// In your header:
{user && (
  <NotificationCenter user={user} translate={translate} />
)}
```

**That's it! You now have notifications!** 🎉

---

## 📧 Full Setup (30 minutes)

### Part 1: Database Setup (5 min)

1. **Run Migrations:**
   ```bash
   cd /Users/luca/cloneswiss/swiss
   
   # Option A: Using psql
   psql -h your-db.supabase.co -U postgres -d postgres \
     -f supabase-notifications-schema.sql
   
   psql -h your-db.supabase.co -U postgres -d postgres \
     -f supabase-user-preferences-schema.sql
   
   # Option B: Using Supabase Dashboard
   # 1. Go to SQL Editor
   # 2. Copy/paste each file
   # 3. Run
   ```

2. **Verify Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%notification%' OR table_name = 'user_preferences';
   
   -- Should see:
   -- notification_preferences
   -- saved_searches
   -- job_alerts
   -- notification_queue
   -- notification_history
   -- job_views
   -- company_metrics
   -- user_preferences
   ```

### Part 2: Email Service (5 min)

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Create account
   - Verify your domain (or use resend.dev for testing)
   - Get API key

2. **Configure Environment:**
   ```bash
   # Create/edit .env.local
   REACT_APP_EMAIL_PROVIDER=resend
   REACT_APP_RESEND_API_KEY=re_xxxxxxxxxxxxx
   REACT_APP_FROM_EMAIL=noreply@swissstartupconnect.com
   REACT_APP_FROM_NAME=Swiss Startup Connect
   REACT_APP_URL=http://localhost:3000
   ```

3. **Test Email:**
   ```javascript
   // In browser console:
   import { sendJobAlertEmail } from './services/emailService';
   
   await sendJobAlertEmail(
     'your.email@example.com',
     [{
       id: '1',
       title: 'Test Job',
       company_name: 'Test Co',
       location: 'Zurich',
       description: 'This is a test',
     }],
     'Test Search'
   );
   ```

### Part 3: Frontend Integration (10 min)

1. **Import CSS:**
   ```javascript
   // In src/SwissStartupConnect.jsx or App.js
   import './components/Notifications.css';
   import './components/Recommendations.css';
   ```

2. **Add Notification Center:**
   ```javascript
   import NotificationCenter from './components/NotificationCenter';
   
   // In your header/nav:
   {user && (
     <NotificationCenter 
       user={user} 
       translate={translate} 
     />
   )}
   ```

3. **Add Recommended Jobs:**
   ```javascript
   import RecommendedJobs from './components/RecommendedJobs';
   
   // On your jobs page or homepage:
   {user && (
     <RecommendedJobs
       user={user}
       allJobs={jobs}
       translate={translate}
       onJobClick={handleJobClick}
       limit={6}
     />
   )}
   ```

4. **Add Saved Searches:**
   ```javascript
   import SavedSearches from './components/SavedSearches';
   
   // On a dedicated page or sidebar:
   <SavedSearches
     user={user}
     translate={translate}
     setFeedback={setFeedback}
     currentFilters={currentFilters}
     onApplySearch={applyFilters}
   />
   ```

5. **Add Settings Page:**
   ```javascript
   import NotificationPreferences from './components/NotificationPreferences';
   
   // In settings:
   <NotificationPreferences
     user={user}
     translate={translate}
     setFeedback={setFeedback}
   />
   ```

6. **Add Analytics (for employers):**
   ```javascript
   import AnalyticsDashboard from './components/AnalyticsDashboard';
   
   // In employer dashboard:
   {user?.type === 'startup' && (
     <AnalyticsDashboard
       user={user}
       startup={startupProfile}
       translate={translate}
     />
   )}
   ```

### Part 4: Job Tracking (5 min)

```javascript
import { useJobTracking } from './hooks/useJobTracking';

// In your JobDetailPage component:
const JobDetailPage = ({ job, user }) => {
  const { trackApplyClick, trackSave } = useJobTracking(job, user, {
    source: 'search',
    trackViews: true,
    trackScrollDepth: true,
    trackTimeSpent: true,
  });

  return (
    <div>
      <h1>{job.title}</h1>
      {/* ... job details ... */}
      
      <button onClick={() => {
        trackSave();
        saveJob(job.id);
      }}>
        Save Job
      </button>
      
      <button onClick={() => {
        trackApplyClick();
        openApplicationModal();
      }}>
        Apply Now
      </button>
    </div>
  );
};
```

### Part 5: Edge Function (5 min)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Deploy Function:**
   ```bash
   cd /Users/luca/cloneswiss/swiss
   supabase functions deploy process-job-alerts
   ```

3. **Set Secrets:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxx
   supabase secrets set FROM_EMAIL=noreply@swissstartupconnect.com
   supabase secrets set FROM_NAME="Swiss Startup Connect"
   supabase secrets set APP_URL=https://swissstartupconnect.com
   ```

4. **Test Function:**
   ```bash
   curl -X POST \
     'https://your-project.supabase.co/functions/v1/process-job-alerts' \
     -H 'Authorization: Bearer YOUR_ANON_KEY'
   ```

---

## 🧪 Testing Your Setup

### Test 1: Create a Saved Search

```javascript
// In browser console (logged in as user):
import { createSavedSearch } from './services/supabaseNotifications';

await createSavedSearch(user.id, {
  name: 'My Test Search',
  description: 'Testing saved searches',
  filters: {
    searchTerm: 'Developer',
    locations: ['Zurich'],
  },
  alert_enabled: true,
  alert_frequency: 'instant',
});

// Check: Go to Saved Searches page, should see your search!
```

### Test 2: Queue a Notification

```javascript
import { queueNotification } from './services/supabaseNotifications';

await queueNotification(
  user.id,
  'job_alert',
  {
    subject: 'Test Job Alert',
    savedSearchName: 'My Test Search',
    jobs: [{
      id: '1',
      title: 'Test Developer',
      company_name: 'Test Co',
      location: 'Zurich',
    }],
  }
);

// Check: Should appear in notification center!
```

### Test 3: Send Test Email

```javascript
// Manually trigger email processor
await fetch('https://your-project.supabase.co/functions/v1/process-job-alerts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
  },
});

// Check: Email should be in your inbox!
```

### Test 4: View Recommendations

```javascript
// Just browse some jobs
// - Save a few
// - Apply to some
// - View different ones

// Then refresh the page
// Check: RecommendedJobs section should show personalized matches!
```

---

## 🎨 Customization

### Change Email Templates

Edit `src/services/emailService.js`:

```javascript
// Find generateJobAlertHTML function
// Modify the HTML template
// Colors, layout, branding, etc.
```

### Adjust Recommendation Algorithm

Edit `src/services/jobRecommendations.js`:

```javascript
// Find calculateJobScore function
// Modify weights:
const weights = {
  savedJobs: 25,      // Change these numbers
  appliedJobs: 20,    // to tune recommendations
  viewHistory: 15,
  profileMatch: 20,
  locationMatch: 10,
  salaryMatch: 10,
};
```

### Change Alert Frequencies

Edit `supabase-notifications-schema.sql`:

```sql
-- Add new frequency option
job_alert_frequency VARCHAR(50) DEFAULT 'daily' 
  CHECK (job_alert_frequency IN (
    'instant', 
    'daily', 
    'weekly',
    'monthly'  -- Add this
  ))
```

---

## 🔥 Pro Tips

### Tip 1: Start Small
Don't enable all features at once. Roll out gradually:
- Week 1: Notification center + preferences
- Week 2: Saved searches + alerts
- Week 3: Recommendations
- Week 4: Analytics

### Tip 2: Monitor Performance
```sql
-- Check email send success rate
SELECT 
  status,
  COUNT(*) as count
FROM notification_queue
GROUP BY status;

-- Check most popular saved searches
SELECT 
  name,
  COUNT(*) as users
FROM saved_searches
WHERE is_active = true
GROUP BY name
ORDER BY users DESC
LIMIT 10;
```

### Tip 3: Optimize Recommendations
```javascript
// Initially, show random jobs for new users
// As they interact, recommendations improve
if (userInteractionCount < 5) {
  // Show trending/popular jobs
} else {
  // Show personalized recommendations
}
```

### Tip 4: A/B Test Email Timing
```sql
-- Try different send times
-- 9 AM vs 6 PM
-- Weekday vs Weekend
-- Track open rates to optimize
```

---

## 📚 Additional Resources

- **Full Setup**: `NOTIFICATIONS_SETUP_GUIDE.md`
- **Code Examples**: `INTEGRATION_EXAMPLE.md`
- **Feature Overview**: `IMPROVEMENTS_SUMMARY.md`
- **Environment**: `ENVIRONMENT_SETUP.md`
- **Phase 1 Summary**: `PHASE_1_COMPLETE.md`

---

## 🆘 Common Issues

### Issue: "Emails not sending"
**Solution**: Check these in order:
1. Is `REACT_APP_RESEND_API_KEY` set correctly?
2. Is `FROM_EMAIL` verified in Resend?
3. Are notifications in the queue? (Check `notification_queue` table)
4. Is the Edge Function deployed?
5. Check Edge Function logs in Supabase Dashboard

### Issue: "Recommendations not showing"
**Solution**:
1. Has user saved/viewed any jobs?
2. Are there enough jobs in the database?
3. Check browser console for errors
4. Verify `user_preferences` table exists

### Issue: "Saved searches not working"
**Solution**:
1. Is user logged in?
2. Check `saved_searches` table in Supabase
3. Verify RLS policies are enabled
4. Check browser console for errors

### Issue: "Analytics showing 0"
**Solution**:
1. Is `job_views` table created?
2. Is tracking hook being used?
3. Wait a few minutes (data is async)
4. Check table directly: `SELECT * FROM job_views LIMIT 10;`

---

## ✅ Final Checklist

- [ ] Database migrations run successfully
- [ ] Email service configured and tested
- [ ] NotificationCenter added to header
- [ ] RecommendedJobs showing on homepage
- [ ] SavedSearches page created
- [ ] NotificationPreferences in settings
- [ ] AnalyticsDashboard for employers
- [ ] Job tracking hooks integrated
- [ ] Edge Function deployed
- [ ] Cron jobs scheduled
- [ ] Test email received
- [ ] Test saved search created
- [ ] Test recommendations showing
- [ ] Analytics tracking data

---

## 🎉 You're Ready!

Once all checkboxes are ✅, your Phase 1 implementation is complete!

Your users can now:
- 📧 Get email alerts for matching jobs
- 🔔 See in-app notifications
- 💾 Save their favorite searches
- 🤖 Discover personalized job recommendations
- ⚙️ Customize their notification preferences

Your employers can now:
- 📊 View detailed analytics
- 👁️ Track job view metrics
- 📈 See conversion rates
- ⭐ Display trust signals
- 💡 Get performance insights

**Congratulations!** 🚀

---

**Next Steps**: See `PHASE_1_COMPLETE.md` for what comes next!

