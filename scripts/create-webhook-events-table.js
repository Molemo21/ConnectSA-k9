#!/usr/bin/env node

/**
 * Create WebhookEvents Table Script
 * 
 * This script creates the webhook_events table in your database
 * to store webhook events for audit and idempotency.
 * 
 * Usage: node scripts/create-webhook-events-table.js
 */

const { Client } = require('pg');

async function createWebhookEventsTable() {
  // Get the actual DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL with your database connection string');
    process.exit(1);
  }

  console.log('🔌 Using database URL:', databaseUrl.replace(/:[^:@]*@/, ':***@')); // Hide password in logs

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to Supabase PostgreSQL database');

    // Check if table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhook_events'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ WebhookEvents table already exists');
      
      // Check table structure
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'webhook_events'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Current table structure:');
      tableInfo.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });

      // Check if we need to add missing columns
      const existingColumns = tableInfo.rows.map(row => row.column_name);
      const requiredColumns = [
        'id', 'eventType', 'paystackRef', 'payload', 'processed', 
        'error', 'retryCount', 'createdAt', 'processedAt'
      ];

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns detected:', missingColumns);
        console.log('🔄 Adding missing columns...');
        
        for (const column of missingColumns) {
          try {
            let columnDefinition = '';
            switch (column) {
              case 'id':
                columnDefinition = 'ADD COLUMN "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text';
                break;
              case 'eventType':
                columnDefinition = 'ADD COLUMN "eventType" TEXT NOT NULL';
                break;
              case 'paystackRef':
                columnDefinition = 'ADD COLUMN "paystackRef" TEXT';
                break;
              case 'payload':
                columnDefinition = 'ADD COLUMN "payload" JSONB NOT NULL';
                break;
              case 'processed':
                columnDefinition = 'ADD COLUMN "processed" BOOLEAN NOT NULL DEFAULT false';
                break;
              case 'error':
                columnDefinition = 'ADD COLUMN "error" TEXT';
                break;
              case 'retryCount':
                columnDefinition = 'ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0';
                break;
              case 'createdAt':
                columnDefinition = 'ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()';
                break;
              case 'processedAt':
                columnDefinition = 'ADD COLUMN "processedAt" TIMESTAMP WITH TIME ZONE';
                break;
            }
            
            if (columnDefinition) {
              await client.query(`ALTER TABLE webhook_events ${columnDefinition}`);
              console.log(`  ✅ Added column: ${column}`);
            }
          } catch (addError) {
            console.log(`  ⚠️ Could not add column ${column}:`, addError.message);
          }
        }
      } else {
        console.log('✅ All required columns are present');
      }
      
      return;
    }

    // Create WebhookEvents table
    console.log('📝 Creating WebhookEvents table...');
    
    await client.query(`
      CREATE TABLE webhook_events (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "eventType" TEXT NOT NULL,
        "paystackRef" TEXT,
        "payload" JSONB NOT NULL,
        "processed" BOOLEAN NOT NULL DEFAULT false,
        "error" TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "processedAt" TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    await client.query(`
      CREATE INDEX idx_webhook_events_event_type ON webhook_events("eventType");
      CREATE INDEX idx_webhook_events_paystack_ref ON webhook_events("paystackRef");
      CREATE INDEX idx_webhook_events_processed ON webhook_events("processed");
      CREATE INDEX idx_webhook_events_created_at ON webhook_events("createdAt");
      CREATE INDEX idx_webhook_events_paystack_ref_event_type ON webhook_events("paystackRef", "eventType");
    `);

    console.log('✅ WebhookEvents table created successfully with indexes');

    // Verify table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'webhook_events'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Test inserting a sample record
    console.log('🧪 Testing table with sample record...');
    const testRecord = await client.query(`
      INSERT INTO webhook_events ("eventType", "paystackRef", "payload", "processed")
      VALUES ('test.event', 'test_ref_123', '{"test": "data"}', false)
      RETURNING "id", "eventType", "createdAt";
    `);
    
    console.log('✅ Test record inserted successfully:', testRecord.rows[0]);
    
    // Clean up test record
    await client.query(`DELETE FROM webhook_events WHERE "id" = $1`, [testRecord.rows[0].id]);
    console.log('🧹 Test record cleaned up');

  } catch (error) {
    console.error('❌ Error creating WebhookEvents table:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createWebhookEventsTable()
    .then(() => {
      console.log('\n🎉 WebhookEvents table setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your application to load the new table');
      console.log('2. Test the webhook endpoint: https://b5424031aff4.ngrok-free.app/api/webhooks/paystack');
      console.log('3. Make a test payment to verify webhook processing');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to create WebhookEvents table:', error);
      process.exit(1);
    });
}

module.exports = { createWebhookEventsTable };
