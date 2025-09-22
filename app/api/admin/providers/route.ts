import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Admin providers API: Starting request for user:', user.id)

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
          services: {
            select: {
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
      const services = provider.services.map(ps => ps.service.name)
      
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
        bio: provider.description || "No bio provided",
        documents: {
          idDocument: provider.idDocument ? "verified" : "pending",
          businessLicense: "pending", // This field doesn't exist in schema
          insurance: "pending", // This field doesn't exist in schema
          references: "pending" // This field doesn't exist in schema
        },
        previousWork: [], // This field doesn't exist in schema
        rating: 0 // Will be calculated from reviews if needed
      }
    })

    console.log('Admin providers API: Successfully fetched providers:', {
      count: transformedProviders.length,
      total: totalCount,
      status
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