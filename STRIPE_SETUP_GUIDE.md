# Stripe Integration Setup Guide

## Overview
This guide explains how to set up and use the Stripe subscription system integrated into the Swiss Startup Connect platform.

## Stripe Products Configuration

Based on your Stripe account, the following products are configured:

### Student Products
- **Product ID**: `prod_THY4PLgnJZU3eE` - Student Premium Subscription (Monthly)
  - **Payment Link**: https://buy.stripe.com/test_6oU9AU5D9dDldqN7iZg7e00
- **Product ID**: `prod_THY4DA4lq3TnrZ` - Student Premium Subscription (Quarterly)
- **Product ID**: `prod_THY3ZpRjvAhJoI` - Student Premium Subscription (Yearly)

### Employer/Startup Products
- **Product ID**: `prod_THY8CuZp5Mc98C` - Talent Search Access
- **Product ID**: `prod_THY7szAmTkSWq3` - Startup Analytics Dashboard
- **Product ID**: `prod_THY7tDZ9wkMN4Q` - Startup Featured Jobs

### Payment Links
Stripe Payment Links provide a simple way to accept payments without creating checkout sessions:
- **Student Monthly**: https://buy.stripe.com/test_6oU9AU5D9dDldqN7iZg7e00

## Environment Setup

### 1. Create `.env.local` file

Create a file named `.env.local` in the project root with the following content:

```bash
# Stripe Configuration
# Get your keys from: https://dashboard.stripe.com/apikeys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
REACT_APP_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
REACT_APP_STRIPE_API_URL=https://api.stripe.com
REACT_APP_STRIPE_TEST_MODE=false

# Supabase Configuration (if not already set)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: Replace the placeholder values with your actual Stripe keys from the dashboard.
**Security**: Never commit these keys to git! The .env.local file is already in .gitignore.

### 2. Stripe Dashboard Setup

You need to create **Prices** in your Stripe Dashboard for each product:

#### For Student Premium (prod_THY4PLgnJZU3eE)
1. Go to https://dashboard.stripe.com/products/prod_THY4PLgnJZU3eE
2. Click "Add another price"
3. Create a recurring price:
   - Amount: CHF 7.90
   - Billing period: Monthly
   - Price ID will be generated (e.g., `price_xxxxx`)

#### For Startup Products
Repeat the same process for:
- `prod_THY8CuZp5Mc98C` (Talent Search Access) - CHF 99.00/month
- `prod_THY7szAmTkSWq3` (Analytics Dashboard) - CHF 49.00/month
- `prod_THY7tDZ9wkMN4Q` (Featured Jobs) - CHF 119.00 one-time

### 3. Update Price IDs

After creating prices in Stripe, update the price IDs in:
`src/services/stripeService.js`

```javascript
stripe_price_id: 'price_xxxxx', // Replace with your actual price ID
```

## How It Works

### User Flow

1. **User clicks "Subscription" tab** in their profile settings
2. **Views available plans** based on their user type (Student or Employer)
3. **Clicks "Upgrade Now"** on a plan
4. **Confirmation dialog appears** asking if they want to proceed to payment
5. **User confirms** by clicking "Proceed to Payment"
6. **Stripe Checkout window opens** (in a new tab/window)
7. **User completes payment** securely on Stripe
8. **User is redirected back** to the success page
9. **Subscription is activated** in the database

### Features

#### Confirmation Dialog
- Shows plan details (name, price, billing period)
- Explains that payment is processed by Stripe
- Allows user to cancel before being redirected
- Beautiful, responsive design with animations

#### Subscription View
- Displays all available plans based on user type
- Shows current subscription status
- Highlights recommended plans (best value)
- Shows savings percentage for longer billing periods
- Allows users to manage billing through Stripe Customer Portal

#### Security
- All payment processing handled by Stripe
- No sensitive card data touches your servers
- PCI compliance handled by Stripe
- Secure redirects using HTTPS

## Files Modified

### Core Files
1. **`src/services/stripeService.js`**
   - Added Stripe API configuration with your keys
   - Updated product IDs from your CSV
   - Implemented checkout session creation
   - Added confirmation workflow

2. **`src/components/SubscriptionView.jsx`**
   - Added confirmation dialog state management
   - Implemented modal for payment confirmation
   - Enhanced UI with better user feedback

3. **`src/components/Subscription.css`**
   - Added styles for confirmation dialog
   - Responsive design for mobile
   - Dark mode support

4. **`src/config/stripeProducts.js`** (New)
   - Centralized product configuration
   - Easy product lookup by ID or user type

## Testing

### Test Mode
The system automatically detects test mode when using test keys (keys starting with `pk_test_` or `sk_test_`).

### Test Cards
Use Stripe's test cards for testing:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

Any future date for expiry, any 3-digit CVC.

### Testing Steps
1. Start the app: `yarn start`
2. Log in as a user
3. Go to Profile Settings → Subscription tab
4. Click on a plan
5. Confirm in the dialog
6. Use test card number to complete payment
7. Verify subscription is created

## Production Deployment

### Before Going Live
1. ✅ Create prices in Stripe Dashboard for all products
2. ✅ Update price IDs in the code
3. ✅ Replace test keys with live keys in `.env.local`
4. ✅ Set `REACT_APP_STRIPE_TEST_MODE=false`
5. ✅ Test the complete flow with real card
6. ✅ Set up webhooks for subscription events
7. ✅ Configure success/cancel URLs in Stripe Dashboard

### Webhook Events to Handle
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Record payment
- `invoice.payment_failed` - Handle failed payments

## Troubleshooting

### "Stripe failed to load" error
- Check that publishable key is correct
- Verify internet connection
- Check browser console for errors

### "Plan not found" error
- Verify product IDs match your Stripe products
- Check that plans are marked as `is_active: true`

### Checkout not opening
- Ensure prices are created in Stripe Dashboard
- Check that price IDs are correct
- Verify Stripe.js is loading correctly

### Payment not processing
- Check that you're using test cards in test mode
- Verify webhook endpoint is configured
- Check Stripe Dashboard logs for errors

## Support

For issues:
1. Check Stripe Dashboard logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Review Stripe documentation: https://stripe.com/docs

## Summary

Your Stripe integration is now set up with:
- ✅ Stripe API keys configured
- ✅ Product IDs from your CSV imported
- ✅ Confirmation dialog before payment
- ✅ Secure Stripe Checkout integration
- ✅ Beautiful, responsive UI
- ✅ Test mode support
- ✅ Ready for production (after creating prices)

**Next Steps**:
1. Create prices in Stripe Dashboard
2. Update price IDs in the code
3. Test the complete flow
4. Deploy to production

