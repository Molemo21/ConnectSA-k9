import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔐 MINIMAL TEST API CALLED');
  
  try {
    console.log('📝 Step 1: Parsing request body...');
    const body = await request.json();
    console.log('📧 Email received:', body.email);
    
    console.log('✅ Step 2: Basic validation...');
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    console.log('✅ Step 3: Email validation passed');
    
    console.log('🔍 Step 4: Testing database import...');
    try {
      const { db } = await import('@/lib/db-utils');
      console.log('✅ Database import successful');
      
      console.log('🔍 Step 5: Testing user lookup...');
      const user = await db.user.findUnique({ 
        where: { email: body.email },
        select: { id: true, name: true, email: true }
      });
      console.log('👤 User lookup result:', user ? `${user.name} (${user.email})` : 'No user found');
      
      if (user) {
        console.log('🔐 Step 6: Testing token generation...');
        const { generateSecureToken } = await import('@/lib/utils');
        const token = generateSecureToken(32);
        console.log('✅ Token generated:', token.substring(0, 10) + '...');
        
        console.log('💾 Step 7: Testing token creation...');
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires,
          },
        });
        console.log('✅ Token created in database');
        
        console.log('📧 Step 8: Testing email service...');
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
          // Don't fail the request if email fails
        }
        
        console.log('✅ Step 9: All operations completed successfully');
      }
      
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    console.log('✅ Step 10: Returning success response');
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