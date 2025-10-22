# Premium Subscription System - Setup Guide

This guide will walk you through setting up the complete premium subscription system with Stripe integration.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Pricing](#pricing)
4. [Setup Steps](#setup-steps)
5. [Stripe Configuration](#stripe-configuration)
6. [Database Setup](#database-setup)
7. [Edge Functions Deployment](#edge-functions-deployment)
8. [Frontend Integration](#frontend-integration)
9. [Testing](#testing)
10. [Production Checklist](#production-checklist)

---

## Overview

The premium subscription system enables monetization through tiered subscription plans with the following architecture:

- **Frontend**: React components for subscription UI
- **Backend**: Supabase Edge Functions for Stripe integration
- **Database**: PostgreSQL tables for subscriptions and premium features
- **Payment**: Stripe for payment processing and subscription management

---

## Features

### For Students (Premium)
- ✅ Ad-free experience
- ✅ See who viewed their profile
- ✅ See who searched for them
- ✅ Enhanced profile visibility
- ✅ Advanced analytics

### For Startups (Premium)
- ✅ Ad-free experience
- ✅ Promote job vacancies (featured placement)
- ✅ See detailed student profiles
- ✅ Priority job placement
- ✅ Advanced hiring analytics

---

## Pricing

| Plan | Billing | Price/Month | Total Price | Savings |
|------|---------|-------------|-------------|---------|
| **Monthly** | Monthly | 7.90 CHF | 7.90 CHF | - |
| **Quarterly** | Every 3 months | 6.66 CHF | 20.00 CHF | 16% |
| **Yearly** | Annually | 6.25 CHF | 75.00 CHF | 26% |

All plans include a **7-day free trial** and can be canceled anytime.

---

## Setup Steps

### 1. Database Setup

Run the subscription schema:

```bash
# Apply the schema to your Supabase database
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase-subscriptions-schema.sql
```

Or use the Supabase Dashboard:
1. Go to SQL Editor
2. Paste the contents of `supabase-subscriptions-schema.sql`
3. Run the query

This creates:
- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - Active and historical subscriptions
- `profile_views` - Track profile views (premium feature)
- `profile_search_appearances` - Track search appearances (premium feature)
- `featured_jobs` - Jobs with premium promotion
- `payment_transactions` - Payment history

### 2. Install Dependencies

Add Stripe.js to your project:

```bash
npm install @stripe/stripe-js
```

### 3. Environment Variables

Add these to your `.env.local`:

```env
# Frontend (React)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxxxxxxxxxxxx

# Backend (Supabase Edge Functions - set in Supabase Dashboard)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx
APP_URL=https://yourdomain.com
```

---

## Stripe Configuration

### Step 1: Create Stripe Account

1. Sign up at [https://stripe.com](https://stripe.com)
2. Complete account setup
3. Get your API keys from Dashboard → Developers → API keys

### Step 2: Create Products and Prices

In Stripe Dashboard → Products:

#### Product 1: Premium Monthly
- Name: Premium Monthly
- Description: All premium features, billed monthly
- Price: 7.90 CHF / month
- **Copy the Price ID** → Update `stripe_price_id` in database

#### Product 2: Premium Quarterly
- Name: Premium Quarterly
- Description: All premium features, save 16% with quarterly billing
- Price: 20.00 CHF / 3 months
- **Copy the Price ID** → Update `stripe_price_id` in database

#### Product 3: Premium Yearly
- Name: Premium Yearly
- Description: All premium features, save 26% with yearly billing
- Price: 75.00 CHF / year
- **Copy the Price ID** → Update `stripe_price_id` in database

### Step 3: Update Database with Stripe IDs

```sql
-- Update plans with Stripe Price IDs from your Stripe Dashboard
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx',
    stripe_product_id = 'prod_xxxxxxxxxxxxx'
WHERE plan_id = 'premium_monthly';

UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx',
    stripe_product_id = 'prod_xxxxxxxxxxxxx'
WHERE plan_id = 'premium_quarterly';

UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx',
    stripe_product_id = 'prod_xxxxxxxxxxxxx'
WHERE plan_id = 'premium_yearly';
```

### Step 4: Configure Customer Portal

In Stripe Dashboard → Settings → Customer portal:

1. Enable the customer portal
2. Configure allowed actions:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ Update billing information
3. Set business information (name, logo, etc.)

---

## Edge Functions Deployment

### Prerequisites

Install Supabase CLI:

```bash
npm install -g supabase
```

Login to Supabase:

```bash
supabase login
```

Link to your project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions

```bash
# Deploy checkout session creation
supabase functions deploy create-checkout-session

# Deploy customer portal session
supabase functions deploy create-portal-session

# Deploy webhook handler
supabase functions deploy stripe-webhook
```

### Set Environment Variables

Set secrets for Edge Functions:

```bash
# Stripe keys
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Supabase keys (if not already set)
supabase secrets set SUPABASE_URL=https://xxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx
supabase secrets set APP_URL=https://yourdomain.com
```

### Configure Webhook in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://xxx.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the signing secret** → Set as `STRIPE_WEBHOOK_SECRET`

---

## Frontend Integration

### Step 1: Import Components

```javascript
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionManager from './components/SubscriptionManager';
import PremiumBadge from './components/PremiumBadge';
import './components/Subscription.css';
```

### Step 2: Add Subscription Plans Page

```javascript
// In your routing or modal logic
<SubscriptionPlans
  user={currentUser}
  translate={translate}
  onClose={() => setShowSubscriptionModal(false)}
/>
```

### Step 3: Add Subscription Manager

```javascript
// In user settings or profile
<SubscriptionManager
  user={currentUser}
  translate={translate}
  onUpgrade={() => setShowSubscriptionPlans(true)}
/>
```

### Step 4: Display Premium Badge

```javascript
import { isPremiumUser } from './services/stripeService';

// In user profile or navbar
const [isPremium, setIsPremium] = useState(false);

useEffect(() => {
  if (user?.id) {
    isPremiumUser(user.id).then(({ isPremium }) => {
      setIsPremium(isPremium);
    });
  }
}, [user?.id]);

{isPremium && <PremiumBadge translate={translate} />}
```

### Step 5: Track Profile Views

```javascript
import { trackProfileView } from './services/stripeService';

// When a user views a profile
useEffect(() => {
  if (profileId) {
    trackProfileView(profileId, {
      viewerId: currentUser?.id,
      viewerType: currentUser?.type || 'anonymous',
      source: 'profile_page',
      companyName: currentUser?.companyName,
    });
  }
}, [profileId]);
```

### Step 6: Show Featured Jobs

```javascript
import { getFeaturedJobs } from './services/stripeService';

// Load and display featured jobs
const [featuredJobs, setFeaturedJobs] = useState([]);

useEffect(() => {
  getFeaturedJobs(5).then(({ featuredJobs }) => {
    setFeaturedJobs(featuredJobs);
  });
}, []);

// Display with premium badge
{featuredJobs.map(({ job }) => (
  <JobCard key={job.id} job={job} featured={true} />
))}
```

### Step 7: Premium-Only Features

```javascript
// Conditionally show features based on premium status
{isPremium ? (
  <ProfileViewsList userId={user.id} />
) : (
  <div className="ssc__premium-upsell">
    <p>Upgrade to Premium to see who viewed your profile</p>
    <button onClick={() => setShowSubscriptionPlans(true)}>
      <Crown size={16} /> Upgrade Now
    </button>
  </div>
)}
```

---

## Testing

### Test Mode

During development, use Stripe test mode:

1. Use test API keys (starts with `pk_test_` and `sk_test_`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - 3D Secure: `4000 0027 6000 3184`
   - Declined: `4000 0000 0000 0002`

### Test Webhook Locally

Use Stripe CLI to forward webhooks to local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe listen --forward-to https://xxx.supabase.co/functions/v1/stripe-webhook

# Copy the webhook signing secret to your Edge Function secrets
```

### Test Scenarios

1. **Subscribe to monthly plan**
   - Use test card
   - Verify subscription created in database
   - Check 7-day trial is applied

2. **Subscribe to quarterly plan**
   - Verify correct pricing (20 CHF)
   - Check billing cycle is 3 months

3. **Cancel subscription**
   - Go to customer portal
   - Cancel subscription
   - Verify `cancel_at_period_end` is set

4. **Payment failure**
   - Use declined test card
   - Verify status changes to `past_due`

5. **Profile views tracking**
   - View a profile
   - Check `profile_views` table
   - Verify premium users can see views

---

## Production Checklist

Before going live:

### Stripe Configuration

- [ ] Switch to live API keys (starts with `pk_live_` and `sk_live_`)
- [ ] Update environment variables in Supabase
- [ ] Activate your Stripe account
- [ ] Configure Customer Portal branding
- [ ] Set up email receipts
- [ ] Configure tax settings (if applicable)

### Database

- [ ] Run migrations on production database
- [ ] Seed subscription plans with live Stripe Price IDs
- [ ] Set up database backups
- [ ] Configure RLS policies

### Edge Functions

- [ ] Deploy all Edge Functions to production
- [ ] Set production secrets
- [ ] Configure production webhook endpoint in Stripe
- [ ] Test webhook delivery

### Frontend

- [ ] Update environment variables to production
- [ ] Test checkout flow end-to-end
- [ ] Verify premium features are gated correctly
- [ ] Test customer portal access
- [ ] Add error handling and user feedback

### Legal & Compliance

- [ ] Update Terms of Service (subscription terms)
- [ ] Update Privacy Policy (payment data handling)
- [ ] Add refund policy (30-day money-back guarantee)
- [ ] GDPR compliance (data export/deletion)
- [ ] PCI compliance (handled by Stripe)

### Monitoring

- [ ] Set up Stripe Dashboard notifications
- [ ] Monitor webhook delivery
- [ ] Track subscription metrics
- [ ] Set up alerts for payment failures
- [ ] Monitor Edge Function logs

### Support

- [ ] Document subscription FAQ
- [ ] Train support team on subscription issues
- [ ] Set up process for refunds
- [ ] Create cancellation flow documentation

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL in Stripe Dashboard
2. Verify signing secret is correct
3. Check Edge Function logs in Supabase
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Subscription Not Creating

1. Check Edge Function logs
2. Verify Stripe Price ID matches database
3. Ensure user_id is passed correctly
4. Check database permissions (RLS)

### Payment Declined

1. Verify test card numbers in test mode
2. Check customer has valid payment method
3. Look at Stripe Dashboard → Payments for details

### Profile Views Not Tracking

1. Verify `trackProfileView()` is called
2. Check database permissions
3. Ensure session_id is unique
4. Check for duplicate key errors (same viewer, same session)

---

## Advanced Features

### Promo Codes

Enable promo codes in Stripe Dashboard, then update checkout session:

```typescript
allow_promotion_codes: true, // Already enabled in Edge Function
```

### Usage-Based Billing

Add metered billing for features like job postings:

```typescript
// Create usage record
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  { quantity: 1, timestamp: Math.floor(Date.now() / 1000) }
);
```

### Multiple Subscription Tiers

Add new plans to `subscription_plans` table and create corresponding Stripe Products.

### Trial Extensions

Modify trial period in Edge Function:

```typescript
trial_period_days: 14, // Extend to 14 days
```

---

## Support

For issues or questions:

1. Check Supabase Edge Function logs
2. Review Stripe Dashboard → Logs
3. Consult [Stripe Documentation](https://stripe.com/docs)
4. Check [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

## Next Steps

After setting up subscriptions:

1. **Analytics**: Track subscription conversion rates
2. **Email Marketing**: Send onboarding emails to new subscribers
3. **Retention**: Monitor churn and send win-back campaigns
4. **Upsells**: Prompt free users to upgrade at key moments
5. **Referrals**: Add referral program for subscribers

---

**Congratulations!** 🎉 Your premium subscription system is ready to generate revenue!

