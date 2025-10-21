# SwissStartupConnect Refactoring Guide

## Overview

The `SwissStartupConnect` component has been refactored to break down its monolithic structure (10,000+ lines, 117+ state variables) into feature-focused, manageable modules. This refactoring improves:

- **Testability**: Each feature can be tested in isolation
- **Maintainability**: Clear separation of concerns
- **Reusability**: Hooks can be used in other components
- **Performance**: Enables lazy loading of features
- **Developer Experience**: Easier to understand and modify

## New Hook Architecture

### 1. `useAuth` - Authentication Management
**Location**: `src/swissStartupConnect/hooks/features/useAuth.js`

**Responsibilities**:
- User authentication state (login, logout, registration)
- Email verification and password reset
- Session management
- Security settings (password change, email update)

**Key State**:
- `user`, `authLoading`, `emailVerified`
- `showLoginModal`, `isRegistering`
- `loginForm`, `registerForm`
- Password visibility toggles

**Key Functions**:
- `handleLogin()`, `handleRegister()`, `handleLogout()`
- `resendVerificationEmail()`, `handleForgotPassword()`
- `handleResetPassword()`, `handleUpdatePassword()`, `handleUpdateEmail()`

**Usage**:
```javascript
const auth = useAuth({ translate, setFeedback });

// Access user state
if (auth.user) {
  console.log('Logged in as:', auth.user.name);
}

// Handle login
<button onClick={auth.handleLogin}>Login</button>

// Toggle login modal
auth.setShowLoginModal(true);
```

---

### 2. `useProfile` - User Profile Management
**Location**: `src/swissStartupConnect/hooks/features/useProfile.js`

**Responsibilities**:
- Student/user profile CRUD operations
- Profile form state management
- CV file handling
- Profile caching

**Key State**:
- `profile`, `profileForm`
- `profileModalOpen`, `profileSaving`
- `profileColumnPresence`

**Key Functions**:
- `loadProfile(user)` - Load user profile from Supabase
- `handleProfileSubmit()` - Save profile changes

**Usage**:
```javascript
const profile = useProfile({ user, translate, setFeedback });

// Access profile data
const userName = profile.profile?.full_name;

// Update profile
<button onClick={profile.handleProfileSubmit}>Save Profile</button>
```

---

### 3. `useStartupProfile` - Startup Profile Management
**Location**: `src/swissStartupConnect/hooks/features/useStartupProfile.js`

**Responsibilities**:
- Startup company profile CRUD operations
- Dynamic field handling (team size, fundraising, etc.)
- Verification status management

**Key State**:
- `startupProfile`, `startupForm`
- `startupModalOpen`, `startupSaving`
- `startupColumnPresence`

**Key Functions**:
- `loadStartupProfile(user)` - Load startup profile
- `handleStartupSubmit()` - Save startup profile

**Dependencies**:
- Requires `upsertCompanyFromStartup` callback to sync company data

**Usage**:
```javascript
const startup = useStartupProfile({ 
  user, 
  translate, 
  setFeedback, 
  upsertCompanyFromStartup 
});

// Access startup data
const companyName = startup.startupProfile?.name;
```

---

### 4. `useJobs` - Jobs Data & Saved Jobs
**Location**: `src/swissStartupConnect/hooks/features/useJobs.js`

**Responsibilities**:
- Job listings data fetching and pagination
- Saved jobs management (localStorage)
- Applied jobs tracking
- Job selection and filtering
- Job posting (for startups)

**Key State**:
- `jobs`, `jobsLoading`, `jobsFallbackActive`
- `selectedJob`, `mapFocusJobId`
- `savedJobs`, `appliedJobs`
- `jobPageRequest`, `jobHasMorePages`
- `postJobModalOpen`, `jobForm`

**Key Functions**:
- `toggleSavedJob(jobId)` - Save/unsave a job
- `refreshJobs()` - Reload jobs data

**Usage**:
```javascript
const jobs = useJobs({ jobFilters, translate, setFeedback, user });

// Display jobs
jobs.jobs.map(job => <JobCard key={job.id} job={job} />);

// Toggle saved status
<button onClick={() => jobs.toggleSavedJob(job.id)}>
  {jobs.savedJobs.includes(job.id) ? 'Unsave' : 'Save'}
</button>

// Load more
if (jobs.jobHasMorePages) {
  jobs.setJobPageRequest(prev => prev + 1);
}
```

---

### 5. `useCompanies` - Companies Data & Following
**Location**: `src/swissStartupConnect/hooks/features/useCompanies.js`

**Responsibilities**:
- Company listings data fetching and pagination
- Followed companies management (localStorage)
- Company catalog management
- Company sorting

