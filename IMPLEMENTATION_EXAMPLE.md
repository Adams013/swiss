# Implementation Example

This file shows how to refactor SwissStartupConnect.jsx to use the new centralized services and React Query hooks.

## Example: Jobs Section Refactoring

### Before (Old Imperative Approach)

```javascript
import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';

function SwissStartupConnect() {
  const [jobs, setJobs] = useState(mockJobs);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobColumnPresence, setJobColumnPresence] = useState(() => deriveColumnPresence(mockJobs));
  const [jobsVersion, setJobsVersion] = useState(0);

  // Fetch jobs effect
  useEffect(() => {
    const fetchJobs = async () => {
      setJobsLoading(true);
      try {
        const { data, error } = await supabase.from('jobs').select('*');

        if (error) {
          console.info('Falling back to mock jobs', error.message);
          setJobs(mockJobs);
          setJobColumnPresence(deriveColumnPresence(mockJobs));
        } else if (data && data.length > 0) {
          const mapped = data.map((job) => ({
            ...job,
            applicants: job.applicants ?? 0,
            tags: job.tags ?? [],
            requirements: job.requirements ?? [],
            benefits: job.benefits ?? [],
            posted: job.posted || 'Recently posted',
            motivational_letter_required: job.motivational_letter_required ?? false,
          }));
          const supabaseIds = new Set(mapped.map((job) => job.id));
          const mergedJobs = [...mapped, ...mockJobs.filter((job) => !supabaseIds.has(job.id))];
          setJobs(mergedJobs);
          setJobColumnPresence(deriveColumnPresence(data));
        } else {
          setJobs(mockJobs);
          setJobColumnPresence(deriveColumnPresence(mockJobs));
        }
      } catch (error) {
        console.error('Job load error', error);
        setJobs(mockJobs);
        setJobColumnPresence(deriveColumnPresence(mockJobs));
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [jobsVersion]);

  // Job posting handler (100+ lines of while loop logic)
  const handlePostJob = async () => {
    setPostingJob(true);
    const removedColumns = new Set();
    let attemptPayload = { ...jobFormData };

    while (true) {
      const { error } = await supabase.from('jobs').insert(attemptPayload);
      if (!error) {
        setJobColumnPresence((previous) => {
          const next = { ...previous };
          Object.keys(attemptPayload).forEach((key) => {
            next[key] = true;
          });
          return next;
        });
        break;
      }

      const missingColumn = detectMissingColumn(error.message, 'jobs');
      if (!missingColumn) {
        setPostJobError(error.message);
        setPostingJob(false);
        return;
      }

      // ... more column detection logic
      const { [missingColumn]: _omitted, ...rest } = attemptPayload;
      attemptPayload = rest;
      removedColumns.add(missingColumn);
    }

    setPostingJob(false);
    setJobsVersion((v) => v + 1); // Trigger refetch
  };

  return (
    <div>
      {jobsLoading && <Spinner />}
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### After (New Declarative Approach with Hooks)

```javascript
import React, { useState } from 'react';
import { useJobs, useCreateJob } from './hooks/useJobs';
import mockJobs from './mockData';

function SwissStartupConnect() {
  // Fetch jobs with automatic caching and refetching
  const {
    jobs,
    isLoading: jobsLoading,
    columnPresence: jobColumnPresence,
    refetch: refetchJobs,
  } = useJobs(mockJobs);

  // Create job mutation with automatic column detection
  const createJob = useCreateJob({ columnPresence: jobColumnPresence });

  // Job posting handler (much simpler - no while loops!)
  const handlePostJob = async () => {
    try {
      const result = await createJob.mutateAsync(jobFormData);
      
      if (result.error) {
        setPostJobError(result.error.message);
        return;
      }

      setJobModal(null);
      setJobForm({});
      // Jobs are automatically refetched by React Query!
    } catch (error) {
      setPostJobError(error.message);
    }
  };

  return (
    <div>
      {jobsLoading && <Spinner />}
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      
      <button 
        onClick={handlePostJob} 
        disabled={createJob.isLoading}
      >
        {createJob.isLoading ? 'Posting...' : 'Post Job'}
      </button>
    </div>
  );
}
```

## Example: Profile Section Refactoring

### Before

```javascript
const [profile, setProfile] = useState(null);
const [profileColumnPresence, setProfileColumnPresence] = useState({});

