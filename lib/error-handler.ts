import { NextResponse } from "next/server"

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Error handler function
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: 'Authentication failed', message: error.message },
      { status: 401 }
    )
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: 'Validation failed', message: error.message },
      { status: 400 }
    )
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { error: 'Database error', message: error.message },
      { status: 500 }
    )
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', message: error.message },
      { status: 429 }
    )
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'Duplicate entry', message: 'This record already exists' },
          { status: 409 }
        )
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found', message: 'The requested record was not found' },
          { status: 404 }
        )
      case 'P2003':
        return NextResponse.json(
          { error: 'Foreign key constraint', message: 'Related record not found' },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          { error: 'Database error', message: 'An unexpected database error occurred' },
          { status: 500 }
        )
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'errors' in error) {
    const zodError = error as any
    return NextResponse.json(
      { error: 'Validation failed', details: zodError.errors },
      { status: 400 }
    )
  }

  // Default error response
  return NextResponse.json(
    { error: 'Internal server error', message: 'Something went wrong' },
    { status: 500 }
  )
}

// Helper function to create error responses
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { error: 'Error', message },
    { status }
  )
}

// Helper function to create success responses
export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  })
} 