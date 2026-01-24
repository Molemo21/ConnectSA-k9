import { z } from "zod"

// Email validation schema
const emailSchema = z.string().email("Invalid email address")

// Password validation schema - Strong password requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => {
    // Strong password requirements
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
  }, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  })

// Phone validation schema - South African format
const phoneSchema = z.string()
  .regex(/^(0[1-9]\d{8}|\+27[1-9]\d{8})$/, "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)")

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['CLIENT', 'PROVIDER']).default('CLIENT'),
})

// Reset password schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
})

// New password schema
export const newPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

// Provider onboarding schema
export const providerOnboardingSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  experience: z.number()
    .min(0, 'Experience must be at least 0 years')
    .max(50, 'Experience must be less than 50 years'),
  hourlyRate: z.number()
    .min(50, 'Hourly rate must be at least R50')
    .max(10000, 'Hourly rate must be less than R10,000'),
  location: z.string()
    .min(5, 'Location must be at least 5 characters')
    .max(200, 'Location must be less than 200 characters'),
  services: z.array(z.string().cuid()).min(1, 'At least one service must be selected'),
  idDocument: z.string().url('Invalid document URL').optional(),
  proofOfAddress: z.string().url('Invalid document URL').optional(),
  certifications: z.array(z.string().url('Invalid certification URL')).optional(),
  profileImages: z.array(z.string().url('Invalid image URL')).optional(),
})

// Booking validation schemas
export const createBookingSchema = z.object({
  serviceId: z.string().cuid('Invalid service ID'),
  scheduledDate: z.string()
    .datetime('Invalid date format')
    .refine((date) => new Date(date) > new Date(), 'Scheduled date must be in the future'),
  duration: z.number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration must be less than 24 hours'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
})

// Review validation schemas
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string()
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
})

// Utility functions for validation
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Type exports for use in API routes
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type ReviewInput = z.infer<typeof reviewSchema> 