useEffect(() => {
  if (!user) return;
  loadProfile(user);
}, [user]);

const loadProfile = async (user) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error', error);
      return;
    }

    if (data) {
      setProfile(data);
      setProfileColumnPresence(deriveColumnPresence([data]));
    }
  } catch (error) {
    console.error('Profile load error', error);
  }
};

const handleSaveProfile = async () => {
  setSavingProfile(true);
  let attemptPayload = { ...profileForm, user_id: user.id };

  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(attemptPayload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (!error) {
      setProfile(data);
      setProfileColumnPresence((prev) => ({
        ...prev,
        ...Object.keys(attemptPayload).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {}),
      }));
      break;
    }

    // ... column detection logic
  }

  setSavingProfile(false);
};
```

### After

```javascript
import { useProfile, useUpdateProfile } from './hooks/useProfile';

// Fetch profile with automatic caching
const {
  profile,
  isLoading: profileLoading,
  columnPresence: profileColumnPresence,
} = useProfile(user?.id);

// Update profile mutation
const updateProfile = useUpdateProfile({ 
  columnPresence: profileColumnPresence 
});

const handleSaveProfile = async () => {
  try {
    const result = await updateProfile.mutateAsync({
      ...profileForm,
      user_id: user.id,
    });

    if (result.error) {
      setProfileError(result.error.message);
      return;
    }

    setProfileModal(null);
    // Profile is automatically updated in cache!
  } catch (error) {
    setProfileError(error.message);
  }
};
```

## Example: Companies Section Refactoring

### Before

```javascript
const [companies, setCompanies] = useState(mockCompanies);
const [companiesLoading, setCompaniesLoading] = useState(false);

useEffect(() => {
  fetchCompanies();
}, []);

const fetchCompanies = async () => {
  setCompaniesLoading(true);
  try {
    const { data, error } = await supabase.from('startups').select('*');

    if (error) {
      console.info('Falling back to mock companies', error.message);
      setCompanies(mockCompanies);
    } else if (data && data.length > 0) {
      const mapped = data.map(mapStartupToCompany).filter(Boolean);
      // ... merge logic
      setCompanies(merged);
    } else {
      setCompanies(mockCompanies);
    }
  } catch (error) {
    console.error('Companies load error', error);
    setCompanies(mockCompanies);
  } finally {
    setCompaniesLoading(false);
  }
};
```

### After

```javascript
import { useCompanies } from './hooks/useCompanies';

const {
  companies,
  isLoading: companiesLoading,
  columnPresence: companyColumnPresence,
} = useCompanies(mockCompanies);

// That's it! No manual fetching, loading states, or error handling needed
```

## Example: Startup Profile Refactoring

### Before

```javascript
const [startupProfile, setStartupProfile] = useState(null);
const [startupColumnPresence, setStartupColumnPresence] = useState({});

const loadStartupProfile = async (user) => {
  if (!user || user.type !== 'startup') {
    setStartupProfile(null);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Startup fetch error', error);
      return;
    }

    if (data) {
      setStartupProfile(data);
      setStartupColumnPresence(deriveColumnPresence([data]));
    } else {
      // Create new startup record
      const { data: inserted } = await supabase
        .from('startups')
        .insert({ owner_id: user.id })
        .select('*')
        .single();

      setStartupProfile(inserted);
    }
  } catch (error) {
    console.error('Startup load error', error);
  }
};

useEffect(() => {
  if (user?.type === 'startup') {
    loadStartupProfile(user);
  }
}, [user]);
```

### After

```javascript
import { useStartupProfile, useCreateStartup, useUpdateStartup } from './hooks/useCompanies';

// Fetch startup profile
const {
  startup: startupProfile,
  isLoading: startupLoading,
  columnPresence: startupColumnPresence,
} = useStartupProfile(user?.type === 'startup' ? user.id : null);

// Create startup if needed
const createStartup = useCreateStartup();
const updateStartup = useUpdateStartup({ 
  columnPresence: startupColumnPresence 
});

// Auto-create startup on mount if needed
useEffect(() => {
  if (user?.type === 'startup' && !startupProfile && !startupLoading) {
    createStartup.mutate({
      owner_id: user.id,
      name: user.name,
    });
  }
}, [user, startupProfile, startupLoading]);
```

## Complete Component Structure Example

```javascript
import React, { useState } from 'react';
import { useJobs, useCreateJob } from './hooks/useJobs';
import { useCompanies } from './hooks/useCompanies';
import { useProfile, useUpdateProfile } from './hooks/useProfile';
import { useStartupProfile, useUpdateStartup } from './hooks/useCompanies';

