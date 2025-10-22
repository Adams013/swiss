# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# SUPABASE (Required)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EMAIL SERVICE (Choose one)
REACT_APP_EMAIL_PROVIDER=resend
REACT_APP_RESEND_API_KEY=re_xxxxxxxxxxxxx

# OR use SendGrid
# REACT_APP_EMAIL_PROVIDER=sendgrid
# REACT_APP_SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# EMAIL CONFIGURATION
REACT_APP_FROM_EMAIL=noreply@swissstartupconnect.com
REACT_APP_FROM_NAME=Swiss Startup Connect

# APPLICATION URL
REACT_APP_URL=http://localhost:3000
```

## Getting Your API Keys

### Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### Resend (Recommended)
1. Go to https://resend.com
2. Sign up and verify your domain
3. Go to API Keys
4. Create a new API key
5. Copy the key (starts with `re_`)

### SendGrid (Alternative)
1. Go to https://sendgrid.com
2. Sign up for an account
3. Go to Settings → API Keys
4. Create a new API key with "Mail Send" permissions
5. Copy the key (starts with `SG.`)

## Production Environment Variables

Set these in your hosting platform (Vercel, Netlify, etc.):

```bash
REACT_APP_SUPABASE_URL=https://prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...production-key...
REACT_APP_RESEND_API_KEY=re_...production-key...
REACT_APP_FROM_EMAIL=noreply@swissstartupconnect.com
REACT_APP_FROM_NAME=Swiss Startup Connect
REACT_APP_URL=https://swissstartupconnect.com
NODE_ENV=production
```

## Supabase Edge Function Secrets

For the Edge Function to send emails, set these secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@swissstartupconnect.com
supabase secrets set FROM_NAME="Swiss Startup Connect"
supabase secrets set APP_URL=https://swissstartupconnect.com
```

## Testing

After setting up environment variables:

```bash
# Restart your development server
npm start

# Test that environment variables are loaded
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Email Provider:', process.env.REACT_APP_EMAIL_PROVIDER);
```

## Security Notes

- ✅ Never commit `.env.local` to git
- ✅ Use different API keys for dev/staging/production
- ✅ Rotate API keys periodically
- ✅ The Supabase anon key is safe to expose (RLS protects your data)
- ❌ Never expose service role keys in the frontend
- ❌ Never hardcode API keys in your code

