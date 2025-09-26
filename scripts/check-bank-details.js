const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBankDetails() {
  try {
    console.log('🔍 Checking bank details in database...\n');

    // Get all providers with their bank details
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        userId: true,
        businessName: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        recipientCode: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${providers.length} providers in database\n`);

    if (providers.length === 0) {
      console.log('❌ No providers found in database');
      return;
    }

    // Check each provider's bank details
    providers.forEach((provider, index) => {
      console.log(`👤 Provider ${index + 1}:`);
      console.log(`   ID: ${provider.id}`);
      console.log(`   Name: ${provider.user.name}`);
      console.log(`   Email: ${provider.user.email}`);
      console.log(`   Business: ${provider.businessName || 'Not set'}`);
      console.log(`   Bank Name: ${provider.bankName || 'Not set'}`);
      console.log(`   Bank Code: ${provider.bankCode || 'Not set'}`);
      console.log(`   Account Number: ${provider.accountNumber ? '****' + provider.accountNumber.slice(-4) : 'Not set'}`);
      console.log(`   Account Name: ${provider.accountName || 'Not set'}`);
      console.log(`   Recipient Code: ${provider.recipientCode || 'Not set'}`);
      
      // Check completeness
      const hasCompleteDetails = provider.bankName && 
                                provider.bankCode && 
                                provider.accountNumber && 
                                provider.accountName;
      
      console.log(`   ✅ Complete Bank Details: ${hasCompleteDetails ? 'YES' : 'NO'}`);
      console.log('');
    });

    // Summary
    const completeProviders = providers.filter(p => 
      p.bankName && p.bankCode && p.accountNumber && p.accountName
    );
    
    console.log('📈 Summary:');
    console.log(`   Total Providers: ${providers.length}`);
    console.log(`   With Complete Bank Details: ${completeProviders.length}`);
    console.log(`   Missing Bank Details: ${providers.length - completeProviders.length}`);

    if (completeProviders.length > 0) {
      console.log('\n✅ Providers with complete bank details:');
      completeProviders.forEach(provider => {
        console.log(`   - ${provider.user.name} (${provider.user.email})`);
      });
    }

    if (providers.length - completeProviders.length > 0) {
      console.log('\n❌ Providers missing bank details:');
      providers.filter(p => !(p.bankName && p.bankCode && p.accountNumber && p.accountName))
        .forEach(provider => {
          console.log(`   - ${provider.user.name} (${provider.user.email})`);
        });
    }

  } catch (error) {
    console.error('❌ Error checking bank details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkBankDetails();