import { z } from 'zod';
import Paystack from 'paystack-sdk';

// Environment variables validation - only validate at runtime, not during build
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
    source: z.string().nullable().optional(), // Allow null values
    amount_settled: z.number().optional(),
    customer: z.object({
      id: z.number(),
      first_name: z.string().nullable().optional(), // Allow null values
      last_name: z.string().nullable().optional(), // Allow null values
      email: z.string(),
      customer_code: z.string(),
      phone: z.string().nullable().optional(), // Allow null values
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
    updated_at: z.string().optional(), // Make this optional since Paystack sometimes doesn't provide it
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

// Paystack API client
class PaystackClient {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    // Skip initialization during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      this.secretKey = 'dummy-key';
      this.publicKey = 'dummy-key';
      return;
    }
    
    validateEnvVars();
    this.secretKey = requiredEnvVars.PAYSTACK_SECRET_KEY!;
    this.publicKey = requiredEnvVars.PAYSTACK_PUBLIC_KEY!;
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
  }

  // Initialize payment transaction
  async initializePayment(params: {
    amount: number;
    email: string;
    reference: string;
    callback_url: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackPaymentResponse> {
    const response = await paystack.transaction.initialize({
      amount: params.amount * 100, // Convert to kobo
      email: params.email,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
      currency: 'ZAR',
    });

    return PaystackPaymentResponseSchema.parse(response);
  }

  // Verify payment transaction
  async verifyPayment(reference: string): Promise<PaystackChargeResponse> {
    const response = await paystack.transaction.verify(reference);

    return PaystackChargeResponseSchema.parse(response);
  }

  // Create transfer to provider (payout)
  async createTransfer(params: {
    source: 'balance';
    amount: number;
    recipient: string;
    reason: string;
    reference: string;
  }): Promise<PaystackTransferResponse> {
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

    return PaystackTransferResponseSchema.parse(response);
  }

  // Create recipient for provider
  async createRecipient(params: {
    type: 'nuban';
    name: string;
    account_number: string;
    bank_code: string;
  }): Promise<any> {
    return this.makeRequest('/transferrecipient', 'POST', params);
  }

  // Process refund
  async processRefund(params: {
    transaction: string;
    amount: number;
    reason?: string;
  }): Promise<PaystackRefundResponse> {
    const response = await this.makeRequest<PaystackRefundResponse>(
      '/refund',
      'POST',
      {
        transaction: params.transaction,
        amount: params.amount * 100, // Convert to kobo
        reason: params.reason || 'Customer request',
      }
    );

    return PaystackRefundResponseSchema.parse(response);
  }

  // Get public key for frontend
  getPublicKey(): string {
    return this.publicKey;
  }
}

// Export singleton instance
export const paystackClient = new PaystackClient();

// Utility functions for payment processing
export class PaymentProcessor {
  private paystack: PaystackClient;

  constructor() {
    this.paystack = paystackClient;
  }

  // Calculate platform fee and escrow amounts
  calculatePaymentBreakdown(serviceAmount: number, platformFeePercentage: number = 0.1) {
    const platformFee = serviceAmount * platformFeePercentage;
    const escrowAmount = serviceAmount - platformFee;
    const totalAmount = serviceAmount;

    return {
      serviceAmount,
      platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
      escrowAmount: Math.round(escrowAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  // Generate unique reference for Paystack
  generateReference(prefix: string = 'CS'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  // Validate Paystack webhook signature
  validateWebhookSignature(payload: string, signature: string): boolean {
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
    
    return hash === signature;
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
