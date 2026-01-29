import { transferEnabledBanksService } from './transfer-enabled-banks-service';

/**
 * Bank Validation Service
 * 
 * Validates bank codes against transfer-enabled banks (advisory check)
 * Provides hard failure handling for recipient creation and transfers
 * 
 * NOTE: Paystack metadata is advisory, not authoritative
 * Actual validation happens during recipient creation (hard failure)
 */
export class BankValidationService {
  /**
   * Validate bank code for transfer recipient creation (advisory check)
   * Uses transfer-enabled bank list (advisory metadata from Paystack)
   * 
   * NOTE: This is an advisory check. Hard validation happens during
   * actual recipient creation via Paystack API.
   */
  static async validateForTransfer(
    bankCode: string, 
    country: string = 'ZA'
  ): Promise<{
    valid: boolean;
    error?: string;
    bank?: { code: string; name: string };
    isAdvisory: boolean; // Indicates this is advisory, not authoritative
  }> {
    if (!bankCode) {
      return { 
        valid: false, 
        error: 'Bank code is required',
        isAdvisory: false 
      };
    }

    // Advisory check: Is bank in transfer-enabled list?
    const isEnabled = await transferEnabledBanksService.isTransferEnabled(bankCode, country);
    
    if (!isEnabled) {
      return {
        valid: false,
        error: `Bank code "${bankCode}" is not in the transfer-enabled list (advisory). This bank may not support transfer recipients. Please select a bank from the transfer-enabled list.`,
        isAdvisory: true,
      };
    }

    const bank = await transferEnabledBanksService.getTransferEnabledBank(bankCode, country);
    return {
      valid: true,
      bank: bank ? { code: bank.code, name: bank.name } : undefined,
      isAdvisory: true, // Advisory check, not authoritative
    };
  }

  /**
   * Get all transfer-enabled bank codes (advisory list)
   */
  static async getTransferEnabledCodes(country: string = 'ZA'): Promise<string[]> {
    const banks = await transferEnabledBanksService.getTransferEnabledBanks(country);
    return banks.map(bank => bank.code);
  }

  /**
   * Hard validation during recipient creation
   * This is the authoritative validation - Paystack API response
   * 
   * @param error - Error from Paystack createRecipient API
   * @returns Hard failure result with actionable error
   */
  static handleRecipientCreationFailure(error: unknown): {
    isHardFailure: boolean;
    error: string;
    details: string;
    recoverable: boolean;
    actionRequired?: string;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Hard failure: Invalid bank code (authoritative from Paystack)
    if (errorMessage.includes('invalid_bank_code') || 
        errorMessage.includes('Invalid bank code') ||
        errorMessage.includes('bank code')) {
      return {
        isHardFailure: true,
        error: 'Bank code rejected by payment provider',
        details: 'The bank code was rejected during recipient creation. This bank does not support transfers with the current payment provider.',
        recoverable: true,
        actionRequired: 'PROVIDER_UPDATE_BANK_DETAILS',
      };
    }

    // Hard failure: Invalid account number
    if (errorMessage.includes('invalid_account_number') ||
        errorMessage.includes('Invalid account number')) {
      return {
        isHardFailure: true,
        error: 'Invalid account number',
        details: 'The account number was rejected by the payment provider. Please verify the account number is correct.',
        recoverable: true,
        actionRequired: 'PROVIDER_UPDATE_BANK_DETAILS',
      };
    }

    // Hard failure: Invalid account name
    if (errorMessage.includes('invalid_account_name') ||
        errorMessage.includes('Invalid account name')) {
      return {
        isHardFailure: true,
        error: 'Invalid account name',
        details: 'The account name was rejected by the payment provider. Please ensure it matches exactly as it appears on the bank account.',
        recoverable: true,
        actionRequired: 'PROVIDER_UPDATE_BANK_DETAILS',
      };
    }

    // Hard failure: Provider API error
    if (errorMessage.includes('API error') || 
        errorMessage.includes('Request failed')) {
      return {
        isHardFailure: true,
        error: 'Payment provider API error',
        details: 'The payment provider rejected the request. This may be a temporary issue or a configuration problem.',
        recoverable: true,
        actionRequired: 'RETRY_OR_CONTACT_SUPPORT',
      };
    }

    // Unknown hard failure
    return {
      isHardFailure: true,
      error: 'Recipient creation failed',
      details: errorMessage,
      recoverable: false,
      actionRequired: 'CONTACT_SUPPORT',
    };
  }

  /**
   * Hard validation during transfer creation
   * This is the authoritative validation - Paystack API response
   */
  static handleTransferCreationFailure(error: unknown): {
    isHardFailure: boolean;
    error: string;
    details: string;
    recoverable: boolean;
    actionRequired?: string;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Hard failure: Insufficient funds
    if (errorMessage.includes('Insufficient funds') ||
        errorMessage.includes('insufficient')) {
      return {
        isHardFailure: true,
        error: 'Insufficient funds for transfer',
        details: 'The account does not have sufficient funds to complete the transfer.',
        recoverable: false,
        actionRequired: 'ADMIN_INTERVENTION',
      };
    }

    // Hard failure: Invalid recipient
    if (errorMessage.includes('Invalid recipient') ||
        errorMessage.includes('recipient')) {
      return {
        isHardFailure: true,
        error: 'Invalid transfer recipient',
        details: 'The recipient code is invalid or has been deleted. A new recipient must be created.',
        recoverable: true,
        actionRequired: 'RECREATE_RECIPIENT',
      };
    }

    // Hard failure: Transfer limit exceeded
    if (errorMessage.includes('limit') ||
        errorMessage.includes('exceeded')) {
      return {
        isHardFailure: true,
        error: 'Transfer limit exceeded',
        details: 'The transfer amount exceeds the allowed limit.',
        recoverable: false,
        actionRequired: 'ADMIN_INTERVENTION',
      };
    }

    // Hard failure: Provider API error
    if (errorMessage.includes('API error') || 
        errorMessage.includes('Request failed')) {
      return {
        isHardFailure: true,
        error: 'Payment provider API error',
        details: 'The payment provider rejected the transfer request. This may be a temporary issue.',
        recoverable: true,
        actionRequired: 'RETRY_TRANSFER',
      };
    }

    // Unknown hard failure
    return {
      isHardFailure: true,
      error: 'Transfer creation failed',
      details: errorMessage,
      recoverable: false,
      actionRequired: 'CONTACT_SUPPORT',
    };
  }
}
