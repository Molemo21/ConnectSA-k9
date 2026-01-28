// Paystack Configuration for Test vs Production Mode

export const PAYSTACK_CONFIG = {
  // Environment detection
  isTestMode: process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true',
  
  // Test mode settings
  test: {
    baseUrl: 'https://api.paystack.co',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
    
    // Test bank codes (Paystack test environment)
    supportedBanks: [
      { code: '044', name: 'ABSA Bank' },
      { code: '632005', name: 'Access Bank' },
      { code: '431150', name: 'African Bank' },
      { code: '198765', name: 'Bank of Athens' },
      { code: '462005', name: 'Bidvest Bank' },
      { code: '470010', name: 'Capitec Bank' },
      { code: '198765', name: 'Citibank' },
      { code: '198765', name: 'FNB Bank' },
      { code: '580105', name: 'Grindrod Bank' },
      { code: '198765', name: 'HSBC Bank' },
      { code: '198765', name: 'Investec Bank' },
      { code: '198765', name: 'Nedbank' },
      { code: '198765', name: 'Postbank' },
      { code: '198765', name: 'Rand Merchant Bank' },
      { code: '198765', name: 'Sasfin Bank' },
      { code: '198765', name: 'Standard Bank' },
      { code: '198765', name: 'TymeBank' },
      { code: '198765', name: 'Ubank' },
      { code: '198765', name: 'VBS Mutual Bank' },
    ],
    
    // Test account details for demo purposes
    testAccounts: {
      provider: {
        bankCode: '044',
        accountNumber: '1234567890',
        accountName: 'Test Provider Account',
      },
      client: {
        bankCode: '470010',
        accountNumber: '0987654321',
        accountName: 'Test Client Account',
      }
    }
  },
  
  // Production mode settings
  production: {
    baseUrl: 'https://api.paystack.co',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
    
    // Production bank codes (actual Paystack production)
    // NOTE: "470010" (Capitec) removed - it's invalid according to Paystack API
    // This list is only used as fallback if Paystack API is unavailable
    supportedBanks: [
      { code: '044', name: 'ABSA Bank' },
      { code: '632005', name: 'Access Bank' },
      { code: '431150', name: 'African Bank' },
      { code: '198765', name: 'Bank of Athens' },
      { code: '462005', name: 'Bidvest Bank' },
      // { code: '470010', name: 'Capitec Bank' }, // REMOVED - Invalid code according to Paystack
      { code: '198765', name: 'Citibank' },
      { code: '198765', name: 'FNB Bank' },
      { code: '580105', name: 'Grindrod Bank' },
      { code: '198765', name: 'HSBC Bank' },
      { code: '198765', name: 'Investec Bank' },
      { code: '198765', name: 'Nedbank' },
      { code: '198765', name: 'Postbank' },
      { code: '198765', name: 'Rand Merchant Bank' },
      { code: '198765', name: 'Sasfin Bank' },
      { code: '198765', name: 'Standard Bank' },
      { code: '198765', name: 'TymeBank' },
      { code: '198765', name: 'Ubank' },
      { code: '198765', name: 'VBS Mutual Bank' },
    ]
  }
};

// Helper functions
export const getCurrentConfig = () => {
  return PAYSTACK_CONFIG.isTestMode ? PAYSTACK_CONFIG.test : PAYSTACK_CONFIG.production;
};

export const isTestMode = () => PAYSTACK_CONFIG.isTestMode;

export const getSupportedBanks = () => {
  return getCurrentConfig().supportedBanks;
};

export const getTestAccount = (type: 'provider' | 'client') => {
  if (!isTestMode()) {
    throw new Error('Test accounts are only available in test mode');
  }
  return PAYSTACK_CONFIG.test.testAccounts[type];
};

// Validation helpers
export const validateBankCode = (bankCode: string): boolean => {
  const banks = getSupportedBanks();
  return banks.some(bank => bank.code === bankCode);
};

export const validateAccountNumber = (accountNumber: string): boolean => {
  return /^\d{6,17}$/.test(accountNumber);
};

// Test mode indicators
export const getTestModeIndicator = () => {
  if (isTestMode()) {
    return {
      isTest: true,
      message: 'Test Mode Active',
      description: 'You are currently using Paystack test credentials. No real money will be transferred.',
      color: 'warning' as const,
    };
  }
  
  return {
    isTest: false,
    message: 'Production Mode',
    description: 'You are using Paystack production credentials. Real money transfers will occur.',
    color: 'success' as const,
  };
};
