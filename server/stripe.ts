import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { users, subscriptions, tiers, creators } from "../drizzle/schema";
import {
  sendPaymentConfirmationEmail,
  sendSubscriptionRenewalEmail,
  sendSubscriptionCancellationEmail,
  sendCreatorNotificationEmail,
} from "./email";
import { notifySubscriptionConfirmed } from "./db";

// ── Stripe client ──────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });
}

// ── Ensure Stripe customer exists for user ─────────────────────
export async function ensureStripeCustomer(userId: number, email: string, name?: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId: userId.toString() },
  });

  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

// ── Create Stripe Price for a tier (on-demand) ─────────────────
export async function getOrCreateStripePrice(tierId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [tier] = await db.select().from(tiers).where(eq(tiers.id, tierId)).limit(1);
  if (!tier) throw new Error("Tier not found");

  const [creator] = await db.select().from(creators).where(eq(creators.id, tier.creatorId)).limit(1);
  if (!creator) throw new Error("Creator not found");

  const stripe = getStripe();

  // Check if we already have a price ID stored in the tier
  // For now we create a new price each time (idempotency via metadata lookup)
  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [`tier_${tierId}`],
  });

  if (existingPrices.data.length > 0) {
    return existingPrices.data[0].id;
  }

  // Create product + price
  const product = await stripe.products.create({
    name: `${creator.alias} — ${tier.name}`,
    description: tier.description || undefined,
    metadata: { tierId: tierId.toString(), creatorId: tier.creatorId.toString() },
  });

  const priceAmount = Math.round(parseFloat(tier.price) * 100); // cents
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceAmount,
    currency: (tier.currency || "usd").toLowerCase(),
    recurring: { interval: "month" },
    lookup_key: `tier_${tierId}`,
  });

  return price.id;
}

// ── Create Checkout Session ────────────────────────────────────
// ── Stripe Connect Express Onboarding ────────────────────────
export async function createConnectedAccount(email: string, country: string = "US"): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

export async function createAccountOnboardingLink(accountId: string, origin: string): Promise<string> {
  const stripe = getStripe();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/creator-admin?tab=payouts&refresh=1`,
    return_url: `${origin}/creator-admin?tab=payouts&return=1`,
    type: "account_onboarding",
  });
  return accountLink.url;
}

export async function createLoginLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

export async function checkConnectedAccountActive(accountId: string): Promise<boolean> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return !!(account.charges_enabled && account.details_submitted);
}

export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string;
  tierId: number;
  origin: string;
}): Promise<string> {
  const stripe = getStripe();

  const customerId = await ensureStripeCustomer(params.userId, params.userEmail, params.userName);
  const priceId = await getOrCreateStripePrice(params.tierId);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [tier] = await db.select().from(tiers).where(eq(tiers.id, params.tierId)).limit(1);
  if (!tier) throw new Error("Tier not found");

  const [creator] = await db.select().from(creators).where(eq(creators.id, tier.creatorId)).limit(1);
  if (!creator) throw new Error("Creator not found");

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${params.origin}/profile?subscribed=1`,
    cancel_url: `${params.origin}`,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      tier_id: params.tierId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
    },
  };

  // Se o criador tiver o Stripe Connect configurado, direcionar pagamento cobrando taxa
  if (creator.stripeConnectAccountId) {
    sessionParams.subscription_data = {
      application_fee_percent: 10, // 10% de taxa da plataforma
      transfer_data: {
        destination: creator.stripeConnectAccountId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) throw new Error("Failed to create checkout session URL");
  return session.url;
}

// ── Create Billing Portal Session ─────────────────────────────
export async function createBillingPortalSession(userId: number, origin: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.stripeCustomerId) throw new Error("No Stripe customer found for this user");

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/profile`,
  });

  return session.url;
}

// ── Cancel Subscription ────────────────────────────────────────
export async function cancelSubscription(userId: number, subscriptionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.patronId, userId)))
    .limit(1);

  if (!sub) throw new Error("Subscription not found");

  if (sub.stripeSubscriptionId) {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
  }

  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));
}

// ── Handle Webhook Event ───────────────────────────────────────
export async function handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  // Test events — just acknowledge
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected:", event.type);
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available, skipping event:", event.type);
    return;
  }

  console.log("[Webhook] Processing event:", event.type, event.id);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id || "0");
      const tierId = parseInt(session.metadata?.tier_id || "0");
      const stripeSubId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

      if (!userId || !tierId) {
        console.warn("[Webhook] Missing metadata in checkout.session.completed");
        break;
      }

      // Get tier to find creatorId
      const [tier] = await db.select().from(tiers).where(eq(tiers.id, tierId)).limit(1);
      if (!tier) {
        console.warn("[Webhook] Tier not found:", tierId);
        break;
      }

      // Upsert subscription
      const existing = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.patronId, userId), eq(subscriptions.tierId, tierId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            stripeSubscriptionId: stripeSubId || null,
            cancelledAt: null,
          })
          .where(eq(subscriptions.id, existing[0].id));
      } else {
        await db.insert(subscriptions).values({
          patronId: userId,
          creatorId: tier.creatorId,
          tierId,
          status: "active",
          stripeSubscriptionId: stripeSubId || null,
          startedAt: new Date(),
        });
        // Increment creator subscriber count
        const [creator] = await db
          .select({ totalSubscribers: creators.totalSubscribers })
          .from(creators)
          .where(eq(creators.id, tier.creatorId))
          .limit(1);
        if (creator) {
          await db
            .update(creators)
            .set({ totalSubscribers: creator.totalSubscribers + 1 })
            .where(eq(creators.id, tier.creatorId));
          // Notify creator about new subscription
          const [patron] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
          if (patron) {
            await notifySubscriptionConfirmed(tier.creatorId, patron.name || 'Unknown', tier.name);
          }
        }
      }

      // Send confirmation emails
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const [creator] = await db.select().from(creators).where(eq(creators.id, tier.creatorId)).limit(1);

      if (user && creator) {
        const creatorName = creator.alias;
        const amount = Math.round(parseFloat(tier.price) * 100);
        const currency = tier.currency || "usd";

        // Send to patron
        await sendPaymentConfirmationEmail(
          user.email || "",
          user.name || "Patron",
          creatorName,
          tier.name,
          amount,
          currency
        );

        // Send to creator
        const creatorEmail = creator.email || "";
        if (creatorEmail) {
          await sendCreatorNotificationEmail(
            creatorEmail,
            creatorName,
            user.name || "New Patron",
            tier.name,
            amount,
            currency
          );
        }
      }

      console.log("[Webhook] Subscription activated for user:", userId, "tier:", tierId);
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
        .limit(1);

      if (sub) {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(eq(subscriptions.id, sub.id));

        // Send cancellation email
        const [patron] = await db.select().from(users).where(eq(users.id, sub.patronId)).limit(1);
        const [tier] = await db.select().from(tiers).where(eq(tiers.id, sub.tierId)).limit(1);
        const [creator] = await db.select().from(creators).where(eq(creators.id, sub.creatorId)).limit(1);

        if (patron && tier && creator) {
          await sendSubscriptionCancellationEmail(
            patron.email || "",
            patron.name || "Patron",
            creator.alias,
            tier.name
          );
        }
      }

      console.log("[Webhook] Subscription cancelled:", stripeSub.id);
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const status = stripeSub.status === "active" ? "active" : "expired";
      await db
        .update(subscriptions)
        .set({ status })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
      console.log("[Webhook] Subscription updated:", stripeSub.id, "→", status);
      break;
    }

    default:
      console.log("[Webhook] Unhandled event type:", event.type);
  }
}
