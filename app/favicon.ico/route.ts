import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Favicon route handler to prevent 500 errors
// Serves the actual favicon file or returns 404 gracefully
export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return new NextResponse(null, { status: 404 })
    }

    // Try to serve the placeholder logo as favicon
    const publicPath = join(process.cwd(), 'public', 'placeholder-logo.png')
    
    try {
      const fileBuffer = await readFile(publicPath)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (fileError) {
      // If file doesn't exist, return 404 instead of 500
      return new NextResponse(null, { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
  } catch (error) {
    // If anything fails, return 404 instead of 500
    console.error('Favicon route error:', error)
    return new NextResponse(null, { status: 404 })
  }
}