function SwissStartupConnect() {
  // ===== Data Fetching with React Query =====
  
  // Jobs
  const {
    jobs,
    isLoading: jobsLoading,
    columnPresence: jobColumnPresence,
  } = useJobs(mockJobs);

  const createJob = useCreateJob({ columnPresence: jobColumnPresence });

  // Companies
  const {
    companies,
    isLoading: companiesLoading,
    columnPresence: companyColumnPresence,
  } = useCompanies(mockCompanies);

  // Profile (for students)
  const {
    profile,
    isLoading: profileLoading,
    columnPresence: profileColumnPresence,
  } = useProfile(user?.type === 'student' ? user.id : null);

  const updateProfile = useUpdateProfile({ 
    columnPresence: profileColumnPresence 
  });

  // Startup Profile (for startups)
  const {
    startup: startupProfile,
    isLoading: startupLoading,
    columnPresence: startupColumnPresence,
  } = useStartupProfile(user?.type === 'startup' ? user.id : null);

  const updateStartup = useUpdateStartup({ 
    columnPresence: startupColumnPresence 
  });

  // ===== UI State (keeps existing local state) =====
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobModal, setJobModal] = useState(null);
  // ... other UI state

  // ===== Handlers (much simpler now!) =====
  
  const handleSaveProfile = async (formData) => {
    const result = await updateProfile.mutateAsync({
      ...formData,
      user_id: user.id,
    });

    if (result.error) {
      setFeedback({ type: 'error', message: result.error.message });
      return;
    }

    setFeedback({ type: 'success', message: 'Profile saved!' });
    setProfileModal(null);
  };

  const handlePostJob = async (formData) => {
    const result = await createJob.mutateAsync(formData);

    if (result.error) {
      setFeedback({ type: 'error', message: result.error.message });
      return;
    }

    setFeedback({ type: 'success', message: 'Job posted!' });
    setJobModal(null);
  };

  const handleUpdateStartup = async (formData) => {
    const result = await updateStartup.mutateAsync({
      ...formData,
      owner_id: user.id,
    });

    if (result.error) {
      setFeedback({ type: 'error', message: result.error.message });
      return;
    }

    setFeedback({ type: 'success', message: 'Startup profile updated!' });
    setStartupModal(null);
  };

  // ===== Render (existing JSX, minimal changes) =====
  
  return (
    <div className="ssc">
      {/* All existing UI code remains the same */}
      {/* Just replace loading states with new ones */}
      
      {jobsLoading && <Spinner />}
      {companiesLoading && <Spinner />}
      
      {/* All other JSX... */}
    </div>
  );
}
```

## Key Differences

### State Management

**Before:**
- Manual state for data (`jobs`, `companies`, `profile`)
- Manual loading states (`jobsLoading`, `companiesLoading`)
- Manual error states
- Manual version tracking (`jobsVersion`)
- Manual column presence tracking

**After:**
- React Query manages all data state
- Automatic loading states from hooks
- Automatic error handling
- Automatic cache invalidation
- Column presence still tracked but handled by hooks

### Data Fetching

**Before:**
- `useEffect` with async function
- Manual try/catch blocks
- Manual loading state updates
- Manual error handling
- Manual refetch triggers

**After:**
- Hooks handle everything
- Automatic caching
- Automatic retries
- Automatic refetching
- Declarative loading/error states

### Mutations

**Before:**
- 50-100 line while loops
- Manual column detection
- Manual retry logic
- Manual state updates
- Manual refetch triggers

**After:**
- Single `mutateAsync` call
- Automatic column detection (in service layer)
- Automatic retries (React Query config)
- Automatic cache updates
- Automatic related query invalidation

## Migration Steps for SwissStartupConnect.jsx

1. **Import new hooks** at the top
2. **Replace data fetching effects** with hooks
3. **Replace mutation handlers** with mutation hooks
4. **Update loading checks** to use hook loading states
5. **Remove manual refetch logic** (automatic now)
6. **Remove manual state management** for fetched data
7. **Keep UI state** (modals, forms, etc.) as is
8. **Test thoroughly**

The component will be significantly smaller and easier to maintain!

