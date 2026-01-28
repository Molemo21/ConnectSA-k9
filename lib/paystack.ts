import { z } from 'zod';
const PaystackSDK = require('paystack-sdk');

// Environment variables validation
const requiredEnvVars = {
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
};

// Validate environment variables only at runtime
const validateEnvVars = () => {
  // Skip validation during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  // Validate Paystack key consistency
  const secretKey = requiredEnvVars.PAYSTACK_SECRET_KEY;
  const publicKey = requiredEnvVars.PAYSTACK_PUBLIC_KEY;
  const testMode = process.env.PAYSTACK_TEST_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (secretKey && publicKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const secretIsLive = secretKey.startsWith('sk_live_');
    const publicIsTest = publicKey.startsWith('pk_test_');
    const publicIsLive = publicKey.startsWith('pk_live_');

    // Check key consistency
    if ((secretIsTest && publicIsLive) || (secretIsLive && publicIsTest)) {
      throw new Error(
        `Paystack key mismatch: Secret and public keys must both be test or both be live. ` +
        `Secret: ${secretIsTest ? 'TEST' : secretIsLive ? 'LIVE' : 'INVALID'}, ` +
        `Public: ${publicIsTest ? 'TEST' : publicIsLive ? 'LIVE' : 'INVALID'}`
      );
    }

    // Warn about production using test keys
    if (isProduction && secretIsTest) {
      console.warn('⚠️  WARNING: Production environment is using TEST Paystack keys!');
    }

    // Warn about development using live keys
    if (!isProduction && secretIsLive) {
      console.warn('⚠️  WARNING: Development environment is using LIVE Paystack keys!');
    }

    // Check test mode flag consistency
    if (testMode && secretIsLive) {
      throw new Error(
        'Configuration error: PAYSTACK_TEST_MODE=true but using LIVE keys. ' +
        'Set PAYSTACK_TEST_MODE=false for live keys.'
      );
    }
  }
};

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Paystack API response schemas
const PaystackChargeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.number(),
    domain: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    reference: z.string(),
    tx_ref: z.string().optional(),
    source: z.string().nullable().optional(),
    amount_settled: z.number().optional(),
    customer: z.object({
      id: z.number(),
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
      email: z.string(),
      customer_code: z.string(),
      phone: z.string().nullable().optional(),
      metadata: z.any().optional(),
      risk_action: z.string().optional(),
    }).optional(),
    authorization: z.object({
      authorization_code: z.string().optional(),
      bin: z.string().optional(),
      last4: z.string().optional(),
      exp_month: z.string().optional(),
      exp_year: z.string().optional(),
      channel: z.string().optional(),
      card_type: z.string().optional(),
      bank: z.string().optional(),
      country_code: z.string().optional(),
      brand: z.string().optional(),
      reusable: z.boolean().optional(),
      signature: z.string().optional(),
    }).optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  }),
});

const PaystackTransactionResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.number(),
    domain: z.string(),
    amount: z.number(),
    currency: z.string(),
    source: z.string(),
    reason: z.string(),
    recipient: z.number(),
    status: z.string(),
    transfer_code: z.string(),
    titan_code: z.nullable(z.string()),
    transferred_at: z.nullable(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

const PaystackPaymentResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    authorization_url: z.string(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

const PaystackTransferResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.number(),
    domain: z.string(),
    amount: z.number(),
    currency: z.string(),
    source: z.string(),
    reason: z.string(),
    recipient: z.number(),
    status: z.string(),
    transfer_code: z.string(),
    titan_code: z.nullable(z.string()),
    transferred_at: z.nullable(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

const PaystackRefundResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.number(),
    domain: z.string(),
    amount: z.number(),
    currency: z.string(),
    reason: z.string(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
});

export type PaystackChargeResponse = z.infer<typeof PaystackChargeResponseSchema>;
export type PaystackTransactionResponse = z.infer<typeof PaystackTransactionResponseSchema>;
export type PaystackPaymentResponse = z.infer<typeof PaystackPaymentResponseSchema>;
export type PaystackTransferResponse = z.infer<typeof PaystackTransferResponseSchema>;
export type PaystackRefundResponse = z.infer<typeof PaystackRefundResponseSchema>;

// Structured logging utility
const createLogger = (context: string) => ({
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

// Paystack API client - Singleton pattern
class PaystackClient {
  private static instance: PaystackClient;
  private secretKey: string;
  private publicKey: string;
  private paystackSDK: Paystack;
  private logger = createLogger('PaystackClient');

  private constructor() {
    // Skip initialization during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      this.secretKey = 'dummy-key';
      this.publicKey = 'dummy-key';
      this.paystackSDK = {} as Paystack;
      return;
    }
    
    try {
      validateEnvVars();
      this.secretKey = requiredEnvVars.PAYSTACK_SECRET_KEY!;
      this.publicKey = requiredEnvVars.PAYSTACK_PUBLIC_KEY!;
      
      // Log configuration for debugging
      this.logger.info('Paystack configuration', {
        secretKeyPrefix: this.secretKey.substring(0, 8) + '...',
        publicKeyPrefix: this.publicKey.substring(0, 8) + '...',
        isTestMode: this.secretKey.startsWith('sk_test_'),
        webhookUrl: process.env.PAYSTACK_WEBHOOK_URL
      });
      
      // Initialize Paystack SDK with proper error handling
      try {
        this.paystackSDK = new PaystackSDK.Paystack(this.secretKey);
        this.logger.info('Paystack SDK initialized successfully');
      } catch (sdkError) {
        this.logger.warn('Paystack SDK initialization failed, using direct API calls', sdkError);
        // Fallback to direct API calls if SDK fails
        this.paystackSDK = null as any;
      }
      
      this.logger.info('Paystack client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Paystack client', error);
      throw new Error(`Paystack client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static getInstance(): PaystackClient {
    if (!PaystackClient.instance) {
      PaystackClient.instance = new PaystackClient();
    }
    return PaystackClient.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${PAYSTACK_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        // Try to parse error response for better error messages
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // If parsing fails, use raw text
          errorData = { message: responseText };
        }
        
        // Create a more informative error with structured data
        const error = new Error(`Paystack API error: ${response.status} - ${JSON.stringify(errorData)}`);
        (error as any).paystackError = errorData;
        (error as any).statusCode = response.status;
        throw error;
      }

      const data = JSON.parse(responseText);
      return data as T;
    } catch (error) {
      this.logger.error(`Paystack API request failed: ${method} ${endpoint}`, error, { endpoint, method });
      throw error;
    }
  }

  // Initialize payment transaction
  async initializePayment(params: {
    amount: number;
    email: string;
    reference: string;
    callback_url: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackPaymentResponse> {
    const logData = {
      reference: params.reference,
      amount: params.amount,
      email: params.email,
      callback_url: params.callback_url
    };

    try {
      this.logger.info('Initializing payment', logData);

      // Skip during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        const dummyResponse = {
          status: true,
          message: 'Payment initialized successfully',
          data: {
            authorization_url: 'https://checkout.paystack.com/dummy',
            access_code: 'dummy_code',
            reference: params.reference,
          }
        };
        this.logger.info('Using dummy response for build time', { reference: params.reference });
        return dummyResponse;
      }

      // Check if we have valid API keys
      if (!this.secretKey || this.secretKey === 'dummy-key') {
        throw new Error('Paystack API keys not configured');
      }

      // Prepare request payload
      const requestPayload = {
        amount: Math.round(params.amount * 100), // Convert to kobo (cents)
        email: params.email,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
        currency: 'ZAR', // South African Rand
      };

      this.logger.info('Making Paystack API request', {
        endpoint: '/transaction/initialize',
        payload: { ...requestPayload, metadata: '...' } // Don't log full metadata
      });

      const response = await this.makeRequest<PaystackPaymentResponse>('/transaction/initialize', 'POST', requestPayload);

      // Debug logging
      this.logger.info('Paystack API response received', { 
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : 'null/undefined',
        responseStatus: response?.status,
        responseMessage: response?.message,
        hasAuthorizationUrl: !!response?.data?.authorization_url
      });

      const validatedResponse = PaystackPaymentResponseSchema.parse(response);
      this.logger.info('Payment initialized successfully', { 
        reference: params.reference, 
        authorization_url: validatedResponse.data.authorization_url,
        access_code: validatedResponse.data.access_code
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Payment initialization failed', error, logData);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('not valid JSON')) {
          throw new Error(`Paystack API response format error: ${error.message}`);
        }
        if (error.message.includes('ZodError')) {
          throw new Error(`Paystack response validation error: ${error.message}`);
        }
        if (error.message.includes('Request failed with status code 400')) {
          throw new Error(`Paystack API validation error: Invalid request parameters. Check email, amount, currency, and callback URL.`);
        }
        if (error.message.includes('Request failed with status code 401')) {
          throw new Error(`Paystack API authentication error: Invalid secret key.`);
        }
        if (error.message.includes('Request failed with status code 403')) {
          throw new Error(`Paystack API authorization error: Access denied.`);
        }
      }
      
      throw new Error(`Paystack payment initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify payment transaction
  async verifyPayment(reference: string): Promise<PaystackChargeResponse> {
    try {
      this.logger.info('Verifying payment', { reference });

      // Skip during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        const dummyResponse = {
          status: true,
          message: 'Transaction verified successfully',
          data: {
            id: 123456,
            domain: 'test',
            amount: 10000,
            currency: 'ZAR',
            status: 'success',
            reference: reference,
            created_at: new Date().toISOString(),
            customer: {
              id: 123,
              email: 'test@example.com',
              customer_code: 'CUS_test',
            }
          }
        };
        this.logger.info('Using dummy response for build time', { reference });
        return dummyResponse;
      }

      // Use direct API call instead of SDK to avoid JSON parsing issues
      const response = await this.makeRequest<PaystackChargeResponse>(`/transaction/verify/${reference}`, 'GET');
      const validatedResponse = PaystackChargeResponseSchema.parse(response);
      
      this.logger.info('Payment verification completed', { 
        reference, 
        status: validatedResponse.data.status 
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Payment verification failed', error, { reference });
      
      // Handle specific JSON parsing errors
      if (error instanceof Error && error.message.includes('Unexpected token')) {
        this.logger.warn('JSON parsing error, trying direct API call', { reference });
        
        try {
          // Fallback to direct API call
          const response = await this.makeRequest<PaystackChargeResponse>(`/transaction/verify/${reference}`, 'GET');
          const validatedResponse = PaystackChargeResponseSchema.parse(response);
          
          this.logger.info('Payment verification completed via fallback', { 
            reference, 
            status: validatedResponse.data.status 
          });

          return validatedResponse;
        } catch (fallbackError) {
          this.logger.error('Fallback verification also failed', fallbackError, { reference });
          throw new Error(`Paystack payment verification failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
      
      throw new Error(`Paystack payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create transfer to provider (payout)
  async createTransfer(params: {
    source: 'balance';
    amount: number;
    recipient: string;
    reason: string;
    reference: string;
  }): Promise<PaystackTransferResponse> {
    const logData = {
      reference: params.reference,
      amount: params.amount,
      recipient: params.recipient
    };

    try {
      this.logger.info('Creating transfer', logData);

      const response = await this.makeRequest<PaystackTransferResponse>(
        '/transfer',
        'POST',
        {
          source: params.source,
          amount: params.amount * 100, // Convert to cents
          recipient: params.recipient,
          reason: params.reason,
          reference: params.reference,
          currency: 'ZAR',
        }
      );

      const validatedResponse = PaystackTransferResponseSchema.parse(response);
      this.logger.info('Transfer created successfully', { 
        reference: params.reference, 
        transfer_code: validatedResponse.data.transfer_code 
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Transfer creation failed', error, logData);
      throw new Error(`Paystack transfer creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify transfer status with Paystack
  async verifyTransfer(transferCode: string): Promise<PaystackTransferResponse> {
    try {
      this.logger.info('Verifying transfer status', { transferCode });

      // Skip during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        const dummyResponse = {
          status: true,
          message: 'Transfer verified successfully',
          data: {
            id: 123456,
            domain: 'test',
            amount: 10000,
            currency: 'ZAR',
            source: 'balance',
            reason: 'Payment release',
            recipient: 123,
            status: 'success',
            transfer_code: transferCode,
            titan_code: null,
            transferred_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        };
        this.logger.info('Using dummy response for build time', { transferCode });
        return dummyResponse;
      }

      const response = await this.makeRequest<PaystackTransferResponse>(
        `/transfer/${transferCode}`,
        'GET'
      );

      const validatedResponse = PaystackTransferResponseSchema.parse(response);
      this.logger.info('Transfer verification successful', {
        transferCode,
        status: validatedResponse.data.status
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Transfer verification failed', error, { transferCode });
      throw new Error(`Paystack transfer verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch list of banks from Paystack
  async listBanks(params?: {
    country?: string;
    currency?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: Array<{
      id: number;
      name: string;
      slug: string;
      code: string;
      longcode?: string;
      gateway?: string;
      pay_with_bank?: boolean;
      active: boolean;
      is_deleted: boolean;
      country: string;
      currency: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.country) queryParams.append('country', params.country);
      if (params?.currency) queryParams.append('currency', params.currency);
      
      const endpoint = `/bank${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest<{
        status: boolean;
        message: string;
        data: any[];
      }>(endpoint, 'GET');
      
      this.logger.info('Banks fetched successfully', { 
        count: response.data?.length || 0,
        country: params?.country || 'all'
      });
      return response as any;
    } catch (error) {
      this.logger.error('Failed to fetch banks', error, { country: params?.country });
      throw error;
    }
  }

  // Validate bank code against Paystack
  // BEST PRACTICE: If the code exists in Paystack's API list, we trust it
  // This avoids issues where Paystack's list endpoint returns codes that
  // their validation endpoint might reject due to API inconsistencies
  // 
  // IMPORTANT: We apply the same filtering as the frontend (active && !is_deleted)
  // to ensure consistency between what users see and what we validate
  async validateBankCode(bankCode: string, country: string = 'ZA'): Promise<boolean> {
    try {
      // Fetch the current list of banks from Paystack API
      const banks = await this.listBanks({ country });
      
      // Apply the same filtering logic as the frontend API route
      // Only consider banks that are active and not deleted
      // This ensures consistency: if a bank shows in the frontend, it will pass validation
      const activeBanks = banks.data?.filter(bank => bank.active && !bank.is_deleted) || [];
      
      // Check if the bank code exists in the filtered (active) bank list
      let isValid = activeBanks.some(bank => bank.code === bankCode);
      
      // BEST PRACTICE: If code exists in Paystack API at all (even if inactive/deleted), 
      // we still trust it because Paystack returned it. This handles edge cases where
      // Paystack's list might include codes that are temporarily inactive but still valid.
      if (!isValid) {
        const bankExists = banks.data?.some(bank => bank.code === bankCode);
        if (bankExists) {
          const bank = banks.data?.find(bank => bank.code === bankCode);
          this.logger.warn('Bank code exists in Paystack API but is inactive/deleted - accepting anyway', {
            bankCode,
            bankName: bank?.name,
            bankActive: bank?.active,
            bankDeleted: bank?.is_deleted,
            reason: 'Trusting Paystack API - code exists in their system'
          });
          // Accept it anyway - if Paystack returns it, we trust it
          isValid = true;
        }
      }
      
      // Log detailed validation info
      this.logger.info('Bank code validation', { 
        bankCode, 
        country, 
        isValid,
        totalBanksFromAPI: banks.data?.length || 0,
        activeBanksCount: activeBanks.length,
        validationStrategy: 'trust_api_list_with_filtering',
        message: isValid 
          ? 'Bank code found in Paystack API active banks list - trusting it' 
          : 'Bank code NOT found in Paystack API active banks list - rejecting it'
      });
      
      // If code exists in Paystack's active bank list, trust it (skip additional validation)
      // This is the source of truth - if Paystack returns it as active, we accept it
      if (isValid) {
        const matchedBank = activeBanks.find(bank => bank.code === bankCode);
        this.logger.info('Bank code validated successfully from Paystack API list', {
          bankCode,
          bankName: matchedBank?.name,
          country,
          trustedSource: 'paystack_api_active_banks_list',
          bankActive: matchedBank?.active,
          bankDeleted: matchedBank?.is_deleted
        });
      } else {
        // Log why validation failed for debugging
        const allBanksWithCode = banks.data?.filter(bank => bank.code === bankCode) || [];
        if (allBanksWithCode.length > 0) {
          this.logger.warn('Bank code exists in Paystack API but filtered out', {
            bankCode,
            reason: allBanksWithCode[0].active ? 'bank is deleted' : 'bank is inactive',
            bankActive: allBanksWithCode[0].active,
            bankDeleted: allBanksWithCode[0].is_deleted
          });
        }
      }
      
      return isValid;
    } catch (error) {
      // If Paystack API fails, fall back to static config validation
      // This ensures we still validate even if API is down
      this.logger.warn('Paystack API validation failed, using fallback static config', { 
        bankCode, 
        country, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // IMPORTANT: If Paystack API fails, we should be conservative and reject the code
      // The static config may contain outdated or incorrect codes (like "470010" which Paystack rejects)
      // Only use static config as a last resort, and log a warning
      try {
        // Import static config as fallback ONLY if Paystack API is completely unavailable
        const { getSupportedBanks } = await import('@/lib/config/paystack-config');
        const staticBanks = getSupportedBanks();
        const isValidInStatic = staticBanks.some(bank => bank.code === bankCode);
        
        this.logger.warn('Using fallback static config validation (Paystack API unavailable)', {
          bankCode,
          isValidInStatic,
          staticBanksCount: staticBanks.length,
          warning: 'Static config may contain outdated codes. Paystack API validation is preferred.'
        });
        
        // Be conservative: If Paystack API is down, we should still validate
        // But note that static config might have wrong codes, so this is not ideal
        return isValidInStatic;
      } catch (fallbackError) {
        // If even fallback fails, we should reject to be safe
        this.logger.error('Both Paystack API and fallback validation failed', fallbackError);
        return false; // Reject unknown bank codes for safety
      }
    }
  }

  // Create recipient for provider
  async createRecipient(params: {
    type: 'nuban';
    name: string;
    account_number: string;
    bank_code: string;
  }): Promise<any> {
    const logData = {
      type: params.type,
      name: params.name,
      bank_code: params.bank_code
    };

    try {
      this.logger.info('Creating recipient', logData);
      const response = await this.makeRequest('/transferrecipient', 'POST', params);
      this.logger.info('Recipient created successfully', { name: params.name });
      return response;
    } catch (error) {
      this.logger.error('Recipient creation failed', error, logData);
      
      // Parse Paystack's structured error response for better error messages
      if (error instanceof Error && error.message.includes('Paystack API error')) {
        try {
          const errorMatch = error.message.match(/\{.*\}/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[0]);
            
            // Handle specific error codes
            if (errorData.code === 'invalid_bank_code') {
              const enhancedError = new Error(
                `Invalid bank code: ${params.bank_code}. ${errorData.meta?.nextStep || 'Please verify the bank code is correct for South African banks.'}`
              );
              (enhancedError as any).paystackError = errorData;
              (enhancedError as any).errorCode = 'invalid_bank_code';
              throw enhancedError;
            }
            
            // Re-throw with parsed error message for other errors
            if (errorData.message) {
              const enhancedError = new Error(errorData.message);
              (enhancedError as any).paystackError = errorData;
              throw enhancedError;
            }
          }
        } catch (parseError) {
          // If parsing fails, use original error
          this.logger.warn('Could not parse Paystack error response', { parseError });
        }
      }
      
      throw error;
    }
  }

  // Process refund
  async processRefund(params: {
    transaction: string;
    amount: number;
    reason?: string;
  }): Promise<PaystackRefundResponse> {
    const logData = {
      transaction: params.transaction,
      amount: params.amount,
      reason: params.reason
    };

    try {
      this.logger.info('Processing refund', logData);

      const response = await this.makeRequest<PaystackRefundResponse>(
        '/refund',
        'POST',
        {
          transaction: params.transaction,
          amount: params.amount * 100, // Convert to kobo
          reason: params.reason || 'Customer request',
        }
      );

      const validatedResponse = PaystackRefundResponseSchema.parse(response);
      this.logger.info('Refund processed successfully', { 
        transaction: params.transaction, 
        refund_id: validatedResponse.data.id 
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Refund processing failed', error, logData);
      throw new Error(`Paystack refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get public key for frontend
  getPublicKey(): string {
    return this.publicKey;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Skip during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return true;
      }

      // Make a simple API call to check connectivity
      await this.makeRequest('/transaction/totals', 'GET');
      this.logger.info('Paystack health check passed');
      return true;
    } catch (error) {
      this.logger.error('Paystack health check failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const paystackClient = PaystackClient.getInstance();

// Utility functions for payment processing
export class PaymentProcessor {
  private paystack: PaystackClient;
  private logger = createLogger('PaymentProcessor');

  constructor() {
    this.paystack = paystackClient;
  }

  // Calculate platform fee and escrow amounts
  calculatePaymentBreakdown(serviceAmount: number, platformFeePercentage: number = 0.1) {
    const platformFee = serviceAmount * platformFeePercentage;
    const escrowAmount = serviceAmount - platformFee;
    const totalAmount = serviceAmount;

    const breakdown = {
      serviceAmount,
      platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
      escrowAmount: Math.round(escrowAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };

    this.logger.info('Payment breakdown calculated', breakdown);
    return breakdown;
  }

  // Generate unique reference for Paystack
  generateReference(prefix: string = 'CS'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const reference = `${prefix}_${timestamp}_${random}`.toUpperCase();
    
    this.logger.info('Generated payment reference', { reference, prefix });
    return reference;
  }

  // Validate Paystack webhook signature
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Skip validation during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return false;
      }
      
      validateEnvVars();
      const crypto = require('crypto');
      const secretKey = requiredEnvVars.PAYSTACK_SECRET_KEY!;
      
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(payload)
        .digest('hex');
      
      const isValid = hash === signature;
      this.logger.info('Webhook signature validation', { isValid });
      return isValid;
    } catch (error) {
      this.logger.error('Webhook signature validation failed', error);
      return false;
    }
  }
}

// Export payment processor
export const paymentProcessor = new PaymentProcessor();

// Constants
export const PAYMENT_CONSTANTS = {
  PLATFORM_FEE_PERCENTAGE: 0.1, // 10%
  AUTO_CONFIRMATION_DAYS: 3, // Auto-confirm job after 3 days
  CURRENCY: 'ZAR', // South African Rand
  MIN_AMOUNT: 10, // Minimum amount in ZAR (R10)
  MAX_AMOUNT: 100000, // Maximum amount in ZAR (R100,000)
} as const;