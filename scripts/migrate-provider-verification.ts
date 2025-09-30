#!/usr/bin/env node

/**
 * Provider Verification Migration Script
 * 
 * This script:
 * 1. Adds verification fields to the providers table
 * 2. Updates existing providers based on their current status
 * 3. Fixes the verification status for approved providers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateProviderVerification() {
  console.log('🔄 Starting Provider Verification Migration...')

  try {
    // Step 1: Add verification fields (if not already added)
    console.log('📝 Adding verification fields to providers table...')
    
    // This would normally be done via Prisma migration, but we'll handle it manually
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        -- Add verification status enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationStatus') THEN
          CREATE TYPE "VerificationStatus" AS ENUM (
            'PENDING',
            'VERIFIED', 
            'REJECTED',
            'EXPIRED'
          );
        END IF;
        
        -- Add verification fields if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'verificationStatus') THEN
          ALTER TABLE "providers" ADD COLUMN "verificationStatus" "VerificationStatus" DEFAULT 'PENDING';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'verificationDocuments') THEN
          ALTER TABLE "providers" ADD COLUMN "verificationDocuments" JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'phoneVerified') THEN
          ALTER TABLE "providers" ADD COLUMN "phoneVerified" BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'emailVerified') THEN
          ALTER TABLE "providers" ADD COLUMN "emailVerified" BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'addressVerified') THEN
          ALTER TABLE "providers" ADD COLUMN "addressVerified" BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'verifiedAt') THEN
          ALTER TABLE "providers" ADD COLUMN "verifiedAt" TIMESTAMP(3);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'verificationNotes') THEN
          ALTER TABLE "providers" ADD COLUMN "verificationNotes" TEXT;
        END IF;
      END $$;
    `

    console.log('✅ Verification fields added successfully')

    // Step 2: Update existing providers based on their current status
    console.log('🔄 Updating existing providers verification status...')

    const providers = await prisma.provider.findMany({
      include: {
        user: true
      }
    })

    console.log(`📊 Found ${providers.length} providers to update`)

    for (const provider of providers) {
      let verificationStatus = 'PENDING'
      let emailVerified = false
      let verifiedAt = null

      // Determine verification status based on current status
      switch (provider.status) {
        case 'APPROVED':
          verificationStatus = 'VERIFIED'
          emailVerified = true
          verifiedAt = provider.updatedAt
          break
        case 'REJECTED':
          verificationStatus = 'REJECTED'
          break
        case 'PENDING':
        case 'SUSPENDED':
          verificationStatus = 'PENDING'
          break
      }

      // Update provider with verification data
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          verificationStatus: verificationStatus as any,
          emailVerified,
          verifiedAt,
          verificationNotes: `Migrated from status: ${provider.status}`
        }
      })

      console.log(`✅ Updated ${provider.user.name} (${provider.businessName || 'N/A'}): ${provider.status} → ${verificationStatus}`)
    }

    // Step 3: Verify the migration
    console.log('🔍 Verifying migration results...')

    const verificationStats = await prisma.provider.groupBy({
      by: ['status', 'verificationStatus'],
      _count: {
        id: true
      }
    })

    console.log('📊 Migration Results:')
    console.log('Status → Verification Status: Count')
    console.log('-----------------------------------')
    
    verificationStats.forEach(stat => {
      console.log(`${stat.status} → ${stat.verificationStatus}: ${stat._count.id}`)
    })

    // Step 4: Show specific examples
    console.log('\n🎯 Specific Examples:')
    
    const approvedProviders = await prisma.provider.findMany({
      where: { status: 'APPROVED' },
      include: { user: true },
      take: 5
    })

    console.log('Approved Providers with Verification Status:')
    approvedProviders.forEach(provider => {
      console.log(`- ${provider.user.name} (${provider.businessName || 'N/A'}): ${provider.status} / ${provider.verificationStatus}`)
    })

    console.log('\n🎉 Provider Verification Migration Completed Successfully!')
    console.log('\n📋 Summary:')
    console.log('- Added verification fields to providers table')
    console.log('- Updated all existing providers with proper verification status')
    console.log('- Approved providers now show as VERIFIED')
    console.log('- Pending providers show as PENDING verification')
    console.log('- Rejected providers show as REJECTED verification')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
if (require.main === module) {
  migrateProviderVerification()
    .then(() => {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}

export { migrateProviderVerification }
