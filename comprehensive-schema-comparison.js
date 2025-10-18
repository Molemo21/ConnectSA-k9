/**
 * Comprehensive Database Schema Comparison Tool
 * 
 * This script compares the local Prisma schema with the production database
 * to identify any synchronization issues using best practices.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Create Prisma client with production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
    }
  },
  log: ['error'],
  errorFormat: 'pretty'
});

// Read local Prisma schema
function readLocalSchema() {
  try {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return schemaContent;
  } catch (error) {
    console.error('❌ Error reading local schema:', error.message);
    return null;
  }
}

// Parse Prisma schema to extract model information
function parsePrismaSchema(schemaContent) {
  const models = {};
  const enums = {};
  
  // Extract enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const enumName = enumMatch[1];
    const enumBody = enumMatch[2];
    const values = enumBody.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.replace(/\s+/g, ' ').trim());
    
    enums[enumName] = values;
  }
  
  // Extract models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let modelMatch;
  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];
    
    const fields = {};
    const fieldLines = modelBody.split('\n');
    
    for (const line of fieldLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('@@')) {
        const fieldMatch = trimmedLine.match(/^(\w+)\s+([^@]+?)(?:\s+@map\("([^"]+)"\))?(?:\s+@unique)?(?:\s+@id)?(?:\s+@default\([^)]+\))?/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2].trim();
          const mappedName = fieldMatch[3];
          
          fields[fieldName] = {
            type: fieldType,
            mappedName: mappedName || fieldName,
            isUnique: trimmedLine.includes('@unique'),
            isId: trimmedLine.includes('@id'),
            hasDefault: trimmedLine.includes('@default')
          };
        }
      }
    }
    
    models[modelName] = fields;
  }
  
  return { models, enums };
}

async function getProductionSchema() {
  try {
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const productionSchema = {
      tables: {},
      enums: {}
    };
    
    // Get table structures
    for (const table of tables) {
      const tableName = table.table_name;
      
      const columns = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      productionSchema.tables[tableName] = columns;
    }
    
    // Get all enums
    const enumTypes = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typtype = 'e'
      ORDER BY t.typname, e.enumsortorder
    `;
    
    for (const enumType of enumTypes) {
      if (!productionSchema.enums[enumType.enum_name]) {
        productionSchema.enums[enumType.enum_name] = [];
      }
      productionSchema.enums[enumType.enum_name].push(enumType.enum_value);
    }
    
    return productionSchema;
  } catch (error) {
    console.error('❌ Error getting production schema:', error.message);
    return null;
  }
}

async function compareSchemas() {
  console.log('🔍 Comprehensive Database Schema Comparison');
  console.log('============================================');
  
  try {
    // Step 1: Read local schema
    console.log('📋 Step 1: Reading local Prisma schema...');
    const localSchemaContent = readLocalSchema();
    if (!localSchemaContent) {
      console.log('❌ Failed to read local schema');
      return;
    }
    
    const localSchema = parsePrismaSchema(localSchemaContent);
    console.log(`✅ Parsed ${Object.keys(localSchema.models).length} models and ${Object.keys(localSchema.enums).length} enums from local schema`);
    
    // Step 2: Get production schema
    console.log('\n📋 Step 2: Getting production database schema...');
    const productionSchema = await getProductionSchema();
    if (!productionSchema) {
      console.log('❌ Failed to get production schema');
      return;
    }
    
    console.log(`✅ Found ${Object.keys(productionSchema.tables).length} tables and ${Object.keys(productionSchema.enums).length} enums in production`);
    
    // Step 3: Compare enums
    console.log('\n📋 Step 3: Comparing enum values...');
    const enumDiscrepancies = [];
    
    for (const [enumName, localValues] of Object.entries(localSchema.enums)) {
      const productionValues = productionSchema.enums[enumName] || [];
      
      const missingInProduction = localValues.filter(val => !productionValues.includes(val));
      const extraInProduction = productionValues.filter(val => !localValues.includes(val));
      
      if (missingInProduction.length > 0 || extraInProduction.length > 0) {
        enumDiscrepancies.push({
          enumName,
          missingInProduction,
          extraInProduction,
          localValues,
          productionValues
        });
      }
    }
    
    // Check for enums in production that don't exist locally
    for (const [enumName, productionValues] of Object.entries(productionSchema.enums)) {
      if (!localSchema.enums[enumName]) {
        enumDiscrepancies.push({
          enumName,
          missingInProduction: [],
          extraInProduction: productionValues,
          localValues: [],
          productionValues
        });
      }
    }
    
    // Step 4: Compare table structures
    console.log('\n📋 Step 4: Comparing table structures...');
    const tableDiscrepancies = [];
    
    for (const [modelName, localFields] of Object.entries(localSchema.models)) {
      // Convert model name to table name (usually lowercase with underscores)
      const tableName = modelName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      
      const productionColumns = productionSchema.tables[tableName] || [];
      const productionColumnNames = productionColumns.map(col => col.column_name);
      
      const missingInProduction = [];
      const extraInProduction = [];
      const typeMismatches = [];
      
      // Check for missing columns
      for (const [fieldName, fieldInfo] of Object.entries(localFields)) {
        const dbColumnName = fieldInfo.mappedName;
        if (!productionColumnNames.includes(dbColumnName)) {
          missingInProduction.push({
            fieldName,
            dbColumnName,
            type: fieldInfo.type
          });
        }
      }
      
      // Check for extra columns
      for (const column of productionColumns) {
        const fieldExists = Object.values(localFields).some(field => field.mappedName === column.column_name);
        if (!fieldExists) {
          extraInProduction.push({
            columnName: column.column_name,
            dataType: column.data_type
          });
        }
      }
      
      if (missingInProduction.length > 0 || extraInProduction.length > 0) {
        tableDiscrepancies.push({
          modelName,
          tableName,
          missingInProduction,
          extraInProduction,
          typeMismatches
        });
      }
    }
    
    // Check for tables in production that don't exist locally
    for (const [tableName, columns] of Object.entries(productionSchema.tables)) {
      const modelExists = Object.keys(localSchema.models).some(modelName => {
        const expectedTableName = modelName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        return expectedTableName === tableName;
      });
      
      if (!modelExists) {
        tableDiscrepancies.push({
          modelName: null,
          tableName,
          missingInProduction: [],
          extraInProduction: columns.map(col => ({
            columnName: col.column_name,
            dataType: col.data_type
          })),
          typeMismatches: []
        });
      }
    }
    
    // Step 5: Generate comprehensive report
    console.log('\n📋 Step 5: Generating synchronization report...');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCHEMA SYNCHRONIZATION REPORT');
    console.log('='.repeat(60));
    
    // Enum discrepancies
    if (enumDiscrepancies.length === 0) {
      console.log('\n✅ ENUMS: All enums are synchronized');
    } else {
      console.log('\n❌ ENUM DISCREPANCIES FOUND:');
      enumDiscrepancies.forEach(discrepancy => {
        console.log(`\n🔍 Enum: ${discrepancy.enumName}`);
        if (discrepancy.missingInProduction.length > 0) {
          console.log(`   ❌ Missing in production: ${discrepancy.missingInProduction.join(', ')}`);
        }
        if (discrepancy.extraInProduction.length > 0) {
          console.log(`   ⚠️  Extra in production: ${discrepancy.extraInProduction.join(', ')}`);
        }
        console.log(`   📋 Local values: ${discrepancy.localValues.join(', ')}`);
        console.log(`   📋 Production values: ${discrepancy.productionValues.join(', ')}`);
      });
    }
    
    // Table discrepancies
    if (tableDiscrepancies.length === 0) {
      console.log('\n✅ TABLES: All tables are synchronized');
    } else {
      console.log('\n❌ TABLE DISCREPANCIES FOUND:');
      tableDiscrepancies.forEach(discrepancy => {
        console.log(`\n🔍 ${discrepancy.modelName ? `Model: ${discrepancy.modelName}` : 'Unknown Model'} (Table: ${discrepancy.tableName})`);
        
        if (discrepancy.missingInProduction.length > 0) {
          console.log('   ❌ Missing columns in production:');
          discrepancy.missingInProduction.forEach(field => {
            console.log(`      - ${field.fieldName} (${field.dbColumnName}) - ${field.type}`);
          });
        }
        
        if (discrepancy.extraInProduction.length > 0) {
          console.log('   ⚠️  Extra columns in production:');
          discrepancy.extraInProduction.forEach(column => {
            console.log(`      - ${column.columnName} - ${column.dataType}`);
          });
        }
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const totalIssues = enumDiscrepancies.length + tableDiscrepancies.length;
    
    if (totalIssues === 0) {
      console.log('🎉 PERFECT SYNCHRONIZATION: Local schema matches production database exactly!');
    } else {
      console.log(`⚠️  SYNCHRONIZATION ISSUES FOUND: ${totalIssues} discrepancies detected`);
      console.log(`   - Enum discrepancies: ${enumDiscrepancies.length}`);
      console.log(`   - Table discrepancies: ${tableDiscrepancies.length}`);
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      if (enumDiscrepancies.length > 0) {
        console.log('   1. Update production database enums to match local schema');
        console.log('   2. Or update local schema to match production enums');
      }
      if (tableDiscrepancies.length > 0) {
        console.log('   3. Update production database tables to match local schema');
        console.log('   4. Or update local schema to match production tables');
      }
      console.log('   5. Run `npx prisma db push` to sync schema changes');
      console.log('   6. Regenerate Prisma client with `npx prisma generate`');
    }
    
    console.log('\n📋 Detailed comparison completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema comparison failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comparison
compareSchemas().catch(console.error);
