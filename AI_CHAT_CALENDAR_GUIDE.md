## AI Chat & Calendar Integration - Complete Guide

## Overview

Two powerful new features have been added to Swiss Startup Connect:

1. **🤖 AI Career Assistant** - Free AI chat for salary, tax, and career advice
2. **📅 Calendar Integration** - Add interviews and events to any calendar app

Both features are fully styled, responsive, and ready to use!

---

## Table of Contents

1. [AI Chat Assistant](#ai-chat-assistant)
2. [Calendar Integration](#calendar-integration)
3. [Setup Instructions](#setup-instructions)
4. [Integration Examples](#integration-examples)
5. [UI/UX Features](#uiux-features)
6. [Customization](#customization)

---

## AI Chat Assistant 🤖

### Features

✅ **Free for all users** - No cost, unlimited questions  
✅ **Swiss-specific knowledge** - Salary ranges, tax info, work culture  
✅ **Smart responses** - Powered by GPT-4o-mini  
✅ **Quick suggestions** - Pre-made questions to get started  
✅ **Beautiful UI** - Gradient design, smooth animations  
✅ **Floating widget** - Accessible from anywhere  
✅ **Expandable** - Full-screen mode for longer conversations  
✅ **Dark mode** - Automatic theme support  
✅ **Mobile optimized** - Full-screen on mobile  

### Topics Covered

- 💰 **Salary expectations** by role and location
- 📊 **Swiss tax system** (federal, cantonal, communal)
- 📝 **Job descriptions** and career advice
- 🎯 **Interview preparation** tips
- 🏢 **Swiss work culture** and expectations
- 💼 **Startup equity** and compensation packages
- 🌍 **Visa and work permits** for Switzerland

### Example Questions

**For Students:**
- "What salary should I expect as a junior developer in Zurich?"
- "How much tax will I pay in Switzerland?"
- "How do I write a good cover letter for Swiss startups?"
- "What are the most in-demand skills in Swiss tech?"

**For Employers:**
- "What is the market rate for a senior engineer in Zurich?"
- "What benefits do Swiss employees expect?"
- "How do I write an attractive job description?"
- "What perks attract top talent in Switzerland?"

---

## Calendar Integration 📅

### Features

✅ **Multiple calendar support** - Google, Apple, Outlook, Office 365, Yahoo  
✅ **One-click add** - Simple dropdown interface  
✅ **iCal download** - Works with any calendar app  
✅ **Auto-detection** - Suggests best calendar based on device  
✅ **Event formatting** - Proper titles, descriptions, locations  
✅ **Time zones** - Europe/Zurich default  
✅ **Beautiful UI** - Clean, modern design  
✅ **Interview scheduler** - Built-in form for scheduling  

### Supported Calendars

- 📅 **Google Calendar** - Opens in new tab
- 🍎 **Apple Calendar** - Downloads .ics file
- 📧 **Outlook Calendar** - Opens Outlook.com
- 💼 **Office 365 Calendar** - Opens Office.com
- 📮 **Yahoo Calendar** - Opens Yahoo
- 📥 **iCal File** - Universal .ics download

### Event Types

- **Interviews** - Job interviews with all details
- **Job Fairs** - Networking and career events
- **Company Visits** - Office tours and meet-ups
- **Career Events** - Workshops, talks, conferences

---

## Setup Instructions

### 1. Database Setup

Run the AI Chat schema:

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-ai-chat-schema.sql
```

Or use Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Paste contents of `supabase-ai-chat-schema.sql`
3. Run the query

### 2. Get OpenAI API Key

1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Go to API Keys
3. Create new secret key
4. Copy the key (starts with `sk-...`)

**Note:** We use `gpt-4o-mini` which is very cost-effective (~$0.15 per 1M tokens)

### 3. Deploy Edge Function

```bash
# Deploy AI chat function
supabase functions deploy ai-chat

# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

### 4. Add to Your App

Import and add the AI Chat component:

```javascript
import AIChat from './components/AIChat';
import './components/AIChat.css';

function App() {
  return (
    <div>
      {/* Your existing app */}
      
      {/* AI Chat Widget - Fixed position, always accessible */}
      <AIChat
        user={currentUser}
        translate={translate}
      />
    </div>
  );
}
```

That's it! The chat widget will appear as a floating button in the bottom-right corner.

---

## Integration Examples

### AI Chat Integration

#### Basic Usage

```javascript
import AIChat from './components/AIChat';

<AIChat 
  user={currentUser} 
  translate={translate}
  initiallyOpen={false} // Optional: start open or closed
/>
```

#### Programmatic Control

```javascript
const [showChat, setShowChat] = useState(false);

<AIChat 
  user={currentUser}
  translate={translate}
  initiallyOpen={showChat}
/>

// Open chat from elsewhere in your app
<button onClick={() => setShowChat(true)}>
  Ask AI Assistant
</button>
```

### Calendar Integration

#### Add to Calendar Button

```javascript
import AddToCalendar from './components/AddToCalendar';

const interview = {
  title: "Interview: Software Engineer at TechStartup",
  description: "Technical interview with CTO",
  location: "Zurich, Switzerland",
  startTime: "2024-11-15T14:00:00Z",
  endTime: "2024-11-15T15:00:00Z",
};

<AddToCalendar 
  event={interview}
  translate={translate}
  buttonText="Add Interview to Calendar"
  buttonStyle="primary"
/>
```

#### Calendar Event Card

```javascript
import { CalendarEventCard } from './components/AddToCalendar';

<CalendarEventCard 
  event={interview}
  translate={translate}
  onClose={() => setShowEvent(false)}
/>
```

#### Interview Scheduler

```javascript
import { InterviewScheduler } from './components/AddToCalendar';

const interviewInfo = {
  jobTitle: "Software Engineer",
  companyName: "TechStartup",
  interviewer: "John Doe",
};

<InterviewScheduler 
  interview={interviewInfo}
  translate={translate}
  onSchedule={(event) => {
    // Event created, now add to calendar
    addToCalendar(event);
  }}
/>
```

### Complete Job Application Flow

```javascript
import AddToCalendar, { InterviewScheduler } from './components/AddToCalendar';
import { createInterviewEvent } from '../services/calendarService';

function JobApplicationPage({ job }) {
  const [showScheduler, setShowScheduler] = useState(false);

  const handleScheduleInterview = () => {
    setShowScheduler(true);
  };

  const handleInterviewScheduled = (eventDetails) => {
    // Save to database
    saveInterviewToDatabase(eventDetails);
    
    // Show success message
    toast.success('Interview added to your calendar!');
    
    setShowScheduler(false);
  };

  return (
    <div>
      <h2>{job.title}</h2>
      <p>{job.company}</p>
      
      <button onClick={handleScheduleInterview}>
        Schedule Interview
      </button>

      {showScheduler && (
        <Modal onClose={() => setShowScheduler(false)}>
          <InterviewScheduler
            interview={{
              jobTitle: job.title,
              companyName: job.company,
              interviewer: job.contactPerson,
            }}
            translate={translate}
            onSchedule={handleInterviewScheduled}
          />
        </Modal>
      )}
    </div>
  );
}
```

---

## UI/UX Features

### AI Chat UI

#### Design Elements

- **Gradient Header**: Purple gradient (#667eea → #764ba2)
- **Floating Button**: 60×60px with pulse animation
- **Message Bubbles**: Rounded corners, subtle shadows
- **Typing Indicator**: Animated dots
- **Quick Suggestions**: 2-column grid on desktop, 1-column on mobile
- **Smooth Animations**: Slide-up entrance, fade-in messages
- **Expandable**: Click maximize to go full-screen

#### Color Scheme

```css
/* AI Assistant Colors */
Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Background: #f9fafb (light), #111827 (dark)
Text: #1f2937 (light), #f9fafb (dark)
Border: #e5e7eb (light), #374151 (dark)
```

#### Responsive Breakpoints

- **Desktop** (> 768px): 400px wide sidebar
- **Expanded**: 600px wide
- **Tablet** (< 768px): Full width
- **Mobile** (< 480px): Full screen overlay

### Calendar UI

#### Design Elements

- **Clean Dropdown**: White card with shadow
- **Event Preview**: Date, time, location at top
- **Calendar Icons**: Emoji prefixes for recognition
- **Checkmark Animation**: Smooth check when selected
- **Hover States**: Subtle background change
- **Calendar Event Card**: Gradient header, detailed info sections

#### Color Scheme

```css
/* Calendar Colors */
Primary: #3b82f6
Background: #dbeafe → #e0e7ff gradient
Success: #10b981
Text: #1f2937
Border: #e5e7eb
```

### Accessibility

✅ **Keyboard Navigation**: All buttons tabbable  
✅ **Screen Reader**: Proper ARIA labels  
✅ **Focus States**: Clear outline on focus  
✅ **Reduced Motion**: Respects prefers-reduced-motion  
✅ **Color Contrast**: WCAG AA compliant  

---

## Customization

### Translate Function

The `translate` function allows full internationalization:

```javascript
const translate = (key, fallback) => {
  const translations = {
    'aiChat.title': 'AI Karriere-Assistent', // German
    'aiChat.placeholder': 'Frag mich etwas...', // German
    'calendar.addToCalendar': 'Zum Kalender hinzufügen', // German
  };
  
  return translations[key] || fallback;
};
```

### Custom Styling

Override CSS variables in your theme:

```css
:root {
  /* AI Chat Colors */
  --ai-chat-gradient-start: #667eea;
  --ai-chat-gradient-end: #764ba2;
  --ai-chat-user-bubble: #3b82f6;
  
  /* Calendar Colors */
  --calendar-primary: #3b82f6;
  --calendar-gradient-start: #dbeafe;
  --calendar-gradient-end: #e0e7ff;
}
```

### System Prompt Customization

Edit the system prompt in:
- `src/services/aiChatService.js` (client-side)
- `supabase/functions/ai-chat/index.ts` (server-side)

```javascript
const SYSTEM_PROMPT = `You are a helpful assistant...
Your expertise includes:
- [Add your specific topics]
- [Custom guidelines]
...`;
```

---

## Cost Estimates

### AI Chat

Using GPT-4o-mini:
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens

**Typical conversation cost:**
- 10 messages: ~2,000 tokens = $0.001
- 100 messages: ~20,000 tokens = $0.01
- 1,000 users × 10 messages = $1.00

**Very affordable!** Even with heavy usage, monthly costs should be under $50-100.

### Calendar Integration

**Completely free!** No API costs, just generates iCal files or redirects to calendar providers.

---

## Testing

### Test AI Chat

1. Click floating chat button
2. Try a quick suggestion
3. Ask a custom question
4. Test expand/minimize
5. Test on mobile
6. Try dark mode

**Test Questions:**
- "What's a typical salary for a developer in Zurich?"
- "How does Swiss tax work?"
- "Help me prepare for a job interview"

### Test Calendar Integration

1. Create a test event
2. Click "Add to Calendar"
3. Try different calendar providers
4. Test on mobile (should default to iCal download)
5. Verify event details in calendar

---

## Troubleshooting

### AI Chat Not Responding

**Check:**
1. Is `OPENAI_API_KEY` set in Supabase secrets?
2. Is Edge Function deployed?
3. Check browser console for errors
4. Check Edge Function logs in Supabase

**Fix:**
```bash
# Re-deploy function
supabase functions deploy ai-chat

# Verify secret
supabase secrets list
```

### Calendar Not Adding Events

**Check:**
1. Are start/end times valid ISO strings?
2. Is popup blocker preventing new tab?
3. Check browser console for errors

**Fix:**
```javascript
// Ensure proper date format
const startTime = new Date('2024-11-15T14:00:00Z').toISOString();
```

### Styling Issues

**Check:**
1. Are CSS files imported?
2. Check for CSS conflicts
3. Verify CSS variables are set

**Fix:**
```javascript
// Import CSS in your component
import './components/AIChat.css';
import './components/AddToCalendar.css';
```

---

## Advanced Features

### Save Chat Conversations

```javascript
import { saveChatConversation } from '../services/aiChatService';

// Save conversation to database
await saveChatConversation(user.id, messages, 'salary');
```

### Automatic Event Reminders

```javascript
// Set reminder for event
const event = {
  ...eventDetails,
  reminder: {
    enabled: true,
    minutesBefore: 30,
  },
};

// Save to calendar_events table
await supabase.from('calendar_events').insert(event);
```

### Chat Analytics

```javascript
// Track popular topics
const { data } = await supabase
  .from('chat_conversations')
  .select('topic')
  .not('topic', 'is', null);

const topicCounts = data.reduce((acc, { topic }) => {
  acc[topic] = (acc[topic] || 0) + 1;
  return acc;
}, {});
```

---

## Production Checklist

### AI Chat

- [ ] OpenAI API key configured in Supabase
- [ ] Edge Function deployed
- [ ] Rate limiting implemented (optional)
- [ ] Error handling tested
- [ ] Mobile UI tested
- [ ] Dark mode tested
- [ ] Translations added
- [ ] Analytics tracking added

### Calendar

- [ ] All calendar providers tested
- [ ] Mobile calendar download tested
- [ ] Timezone handling verified
- [ ] Event format validated
- [ ] UI responsive on all devices
- [ ] Accessibility tested
- [ ] Browser compatibility checked

---

## Future Enhancements

### AI Chat
- 📊 Chat analytics dashboard
- 🎯 Topic categorization
- ⭐ User ratings and feedback
- 📚 Knowledge base integration
- 🔍 Search conversation history
- 🤝 Hand-off to human support

### Calendar
- 🔔 SMS/Email reminders
- 🔄 Sync with job applications
- 📈 Interview analytics
- 🗓️ Recurring events
- 👥 Group events (job fairs)
- ⏰ Timezone auto-detection

---

## Support

### Documentation
- 📖 [AI Chat Service](src/services/aiChatService.js)
- 📅 [Calendar Service](src/services/calendarService.js)
- 🎨 [UI Components](src/components/)

### External Resources
- 🔗 [OpenAI API Documentation](https://platform.openai.com/docs)
- 🔗 [iCal Format Specification](https://icalendar.org/)
- 🔗 [Google Calendar API](https://developers.google.com/calendar)

---

## Congratulations! 🎉

You now have a **fully functional AI chat assistant** and **universal calendar integration**!

**Users can:**
- Ask unlimited career questions 24/7
- Get Swiss-specific salary and tax advice
- Add interviews to their preferred calendar app with one click
- Schedule and manage interviews directly in the app

**Next Steps:**
1. Deploy the Edge Function
2. Configure your OpenAI API key
3. Test on various devices and browsers
4. Gather user feedback
5. Monitor usage and costs

**Enjoy your new features! 🚀**

