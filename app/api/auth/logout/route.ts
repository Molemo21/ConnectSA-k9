import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Build response
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

    // Clear auth cookie with all possible configurations
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    };

    // Clear auth token
    response.cookies.set('auth-token', '', cookieOptions);
    cookieStore.delete('auth-token');

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      error: "Failed to logout",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests for logout (redirect from form)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // Clear auth cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    };

    response.cookies.set('auth-token', '', cookieOptions);
    cookieStore.delete('auth-token');

    return response;
  } catch (error) {
    console.error("Logout GET error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}