import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { savePushSubscription } from "@/lib/push-notification-service"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const subscription = subscriptionSchema.parse(body)
    const userAgent = request.headers.get('user-agent') || undefined

    await savePushSubscription(user.id, subscription, userAgent)

    return NextResponse.json({ 
      success: true,
      message: "Push subscription saved successfully"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subscription data", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Push subscription error:', error)
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    )
  }
}




