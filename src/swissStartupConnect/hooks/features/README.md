# SwissStartupConnect Feature Hooks

This directory contains feature-focused custom hooks extracted from the monolithic `SwissStartupConnect` component.

## Overview

These hooks break down the 10,000+ line component into manageable, testable pieces. Each hook manages a specific feature domain with clear boundaries and responsibilities.

## Available Hooks

| Hook | Size | Responsibility | Key State |
|------|------|----------------|-----------|
| `useAuth` | 520 lines | Authentication & security | user, login/register forms, modals |
| `useProfile` | 460 lines | User profile management | profile, profileForm, CV handling |
| `useStartupProfile` | 380 lines | Startup profile management | startupProfile, startupForm |
| `useJobs` | 380 lines | Jobs data & saved jobs | jobs, savedJobs, appliedJobs |
| `useCompanies` | 310 lines | Companies data & following | companies, followedCompanies |
| `useApplications` | 500 lines | Applications & CV uploads | applications, threads, CV upload |
| `useReviews` | 100 lines | Company reviews | reviews, reviewForm |
| `useEvents` | 160 lines | Events management | events, eventForm |
| `useSalaryCalculator` | 50 lines | Salary calculator UI | calculator state |

## Quick Start

### Basic Usage

```javascript
import { useAuth, useJobs, useProfile } from './swissStartupConnect/hooks/features';

function MyComponent() {
  // Initialize hooks
  const auth = useAuth({ translate, setFeedback });
  const profile = useProfile({ user: auth.user, translate, setFeedback });
  const jobs = useJobs({ jobFilters, translate, setFeedback, user: auth.user });
  
  // Use hook state and functions
  if (auth.authLoading) return <Spinner />;
  
  return (
    <div>
      {auth.user ? (
        <UserDashboard user={auth.user} profile={profile.profile} />
      ) : (
        <button onClick={() => auth.setShowLoginModal(true)}>Login</button>
      )}
      
      <JobsList 
        jobs={jobs.jobs} 
        savedJobs={jobs.savedJobs}
        onToggleSave={jobs.toggleSavedJob}
      />
    </div>
  );
}
```

### Hook Dependencies

Some hooks depend on state from others:

```javascript
// useProfile needs user from useAuth
const auth = useAuth({ translate, setFeedback });
const profile = useProfile({ 
  user: auth.user,  // ← dependency
  translate, 
  setFeedback 
});

// useApplications needs profile data
const applications = useApplications({
  user: auth.user,
  profile: profile.profile,  // ← dependency
  profileForm: profile.profileForm,  // ← dependency
  startupProfile: startup.startupProfile,
  translate,
  setFeedback,
  getLocalizedJobText
});

// useStartupProfile needs upsertCompanyFromStartup
const companies = useCompanies();
const startup = useStartupProfile({
  user: auth.user,
  translate,
  setFeedback,
  upsertCompanyFromStartup: companies.upsertCompanyFromStartup  // ← dependency
});
```

## Hook Details

### 1. useAuth

**Purpose**: Manages all authentication-related state and operations.

**Required Props**:
- `translate(key, fallback, params?)` - Translation function
- `setFeedback({ type, message })` - Feedback display function

**Returns**:
```typescript
{
  // State
  user: User | null,
  authLoading: boolean,
  emailVerified: boolean,
  showLoginModal: boolean,
  isRegistering: boolean,
  loginForm: { email: string, password: string },
  registerForm: { name: string, email: string, password: string, type: string },
  
  // Setters
  setUser, setShowLoginModal, setIsRegistering, setLoginForm, setRegisterForm,
  
  // Functions
  handleLogin: (event) => Promise<void>,
  handleRegister: (event) => Promise<void>,
  handleLogout: () => Promise<void>,
  resendVerificationEmail: () => Promise<void>,
  handleForgotPassword: () => Promise<void>,
  handleResetPassword: (event) => Promise<void>,
  handleUpdatePassword: (event) => Promise<void>,
  handleUpdateEmail: (event) => Promise<void>,
  
  // ... more state and functions
}
```

---

### 2. useProfile

**Purpose**: Manages user/student profile data and operations.

