import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 MINIMAL TEST API CALLED');
    
    const body = await request.json();
    console.log('📧 Email received:', body.email);
    
    // Basic validation
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    console.log('✅ Basic validation passed');
    
    // Test database import
    try {
      const { db } = await import('@/lib/db-utils');
      console.log('✅ Database import successful');
      
      // Test user lookup
      const user = await db.user.findUnique({ 
        where: { email: body.email },
        select: { id: true, name: true, email: true }
      });
      console.log('👤 User lookup result:', user ? `${user.name} (${user.email})` : 'No user found');
      
      if (user) {
        // Test token generation
        const { generateSecureToken } = await import('@/lib/utils');
        const token = generateSecureToken(32);
        console.log('✅ Token generated:', token.substring(0, 10) + '...');
        
        // Test token creation
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires,
          },
        });
        console.log('✅ Token created in database');
        
        // Test email service
        try {
          const { sendPasswordResetEmail } = await import('@/lib/email');
          const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
          const resetLink = `${baseUrl}/reset-password?token=${token}`;
          
          const emailResult = await sendPasswordResetEmail(
            user.email,
            user.name,
            resetLink
          );
          console.log('📧 Email result:', emailResult);
          
          if (emailResult.success) {
            console.log('✅ Email sent successfully!');
          } else {
            console.log('⚠️ Email failed but continuing:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Email service error:', emailError);
        }
        
        console.log('✅ All operations completed successfully');
      }
      
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    console.log('✅ Returning success response');
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      debug: process.env.NODE_ENV === 'development' ? 'All steps completed successfully' : undefined
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in minimal test API:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}