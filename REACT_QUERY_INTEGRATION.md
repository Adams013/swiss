# React Query Integration Guide

This project now includes React Query for improved data fetching, caching, and state management.

## 📦 What's New

### React Query Setup

React Query is configured in `src/App.js` with optimized defaults:
- **5-minute stale time** - Data is considered fresh for 5 minutes
- **10-minute garbage collection** - Unused cache is cleared after 10 minutes
- **Automatic retries** - 2 retries for queries, 1 for mutations
- **No refetch on window focus** - Prevents unnecessary API calls

### New Query Hooks

#### `useJobsQuery.js`

Wraps the existing `services/supabaseJobs.js` with React Query:

```javascript
import { useJobs, useCreateJob, useFilteredJobs } from './hooks/useJobsQuery';

// Fetch all jobs with automatic caching
const { data: jobs, isLoading, error, refetch } = useJobs({ 
  pageSize: 50, 
  mockJobs 
});

// Create a job with automatic cache invalidation
const createJob = useCreateJob();
await createJob.mutateAsync(jobData);
// Jobs are automatically refetched after creation!

// Fetch filtered jobs
const { data: filteredJobs } = useFilteredJobs({ 
  location: 'Zurich', 
  type: 'Full-time' 
});
```

#### `useCompaniesQuery.js`

Wraps the existing `services/supabaseCompanies.js` with React Query:

```javascript
import { useCompanies, useUpsertCompany, useCompany } from './hooks/useCompaniesQuery';

// Fetch all companies with automatic caching
const { data: companies, isLoading } = useCompanies({ mockCompanies });

// Upsert a company profile
const upsertCompany = useUpsertCompany();
await upsertCompany.mutateAsync(companyData);

// Fetch a specific company by ID
const { data: company } = useCompany(companyId);
```

## 🎯 Benefits

### 1. Automatic Caching

**Before:**
```javascript
// Manual state management
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadJobs = async () => {
    setLoading(true);
    const result = await fetchJobs({ pageSize: 50 });
    setJobs(result.jobs || []);
    setLoading(false);
  };
  loadJobs();
}, []);
```

**After:**
```javascript
// Automatic caching and loading states
const { data: jobs, isLoading } = useJobs({ pageSize: 50, mockJobs });
```

### 2. Automatic Cache Invalidation

When you create or update data, related queries are automatically refetched:

```javascript
const createJob = useCreateJob();
await createJob.mutateAsync(newJob);
// All useJobs() hooks automatically refetch! 
// No manual refetch needed!
```

### 3. Shared Cache Across Components

Multiple components using the same query share the same cached data:

```javascript
// Component A
const { data: jobs } = useJobs({ pageSize: 50 });

// Component B (gets the same cached data instantly!)
const { data: jobs } = useJobs({ pageSize: 50 });
```

### 4. Background Refetching

Data is automatically refetched in the background when it becomes stale (after 5 minutes).

### 5. Loading and Error States

Built-in loading and error states without manual management:

```javascript
const { data, isLoading, isError, error } = useJobs();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;
return <JobList jobs={data} />;
```

## 🔄 Integration with Existing Services

The new hooks **wrap** your existing services - they don't replace them:

```
┌─────────────────────┐
│   useJobsQuery.js   │  ← New React Query hooks
└──────────┬──────────┘
           │ wraps
           ▼
┌─────────────────────┐
│ supabaseJobs.js     │  ← Existing service (unchanged)
└─────────────────────┘
```

This means:
- ✅ Existing code continues to work
- ✅ No breaking changes
- ✅ Gradual adoption possible
- ✅ All existing logic (column detection, fallbacks) preserved

## 📝 Migration Example

### Migrating Job Fetching

**Current code:**
```javascript
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadJobs = async () => {
    setLoading(true);
    try {
      const result = await fetchJobs({ pageSize: 50, mockJobs });
      setJobs(result.jobs || mockJobs);
    } finally {
      setLoading(false);
    }
  };
  loadJobs();
}, []);

// Manual refetch when needed
const handleRefresh = () => {
  loadJobs();
};
```

