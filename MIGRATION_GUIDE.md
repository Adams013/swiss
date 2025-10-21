# Data Fetching Migration Guide

This guide explains how to migrate from the old imperative data fetching approach to the new centralized services and React Query hooks.

## Overview

The new architecture provides:
- **Automatic caching** - No need to manually manage state
- **Automatic retries** - Failed requests are retried automatically
- **Column detection** - Automatic fallback when database columns are missing
- **Simplified code** - No more nested while loops or manual state management
- **Better performance** - Smart caching and background refetching

## Architecture

```
src/
├── services/          # Centralized business logic
│   ├── supabaseService.js   # Core utilities (column detection, resilient queries)
│   ├── jobService.js         # Job CRUD operations
│   ├── companyService.js     # Company/Startup operations
│   └── profileService.js     # Profile operations
├── hooks/             # React Query hooks
│   ├── useJobs.js            # Job-related hooks
│   ├── useCompanies.js       # Company-related hooks
│   └── useProfile.js         # Profile-related hooks
```

## Migration Examples

### Before: Manual Job Fetching

```javascript
// Old approach (SwissStartupConnect.jsx)
const [jobs, setJobs] = useState(mockJobs);
const [jobsLoading, setJobsLoading] = useState(false);
const [jobColumnPresence, setJobColumnPresence] = useState({});

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
          // ... more mapping
        }));
        setJobs(mapped);
        setJobColumnPresence(deriveColumnPresence(data));
      }
    } catch (error) {
      console.error('Job load error', error);
      setJobs(mockJobs);
    } finally {
      setJobsLoading(false);
    }
  };

  fetchJobs();
}, [jobsVersion]);
```

### After: Using React Query Hook

```javascript
// New approach
import { useJobs } from './hooks/useJobs';

function Component({ mockJobs }) {
  const { jobs, isLoading, columnPresence, refetch } = useJobs(mockJobs);
  
  // That's it! Data is cached, automatically retried, and refetched as needed
}
```

### Before: Manual Job Creation with Column Detection

```javascript
// Old approach - nested while loop with manual column detection
const handlePostJob = async () => {
  setPostingJob(true);
  
  const removedColumns = new Set();
  let attemptPayload = { ...jobData };
  
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

    if (removedColumns.has(missingColumn)) {
      setPostJobError(error.message);
      setPostingJob(false);
      return;
    }

    const { [missingColumn]: _omitted, ...rest } = attemptPayload;
    attemptPayload = rest;
    removedColumns.add(missingColumn);
    handleMissingColumn(missingColumn);
  }
  
  setPostingJob(false);
  refetchJobs();
};
```

### After: Using Mutation Hook

```javascript
// New approach
import { useCreateJob } from './hooks/useJobs';

function Component({ jobColumnPresence }) {
  const createJob = useCreateJob({ columnPresence: jobColumnPresence });
  
  const handlePostJob = async (jobData) => {
    try {
      const result = await createJob.mutateAsync(jobData);
      if (result.error) {
        setPostJobError(result.error.message);
      }
      // Jobs are automatically refetched after mutation
    } catch (error) {
      setPostJobError(error.message);
    }
  };
  
  return (
    <button onClick={() => handlePostJob(formData)} disabled={createJob.isLoading}>
      {createJob.isLoading ? 'Posting...' : 'Post Job'}
    </button>
  );
}
```

### Before: Manual Profile Update with Column Detection

```javascript
// Old approach - complex while loop with ref juggling
const attemptPayload = filterUnsupportedColumns(plannedUpdates);
let upsertedProfile = null;

while (true) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(attemptPayload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (!error) {
    upsertedProfile = data;
    setProfileColumnPresence((previous) => {
      const next = { ...previous };
      Object.keys(attemptPayload).forEach((key) => {
        next[key] = true;
      });
      return next;
    });
    break;
  }

  const missingColumn = detectMissingColumn(error.message, 'profiles');
  if (!missingColumn) {
    // Handle error...
    break;
  }

  const { [missingColumn]: _omitted, ...rest } = attemptPayload;
  attemptPayload = rest;
  setProfileColumnPresence((previous) => ({ ...previous, [missingColumn]: false }));
}
```

### After: Using Profile Hook

```javascript
// New approach
import { useUpdateProfile } from './hooks/useProfile';

function Component({ profileColumnPresence }) {
  const updateProfile = useUpdateProfile({ columnPresence: profileColumnPresence });
  
  const handleSaveProfile = async (profileData) => {
    const result = await updateProfile.mutateAsync(profileData);
    if (result.error) {
      console.error('Profile update failed:', result.error);
    }
    // Profile cache is automatically updated
  };
}
```

## Service Layer API Reference

### supabaseService.js

Core utilities for database operations:

- `detectMissingColumn(message, tableName)` - Detects missing columns from error messages
- `deriveColumnPresence(records)` - Extracts column names from records
- `filterUnsupportedColumns(payload, columnPresence)` - Filters out unsupported columns
- `resilientSelect({ table, columns, columnPresence, onColumnMissing, queryBuilder })` - Select with auto column detection
- `resilientUpsert({ table, payload, columnPresence, onColumnMissing, onColumnPresenceUpdate, onConflict })` - Upsert with retry
- `resilientInsert({ table, payload, columnPresence, onColumnMissing, onColumnPresenceUpdate })` - Insert with retry

### jobService.js

Job-related operations:

- `fetchJobs(mockJobs)` - Fetch all jobs with fallback
- `createJob(jobData, options)` - Create job with column handling
- `updateJob(jobId, updates)` - Update a job
- `deleteJob(jobId)` - Delete a job
- `fetchJobsByStartup(startupId)` - Fetch jobs for a startup

### companyService.js

Company/Startup operations:

- `mapStartupToCompany(startup)` - Map startup to company format
- `fetchCompanies(mockCompanies)` - Fetch all companies with fallback
- `fetchStartupByOwner(ownerId)` - Fetch startup by owner
- `createStartup(startupData)` - Create a startup
- `updateStartup(startupData, options)` - Update startup with column handling
- `deleteStartup(startupId)` - Delete a startup

### profileService.js

Profile-related operations:

- `fetchProfile(userId)` - Fetch user profile
- `updateProfile(profileData, options)` - Update profile with column handling
- `uploadFile(bucket, path, file)` - Upload file to storage
- `getPublicUrl(bucket, path)` - Get public URL for file
- `deleteFile(bucket, path)` - Delete file from storage
- `fetchStudentApplications(profileId)` - Fetch student's applications
- `fetchSavedJobs(profileId)` - Fetch saved jobs
- `saveJob(profileId, jobId)` - Save a job
- `unsaveJob(profileId, jobId)` - Unsave a job

## React Query Hooks API Reference

### useJobs.js

- `useJobs(mockJobs)` - Fetch and cache all jobs
- `useCreateJob({ columnPresence })` - Create job mutation
- `useUpdateJob()` - Update job mutation
- `useDeleteJob()` - Delete job mutation
- `useJobsByStartup(startupId, options)` - Fetch jobs for startup

### useCompanies.js

- `useCompanies(mockCompanies)` - Fetch and cache all companies
- `useStartupProfile(ownerId, options)` - Fetch startup profile
- `useCreateStartup()` - Create startup mutation
- `useUpdateStartup({ columnPresence })` - Update startup mutation
- `useDeleteStartup()` - Delete startup mutation

### useProfile.js

- `useProfile(userId, options)` - Fetch user profile
- `useUpdateProfile({ columnPresence })` - Update profile mutation
- `useFileUpload()` - Upload file mutation
- `useFileDelete()` - Delete file mutation
- `useStudentApplications(profileId, options)` - Fetch student applications
- `useSavedJobs(profileId, options)` - Fetch saved jobs
- `useSaveJob()` - Save/unsave job mutations

## Benefits

### 1. Automatic Caching
```javascript
// Data is cached automatically
const { jobs } = useJobs(mockJobs);
// Second component using same hook gets cached data instantly
const { jobs: cachedJobs } = useJobs(mockJobs);
```

### 2. Automatic Refetching
```javascript
// Mutations automatically invalidate related queries
const createJob = useCreateJob();
await createJob.mutateAsync(jobData);
// Jobs are automatically refetched - no manual refetch needed!
```

### 3. Loading States
```javascript
const { jobs, isLoading, isError, error } = useJobs(mockJobs);

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;
return <JobList jobs={jobs} />;
```

### 4. Optimistic Updates
```javascript
const queryClient = useQueryClient();
const updateJob = useUpdateJob();

// Optimistically update UI before server responds
await updateJob.mutateAsync(
  { jobId, updates },
  {
    onMutate: async ({ jobId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['jobs']);
      
      // Optimistically update
      queryClient.setQueryData(['jobs'], (old) =>
        old.map((job) => (job.id === jobId ? { ...job, ...updates } : job))
      );
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Roll back on error
      queryClient.setQueryData(['jobs'], context.previous);
    },
  }
);
```

## Migration Checklist

1. ✅ Install @tanstack/react-query
2. ✅ Add QueryClientProvider to App.js
3. ✅ Create service files in `src/services/`
4. ✅ Create hook files in `src/hooks/`
5. ⏳ Replace manual fetching with hooks in components
6. ⏳ Replace manual mutations with mutation hooks
7. ⏳ Remove old state management code
8. ⏳ Test and verify functionality

## Next Steps

To complete the migration:

1. Replace `useEffect` data fetching with React Query hooks
2. Replace manual mutations (insert/update/delete) with mutation hooks
3. Remove old loading states and replace with hook loading states
4. Remove manual column presence tracking (hooks handle it automatically)
5. Test thoroughly to ensure all functionality works as before

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

