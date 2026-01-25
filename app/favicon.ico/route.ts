import { NextRequest, NextResponse } from 'next/server'

// Favicon route handler to prevent 500 errors
// Redirects to the actual icon file specified in layout metadata
export async function GET(request: NextRequest) {
  // Redirect to the icon specified in metadata, or return 404
  // This prevents 500 errors when favicon.ico is requested
  return NextResponse.redirect(new URL('/placeholder-logo.png', request.url), 302)
}
