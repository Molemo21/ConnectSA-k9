import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-utils';
import { generateSecureToken } from '@/lib/utils';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  console.log('🔐 Forgot password API called')
  
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('⏭️ Skipping during build phase')
    return NextResponse.json({ 
      message: 'Service temporarily unavailable during deployment' 
    }, { status: 503 });
  }

  try {
    console.log('📝 Parsing request body...')
    const body = await request.json();
    console.log('📧 Email:', body.email)
    
    const { email } = forgotPasswordSchema.parse(body);
    console.log('✅ Email validation passed')

    console.log('🔍 Looking up user...')
    // Find user by email
    const user = await db.user.findUnique({ 
      where: { email },
      select: { id: true, name: true, email: true }
    });
    console.log('👤 User found:', user ? 'Yes' : 'No')

    if (user) {
      try {
        console.log('🗑️ Deleting existing tokens...')
        // Delete any existing tokens for this user
        await db.passwordResetToken.deleteMany({ 
          where: { userId: user.id } 
        });

        console.log('🔐 Generating secure token...')
        // Generate a new secure token
        const token = generateSecureToken(32);
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        console.log('⏰ Token expires:', expires)

        console.log('💾 Creating token in database...')
        // Create the new reset token
        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires,
          },
        });
        console.log('✅ Token created successfully')

        // Generate the reset link
        const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        console.log('🔗 Reset link generated:', resetLink)

        console.log('📧 Sending password reset email...')
        // Send password reset email
        const emailResult = await sendPasswordResetEmail(
          user.email,
          user.name,
          resetLink
        );
        console.log('📧 Email result:', emailResult)

        if (!emailResult.success) {
          console.error('❌ Failed to send password reset email:', emailResult.error);
          // Don't fail the request if email fails, just log it
          // The user can still use the reset link from console in dev mode
        }

        // Log successful token creation
        console.log(`✅ Password reset token created for user: ${user.email}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 DEV MODE: Password reset link generated');
          console.log(`📧 For: ${user.email}`);
          console.log(`🔗 Reset Link: ${resetLink}`);
          console.log('💡 In production, this would be sent via email');
        }
      } catch (dbError) {
        console.error('❌ Database error during password reset:', dbError);
        return NextResponse.json({ 
          error: 'Failed to process password reset request' 
        }, { status: 500 });
      }
    }

    console.log('✅ Returning success response')
    // Always return the same message for security (prevents email enumeration)
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json({ 
        error: error.errors[0]?.message || 'Invalid input' 
      }, { status: 400 });
    }

    // Generic error message for security
    return NextResponse.json({ 
      error: 'An error occurred while processing your request' 
    }, { status: 500 });
  }
} 