import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserNotifications } from "@/lib/notification-service"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getUserNotifications(user.id, 1)
    const latestNotification = notifications[0] || null

    // Serialize Date objects to ISO strings for JSON response
    const serializedNotification = latestNotification ? {
      ...latestNotification,
      createdAt: latestNotification.createdAt instanceof Date 
        ? latestNotification.createdAt.toISOString() 
        : latestNotification.createdAt,
      updatedAt: latestNotification.updatedAt instanceof Date 
        ? latestNotification.updatedAt.toISOString() 
        : latestNotification.updatedAt
    } : null

    return NextResponse.json({
      notification: serializedNotification,
      success: true
    })
  } catch (error) {
    console.error("Get latest notification error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
