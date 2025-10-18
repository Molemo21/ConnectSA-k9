import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Provider Services Assignment Tool ===\n')

    // Get all providers without services
    const providersWithoutServices = await db.provider.findMany({
      where: {
        services: {
          none: {}
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        services: true
      }
    })

    // Get all available services
    const allServices = await db.service.findMany()

    if (providersWithoutServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All providers have services assigned!"
      })
    }

    const results = []
    
    // For each provider, assign default services
    for (const provider of providersWithoutServices) {
      console.log(`\nProcessing provider: ${provider.user?.name || 'Unknown'}`)

      if (allServices.length === 0) {
        results.push({
          provider: provider.user?.name || 'Unknown',
          error: 'No services found to assign'
        })
        continue
      }

      try {
        // Delete any existing services first
        await db.providerService.deleteMany({
          where: {
            providerId: provider.id
          }
        })

        // Create new services one by one
        for (const service of allServices) {
          await db.providerService.create({
            data: {
              providerId: provider.id,
              serviceId: service.id
            }
          })
        }

        // List assigned services
        const assignedServices = await db.providerService.findMany({
          where: {
            providerId: provider.id
          },
          include: {
            service: true
          }
        })

        results.push({
          provider: provider.user?.name || 'Unknown',
          success: true,
          servicesAssigned: assignedServices.length,
          services: assignedServices.map(ps => ps.service.name)
        })

      } catch (error) {
        results.push({
          provider: provider.user?.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Verify assignments
    const remainingProvidersWithoutServices = await db.provider.count({
      where: {
        services: {
          none: {}
        }
      }
    })

    return NextResponse.json({
      success: true,
      results,
      remainingProvidersWithoutServices,
      message: remainingProvidersWithoutServices === 0
        ? "All providers have been assigned services successfully!"
        : `There are still ${remainingProvidersWithoutServices} providers without services`
    })

  } catch (error) {
    console.error("Error assigning provider services:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}