# Calendar Save Issue - Investigation & Fix

## Problem
Users cannot save events to their Swiss Startup Connect calendar and receive the error:
> "We could not save this event. Please try again."

## Root Cause Analysis

After analyzing the code flow, the issue occurs when:
1. User clicks "Add to calendar" on an event in the Map view
2. Selects "Swiss Startup Connect Calendar"  
3. The event data flows through: `AddToCalendarMenu` → `createCommunityCalendarEvent` → `saveEventToSiteCalendar` → `createCalendarEvent` (Supabase)
4. Somewhere in this chain, the operation fails

## Potential Issues Identified

### 1. Date/Time Parsing Failure
The `createCommunityCalendarEvent` function needs to parse `event_date` and `event_time` fields and convert them to ISO timestamp strings. If parsing fails, it returns `null`, causing the save to fail.

**Status**: ✅ **FIXED** - Enhanced parsing logic to handle multiple time formats

### 2. Missing Database Table
The `calendar_events` table might not exist in the Supabase database.

**Status**: ⚠️ **NEEDS VERIFICATION**

### 3. RLS Policy Issues  
Row-Level Security policies might be preventing inserts.

**Status**: ⚠️ **NEEDS VERIFICATION**

### 4. Authentication Issues
User might not be properly authenticated.

**Status**: ⚠️ **NEEDS VERIFICATION** (less likely, would show different error)

## Changes Made

### 1. Enhanced Logging (`/src/services/calendarService.js`)

Added comprehensive console logging to track every step:

```javascript
// parseTimeComponents - logs all time parsing attempts
console.log('parseTimeComponents: Parsed:', { value, hours, minutes });

// coerceEventDateTime - logs date parsing flow
console.log('coerceEventDateTime: Input:', { eventDate, eventTime, ...});
console.log('coerceEventDateTime: Start date created:', startDate.toISOString());

// createCommunityCalendarEvent - logs event transformation
console.log('createCommunityCalendarEvent: Input event:', event);
console.log('createCommunityCalendarEvent: Created calendar event', calendarEvent);

// saveEventToSiteCalendar - logs save operation
console.log('saveEventToSiteCalendar: Called with event:', event);
console.log('saveEventToSiteCalendar: Payload to save:', payload);
console.log('saveEventToSiteCalendar: Successfully saved event:', createdEvent);
```

### 2. Improved Time Parsing

Enhanced `parseTimeComponents` to handle multiple formats:
- `"18:30"` - Basic format
- `"18:30:00"` - Postgres TIME format with seconds
- `"18:30:00.000"` - With milliseconds
- Handles malformed inputs gracefully

### 3. Fixed Date Handling

Improved `coerceEventDateTime` to avoid timezone issues:
- Creates dates in local timezone instead of UTC
- Extracts year, month, day and reconstructs date object
- More robust error handling

### 4. Parsing Tests

✅ All parsing scenarios tested and working:
```
✓ Mock event format ("18:30")
✓ Postgres TIME with seconds ("18:30:00")  
✓ Postgres TIME with milliseconds ("18:30:00.000")
✓ Missing time (defaults to 9:00 AM)
✓ Invalid dates (properly handled)
✓ Current date parsing
```

## Next Steps - Testing Required

### Step 1: Check Browser Console

1. Open the application in your browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to Console tab
4. Try to save an event to calendar
5. **Copy all console logs** and check for errors

### Step 2: Expected Console Output

If everything works, you should see:
```
createCommunityCalendarEvent: Input event: {id: "...", title: "Zurich HealthTech Meetup", ...}
coerceEventDateTime: Input: {eventDate: "2024-09-12", eventTime: "18:30", ...}
parseTimeComponents: Parsed: {value: "18:30", hours: 18, minutes: 30}
coerceEventDateTime: Start date created: 2024-09-12T18:30:00.000Z
createCommunityCalendarEvent: Created calendar event: {title: "...", startTime: "...", ...}
saveEventToSiteCalendar: Called with event: {title: "...", startTime: "...", ...}
saveEventToSiteCalendar: Successfully saved event: {id: "...", ...}
```

### Step 3: Common Error Scenarios

#### Scenario A: "Failed to parse event date/time"
```
createCommunityCalendarEvent: Failed to parse event date/time
```
**Action**: Event data structure is unexpected. Check what fields the event actually has.

#### Scenario B: "relation calendar_events does not exist"
```
saveEventToSiteCalendar: Save failed: relation "calendar_events" does not exist
```
**Action**: Run the database migration:
```sql
-- In Supabase SQL Editor, run:
-- /supabase-calendar-events-schema.sql
```

#### Scenario C: RLS Policy Error
```
saveEventToSiteCalendar: Save failed: new row violates row-level security policy
```
**Action**: Check RLS policies on `calendar_events` table. Verify that the INSERT policy allows authenticated users to insert their own events.

#### Scenario D: Auth Error
```
saveEventToSiteCalendar: User not authenticated
```
**Action**: Ensure user is logged in before trying to save events.

### Step 4: Verify Database Setup

Run in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'calendar_events'
);

-- Check RLS policies
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'calendar_events';

-- Expected policies:
-- "Users can view own calendar events" (SELECT)
-- "Users can create own calendar events" (INSERT)
-- "Users can update own calendar events" (UPDATE)
-- "Users can delete own calendar events" (DELETE)
```

## Files Modified

- ✅ `/src/services/calendarService.js` - Enhanced logging & parsing (3 functions modified)
- ✅ `/CALENDAR_DEBUG_GUIDE.md` - Comprehensive debugging guide
- ✅ `/CALENDAR_FIX_SUMMARY.md` - This summary

## Debugging Resources

- **Debug Guide**: `/CALENDAR_DEBUG_GUIDE.md` - Detailed troubleshooting steps
- **Schema File**: `/supabase-calendar-events-schema.sql` - Database table definition
- **Service File**: `/src/services/calendarService.js` - Calendar logic with logging
- **Hook File**: `/src/hooks/useSiteCalendarSave.js` - React hook for saving

## Production Cleanup (After Fix)

Once the issue is resolved, consider:
1. Reducing console.log verbosity (keep console.error for actual errors)
2. Add a `DEBUG` flag to control logging: `if (DEBUG) console.log(...)`
3. Remove the debug guides if no longer needed

## Current Status

🔍 **Investigation Phase Complete**
- ✅ Parsing logic verified and enhanced
- ✅ Comprehensive logging added
- ⏳ Waiting for console output to identify specific failure point
- ⏳ Database setup needs verification

## What to Do Next

**IMMEDIATE ACTION**: 
1. Refresh your browser to load the updated code
2. Try to save an event
3. Check the browser console
4. Share the console output so we can identify the exact issue

The enhanced logging will tell us exactly where and why the save is failing, allowing us to implement a targeted fix.