**Key State**:
- `companies`, `companiesLoading`, `companiesFallbackActive`
- `activeCompanyProfile`
- `companyCatalog`, `companyCatalogById`
- `followedCompanies`, `companySort`

**Key Functions**:
- `upsertCompanyFromStartup(startup)` - Sync startup to companies
- `toggleFollowedCompany(companyId)` - Follow/unfollow company

**Usage**:
```javascript
const companies = useCompanies();

// Display companies
companies.companies.map(company => 
  <CompanyCard key={company.id} company={company} />
);

// Toggle follow
<button onClick={() => companies.toggleFollowedCompany(company.id)}>
  {companies.followedCompanies.includes(company.id) ? 'Unfollow' : 'Follow'}
</button>
```

---

### 6. `useApplications` - Job Applications & CV Uploads
**Location**: `src/swissStartupConnect/hooks/features/useApplications.js`

**Responsibilities**:
- Job application submission and tracking
- CV file uploads and management
- Motivational letter handling
- Application status updates
- Application threads (messaging)
- Local storage fallback for offline applications

**Key State**:
- `applications`, `applicationsLoading`
- `applicationModal`, `applicationSaving`, `applicationError`
- `cvUploadState`, `cvUploadError`
- `acknowledgeShare`, `useExistingCv`
- `applicationThreads`, `applicationThreadDrafts`
- `expandedApplicationId`

**Key Functions**:
- `submitApplication()` - Submit job application
- `handleApplicationStatusUpdate(id, status)` - Update application status

**Usage**:
```javascript
const applications = useApplications({ 
  user, 
  profile, 
  profileForm,
  startupProfile,
  translate, 
  setFeedback,
  getLocalizedJobText 
});

// Submit application
<button 
  onClick={applications.submitApplication}
  disabled={applications.applicationSaving}
>
  Submit Application
</button>

// Update status (for startups)
applications.handleApplicationStatusUpdate(app.id, 'accepted');
```

---

### 7. `useReviews` - Company Reviews
**Location**: `src/swissStartupConnect/hooks/features/useReviews.js`

**Responsibilities**:
- Company review fetching and display
- Review submission
- Review eligibility checking

**Key State**:
- `reviewsModal`, `reviews`, `reviewsLoading`
- `canReview`, `reviewForm`

**Key Functions**:
- `openReviewsModal(company)` - Load reviews for a company
- `submitReview(event)` - Submit a review

**Usage**:
```javascript
const reviews = useReviews({ user, profile, setFeedback });

// Open reviews modal
<button onClick={() => reviews.openReviewsModal(company)}>
  View Reviews
</button>

// Submit review
{reviews.canReview && (
  <form onSubmit={reviews.submitReview}>
    {/* Review form */}
  </form>
)}
```

---

### 8. `useEvents` - Events Management
**Location**: `src/swissStartupConnect/hooks/features/useEvents.js`

**Responsibilities**:
- Events data fetching
- Event creation (for startups)
- Event form management

**Key State**:
- `events`, `eventsLoading`, `eventsFallbackActive`
- `eventModalOpen`, `eventForm`, `eventFormSaving`

**Key Functions**:
- `handleEventSubmit(event)` - Create new event

**Usage**:
```javascript
const events = useEvents({ user, startupProfile, translate, setFeedback });

// Display events
events.events.map(event => <EventCard key={event.id} event={event} />);

// Create event (startups only)
{user?.type === 'startup' && (
  <button onClick={() => events.setEventModalOpen(true)}>
    Create Event
  </button>
)}
```

---

### 9. `useSalaryCalculator` - Salary Calculator
**Location**: `src/swissStartupConnect/hooks/features/useSalaryCalculator.js`

**Responsibilities**:
- Salary calculator UI state
- Salary/equity range selection

**Key State**:
- `salaryCalculatorOpen`, `salaryCalculatorRevealed`
- `salaryCalculatorCompany`, `salaryCalculatorJobId`
- `activeSalaryThumb`, `activeEquityThumb`

**Key Functions**:
- `openSalaryCalculator(job)` - Open calculator for a job
- `closeSalaryCalculator()` - Close calculator

**Usage**:
```javascript
const calculator = useSalaryCalculator();

// Open calculator
<button onClick={() => calculator.openSalaryCalculator(job)}>
  View Salary Details
</button>
```

---

## Migration Strategy

### Step 1: Import the Hooks
Replace individual useState calls with hook imports:

```javascript
// Before
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
// ... 115 more useState calls

// After
import { 
  useAuth, 
  useProfile, 
  useJobs,
  useCompanies,
  useApplications,
  useReviews,
  useEvents,
  useSalaryCalculator 
} from './swissStartupConnect/hooks/features';

const SwissStartupConnect = () => {
  const auth = useAuth({ translate, setFeedback });
  const profile = useProfile({ user: auth.user, translate, setFeedback });
  const jobs = useJobs({ jobFilters, translate, setFeedback, user: auth.user });
  // ... etc
```

### Step 2: Update References
Update all references to use the new hook namespaces:

```javascript
// Before
if (user) { ... }
setShowLoginModal(true);

// After
if (auth.user) { ... }
auth.setShowLoginModal(true);
```

### Step 3: Extract Modal Components (Optional)
For better organization, extract large modal components:

```javascript
// src/swissStartupConnect/components/LoginModal.jsx
export const LoginModal = ({ auth, translate }) => {
  if (!auth.showLoginModal) return null;
  
  return (
    <Modal onClose={() => auth.setShowLoginModal(false)}>
      {/* Login modal content */}
    </Modal>
  );
};
```

### Step 4: Enable Lazy Loading (Optional)
For rarely-used features, implement lazy loading:

```javascript
const ReviewsModal = React.lazy(() => 
  import('./swissStartupConnect/components/ReviewsModal')
);

// In component
{reviews.reviewsModal && (
  <Suspense fallback={<Spinner />}>
    <ReviewsModal {...reviews} />
  </Suspense>
)}
```

---

## Benefits

### 1. **Reduced Complexity**
- Main component: 10,000+ lines → ~2,000 lines (estimated)
- State variables: 117+ → 9 feature hooks with clear boundaries

### 2. **Better Testing**
Each hook can be tested independently:

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';

test('handles login', async () => {
  const { result } = renderHook(() => useAuth({ translate, setFeedback }));
  
  act(() => {
    result.current.setLoginForm({ email: 'test@example.com', password: 'pass' });
  });
  
  await act(async () => {
    await result.current.handleLogin(mockEvent);
  });
  
  expect(result.current.user).toBeTruthy();
});
```

### 3. **Improved Performance**
- Smaller component re-renders
- Easier to memoize specific features
- Can lazy-load entire feature modules

### 4. **Enhanced Maintainability**
- Clear file structure
- Single Responsibility Principle
- Easier onboarding for new developers

### 5. **Reusability**
Hooks can be reused in other components:
```javascript
// In a separate admin panel
import { useApplications } from '../swissStartupConnect/hooks/features';

const AdminApplications = () => {
  const apps = useApplications({ ... });
  return <ApplicationsTable applications={apps.applications} />;
};
```

---

## File Structure

```
src/
└── swissStartupConnect/
    ├── hooks/
    │   └── features/
    │       ├── index.js                 # Barrel export
    │       ├── useAuth.js               # ~520 lines
    │       ├── useProfile.js            # ~460 lines
    │       ├── useStartupProfile.js     # ~380 lines
    │       ├── useJobs.js               # ~380 lines
    │       ├── useCompanies.js          # ~310 lines
    │       ├── useApplications.js       # ~500 lines
    │       ├── useReviews.js            # ~100 lines
    │       ├── useEvents.js             # ~160 lines
    │       └── useSalaryCalculator.js   # ~50 lines
    └── components/                       # (Optional) Extract modals here
        ├── LoginModal.jsx
        ├── ProfileModal.jsx
        ├── ApplicationModal.jsx
        └── ...
```

---

## Next Steps

1. **Gradual Integration**: Start by integrating one hook at a time
2. **Test Coverage**: Add tests for each hook
3. **Modal Extraction**: Extract large modal components
4. **Performance Optimization**: Add memoization where needed
5. **Documentation**: Document any custom configurations

---

## Troubleshooting

### Missing Dependencies
Some hooks may need additional props. Check the hook's JSDoc and add required dependencies:

```javascript
// useStartupProfile needs upsertCompanyFromStartup
const companies = useCompanies();
const startup = useStartupProfile({
  user: auth.user,
  translate,
  setFeedback,
  upsertCompanyFromStartup: companies.upsertCompanyFromStartup
});
```

### Circular Dependencies
If hooks depend on each other's state:
1. Lift shared state to parent component
2. Pass as props to dependent hooks
3. Or use React Context for deeply nested dependencies

### Performance Issues
If re-renders are excessive:
1. Use `useMemo` for expensive computations
2. Use `useCallback` for event handlers passed to children
3. Consider React.memo for child components

---

## Support

For questions or issues with the refactoring:
1. Check this guide
2. Review the hook source code (well-commented)
3. Test individual hooks in isolation
4. Consult the original SwissStartupConnect.jsx for reference

---

*Last updated: October 2025*

