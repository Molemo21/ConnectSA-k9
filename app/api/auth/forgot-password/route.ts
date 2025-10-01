import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-utils';
import { generateSecureToken } from '@/lib/utils';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  console.log('🔐 FIXED FORGOT PASSWORD API CALLED');
  
  try {
    console.log('📝 Step 1: Parsing request body...');
    const body = await request.json();
    console.log('📧 Email received:', body.email);
    
    console.log('✅ Step 2: Validating email...');
    const { email } = forgotPasswordSchema.parse(body);
    console.log('✅ Email validation passed:', email);

    console.log('🔍 Step 3: Looking up user...');
    const user = await db.user.findUnique({ 
      where: { email },
      select: { id: true, name: true, email: true }
    });
    console.log('👤 User found:', user ? `${user.name} (${user.email})` : 'No user found');

    if (user) {
      console.log('🗑️ Step 4: Cleaning up existing tokens...');
      await db.passwordResetToken.deleteMany({ 
        where: { userId: user.id } 
      });
      console.log('✅ Existing tokens deleted');

      console.log('🔐 Step 5: Generating secure token...');
      const token = generateSecureToken(32);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      console.log('✅ Token generated:', token.substring(0, 10) + '...');

      console.log('💾 Step 6: Creating token in database...');
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires,
        },
      });
      console.log('✅ Token saved to database');

      console.log('🔗 Step 7: Generating reset link...');
      const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      console.log('✅ Reset link generated:', resetLink);

      console.log('📧 Step 8: Sending password reset email...');
      try {
        const emailResult = await sendPasswordResetEmail(
          user.email,
          user.name,
          resetLink
        );
        console.log('📧 Email result:', emailResult);

        if (!emailResult.success) {
          console.error('❌ Email sending failed:', emailResult.error);
          // Don't fail the request if email fails
        } else {
          console.log('✅ Email sent successfully!');
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Don't fail the request if email fails
      }

      console.log('✅ Step 9: Token creation completed for user:', user.email);
    } else {
      console.log('ℹ️ No user found for email:', email);
    }

    console.log('✅ Step 10: Returning success response');
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in forgot password API:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error details:', error.errors);
      return NextResponse.json({ 
        error: error.errors[0]?.message || 'Invalid input' 
      }, { status: 400 });
    }

    // Generic error message for security
    return NextResponse.json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}