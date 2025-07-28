import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken } from '@/lib/utils';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      // Generate a new token
      const token = generateSecureToken(32);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires,
        },
      });
      // Log the reset link to the console
      const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      console.log(`Password reset link for ${email}: ${resetLink}`);
    }
    // Always return a generic message
    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 