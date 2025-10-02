import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
});

// Rate limiting (simple in-memory store for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return addSecurityHeaders(NextResponse.json({ 
      message: 'Service temporarily unavailable during deployment' 
    }, { status: 503 }));
  }

  // Import modules with error handling
  let db, generateSecureToken, sendPasswordResetEmail;
  
  try {
    const dbModule = await import('@/lib/db-utils');
    db = dbModule.db;
  } catch (error) {
    console.error('Failed to import db-utils:', error);
    return addSecurityHeaders(NextResponse.json({ 
      error: 'Service temporarily unavailable' 
    }, { status: 503 }));
  }

  try {
    const utilsModule = await import('@/lib/utils');
    generateSecureToken = utilsModule.generateSecureToken;
  } catch (error) {
    console.error('Failed to import utils:', error);
    return addSecurityHeaders(NextResponse.json({ 
      error: 'Service temporarily unavailable' 
    }, { status: 503 }));
  }

  try {
    const emailModule = await import('@/lib/email');
    sendPasswordResetEmail = emailModule.sendPasswordResetEmail;
  } catch (error) {
    console.error('Failed to import email:', error);
    return addSecurityHeaders(NextResponse.json({ 
      error: 'Service temporarily unavailable' 
    }, { status: 503 }));
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return addSecurityHeaders(NextResponse.json({ 
        error: 'Invalid request format' 
      }, { status: 400 }));
    }

    // Validate email
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return addSecurityHeaders(NextResponse.json({ 
        error: validationResult.error.errors[0]?.message || 'Invalid input' 
      }, { status: 400 }));
    }

    const { email } = validationResult.data;

    // Rate limiting
    if (!checkRateLimit(email)) {
      console.warn(`Rate limit exceeded for email: ${email}`);
      return addSecurityHeaders(NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 }));
    }

    // Find user by email
    let user;
    try {
      user = await db.user.findUnique({ 
        where: { email: email.toLowerCase() },
        select: { id: true, name: true, email: true }
      });
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      return addSecurityHeaders(NextResponse.json({ 
        error: 'Service temporarily unavailable' 
      }, { status: 503 }));
    }

    if (user) {
      try {
        // Delete any existing tokens for this user
        await db.passwordResetToken.deleteMany({ 
          where: { userId: user.id } 
        });

        // Generate a new secure token
        const token = generateSecureToken(32);
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Create the new reset token
        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires,
          },
        });

        // Generate the reset link
        const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        // Send password reset email
        try {
          const emailResult = await sendPasswordResetEmail(
            user.email,
            user.name,
            resetLink
          );

          if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
            // Don't fail the request if email fails, just log it
          } else {
            console.log(`Password reset email sent successfully to: ${user.email}`);
          }
        } catch (emailError) {
          console.error('Email service error:', emailError);
          // Don't fail the request if email fails
        }

        // Log successful token creation (for monitoring)
        console.log(`Password reset token created for user: ${user.email}`);
        
        // Development logging
        if (process.env.NODE_ENV === 'development') {
          console.log('DEV MODE: Password reset link generated');
          console.log(`For: ${user.email}`);
          console.log(`Reset Link: ${resetLink}`);
        }

      } catch (dbError) {
        console.error('Database error during token creation:', dbError);
        return addSecurityHeaders(NextResponse.json({ 
          error: 'Service temporarily unavailable' 
        }, { status: 503 }));
      }
    }

    // Always return the same message for security (prevents email enumeration)
    return addSecurityHeaders(NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }));

  } catch (error) {
    console.error('Unexpected error in forgot password API:', error);
    
    // Don't expose internal errors to client
    return addSecurityHeaders(NextResponse.json({ 
      error: 'An error occurred while processing your request' 
    }, { status: 500 }));
  }
}

// Handle unsupported methods
export async function GET() {
  return addSecurityHeaders(NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 }));
}

export async function PUT() {
  return addSecurityHeaders(NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 }));
}

export async function DELETE() {
  return addSecurityHeaders(NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 }));
}