import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "PENDING"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get providers with user data
    const [providers, totalCount] = await Promise.all([
      db.provider.findMany({
        where: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true
            }
          },
          providerServices: {
            include: {
              service: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.provider.count({ where: { status } })
    ])

    // Transform providers data
    const transformedProviders = providers.map(provider => {
      const services = provider.providerServices.map(ps => ps.service.name)
      
      return {
        id: provider.id,
        name: provider.user.name,
        email: provider.user.email,
        phone: provider.user.phone,
        status: provider.status,
        applicationDate: provider.createdAt.toISOString().split('T')[0],
        services,
        location: provider.location || "Not specified",
        experience: provider.experience || "Not specified",
        bio: provider.bio || "No bio provided",
        documents: {
          idDocument: provider.idDocumentVerified ? "verified" : "pending",
          businessLicense: provider.businessLicenseVerified ? "verified" : "pending",
          insurance: provider.insuranceVerified ? "verified" : "pending",
          references: provider.referencesVerified ? "verified" : "pending"
        },
        previousWork: provider.previousWork || [],
        rating: 0 // Will be calculated from reviews if needed
      }
    })

    return NextResponse.json({
      providers: transformedProviders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { providerId, status } = await request.json()

    if (!providerId || !status) {
      return NextResponse.json(
        { error: "Provider ID and status are required" },
        { status: 400 }
      )
    }

    // Update provider status
    const updatedProvider = await db.provider.update({
      where: { id: providerId },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Log admin action
    await db.adminAuditLog.create({
      data: {
        adminId: user.id,
        action: "PROVIDER_APPROVAL",
        details: `Provider ${updatedProvider.user.name} (${updatedProvider.user.email}) status changed to ${status}`,
        targetId: providerId,
        targetType: "PROVIDER"
      }
    })

    return NextResponse.json({
      message: `Provider ${status.toLowerCase()} successfully`,
      provider: updatedProvider
    })
  } catch (error) {
    console.error("Error updating provider status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}