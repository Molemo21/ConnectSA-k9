import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { removePushSubscription } from "@/lib/push-notification-service"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const unsubscribeSchema = z.object({
  endpoint: z.string().url()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = unsubscribeSchema.parse(body)

    await removePushSubscription(endpoint)

    return NextResponse.json({ 
      success: true,
      message: "Push subscription removed successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid endpoint", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: "Failed to remove push subscription" },
      { status: 500 }
    )
  }
}




