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
      return;
    }

    // Create WebhookEvents table
    console.log('📝 Creating WebhookEvents table...');
    
    await client.query(`
      CREATE TABLE webhook_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        event_type TEXT NOT NULL,
        paystack_ref TEXT,
        payload JSONB NOT NULL,
        processed BOOLEAN NOT NULL DEFAULT false,
        error TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    await client.query(`
      CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
      CREATE INDEX idx_webhook_events_paystack_ref ON webhook_events(paystack_ref);
      CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
      CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
      CREATE INDEX idx_webhook_events_paystack_ref_event_type ON webhook_events(paystack_ref, event_type);
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
      console.log('🎉 WebhookEvents table setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 WebhookEvents table setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createWebhookEventsTable };
