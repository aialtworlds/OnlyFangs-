#!/usr/bin/env node

/**
 * Verify Stripe Configuration
 * 
 * This script checks if all required Stripe environment variables are configured
 * and validates their format.
 */

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const optionalEnvVars = [
  'STRIPE_API_VERSION',
];

console.log('🔍 Verifying Stripe Configuration...\n');

let allConfigured = true;
let warnings = [];

// Check required environment variables
console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (!value) {
    console.log(`  ❌ ${envVar}: NOT SET`);
    allConfigured = false;
  } else {
    // Show masked value for security
    const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${envVar}: ${masked}`);

    // Validate format
    if (envVar === 'STRIPE_SECRET_KEY' && !value.startsWith('sk_')) {
      warnings.push(`${envVar} should start with 'sk_' (test: sk_test_, live: sk_live_)`);
    }
    if (envVar === 'VITE_STRIPE_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
      warnings.push(`${envVar} should start with 'pk_' (test: pk_test_, live: pk_live_)`);
    }
    if (envVar === 'STRIPE_WEBHOOK_SECRET' && !value.startsWith('whsec_')) {
      warnings.push(`${envVar} should start with 'whsec_'`);
    }
  }
});

// Check optional environment variables
console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (!value) {
    console.log(`  ⚠️  ${envVar}: NOT SET (using default)`);
  } else {
    console.log(`  ✅ ${envVar}: ${value}`);
  }
});

// Display warnings
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach((warning) => {
    console.log(`  • ${warning}`);
  });
}

// Summary
console.log('\n' + '='.repeat(50));
if (allConfigured) {
  console.log('✅ All required Stripe environment variables are configured!');
  console.log('\n📚 Next Steps:');
  console.log('  1. Claim your Stripe sandbox if you haven\'t already');
  console.log('  2. Set up webhooks in Stripe Dashboard → Developers → Webhooks');
  console.log('  3. Run: node seed-db.mjs (to create test data)');
  console.log('  4. Test checkout at: /creator/lady-nocturna');
  console.log('  5. Use test card: 4242 4242 4242 4242');
  process.exit(0);
} else {
  console.log('❌ Missing required Stripe environment variables!');
  console.log('\n📚 Setup Instructions:');
  console.log('  1. Go to https://dashboard.stripe.com');
  console.log('  2. Navigate to Developers → API Keys');
  console.log('  3. Copy your Secret Key and Publishable Key');
  console.log('  4. Add these to your project settings');
  console.log('  5. For webhooks, go to Developers → Webhooks');
  console.log('  6. Create endpoint for: /api/stripe/webhook');
  console.log('  7. Copy the Signing Secret');
  process.exit(1);
}
