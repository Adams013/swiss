# Calendar Save Debugging Guide

## Issue
Users are unable to save events to the website's calendar and receive the error: "We could not save this event. Please try again."

## Changes Made

### 1. Enhanced Logging
Added comprehensive console logging to track the entire event save flow:

#### `calendarService.js` - Enhanced Functions:
- **`parseTimeComponents`**: Now logs all time parsing attempts and results
- **`coerceEventDateTime`**: Logs input event data, parsed dates, and any parsing failures
- **`createCommunityCalendarEvent`**: Logs the input event and the created calendar event
- **`saveEventToSiteCalendar`**: Logs every step - auth check, payload creation, save attempt, and results

### 2. Improved Time Parsing
Updated `parseTimeComponents` to handle Postgres TIME format:
- Now handles: `"18:30"`, `"18:30:00"`, `"18:30:00.000"`
- Properly strips milliseconds and seconds
- Better error messages when parsing fails

### 3. Fixed Date Handling
Updated `coerceEventDateTime` to avoid timezone issues:
- Now creates dates in local timezone instead of UTC
- Extracts year, month, day and reconstructs the date object
- More robust handling of edge cases

## Testing Steps

### 1. Open Browser Console
1. Open the app in your browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Clear any existing logs

### 2. Try to Save an Event
1. Navigate to the Map view
2. Select a city with events
3. Click "Add to calendar" on any event
4. Select "Swiss Startup Connect Calendar"
5. Watch the console for detailed logs

### 3. Expected Console Output

You should see logs like:
```
createCommunityCalendarEvent: Input event: {id: "...", title: "...", event_date: "2024-09-12", event_time: "18:30", ...}
coerceEventDateTime: Input: {eventDate: "2024-09-12", eventTime: "18:30", ...}
parseTimeComponents: Parsed: {value: "18:30", hours: 18, minutes: 30}
coerceEventDateTime: Start time parts: {hours: 18, minutes: 30}
coerceEventDateTime: Start date created: 2024-09-12T18:30:00.000Z
coerceEventDateTime: End date created: 2024-09-12T20:00:00.000Z
createCommunityCalendarEvent: Created calendar event: {title: "...", startTime: "...", endTime: "...", ...}
saveEventToSiteCalendar: Called with event: {title: "...", startTime: "...", endTime: "...", ...}
saveEventToSiteCalendar: Payload to save: {title: "...", description: "...", location: "...", startTime: "...", endTime: "...", ...}
saveEventToSiteCalendar: Successfully saved event: {id: "...", user_id: "...", ...}
```

### 4. Common Error Scenarios

#### Scenario A: Date Parsing Fails
```
createCommunityCalendarEvent: Input event: {...}
coerceEventDateTime: Input: {...}
parseTimeComponents: Could not parse time: undefined
createCommunityCalendarEvent: Failed to parse event date/time: {event_date: undefined, ...}
```
**Solution**: Event data is missing `event_date` or `event_time` fields

#### Scenario B: Not Authenticated
```
saveEventToSiteCalendar: User not authenticated
```
**Solution**: User needs to sign in

#### Scenario C: Database Error
```
saveEventToSiteCalendar: Save failed: "relation calendar_events does not exist"
```
**Solution**: Need to run database schema migration

#### Scenario D: RLS Policy Error
```
saveEventToSiteCalendar: Save failed: "new row violates row-level security policy"
```
**Solution**: Check that the `calendar_events` table has proper RLS policies

## Database Setup Verification

### Check if `calendar_events` table exists:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run:
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'calendar_events'
);
```

### If table doesn't exist, create it:

Run the SQL from `/supabase-calendar-events-schema.sql`:

```sql
-- Run the entire file to create the table, indexes, and RLS policies
```

### Verify RLS Policies:

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'calendar_events';
```

Expected policies:
- "Users can view own calendar events" (SELECT)
- "Users can create own calendar events" (INSERT)
- "Users can update own calendar events" (UPDATE)
- "Users can delete own calendar events" (DELETE)

## Next Steps Based on Console Output

### If you see "event is null or undefined":
- The issue is in `AddToCalendarMenu` component
- Check that `communityEvent` prop is being passed correctly
- Verify event data structure in the Events panel

### If you see "Failed to parse event date/time":
- The event data has unexpected date/time format
- Check the actual event data structure in the database
- May need to adjust the parsing logic

### If you see "Save failed":
- Check the specific error message
- Verify Supabase connection and configuration
- Check RLS policies on `calendar_events` table
- Verify user is authenticated with a valid user ID

### If you see "Successfully saved event":
- Great! The feature is working
- The error might be a UI state issue
- Check the `useSiteCalendarSave` hook for proper state management

## Remove Debug Logging (After Fixing)

Once the issue is identified and fixed, you may want to remove or reduce the console logging:

1. Remove `console.log` statements in `parseTimeComponents`
2. Remove `console.log` statements in `coerceEventDateTime`  
3. Keep `console.error` statements for actual errors
4. Consider using a debug flag: `if (DEBUG) console.log(...)`

## Files Modified

- `/src/services/calendarService.js` - Added extensive logging and improved parsing

