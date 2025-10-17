import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Debug Login Test:', { email, password: password ? '***' : 'missing' });
    
    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        provider: {
          select: {
            status: true,
          },
        },
      },
    });

    console.log('👤 User found:', { 
      found: !!user, 
      hasPassword: !!user?.password,
      emailVerified: user?.emailVerified,
      isActive: user?.isActive,
      role: user?.role,
      providerStatus: user?.provider?.status
    });

    if (!user || !user.password) {
      return NextResponse.json({ 
        error: "User not found or no password",
        debug: { found: !!user, hasPassword: !!user?.password }
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    console.log('🔐 Password valid:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json({ 
        error: "Invalid password",
        debug: { passwordValid: false }
      }, { status: 401 });
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: "Email not verified",
        debug: { emailVerified: false }
      }, { status: 403 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ 
        error: "Account deactivated",
        debug: { isActive: false }
      }, { status: 401 });
    }

    // Create token
    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    });

    console.log('🎫 Token created:', { tokenLength: token.length });

    // Test cookie setting
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      token: token.substring(0, 20) + '...', // Only show first 20 chars
      debug: {
        cookieDomain: process.env.COOKIE_DOMAIN,
        nodeEnv: process.env.NODE_ENV,
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'set' : 'missing'
      }
    });

    // Set cookie manually for testing
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Debug login successful');
    return response;

  } catch (error) {
    console.error('❌ Debug login error:', error);
    return NextResponse.json({ 
      error: "Debug login failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
