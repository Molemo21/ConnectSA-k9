import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const cookieStore = await cookies();
    
    // Clear the authentication token
    cookieStore.delete("auth-token");
    
    // Clear any other auth-related cookies
    cookieStore.delete("user-session");
    cookieStore.delete("auth-session");
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      error: "Failed to logout" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  // Handle GET requests for logout (redirect from form)
  try {
    const cookieStore = await cookies();
    
    // Clear the authentication token
    cookieStore.delete("auth-token");
    cookieStore.delete("user-session");
    cookieStore.delete("auth-session");
    
    // Redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
