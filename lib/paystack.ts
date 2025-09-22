import { z } from 'zod';
import Paystack from 'paystack-sdk';

// Environment variables validation
const requiredEnvVars = {
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
};

// Validate environment variables only at runtime
const validateEnvVars = () => {
  // Skip validation during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return;
  }
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
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
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      this.secretKey = 'dummy-key';
      this.publicKey = 'dummy-key';
      this.paystackSDK = {} as Paystack;
      return;
    }
    
    try {
      validateEnvVars();
      this.secretKey = requiredEnvVars.PAYSTACK_SECRET_KEY!;
      this.publicKey = requiredEnvVars.PAYSTACK_PUBLIC_KEY!;
      
      // Initialize Paystack SDK
      this.paystackSDK = new Paystack(this.secretKey);
      
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Paystack API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
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
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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

      const response = await this.paystackSDK.transaction.initialize({
        amount: params.amount * 100, // Convert to kobo
        email: params.email,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
        currency: 'ZAR',
      });

      const validatedResponse = PaystackPaymentResponseSchema.parse(response);
      this.logger.info('Payment initialized successfully', { 
        reference: params.reference, 
        authorization_url: validatedResponse.data.authorization_url 
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Payment initialization failed', error, logData);
      throw new Error(`Paystack payment initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify payment transaction
  async verifyPayment(reference: string): Promise<PaystackChargeResponse> {
    try {
      this.logger.info('Verifying payment', { reference });

      // Skip during build time
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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

      const response = await this.paystackSDK.transaction.verify(reference);
      const validatedResponse = PaystackChargeResponseSchema.parse(response);
      
      this.logger.info('Payment verification completed', { 
        reference, 
        status: validatedResponse.data.status 
      });

      return validatedResponse;
    } catch (error) {
      this.logger.error('Payment verification failed', error, { reference });
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
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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