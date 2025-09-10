import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/notification-service"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, limit),
      getUnreadNotificationCount(user.id)
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      success: true
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
