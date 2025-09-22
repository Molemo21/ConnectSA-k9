import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

export const dynamic = 'force-dynamic'


export async function DELETE(
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

    // Delete notification (only if it belongs to the user)
    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Notification deleted"
    })
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
