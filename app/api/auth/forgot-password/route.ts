import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔐 ULTRA MINIMAL TEST API CALLED');
  
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
    
    console.log('🔍 Step 4: Testing Prisma import...');
    try {
      const { PrismaClient } = await import('@prisma/client');
      console.log('✅ PrismaClient import successful');
      
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });
      console.log('✅ Prisma client created');
      
      console.log('🔍 Step 5: Testing database connection...');
      const userCount = await prisma.user.count();
      console.log('✅ Database connection successful, user count:', userCount);
      
      console.log('🔍 Step 6: Testing user lookup...');
      const user = await prisma.user.findUnique({ 
        where: { email: body.email },
        select: { id: true, name: true, email: true }
      });
      console.log('👤 User lookup result:', user ? `${user.name} (${user.email})` : 'No user found');
      
      if (user) {
        console.log('🔐 Step 7: Testing token generation...');
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        console.log('✅ Token generated:', token.substring(0, 10) + '...');
        
        console.log('💾 Step 8: Testing token creation...');
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token,
            expires,
          },
        });
        console.log('✅ Token created in database');
        
        console.log('📧 Step 9: Testing email service import...');
        try {
          const { sendPasswordResetEmail } = await import('@/lib/email');
          console.log('✅ Email service import successful');
          
          const baseUrl = request.nextUrl.origin || 'http://localhost:3000';
          const resetLink = `${baseUrl}/reset-password?token=${token}`;
          
          console.log('📧 Step 10: Sending email...');
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
        
        console.log('✅ Step 11: All operations completed successfully');
      }
      
      await prisma.$disconnect();
      console.log('✅ Prisma client disconnected');
      
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    console.log('✅ Step 12: Returning success response');
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      debug: process.env.NODE_ENV === 'development' ? 'All steps completed successfully' : undefined
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in ultra minimal test API:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}