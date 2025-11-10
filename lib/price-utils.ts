/**
 * Price formatting utilities for booking displays
 * Handles both catalogue-based pricing (with currency) and legacy pricing (ZAR default)
 */

export interface BookingPriceData {
  bookedPrice?: number | null;
  bookedCurrency?: string | null;
  totalAmount: number;
}

/**
 * Formats a booking price for display
 * Uses bookedPrice + bookedCurrency for catalogue bookings (preserves selected price/currency)
 * Falls back to totalAmount with "R" prefix for legacy bookings
 * 
 * @param booking - Booking object with price fields
 * @returns Formatted price string (e.g., "ZAR 500.00" or "R500.00")
 * 
 * @example
 * // Catalogue booking
 * formatBookingPrice({ bookedPrice: 500, bookedCurrency: "ZAR", totalAmount: 500 })
 * // Returns: "ZAR 500.00"
 * 
 * // Legacy booking
 * formatBookingPrice({ totalAmount: 500 })
 * // Returns: "R500.00"
 */
export function formatBookingPrice(booking: BookingPriceData): string {
  // For catalogue bookings: use the exact price and currency that was selected
  if (booking.bookedPrice != null && booking.bookedCurrency) {
    return `${booking.bookedCurrency} ${booking.bookedPrice.toFixed(2)}`;
  }
  
  // For legacy bookings: use totalAmount with ZAR (default currency)
  return `R${booking.totalAmount.toFixed(2)}`;
}

/**
 * Gets the currency symbol for a booking
 * Returns the currency code for catalogue bookings, "R" for legacy bookings
 * 
 * @param booking - Booking object with price fields
 * @returns Currency symbol/code string
 */
export function getBookingCurrency(booking: BookingPriceData): string {
  if (booking.bookedCurrency) {
    return booking.bookedCurrency;
  }
  return "R"; // Default to ZAR for legacy bookings
}

/**
 * Gets the numeric price value for a booking
 * Returns bookedPrice for catalogue bookings, totalAmount for legacy bookings
 * 
 * @param booking - Booking object with price fields
 * @returns Numeric price value
 */
export function getBookingPriceValue(booking: BookingPriceData): number {
  if (booking.bookedPrice != null) {
    return booking.bookedPrice;
  }
  return booking.totalAmount;
}

