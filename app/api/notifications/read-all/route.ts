import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { markAllNotificationsAsRead } from "@/lib/notification-service"

export const dynamic = 'force-dynamic'


export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await markAllNotificationsAsRead(user.id)

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
