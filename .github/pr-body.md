## 🎯 Overview

This PR adds **React Query** (@tanstack/react-query) to improve data fetching, caching, and state management throughout the application.

## 🚀 What's New

### React Query Setup
- ✅ Configured `QueryClientProvider` in `App.js` with optimized defaults
- ✅ 5-minute stale time for data freshness
- ✅ 10-minute garbage collection for unused cache
- ✅ Automatic retries (2 for queries, 1 for mutations)
- ✅ Disabled refetch on window focus to reduce API calls

### New Query Hooks

#### `useJobsQuery.js`
- `useJobs()` - Fetch and cache jobs with automatic refetching
- `useCreateJob()` - Create jobs with automatic cache invalidation
- `useFilteredJobs()` - Fetch filtered jobs with caching

#### `useCompaniesQuery.js`
- `useCompanies()` - Fetch and cache companies
- `useUpsertCompany()` - Upsert companies with auto-invalidation
- `useCompany()` - Fetch specific company by ID

### Integration Approach

These hooks **WRAP** the existing services (`supabaseJobs`, `supabaseCompanies`) rather than replacing them.

This ensures:
- ✅ **No breaking changes**
- ✅ **Existing code continues to work**
- ✅ **All existing logic preserved** (column detection, fallbacks, etc.)
- ✅ **Gradual adoption possible**

## 📈 Benefits

### 1. Automatic Caching
Reduce API calls with intelligent caching - 20+ lines of state management → 1 line

### 2. Automatic Refetching
Data automatically refetches when stale and after mutations

### 3. Shared Cache Across Components
Multiple components using the same query share cached data

### 4. Better UX
- Instant data on component mount (from cache)
- Background refetching keeps data fresh
- Reduced loading spinners
- Fewer API calls = faster experience

## 📁 Files Changed

### New Files
- `src/hooks/useJobsQuery.js` - Jobs query hooks
- `src/hooks/useCompaniesQuery.js` - Companies query hooks
- `REACT_QUERY_INTEGRATION.md` - Complete integration guide

### Modified Files
- `src/App.js` - Added `QueryClientProvider`
- `package.json` - Added `@tanstack/react-query@5.90.5`

## 📚 Documentation

Added comprehensive `REACT_QUERY_INTEGRATION.md` with:
- Complete API reference for all new hooks
- Before/after migration examples
- Best practices and recommendations
- Troubleshooting guide

## 🔄 Migration Path

This is **purely additive** - you can adopt React Query gradually. No need to migrate everything at once!

## ✅ Checklist

- [x] Added React Query dependency
- [x] Configured QueryClientProvider
- [x] Created query hooks for jobs
- [x] Created query hooks for companies
- [x] Added comprehensive documentation
- [x] No breaking changes

---

**Non-Breaking**: All existing code continues to work. New hooks can be adopted gradually.

