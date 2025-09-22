import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { markNotificationAsRead } from "@/lib/notification-service"

export const dynamic = 'force-dynamic'


export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id
    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
    }

    await markNotificationAsRead(notificationId, user.id)

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
