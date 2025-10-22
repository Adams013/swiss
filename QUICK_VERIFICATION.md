# ⚡ Quick Verification - Check These NOW

The dev server is running. Here's what to verify immediately:

## 1️⃣ Check Tab Name (30 seconds)

### For Students:
```
1. Open: http://localhost:3000
2. Sign in as a student
3. Click profile icon (top right)
4. Look at tabs
✅ SHOULD SEE: "Subscription"
```

### For Employers/Startups:
```
1. Open: http://localhost:3000
2. Sign in as employer/startup
3. Click profile icon (top right)
4. Look at tabs
✅ SHOULD SEE: "Subscriptions & Services"
```

## 2️⃣ Check Subscription UI (1 minute)

```
1. Click the Subscription/Subscriptions & Services tab
2. ✅ SHOULD SEE:
   - Yellow test mode banner
   - "Upgrade to Premium" title with crown
   - 3 pricing cards
   - Each card has "Upgrade Now" button
   - Money-back guarantee at bottom
```

## 3️⃣ Check Confirmation Dialog (1 minute)

```
1. Click "Upgrade Now" on any plan
2. ✅ SHOULD SEE: Modal dialog appears with:
   - Crown icon
   - "Confirm Subscription" title
   - Plan details in gold box
   - Monthly price (e.g., "CHF 7.90/month")
   - Two checkmarks with security info
   - "Cancel" and "Proceed to Payment" buttons
3. Click "Cancel" or click outside
4. ✅ SHOULD SEE: Dialog closes
```

## 4️⃣ Check Stripe Link (1 minute)

```
1. Click "Upgrade Now" on any plan
2. Click "Proceed to Payment"
3. ✅ ONE OF THESE WILL HAPPEN:

   OPTION A - Prices Configured:
   - Browser redirects to checkout.stripe.com
   - Stripe payment form loads
   - ✅ SUCCESS!

   OPTION B - Prices NOT Configured (Expected):
   - Alert appears with configuration instructions
   - Shows product ID
   - Console logs details
   - ✅ This is EXPECTED if you haven't created prices yet
```

## 5️⃣ Check Console (30 seconds)

```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Upgrade Now" → "Proceed to Payment"
4. ✅ SHOULD SEE:
   - "Stripe initialized: pk_test_51SKytnJYA99..."
   - "Starting checkout process: {...}"
   - "Plan details: {...}"
   - Product ID information
   - NO RED ERRORS (yellow warnings OK)
```

## 🎯 Expected Results

### ✅ Working Now:
- Tab name changes based on user type
- Beautiful subscription UI displays
- Confirmation dialog works
- Stripe.js loads successfully
- Product IDs from your CSV are used
- Clean error messages

### ⚠️ Needs Configuration (Normal):
- Actual redirect to Stripe (needs price IDs)
- Payment processing (needs Supabase function deployment)

## 🐛 If Something's Wrong

### Tab still says "Subscription" for employers
→ **Check**: Are you logged in as an employer? Try logging out and back in.

### No pricing cards show up
→ **Check**: Open Console (F12), look for errors. Plans should load from mock data.

### Dialog doesn't appear
→ **Check**: Console for errors. Clear browser cache and refresh.

### "Stripe failed to load" error
→ **Check**: Internet connection. Stripe.js needs to load from CDN.

## 📱 Mobile Test (Optional)

```
1. Open DevTools (F12)
2. Click device emulation icon
3. Select "iPhone SE" or similar
4. Navigate to Subscription tab
5. ✅ SHOULD SEE:
   - Cards stack vertically
   - Everything fits on screen
   - Buttons are tappable
```

## 🎉 Success Criteria

If you can confirm these 5 things, everything is working:

- [x] Tab name is correct for user type
- [x] Subscription UI displays beautifully
- [x] Confirmation dialog appears and works
- [x] Stripe attempt happens (redirect or instructions)
- [x] No red errors in console

## 📊 What's Next?

### To Enable Real Payments:

1. **Create prices in Stripe Dashboard** (5 minutes)
   - Go to each product
   - Add a price
   - Copy price ID

2. **Update code with price IDs** (2 minutes)
   - Edit `src/services/stripeService.js`
   - Replace `stripe_price_id` values

3. **Deploy Supabase function** (5 minutes)
   ```bash
   supabase functions deploy create-checkout-session
   ```

4. **Test payment** (1 minute)
   - Use test card: 4242 4242 4242 4242
   - Complete checkout
   - ✅ Done!

---

**Current Status**: Development server running at http://localhost:3000

**Quick Test**: Follow steps 1-5 above (should take ~5 minutes total)

**Full Testing**: See `TESTING_GUIDE.md` for comprehensive tests

**Setup Guide**: See `STRIPE_SETUP_GUIDE.md` for enabling payments