**Migrated to React Query:**
```javascript
const { data: jobs, isLoading, refetch } = useJobs({ 
  pageSize: 50, 
  mockJobs 
});

// Automatic refetch!
const handleRefresh = refetch;
```

### Migrating Job Creation

**Current code:**
```javascript
const [creating, setCreating] = useState(false);

const handleCreate = async (jobData) => {
  setCreating(true);
  try {
    await createJobPost(jobData);
    // Manual refetch
    await loadJobs();
  } finally {
    setCreating(false);
  }
};
```

**Migrated to React Query:**
```javascript
const createJob = useCreateJob();

const handleCreate = async (jobData) => {
  await createJob.mutateAsync(jobData);
  // Jobs automatically refetched!
};

// Access loading state
const isCreating = createJob.isLoading;
```

## 🚀 Usage Recommendations

### When to Use React Query Hooks

✅ **Use React Query for:**
- Fetching lists of data (jobs, companies, etc.)
- Data that multiple components need
- Data that changes over time
- Operations that need automatic refetching

❌ **Don't need React Query for:**
- One-time operations
- Data that never changes
- Component-local state
- UI state (modals, forms, etc.)

### Best Practices

1. **Use query keys consistently:**
```javascript
// Good
const { data } = useJobs({ pageSize: 50 });
const { data } = useJobs({ pageSize: 50 }); // Same key = shared cache

// Bad
const { data } = useJobs({ pageSize: 50 });
const { data } = useJobs({ pageSize: 100 }); // Different keys = separate caches
```

2. **Let React Query handle loading states:**
```javascript
// Good
const { data: jobs, isLoading } = useJobs();
if (isLoading) return <Spinner />;

// Unnecessary
const [loading, setLoading] = useState(false);
const { data: jobs } = useJobs();
```

3. **Use mutations for write operations:**
```javascript
// Good
const createJob = useCreateJob();
await createJob.mutateAsync(data);

// Less optimal (no automatic refetch)
await createJobPost(data);
await refetch();
```

## 🔧 Advanced Usage

### Optimistic Updates

Update UI before server responds:

```javascript
const createJob = useCreateJob();

await createJob.mutateAsync(newJob, {
  onMutate: async (newJob) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['jobs'] });
    
    // Snapshot previous value
    const previousJobs = queryClient.getQueryData(['jobs']);
    
    // Optimistically update
    queryClient.setQueryData(['jobs'], (old) => [...old, newJob]);
    
    // Return context with snapshot
    return { previousJobs };
  },
  onError: (err, newJob, context) => {
    // Rollback on error
    queryClient.setQueryData(['jobs'], context.previousJobs);
  },
});
```

### Conditional Queries

Only fetch when certain conditions are met:

```javascript
const { data } = useCompany(companyId, {
  enabled: !!companyId, // Only fetch if companyId exists
});
```

### Custom Stale Times

Override defaults for specific queries:

```javascript
const { data } = useJobs({ 
  pageSize: 50 
}, {
  staleTime: 10 * 60 * 1000, // 10 minutes instead of 5
});
```

## 📚 Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query Devtools](https://tanstack.com/query/latest/docs/react/devtools) (helpful for debugging)
- [Existing Services Documentation](./src/services/)

## 🐛 Troubleshooting

### Data not refetching after mutation

Make sure you're using the mutation hooks (useCreateJob, useUpsertCompany) which automatically invalidate queries.

### Stale data showing

Check the `staleTime` setting. Lower it if you need fresher data:
```javascript
const { data } = useJobs({ pageSize: 50 }, { staleTime: 1000 }); // 1 second
```

### Multiple identical requests

Ensure you're using the same query key in all components:
```javascript
// All these share the same cache:
useJobs({ pageSize: 50 });
useJobs({ pageSize: 50 });
```

## 🎉 Summary

React Query adds powerful caching and state management to your existing services without breaking anything. Start using it gradually where it provides the most value:

1. **High-traffic components** - Reduce API calls with automatic caching
2. **Frequently updated data** - Automatic background refetching
3. **Shared data** - Multiple components sharing the same cache
4. **Complex state** - Let React Query manage loading/error states

The existing services continue to work as before - React Query just makes them better! 🚀

