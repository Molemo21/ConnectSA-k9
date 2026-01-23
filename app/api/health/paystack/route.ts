import { NextResponse } from 'next/server';
import { validatePaystackKeyConsistency } from '@/lib/env-validation';

/**
 * Health check endpoint for Paystack configuration
 * 
 * Returns information about Paystack keys configuration without exposing sensitive data.
 * Useful for verifying which keys are active (test vs live) and configuration status.
 * 
 * GET /api/health/paystack
 */
export async function GET() {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    const testMode = process.env.PAYSTACK_TEST_MODE === 'true';
    const nodeEnv = process.env.NODE_ENV;
    const webhookUrl = process.env.PAYSTACK_WEBHOOK_URL;

    // Validate key consistency
    const validation = validatePaystackKeyConsistency();

    // Determine key types (without exposing full keys)
    let keyInfo: {
      secretKeyType: 'test' | 'live' | 'invalid' | 'missing';
      publicKeyType: 'test' | 'live' | 'invalid' | 'missing';
      secretKeyPrefix: string;
      publicKeyPrefix: string;
    } = {
      secretKeyType: 'missing',
      publicKeyType: 'missing',
      secretKeyPrefix: 'N/A',
      publicKeyPrefix: 'N/A',
    };

    if (secretKey) {
      if (secretKey.startsWith('sk_test_')) {
        keyInfo.secretKeyType = 'test';
        keyInfo.secretKeyPrefix = secretKey.substring(0, 12) + '...';
      } else if (secretKey.startsWith('sk_live_')) {
        keyInfo.secretKeyType = 'live';
        keyInfo.secretKeyPrefix = secretKey.substring(0, 12) + '...';
      } else {
        keyInfo.secretKeyType = 'invalid';
        keyInfo.secretKeyPrefix = 'Invalid format';
      }
    }

    if (publicKey) {
      if (publicKey.startsWith('pk_test_')) {
        keyInfo.publicKeyType = 'test';
        keyInfo.publicKeyPrefix = publicKey.substring(0, 12) + '...';
      } else if (publicKey.startsWith('pk_live_')) {
        keyInfo.publicKeyType = 'live';
        keyInfo.publicKeyPrefix = publicKey.substring(0, 12) + '...';
      } else {
        keyInfo.publicKeyType = 'invalid';
        keyInfo.publicKeyPrefix = 'Invalid format';
      }
    }

    // Determine configuration status
    const keysMatch = keyInfo.secretKeyType === keyInfo.publicKeyType || 
                     (keyInfo.secretKeyType === 'test' && keyInfo.publicKeyType === 'test') ||
                     (keyInfo.secretKeyType === 'live' && keyInfo.publicKeyType === 'live');
    
    const isProduction = nodeEnv === 'production';
    const isTestKey = keyInfo.secretKeyType === 'test';
    const isLiveKey = keyInfo.secretKeyType === 'live';
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let statusMessage = 'Paystack configuration is valid';

    if (!validation.valid) {
      status = 'error';
      statusMessage = 'Paystack key configuration has errors';
    } else if (isProduction && isTestKey) {
      status = 'warning';
      statusMessage = 'Production environment is using TEST keys (should use LIVE keys)';
    } else if (!isProduction && isLiveKey) {
      status = 'warning';
      statusMessage = 'Development environment is using LIVE keys (should use TEST keys)';
    } else if (!keysMatch) {
      status = 'error';
      statusMessage = 'Secret and public keys do not match (one is test, one is live)';
    }

    const response = {
      status,
      message: statusMessage,
      environment: nodeEnv,
      configuration: {
        secretKeyType: keyInfo.secretKeyType,
        publicKeyType: keyInfo.publicKeyType,
        secretKeyPrefix: keyInfo.secretKeyPrefix,
        publicKeyPrefix: keyInfo.publicKeyPrefix,
        testModeFlag: testMode,
        webhookUrl: webhookUrl || 'Not configured',
        keysConfigured: !!(secretKey && publicKey),
        keysMatch,
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      recommendations: [] as string[],
    };

    // Add recommendations
    if (isProduction && isTestKey) {
      response.recommendations.push('Switch to LIVE keys (sk_live_..., pk_live_...) for production');
      response.recommendations.push('Set PAYSTACK_TEST_MODE=false');
    } else if (!isProduction && isLiveKey) {
      response.recommendations.push('Switch to TEST keys (sk_test_..., pk_test_...) for development');
      response.recommendations.push('Set PAYSTACK_TEST_MODE=true');
    }

    if (!keysMatch) {
      response.recommendations.push('Ensure secret and public keys are both test or both live');
    }

    if (!webhookUrl) {
      response.recommendations.push('Configure PAYSTACK_WEBHOOK_URL for webhook processing');
    }

    return NextResponse.json(response, {
      status: status === 'error' ? 500 : status === 'warning' ? 200 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check Paystack configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
