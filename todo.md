# Only Fangs — Project TODO

## Core Setup
- [x] Project scaffolding with tRPC + Manus Auth + Database
- [x] Dark Victorian aesthetic with Cinzel + IM Fell English fonts
- [x] Global CSS variables and grain texture overlay
- [x] Navbar with navigation links and Join the Coven CTA
- [x] Footer with links and copyright

## Pages
- [x] Home page with hero, stats, featured creators, content feed, how it works, pricing, final CTA
- [x] Discover page with search, filters, content grid
- [x] Creators page with creator cards
- [x] Creator Profile page with content tabs, membership tiers
- [x] Apply page for creator applications

## Features
- [x] Music Player (fixed bottom bar with waveform animation)
- [x] Music Player Context for global state management
- [x] Play music from Creator Profile and Discover pages
- [x] Routing with wouter (SPA navigation)
- [x] All text translated to English (100%)

## Data
- [x] CREATORS mock data (6 creators)
- [x] CONTENT_ITEMS mock data (books, photos, images, music)
- [x] TIERS (Mortal, Initiate, Acolyte, Immortal)
- [x] STATS, CATEGORIES mock data

## Fixes
- [x] Removed duplicate useLocation import in CreatorProfile
- [x] Fixed navigation from onNavigate prop to wouter useLocation
- [x] Fixed price display (R$ → $)
- [x] Translated all Portuguese text to English
- [x] Footer copyright and tagline translated

## Mobile & UX Fixes
- [x] Fix Navbar mobile overlap — add hamburger menu for small screens
- [x] Remove hardcoded tier prices from Creator Profile and data.ts (prices are set by each creator)

## Patron Auth Flow
- [x] DB: user profile table (displayName, bio, avatarUrl, patronSince, role)
- [x] tRPC: patron.me, patron.updateProfile, patron.stats, patron.subscriptions, patron.activity procedures
- [x] Navbar: avatar + dropdown menu when logged in, "Join the Coven" when logged out
- [x] Page: /profile — Patron profile page (avatar, name edit, stats, subscriptions, activity)
- [x] Content unlock: free tier (Mortal) content unlocked for logged-in users (lock overlay removed for authenticated users)

## Stripe Subscription Flow
- [x] Activate Stripe feature and collect API keys
- [x] DB: stripe_customers table (userId, stripeCustomerId), update subscriptions table with stripeSubscriptionId, stripePriceId, status
- [x] tRPC: stripe.createCheckoutSession, stripe.cancelSubscription, stripe.getPortalUrl
- [x] Webhook handler: handle checkout.session.completed, customer.subscription.updated/deleted
- [x] UI: "Select" button on Creator Profile opens real Stripe Checkout
- [x] UI: /profile shows active subscriptions with cancel button and billing portal link
- [x] Public procedures: creatorByHandle, creatorTiers para buscar dados reais de criadores
- [x] CreatorProfile integrado com tRPC para buscar tiers reais do banco de dados
- [x] PatronProfile com botoes de cancelamento de assinatura e portal de cobranca Stripe

## Pending Stripe Tasks
- [ ] Verify Stripe credentials in project settings (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Test Stripe checkout flow end-to-end with test card (4242 4242 4242 4242)
- [x] Create seed data: real creators and tiers in database for testing (seed-db.mjs)
- [ ] Bridge mock creator routes to real DB creators (currently CreatorProfile shows mock tiers as fallback)
- [x] Add vitest tests for Stripe webhook handler and tRPC procedures (stripe.test.ts) — 20 tests passing
- [x] Document Stripe integration setup and testing instructions (STRIPE_SETUP.md)
