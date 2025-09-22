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

    return NextResponse.json({
      notification: latestNotification,
      success: true
    })
  } catch (error) {
    console.error("Get latest notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
