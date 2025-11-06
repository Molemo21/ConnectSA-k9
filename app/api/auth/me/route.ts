export const runtime = 'nodejs'
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // If user is a provider and avatar is null, try to get from profileImages
    let avatar = user.avatar;
    if (!avatar && user.role === 'PROVIDER' && user.provider?.id) {
      try {
        const provider = await prisma.provider.findUnique({
          where: { id: user.provider.id },
          select: { profileImages: true }
        });
        
        if (provider?.profileImages && provider.profileImages.length > 0) {
          avatar = provider.profileImages[0];
          // Update user.avatar for future requests
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { avatar }
            });
            console.log("✅ User avatar synced from profile images");
          } catch (updateError) {
            console.error("⚠️ Failed to update user avatar:", updateError);
            // Continue anyway - we still have the avatar value
          }
        }
      } catch (providerError) {
        console.error("⚠️ Failed to fetch provider profile images:", providerError);
        // Continue with null avatar
      }
    }

    return NextResponse.json({ 
      user: {
        ...user,
        avatar
      }
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
