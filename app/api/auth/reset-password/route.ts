import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Validate token format
    if (!token || token.length < 32) {
      return NextResponse.json({ 
        error: 'Invalid token format' 
      }, { status: 400 });
    }

    try {
      // Find the reset token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        return NextResponse.json({ 
          error: 'Invalid or expired reset token' 
        }, { status: 400 });
      }

      // Check if token has expired
      if (resetToken.expires < new Date()) {
        // Clean up expired token
        await prisma.passwordResetToken.delete({ where: { token } });
        return NextResponse.json({ 
          error: 'Reset token has expired. Please request a new password reset.' 
        }, { status: 400 });
      }

      // Check if user still exists and is active
      if (!resetToken.user || !resetToken.user.id) {
        await prisma.passwordResetToken.delete({ where: { token } });
        return NextResponse.json({ 
          error: 'User account not found' 
        }, { status: 400 });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update user's password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Delete the token after successful use
      await prisma.passwordResetToken.delete({ where: { token } });

      // Log successful password reset
      console.log(`✅ Password reset successful for user: ${resetToken.user.email}`);

      return NextResponse.json({ 
        message: 'Password has been reset successfully.' 
      });

    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json({ 
        error: 'Failed to process password reset' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error instanceof z.ZodError) {
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