import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { getDb, createCustomRequest } from "./db";
import { users, subscriptions, tiers, creators, oneTimePurchases, notifications } from "../drizzle/schema";
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
      application_fee_percent: 10, // 10% platform fee, per Sam's decision (creator keeps 90%) — round number, chosen deliberately
      transfer_data: {
        destination: creator.stripeConnectAccountId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) throw new Error("Failed to create checkout session URL");
  return session.url;
}

// ── Create One-Time Checkout Session ───────────────────────────
export async function createOneTimeCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string;
  creatorId: number;
  amount: number; // in USD (e.g. 15.00)
  type: "post" | "message" | "tip" | "custom_request";
  targetId?: number; // post id or message id
  customTitle?: string; // for custom request title
  instructions?: string; // for custom request briefing instructions
  origin: string;
}): Promise<string> {
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(params.userId, params.userEmail, params.userName);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [creator] = await db.select().from(creators).where(eq(creators.id, params.creatorId)).limit(1);
  if (!creator) throw new Error("Creator not found");

  const priceAmountInCents = Math.round(params.amount * 100);

  // Generate success redirect url
  let successUrl = `${params.origin}/profile?payment_success=1`;
  if (params.type === "post" && params.targetId) {
    successUrl = `${params.origin}/creator/${creator.handle}?unlocked_post=${params.targetId}`;
  } else if (params.type === "message") {
    successUrl = `${params.origin}/messages?unlocked_msg=1`;
  } else if (params.type === "custom_request") {
    successUrl = `${params.origin}/profile?tab=requests&request_success=1`;
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name:
              params.type === "tip"
                ? `Tip to ${creator.alias}`
                : params.type === "post"
                ? `Post Unlock — ${creator.alias}`
                : params.type === "custom_request"
                ? `Custom Request: ${params.customTitle || "Content"} — ${creator.alias}`
                : `PPV DM Unlock — ${creator.alias}`,
          },
          unit_amount: priceAmountInCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: `${params.origin}`,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      creator_id: params.creatorId.toString(),
      type: params.type,
      target_id: params.targetId ? params.targetId.toString() : "",
      amount: params.amount.toString(),
      custom_title: params.customTitle || "",
      instructions: params.instructions || "",
    },
  };

  // Connect split: 10% platform fee if Connect account is active
  if (creator.stripeConnectAccountId) {
    const feeInCents = Math.round(priceAmountInCents * 0.1); // 10%
    sessionParams.payment_intent_data = {
      application_fee_amount: feeInCents,
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
      
      // Check if this is a subscription checkout or a one-time payment
      const tierIdStr = session.metadata?.tier_id;
      const type = session.metadata?.type as "post" | "message" | "tip" | "custom_request" | undefined;

      if (type) {
        // ONE-TIME PAYMENT (Tips, PPV Messages, Post unlocks, Custom requests)
        const userId = parseInt(session.metadata?.user_id || "0");
        const creatorId = parseInt(session.metadata?.creator_id || "0");
        const targetId = session.metadata?.target_id ? parseInt(session.metadata.target_id) : null;
        const amount = parseFloat(session.metadata?.amount || "0");

        if (!userId || !creatorId) {
          console.warn("[Webhook] Missing metadata in one-time checkout.session.completed");
          break;
        }

        // Handle Custom Request specifically
        if (type === "custom_request") {
          const customTitle = session.metadata?.custom_title || "Custom Request";
          const instructions = session.metadata?.instructions || "";
          
          await createCustomRequest({
            patronId: userId,
            creatorId,
            title: customTitle,
            instructions,
            price: amount,
            stripeSessionId: session.id,
          });
        } else {
          // Insert purchase log for tips, posts, messages
          await db.insert(oneTimePurchases).values({
            userId,
            type,
            targetId,
            creatorId,
            amount: amount.toString(),
            stripeSessionId: session.id,
          });
        }

        // Notify creator and user
        const [patron] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
        const patronName = patron?.name || "Patron";

        let notifTitle = "";
        let notifMsg = "";

        if (type === "tip") {
          notifTitle = "Received a Tip!";
          notifMsg = `${patronName} sent you a tip of $${amount.toFixed(2)}!`;
        } else if (type === "post") {
          notifTitle = "Post Unlocked";
          notifMsg = `${patronName} unlocked your premium post #${targetId} for $${amount.toFixed(2)}.`;
        } else if (type === "message") {
          notifTitle = "PPV DM Unlocked";
          notifMsg = `${patronName} unlocked your PPV attachment for $${amount.toFixed(2)}.`;
        } else if (type === "custom_request") {
          const customTitle = session.metadata?.custom_title || "Custom Request";
          notifTitle = "New Custom Request";
          notifMsg = `${patronName} ordered custom content: "${customTitle}" for $${amount.toFixed(2)}.`;
        }

        // Notify creator
        await db.insert(notifications).values({
          userId: creatorId,
          type: "payment",
          title: notifTitle,
          message: notifMsg,
          read: false,
        });

        console.log(`[Webhook] One-time payment (${type}) successfully processed for user ${userId} to creator ${creatorId}`);
        break;
      }

      // SUBSCRIPTION PAYMENT (Existing logic)
      const userId = parseInt(session.metadata?.user_id || "0");
      const tierId = parseInt(tierIdStr || "0");
      const stripeSubId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

      if (!userId || !tierId) {
        console.warn("[Webhook] Missing metadata in subscription checkout.session.completed");
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