**Required Props**:
- `user` - Current user object
- `translate` - Translation function
- `setFeedback` - Feedback function

**Returns**:
```typescript
{
  profile: Profile | null,
  profileForm: ProfileForm,
  profileModalOpen: boolean,
  profileSaving: boolean,
  profileColumnPresence: Record<string, boolean>,
  
  loadProfile: (user, options?) => Promise<void>,
  handleProfileSubmit: (event) => Promise<void>,
  
  // Setters
  setProfile, setProfileForm, setProfileModalOpen,
  
  // Refs
  lastUploadedCvRef: RefObject
}
```

---

### 3. useJobs

**Purpose**: Manages job listings, saved jobs, and job-related operations.

**Required Props**:
- `jobFilters` - Current filter configuration
- `translate` - Translation function
- `setFeedback` - Feedback function
- `user` - Current user

**Returns**:
```typescript
{
  jobs: Job[],
  jobsLoading: boolean,
  savedJobs: string[],
  appliedJobs: string[],
  selectedJob: Job | null,
  jobHasMorePages: boolean,
  
  toggleSavedJob: (jobId) => void,
  refreshJobs: () => void,
  
  setSelectedJob, setJobPageRequest,
  
  // ... more state
}
```

---

### 4. useApplications

**Purpose**: Manages job applications, CV uploads, and application threads.

**Required Props**:
- `user` - Current user
- `profile` - User profile
- `profileForm` - Profile form state
- `startupProfile` - Startup profile (for startup users)
- `translate` - Translation function
- `setFeedback` - Feedback function
- `getLocalizedJobText` - Function to get localized job text

**Returns**:
```typescript
{
  applications: Application[],
  applicationsLoading: boolean,
  applicationModal: Job | null,
  applicationSaving: boolean,
  
  cvUploadState: 'idle' | 'uploading' | 'success' | 'error',
  acknowledgeShare: boolean,
  useExistingCv: boolean,
  
  applicationThreads: Record<string, Thread>,
  
  submitApplication: () => Promise<void>,
  handleApplicationStatusUpdate: (id, status) => Promise<void>,
  
  // ... more state and refs
}
```

---

## Testing

Each hook can be tested independently:

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  const mockTranslate = (key, fallback) => fallback;
  const mockSetFeedback = jest.fn();
  
  it('initializes with authLoading true', () => {
    const { result } = renderHook(() => 
      useAuth({ translate: mockTranslate, setFeedback: mockSetFeedback })
    );
    
    expect(result.current.authLoading).toBe(true);
  });
  
  it('handles login form changes', () => {
    const { result } = renderHook(() => 
      useAuth({ translate: mockTranslate, setFeedback: mockSetFeedback })
    );
    
    act(() => {
      result.current.setLoginForm({ email: 'test@example.com', password: 'pass' });
    });
    
    expect(result.current.loginForm.email).toBe('test@example.com');
  });
});
```

## Integration Patterns

### Pattern 1: Feature-Based Organization

Organize components by feature, importing only needed hooks:

```
src/features/
├── auth/
│   ├── LoginPage.jsx         (uses useAuth)
│   └── RegisterPage.jsx      (uses useAuth)
├── jobs/
│   ├── JobsListPage.jsx      (uses useJobs)
│   └── JobDetailsPage.jsx    (uses useJobs, useApplications)
└── profile/
    └── ProfilePage.jsx       (uses useProfile, useAuth)
```

### Pattern 2: Composition

Compose multiple hooks for complex features:

```javascript
function JobApplicationFlow() {
  const auth = useAuth({ translate, setFeedback });
  const profile = useProfile({ user: auth.user, translate, setFeedback });
  const jobs = useJobs({ jobFilters, translate, setFeedback, user: auth.user });
  const applications = useApplications({
    user: auth.user,
    profile: profile.profile,
    profileForm: profile.profileForm,
    translate,
    setFeedback,
    getLocalizedJobText
  });
  
  // Compose logic from multiple hooks
  const handleApply = () => {
    if (!auth.user) {
      auth.setShowLoginModal(true);
      return;
    }
    
    if (!profile.profile) {
      profile.setProfileModalOpen(true);
      return;
    }
    
    applications.setApplicationModal(jobs.selectedJob);
  };
  
  return <ApplyButton onClick={handleApply} />;
}
```

### Pattern 3: Context Integration

For deeply nested components, combine with React Context:

```javascript
// contexts/AppContext.jsx
const AppContext = createContext();

