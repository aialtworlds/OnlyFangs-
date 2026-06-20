# Stripe Checkout End-to-End Test Guide

## Prerequisites

1. **Stripe Credentials Verified**: Run `node verify-stripe-config.mjs` to confirm all keys are set
2. **Database Seeded**: Run `node seed-db.mjs` to create test creator (Lady Nocturna) and tiers
3. **Dev Server Running**: `pnpm dev` should be active
4. **Authenticated User**: Log in with your Manus account

## Test Flow

### Step 1: Verify Test Data

```bash
# Check Stripe config
node verify-stripe-config.mjs

# Create test creator and tiers
node seed-db.mjs
```

Expected output:
```
✅ All required Stripe environment variables are configured!
✨ Seed completed successfully!
- Creator: Lady Nocturna (handle: lady-nocturna)
- Tiers: Initiate ($9.90), Acolyte ($24.90), Immortal ($59.90)
```

### Step 2: Navigate to Creator Profile

1. Go to `https://your-domain.com/creator/lady-nocturna`
2. Verify you see:
   - Creator name: "Lady Nocturna"
   - Creator bio and stats
   - **Membership Tiers** section with real tiers from database:
     - Initiate ($9.90)
     - Acolyte ($24.90)
     - Immortal ($59.90)

### Step 3: Test Unauthenticated Checkout

1. If not logged in, click "Subscribe Now" on any tier
2. Expected behavior:
   - Toast: "Login required - Please sign in to subscribe."
   - Redirect to login page
3. Log in with your Manus account
4. Return to `/creator/lady-nocturna`

### Step 4: Test Authenticated Checkout

1. Ensure you're logged in
2. Click "Subscribe Now" on the **Initiate** tier ($9.90)
3. Expected behavior:
   - Toast: "Redirecting to Stripe checkout... A new tab will open for payment."
   - New browser tab opens with Stripe Checkout
   - Checkout shows:
     - Amount: $9.90 USD
     - Item: "Initiate" tier
     - Your email pre-filled

### Step 5: Complete Test Payment

In the Stripe Checkout page:

1. **Card Number**: `4242 4242 4242 4242`
2. **Expiry**: Any future date (e.g., `12/25`)
3. **CVC**: Any 3 digits (e.g., `123`)
4. **Name**: Your name (pre-filled)
5. **Email**: Your email (pre-filled)
6. Click **"Pay"**

Expected result:
- Payment succeeds
- Redirected to success URL
- Toast: "Payment successful!"

### Step 6: Verify Subscription Created

1. Go to `/profile` (Patron Profile)
2. Scroll to **"Active Subscriptions"** section
3. Verify you see:
   - Tier name: "Initiate"
   - Status: "active"
   - Start date: today
   - **"Manage Billing"** button
   - **"Cancel Subscription"** button

### Step 7: Test Billing Portal

1. Click **"Manage Billing"** button
2. Expected behavior:
   - New tab opens with Stripe Customer Portal
   - You can view invoice history
   - You can update payment method
   - You can see subscription details

### Step 8: Test Subscription Cancellation

1. Return to `/profile`
2. Click **"Cancel Subscription"** on your active tier
3. Confirm cancellation when prompted
4. Expected behavior:
   - Button shows loading spinner
   - Subscription status changes to "cancelled"
   - Subscription moves to "Cancelled Subscriptions" section

### Step 9: Verify Webhook Events

1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your endpoint (`/api/stripe/webhook`)
3. Click to view recent events
4. Verify you see:
   - `checkout.session.completed` (after payment)
   - `customer.subscription.created` (after payment)
   - `customer.subscription.updated` (after cancellation)

## Webhook Event Details

### checkout.session.completed
```json
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_...",
      "customer": "cus_...",
      "metadata": {
        "user_id": "1",
        "tier_id": "1"
      }
    }
  }
}
```

### customer.subscription.updated
```json
{
  "id": "evt_...",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "active"
    }
  }
}
```

## Troubleshooting

### Checkout Button Shows "Creator not yet in database"

**Problem**: Real creator not found in database.

**Solution**:
1. Run `node seed-db.mjs` to create test data
2. Verify creator was created: Check database or logs
3. Clear browser cache and reload

### Payment Fails with "Invalid API Key"

**Problem**: Stripe API key is incorrect or not configured.

**Solution**:
1. Run `node verify-stripe-config.mjs`
2. Verify all three keys are set and start with correct prefixes:
   - `STRIPE_SECRET_KEY` → `sk_test_` or `sk_live_`
   - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_test_` or `pk_live_`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_`
3. Update keys in project settings if needed

### Webhook Not Received

**Problem**: Stripe webhook events not appearing in dashboard.

**Solution**:
1. Verify webhook URL is publicly accessible
2. Check webhook signing secret is correct
3. Review Stripe Dashboard → Developers → Webhooks → Events for failed deliveries
4. Check application logs for webhook processing errors

### Subscription Not Created After Payment

**Problem**: Payment succeeded but subscription not visible in `/profile`.

**Solution**:
1. Verify webhook was received (check Stripe Dashboard)
2. Check application logs for webhook processing errors
3. Verify database connection is working
4. Refresh browser and check `/profile` again

## Test Checklist

- [ ] Stripe credentials verified
- [ ] Test data seeded (Lady Nocturna creator + 3 tiers)
- [ ] Creator profile shows real tiers from database
- [ ] Unauthenticated checkout redirects to login
- [ ] Authenticated checkout opens Stripe Checkout
- [ ] Test payment succeeds with card 4242 4242 4242 4242
- [ ] Subscription appears in patron profile
- [ ] Manage Billing button opens Stripe portal
- [ ] Subscription cancellation works
- [ ] Webhook events appear in Stripe Dashboard

## Next Steps

Once all tests pass:

1. **Claim Live Stripe Account**: Complete KYC verification
2. **Switch to Live Keys**: Update API keys in project settings
3. **Update Webhook URL**: Point to production domain
4. **Test with Real Payments**: Use small amounts to verify
5. **Monitor Transactions**: Check Stripe Dashboard regularly

## Support

For issues or questions:
- Review [Stripe Documentation](https://stripe.com/docs)
- Check [Stripe API Reference](https://stripe.com/docs/api)
- Review application logs in `.manus-logs/`
