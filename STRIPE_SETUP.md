# Stripe Integration Setup Guide

## Overview

Only Fangs integrates Stripe for subscription payments. Creators can set up membership tiers, and patrons can subscribe to access exclusive content.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at https://stripe.com
2. **Environment Variables**: Ensure the following are configured in your project settings:
   - `STRIPE_SECRET_KEY`: Your Stripe secret API key
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret

## Setup Steps

### 1. Claim Your Stripe Sandbox

If you haven't already claimed your Stripe sandbox, do so at:
https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVGs4YUxFUXQwWm11R2JSLDE3ODI1MTE4NjUv100OdeQkh2i

**Deadline**: 2026-08-18T22:11:05.000Z

### 2. Configure API Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
4. Update these in your project settings

### 3. Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add an endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in your project settings

## Testing

### Seed Test Data

Create test creators and tiers in your database:

```bash
node seed-db.mjs
```

This creates:
- **Creator**: Lady Nocturna (handle: `lady-nocturna`)
- **Tiers**: Initiate ($9.90), Acolyte ($24.90), Immortal ($59.90)

### Test Checkout Flow

1. Navigate to `/creator/lady-nocturna`
2. Click "Subscribe Now" on a tier
3. You'll be redirected to Stripe Checkout
4. Use test card: **4242 4242 4242 4242**
5. Any future expiry date and any CVC
6. Complete the payment

### Verify Webhook

After a successful payment:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your endpoint and click it
3. Scroll to "Events" and verify `checkout.session.completed` was received
4. Click the event to see the payload

### Test Cancellation

1. Log in as a patron with an active subscription
2. Go to `/profile`
3. Click "Cancel Subscription" on any active tier
4. Confirm the cancellation
5. The subscription status should update to "cancelled"

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription, increment creator subscriber count |
| `customer.subscription.updated` | Update subscription status (active/expired) |
| `customer.subscription.deleted` | Mark subscription as cancelled |

## Database Schema

### Users Table
- `stripeCustomerId`: Stripe customer ID for this user

### Subscriptions Table
- `stripeSubscriptionId`: Stripe subscription ID
- `stripePriceId`: Stripe price ID
- `status`: `active` \| `cancelled` \| `expired` \| `paused`

## Procedures

### Client-Side (tRPC)

**Create Checkout Session**
```typescript
const { mutate } = trpc.stripe.createCheckoutSession.useMutation();
mutate({ tierId: 1, origin: window.location.origin });
```

**Cancel Subscription**
```typescript
const { mutate } = trpc.stripe.cancelSubscription.useMutation();
mutate({ subscriptionId: 1 });
```

**Get Billing Portal URL**
```typescript
const { mutate } = trpc.stripe.getBillingPortalUrl.useMutation();
mutate({ origin: window.location.origin });
```

### Server-Side

**Create Checkout Session**
```typescript
import { createCheckoutSession } from './stripe';

const url = await createCheckoutSession({
  userId: 1,
  userEmail: 'user@example.com',
  userName: 'John Doe',
  tierId: 1,
  origin: 'https://example.com',
});
```

**Cancel Subscription**
```typescript
import { cancelSubscription } from './stripe';

await cancelSubscription(userId, subscriptionId);
```

## Troubleshooting

### Webhook Not Received

1. Verify webhook URL is publicly accessible
2. Check webhook signing secret is correct
3. Review Stripe Dashboard → Developers → Webhooks → Events for failed deliveries

### Checkout Session Not Created

1. Verify Stripe API keys are correct
2. Ensure user email is provided
3. Check that tier exists in database

### Subscription Not Created After Payment

1. Verify webhook is being received (check Stripe Dashboard)
2. Check application logs for webhook processing errors
3. Ensure database connection is working

## Going Live

1. Complete Stripe KYC verification
2. Switch to live API keys in project settings
3. Update webhook URL to production domain
4. Test with real payment methods (small amounts)
5. Monitor webhook deliveries and transaction logs

## Support

For Stripe integration issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
