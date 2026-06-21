#!/usr/bin/env node

/**
 * Seed Database with Test Data
 * 
 * This script populates the database with test creator (Lady Nocturna) and membership tiers.
 * 
 * Usage: node seed-db.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seed() {
  let connection;
  try {
    console.log('🌱 Starting database seed...');

    // Parse DATABASE_URL (mysql://user:password@host:port/database)
    const url = new URL(DATABASE_URL);
    const user = url.username || 'root';
    const password = url.password || '';
    const host = url.hostname || 'localhost';
    const port = url.port ? parseInt(url.port) : 3306;
    const database = url.pathname?.slice(1) || 'only_fangs';

    console.log(`📡 Connecting to ${host}:${port}/${database}...`);

    // Create connection
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password: password || undefined,
      database,
      ssl: {},
    });

    // Create test user (creator)
    console.log('📝 Creating test user...');
    const [userResult] = await connection.execute(
      `INSERT INTO users (openId, name, email, displayName, role) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['test-creator-001', 'Lady Nocturna', 'lady@example.com', 'Lady Nocturna', 'user']
    );

    const userId = userResult.insertId || 1;
    console.log(`✅ User created with ID: ${userId}`);

    // Create creator profile
    console.log('🎨 Creating creator profile...');
    const [creatorResult] = await connection.execute(
      `INSERT INTO creators (userId, alias, handle, bio, category, verified, avatarUrl, coverUrl, totalFollowers, totalSubscribers, totalReleases, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE alias = VALUES(alias), verified = VALUES(verified), status = VALUES(status)`,
      [
        userId,
        'Lady Nocturna',
        'lady-nocturna',
        'Photographer specializing in gothic portraits and dark fashion. Every image is a ritual, every click an invocation.',
        'Gothic Photography',
        true,
        'https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/creator-1-k2JmN6sbHACKjF9wX7PShC.webp',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
        0,
        2847,
        156,
        'active'
      ]
    );

    const creatorId = creatorResult.insertId || 1;
    console.log(`✅ Creator profile created with ID: ${creatorId}`);

    // Create tiers
    console.log('💎 Creating membership tiers...');
    const tierData = [
      {
        creatorId,
        name: 'Initiate',
        slug: 'initiate',
        description: 'The first step beyond the veil. Exclusive content unlocked.',
        price: '9.90',
        currency: 'USD',
        perks: JSON.stringify([
          'All Mortal tier content',
          'Monthly exclusive posts',
          'Access to image gallery',
          'Community Discord',
        ]),
        sortOrder: 1,
      },
      {
        creatorId,
        name: 'Acolyte',
        slug: 'acolyte',
        description: 'Initiated into the mysteries. Access to the complete grimoire.',
        price: '24.90',
        currency: 'USD',
        perks: JSON.stringify([
          'All Initiate tier content',
          'Complete book library',
          'Exclusive music albums',
          'Monthly live sessions',
          'Credits mention',
        ]),
        featured: true,
        sortOrder: 2,
      },
      {
        creatorId,
        name: 'Immortal',
        slug: 'immortal',
        description: 'Beyond death. Eternal access and direct communion with the creator.',
        price: '59.90',
        currency: 'USD',
        perks: JSON.stringify([
          'All Acolyte tier content',
          'Exclusive content for Immortals',
          'Direct message with the creator',
          'Digitally signed prints',
          'Lifetime archive access',
          'Co-creation on special projects',
        ]),
        sortOrder: 3,
      },
    ];

    for (const tier of tierData) {
      await connection.execute(
        `INSERT INTO tiers (creatorId, name, slug, description, price, currency, perks, featured, sortOrder) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price)`,
        [
          tier.creatorId,
          tier.name,
          tier.slug,
          tier.description,
          tier.price,
          tier.currency,
          tier.perks,
          tier.featured ? 1 : 0,
          tier.sortOrder,
        ]
      );
    }

    console.log(`✅ ${tierData.length} tiers created`);

    console.log('\n✨ Seed completed successfully!');
    console.log(`
Test data created:
- Creator: Lady Nocturna (handle: lady-nocturna)
- Tiers: Initiate ($9.90), Acolyte ($24.90), Immortal ($59.90)

You can now test Stripe checkout by:
1. Going to /creator/lady-nocturna
2. Clicking "Subscribe Now" on a tier
3. Using test card: 4242 4242 4242 4242
    `);

    try {
      await connection.end();
    } catch {}
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message || error);
    try {
      if (connection) await connection.end();
    } catch {}
    process.exit(1);
  }
}

seed();
