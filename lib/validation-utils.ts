import { z } from 'zod'

// Booking validation schema
export const bookingSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  providerId: z.string(),
  serviceId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  scheduledDate: z.string().datetime(),
  totalAmount: z.number().min(0),
  address: z.string(),
  description: z.string().optional(),
  service: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string().optional(),
    basePrice: z.number().min(0).optional()
  }).nullable(),
  client: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    image: z.string().optional()
  }).nullable(),
  payment: z.object({
    id: z.string(),
    amount: z.number().min(0),
    status: z.string(),
    paystackRef: z.string().optional(),
    paidAt: z.string().datetime().optional(),
    authorizationUrl: z.string().optional()
  }).nullable(),
  review: z.object({
    id: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    createdAt: z.string().datetime()
  }).nullable()
})

export type ValidBooking = z.infer<typeof bookingSchema>

// Validate a single booking
export function validateBooking(booking: any): { 
  isValid: boolean; 
  booking?: ValidBooking; 
  errors?: z.ZodError 
} {
  try {
    const validatedBooking = bookingSchema.parse(booking)
    return { isValid: true, booking: validatedBooking }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error }
    }
    throw error
  }
}

// Validate an array of bookings
export function validateBookings(bookings: any[]): {
  validBookings: ValidBooking[];
  invalidBookings: { booking: any; errors: z.ZodError }[];
} {
  const validBookings: ValidBooking[] = []
  const invalidBookings: { booking: any; errors: z.ZodError }[] = []

  bookings.forEach(booking => {
    const result = validateBooking(booking)
    if (result.isValid && result.booking) {
      validBookings.push(result.booking)
    } else if (!result.isValid && result.errors) {
      invalidBookings.push({ booking, errors: result.errors })
    }
  })

  return { validBookings, invalidBookings }
}

// Fallback values for missing data
export const bookingFallbacks = {
  service: {
    name: 'Unknown Service',
    category: 'Uncategorized',
    description: 'No description available'
  },
  client: {
    name: 'Unknown Client',
    email: 'no-email@example.com'
  },
  payment: {
    amount: 0,
    status: 'UNKNOWN'
  }
}

// Apply fallbacks to missing data
export function applyBookingFallbacks(booking: any): any {
  return {
    ...booking,
    service: booking.service || bookingFallbacks.service,
    client: booking.client || bookingFallbacks.client,
    payment: booking.payment || bookingFallbacks.payment,
    totalAmount: booking.totalAmount || 0,
    status: booking.status || 'UNKNOWN',
    address: booking.address || 'No address provided',
    description: booking.description || 'No description available'
  }
}

// Error logging utility
export function logBookingError(error: any, context: string, booking?: any) {
  const timestamp = new Date().toISOString()
  const errorDetails = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    booking: booking ? {
      id: booking.id,
      status: booking.status,
      clientId: booking.clientId,
      providerId: booking.providerId,
      serviceId: booking.serviceId
    } : undefined
  }

  console.error('Booking Error:', errorDetails)
  
  // You could also send this to your error tracking service
  // await sendToErrorTracking(errorDetails)
  
  return errorDetails
}
