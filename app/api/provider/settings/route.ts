import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    // Get user data
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        avatar: true,
        emailVerified: true
      }
    })

    return NextResponse.json({
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        description: provider.description,
        experience: provider.experience,
        hourlyRate: provider.hourlyRate,
        location: provider.location,
        certifications: provider.certifications,
        profileImages: provider.profileImages,
        status: provider.status,
        available: provider.available,
        bankName: provider.bankName,
        bankCode: provider.bankCode,
        accountNumber: provider.accountNumber,
        accountName: provider.accountName,
        services: provider.services.map(ps => ({
          id: ps.id,
          serviceId: ps.serviceId,
          customRate: ps.customRate,
          service: ps.service
        }))
      },
      user: userData
    })
  } catch (error) {
    console.error("Provider settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    const body = await request.json()
    const { providerData, userData } = body

    // Update provider data
    if (providerData) {
      await db.provider.update({
        where: { userId: user.id },
        data: {
          businessName: providerData.businessName,
          description: providerData.description,
          experience: providerData.experience,
          hourlyRate: providerData.hourlyRate,
          location: providerData.location,
          certifications: providerData.certifications,
          profileImages: providerData.profileImages,
          available: providerData.available
        }
      })
    }

    // Update user data
    if (userData) {
      await db.user.update({
        where: { id: user.id },
        data: {
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Provider settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
