/**
 * Bank Code Mappings
 * 
 * Paystack's listBanks API returns codes that don't work with createRecipient API
 * for some banks. This mapping converts display codes to transfer-compatible codes.
 * 
 * IMPORTANT:
 * - Only add mappings for banks with KNOWN issues
 * - Test other banks before adding them to this mapping
 * - Document why each mapping exists
 * - This is a whitelist approach - we only fix what's broken
 * 
 * Usage:
 * - Frontend receives transfer-compatible codes from /api/paystack/banks
 * - Backend uses codes directly without conversion
 * - Single source of truth for code mappings
 */

export const BANK_CODE_MAPPINGS: Record<string, string> = {
  /**
   * Standard Bank
   * - listBanks API returns: "198774"
   * - createRecipient API requires: "051"
   * - Issue discovered: 2024 (Standard Bank transfers failing)
   */
  '198774': '051',
  
  // Add more mappings ONLY if we discover banks with the same issue
  // Format: 'displayCode': 'transferCode',
  // Example: '123456': '789012', // Bank Name: reason
};

/**
 * Get transfer-compatible code for a display code
 * 
 * @param displayCode - The code returned by Paystack's listBanks API
 * @returns The code that works with createRecipient API, or original code if no mapping exists
 */
export function getTransferCode(displayCode: string): string {
  return BANK_CODE_MAPPINGS[displayCode] || displayCode;
}

/**
 * Check if a code has a mapping
 * 
 * @param displayCode - The code to check
 * @returns True if a mapping exists, false otherwise
 */
export function hasMapping(displayCode: string): boolean {
  return displayCode in BANK_CODE_MAPPINGS;
}

/**
 * Get all mapped codes (for monitoring/debugging)
 * 
 * @returns Object with all mappings
 */
export function getAllMappings(): Record<string, string> {
  return { ...BANK_CODE_MAPPINGS };
}
