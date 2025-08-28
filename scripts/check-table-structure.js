#!/usr/bin/env node

/**
 * Check Table Structure Script
 * 
 * This script checks the actual structure of tables that were created
 * to understand the column names and fix any mismatches.
 * 
 * Usage: node scripts/check-table-structure.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableStructure() {
  console.log('🔍 Checking table structure...\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check what tables exist
    console.log('📋 Checking existing tables...\n');
    
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename IN ('job_proofs', 'payouts', 'disputes')
      ORDER BY tablename;
    `;
    
    console.log('📊 Found tables:', tables.map(t => t.tablename).join(', '));
    console.log('');

    // Check the structure of each table
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`🔍 Checking structure of ${tableName} table...`);
      
      try {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        
        console.log(`📋 Columns in ${tableName}:`);
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
        });
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error checking ${tableName}:`, error.message);
      }
    }

    // Check if there are any foreign key constraints
    console.log('🔗 Checking foreign key constraints...\n');
    
    for (const table of tables) {
      const tableName = table.tablename;
      try {
        const constraints = await prisma.$queryRaw`
          SELECT 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = ${tableName};
        `;
        
        if (constraints.length > 0) {
          console.log(`🔗 Foreign keys in ${tableName}:`);
          constraints.forEach(constraint => {
            console.log(`   - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
          });
        } else {
          console.log(`📝 No foreign key constraints found in ${tableName}`);
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error checking constraints for ${tableName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Error checking table structure:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkTableStructure();
}

module.exports = { checkTableStructure };
