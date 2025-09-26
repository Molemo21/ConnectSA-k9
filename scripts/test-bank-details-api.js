const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBankDetailsAPI() {
  try {
    console.log('🔍 Testing bank details API response...\n');

    // Get a provider with bank details
    const provider = await prisma.provider.findFirst({
      where: {
        bankName: { not: null },
        bankCode: { not: null },
        accountNumber: { not: null },
        accountName: { not: null }
      },
      select: {
        id: true,
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

    if (!provider) {
      console.log('❌ No provider with complete bank details found');
      return;
    }

    console.log(`📊 Testing with provider: ${provider.user.name} (${provider.user.email})`);
    console.log(`Provider ID: ${provider.id}\n`);

    // Simulate the API response structure
    const bankDetails = {
      bankName: provider.bankName,
      bankCode: provider.bankCode,
      accountNumber: provider.accountNumber,
      accountName: provider.accountName,
      recipientCode: provider.recipientCode
    };

    const hasBankDetails = !!(
      bankDetails.bankName && 
      bankDetails.bankCode && 
      bankDetails.accountNumber && 
      bankDetails.accountName &&
      bankDetails.bankName.trim() !== '' &&
      bankDetails.bankCode.trim() !== '' &&
      bankDetails.accountNumber.trim() !== '' &&
      bankDetails.accountName.trim() !== ''
    );

    const apiResponse = {
      hasBankDetails,
      bankDetails: hasBankDetails ? bankDetails : null
    };

    console.log('📤 API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n🔍 Testing BankDetailsForm props:');
    console.log('initialBankDetails:', apiResponse.bankDetails);
    console.log('Type of initialBankDetails:', typeof apiResponse.bankDetails);
    
    if (apiResponse.bankDetails) {
      console.log('Bank name:', apiResponse.bankDetails.bankName);
      console.log('Bank code:', apiResponse.bankDetails.bankCode);
      console.log('Account number:', apiResponse.bankDetails.accountNumber ? '****' + apiResponse.bankDetails.accountNumber.slice(-4) : 'Not set');
      console.log('Account name:', apiResponse.bankDetails.accountName);
    }

    // Test edge cases
    console.log('\n🧪 Testing edge cases:');
    
    // Test with null bankDetails
    const nullResponse = { hasBankDetails: false, bankDetails: null };
    console.log('Null response:', nullResponse);
    
    // Test with undefined bankDetails
    const undefinedResponse = { hasBankDetails: false, bankDetails: undefined };
    console.log('Undefined response:', undefinedResponse);

  } catch (error) {
    console.error('❌ Error testing bank details API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBankDetailsAPI();