export function AppProvider({ children }) {
  const auth = useAuth({ translate, setFeedback });
  const profile = useProfile({ user: auth.user, translate, setFeedback });
  const jobs = useJobs({ jobFilters, translate, setFeedback, user: auth.user });
  
  return (
    <AppContext.Provider value={{ auth, profile, jobs }}>
      {children}
    </AppContext.Provider>
  );
}

// Anywhere in the app
function DeepComponent() {
  const { auth, jobs } = useContext(AppContext);
  // Use hooks via context
}
```

## Performance Optimization

### Memoization

Memoize expensive computations:

```javascript
const jobs = useJobs({ jobFilters, translate, setFeedback, user });

const filteredJobs = useMemo(() => {
  return jobs.jobs.filter(job => 
    job.location === selectedLocation &&
    job.type === selectedType
  );
}, [jobs.jobs, selectedLocation, selectedType]);
```

### Lazy Loading

Lazy load hooks for rarely-used features:

```javascript
// Only load reviews when needed
const ReviewsSection = React.lazy(() => import('./ReviewsSection'));

function CompanyPage() {
  const [showReviews, setShowReviews] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowReviews(true)}>Show Reviews</button>
      
      {showReviews && (
        <Suspense fallback={<Spinner />}>
          <ReviewsSection />
        </Suspense>
      )}
    </div>
  );
}
```

## Common Patterns

### Error Handling

Most hooks handle errors internally and use `setFeedback`:

```javascript
const jobs = useJobs({ jobFilters, translate, setFeedback, user });

// Hook internally handles errors like this:
try {
  // ... fetch jobs
} catch (error) {
  setFeedback({ type: 'error', message: error.message });
}
```

### Loading States

All data-fetching hooks provide loading states:

```javascript
const jobs = useJobs({ ... });
const companies = useCompanies();
const applications = useApplications({ ... });

if (jobs.jobsLoading || companies.companiesLoading || applications.applicationsLoading) {
  return <LoadingSpinner />;
}
```

### Fallback Data

Hooks with data fetching support fallback/mock data:

```javascript
// useJobs automatically falls back to mock data if Supabase fails
const jobs = useJobs({ ... });

// Check if using fallback
if (jobs.jobsFallbackActive) {
  return <Notice>Using offline data</Notice>;
}
```

## Migration Checklist

When migrating from the monolithic component:

- [ ] Import necessary hooks
- [ ] Update state references (e.g., `user` → `auth.user`)
- [ ] Update setter references (e.g., `setUser` → `auth.setUser`)
- [ ] Update function calls (e.g., `handleLogin` → `auth.handleLogin`)
- [ ] Pass hook dependencies correctly
- [ ] Test authentication flow
- [ ] Test data fetching
- [ ] Test form submissions
- [ ] Test local storage persistence
- [ ] Verify no console errors
- [ ] Check for missing dependencies

## Troubleshooting

### "Hook not updating"
Check if you're passing all required dependencies. Some hooks need state from other hooks.

### "Cannot read property of undefined"
Ensure parent hook is initialized before dependent hooks. Example: initialize `useAuth` before `useProfile`.

### "Infinite re-render loop"
Check useEffect dependencies in the hook. This usually means a dependency is changing on every render.

### "Local storage not persisting"
Hooks use `window.localStorage`. Ensure:
1. Code is running in browser (not SSR)
2. localStorage is not disabled
3. No browser privacy mode

## Additional Resources

- [REFACTORING_GUIDE.md](../../../REFACTORING_GUIDE.md) - Complete refactoring documentation
- [REFACTORING_SUMMARY.md](../../../REFACTORING_SUMMARY.md) - Summary of changes
- Original `SwissStartupConnect.jsx` - Reference implementation

## Support

For questions or issues:
1. Check hook source code (well-commented)
2. Review this README
3. Consult the refactoring guide
4. Test hook in isolation

---

*Last updated: October 2025*

