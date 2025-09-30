#!/usr/bin/env node

/**
 * Database Migration Script: Add Provider Verification Fields
 * 
 * This script adds the missing verification fields to the providers table
 * to fix the production database schema mismatch.
 */

const { PrismaClient } = require('@prisma/client')

async function migrateProviderVerification() {
  console.log('🔄 Running Provider Verification Migration...\n')

  const prisma = new PrismaClient()

  try {
    // Check if verificationStatus column already exists
    console.log('1️⃣ Checking if verification fields exist...')
    
    try {
      // Try to query the verificationStatus field
      await prisma.$queryRaw`SELECT verificationStatus FROM providers LIMIT 1`
      console.log('✅ verificationStatus field already exists')
    } catch (error) {
      if (error.message.includes('column "verificationStatus" does not exist')) {
        console.log('❌ verificationStatus field does not exist - needs migration')
        
        console.log('\n2️⃣ Adding verification fields to providers table...')
        
        // Add verificationStatus column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT DEFAULT 'PENDING'
        `
        
        // Add verificationDocuments column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "verificationDocuments" JSONB
        `
        
        // Add phoneVerified column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false
        `
        
        // Add emailVerified column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false
        `
        
        // Add addressVerified column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "addressVerified" BOOLEAN DEFAULT false
        `
        
        // Add verifiedAt column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP
        `
        
        // Add verificationNotes column
        await prisma.$executeRaw`
          ALTER TABLE providers 
          ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT
        `
        
        console.log('✅ All verification fields added successfully!')
        
        // Update existing providers with APPROVED status to have VERIFIED verificationStatus
        console.log('\n3️⃣ Updating existing provider verification statuses...')
        const updateResult = await prisma.$executeRaw`
          UPDATE providers 
          SET "verificationStatus" = 'VERIFIED' 
          WHERE status = 'APPROVED'
        `
        console.log(`✅ Updated ${updateResult} providers to VERIFIED status`)
        
      } else {
        console.error('❌ Unexpected error:', error.message)
      }
    }

    // Test the migration
    console.log('\n4️⃣ Testing migration...')
    const testProvider = await prisma.provider.findFirst({
      select: {
        id: true,
        status: true,
        verificationStatus: true,
        phoneVerified: true,
        emailVerified: true
      }
    })
    
    if (testProvider) {
      console.log('✅ Migration test successful!')
      console.log(`   Provider ID: ${testProvider.id}`)
      console.log(`   Status: ${testProvider.status}`)
      console.log(`   Verification Status: ${testProvider.verificationStatus}`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n🎉 Migration Complete!')
  console.log('\n💡 Next steps:')
  console.log('   1. Regenerate Prisma client: npx prisma generate')
  console.log('   2. Test the admin booking API')
  console.log('   3. Deploy the updated schema to production')
}

// Run the migration
migrateProviderVerification()
