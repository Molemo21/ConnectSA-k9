import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"
import { z } from "zod"
import { createStarterPackages } from "@/lib/services/package-generator"
import { createNotification } from "@/lib/notification-service"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


const onboardingSchema = z.object({
  // Personal Info
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  experience: z.number().min(0, "Experience must be 0 or greater"),
  hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  
  // Services
  selectedServices: z.array(z.string()).min(1, "At least one service must be selected"),
  
  // Documents
  idDocument: z.string().min(1, "ID document is required"),
  proofOfAddress: z.string().min(1, "Proof of address is required"),
  certifications: z.array(z.string()).optional().default([]),
  profileImages: z.array(z.string()).optional().default([]),
  
  // Banking
  bankName: z.string().min(1, "Bank name is required"),
  bankCode: z.string().min(1, "Bank code is required"),
  accountNumber: z.string().min(8, "Account number must be at least 8 characters"),
  accountName: z.string().min(1, "Account name is required"),
})

export async function POST(request: NextRequest) {
  console.log("🚀 Provider onboarding API called")
  console.log("🍪 Request cookies:", request.cookies.getAll())
  console.log("📋 Request headers:", Object.fromEntries(request.headers.entries()))
  
  try {
    console.log("🔍 Getting current user...")
    const user = await getCurrentUser()
    console.log("👤 User:", user ? { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified } : "null")
    
    if (!user) {
      console.log("❌ No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PROVIDER") {
      console.log("❌ User is not a provider:", user.role)
      return NextResponse.json({ error: "Only providers can access this endpoint" }, { status: 403 })
    }

    if (!user.emailVerified) {
      console.log("❌ Email not verified")
      return NextResponse.json({ error: "Email must be verified" }, { status: 403 })
    }

    console.log("📝 Parsing request body...")
    const body = await request.json()
    console.log("📋 Request body keys:", Object.keys(body))
    
    console.log("✅ Validating data...")
    const validatedData = onboardingSchema.parse(body)
    console.log("✅ Data validation successful")

    // Check if provider already exists
    console.log("🔍 Checking for existing provider...")
    const existingProvider = await db.provider.findUnique({
      where: { userId: user.id }
    })
    console.log("📊 Existing provider:", existingProvider ? { id: existingProvider.id, status: existingProvider.status } : "none")

    if (existingProvider && existingProvider.status === "APPROVED") {
      console.log("❌ Provider already approved")
      return NextResponse.json({ error: "Provider is already approved" }, { status: 400 })
    }

    // Create or update provider
    console.log("💾 Creating/updating provider...")
    let provider
    if (existingProvider) {
      console.log("🔄 Updating existing provider...")
      // Update existing provider
      provider = await db.provider.update({
        where: { userId: user.id },
        data: {
          businessName: validatedData.businessName,
          description: validatedData.description,
          experience: validatedData.experience,
          hourlyRate: validatedData.hourlyRate,
          location: validatedData.location,
          status: "PENDING",
          // Document fields
          idDocument: validatedData.idDocument,
          proofOfAddress: validatedData.proofOfAddress,
          certifications: validatedData.certifications,
          profileImages: validatedData.profileImages,
          // Banking fields
          bankName: validatedData.bankName,
          bankCode: validatedData.bankCode,
          accountNumber: validatedData.accountNumber,
          accountName: validatedData.accountName,
        }
      })
      console.log("✅ Provider updated:", provider.id)
    } else {
      console.log("🆕 Creating new provider...")
      // Create new provider
      provider = await db.provider.create({
        data: {
          userId: user.id,
          businessName: validatedData.businessName,
          description: validatedData.description,
          experience: validatedData.experience,
          hourlyRate: validatedData.hourlyRate,
          location: validatedData.location,
          status: "PENDING",
          // Document fields
          idDocument: validatedData.idDocument,
          proofOfAddress: validatedData.proofOfAddress,
          certifications: validatedData.certifications,
          profileImages: validatedData.profileImages,
          // Banking fields
          bankName: validatedData.bankName,
          bankCode: validatedData.bankCode,
          accountNumber: validatedData.accountNumber,
          accountName: validatedData.accountName,
        }
      })
      console.log("✅ Provider created:", provider.id)
    }

    // Update provider services
    console.log("🔧 Updating provider services...")
    if (validatedData.selectedServices.length > 0) {
      console.log("🗑️ Removing existing services...")
      // Remove existing services
      await db.providerService.deleteMany({
        where: { providerId: provider.id }
      })

      console.log("➕ Adding new services:", validatedData.selectedServices)
      // Add new services
      await db.providerService.createMany({
        data: validatedData.selectedServices.map(serviceId => ({
          providerId: provider.id,
          serviceId: serviceId
        }))
      })
      console.log("✅ Services updated successfully")
    } else {
      console.log("⚠️ No services selected")
    }

    // Auto-create starter packages if provider is approved and has services
    if (provider.status === "APPROVED" && validatedData.selectedServices.length > 0) {
      console.log("🎯 Provider is approved, creating starter packages...")
      try {
        const createdPackages = await createStarterPackages(provider.id, validatedData.selectedServices)
        console.log(`✅ Created ${createdPackages.length} starter packages`)

        // Send notification to provider about packages
        await createNotification({
          userId: provider.userId,
          type: 'CATALOGUE_SETUP_REQUIRED',
          title: '🎉 Your Service Packages Are Ready!',
          content: `We've created ${createdPackages.length} starter packages for your services. Customize them now to start receiving bookings!`
        })
        console.log("✅ Notification sent to provider")

      } catch (packageError) {
        console.error("❌ Failed to create starter packages:", packageError)
        // Don't fail the onboarding if package creation fails
        // Just log the error and continue
      }
    }

    // Create audit log (if model exists)
    console.log("📝 Creating audit log...")
    try {
      // Check if adminAuditLog model exists before trying to create
      if (db.adminAuditLog && typeof db.adminAuditLog.create === 'function') {
        await db.adminAuditLog.create({
          data: {
            adminId: user.id,
            action: 'SYSTEM_MAINTENANCE' as any, // Using existing enum value
            targetType: 'PROVIDER',
            targetId: provider.id,
            details: {
              businessName: validatedData.businessName,
              location: validatedData.location,
              servicesCount: validatedData.selectedServices.length,
              action: 'PROVIDER_ONBOARDING_SUBMITTED'
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }
        })
        console.log("✅ Audit log created successfully")
      } else {
        console.log("⚠️ AdminAuditLog model not available, skipping audit log creation")
      }
    } catch (auditError) {
      console.error("❌ Failed to create audit log:", auditError)
      // Don't fail the onboarding if audit log creation fails
      // Just log the error and continue
    }

    return NextResponse.json({
      success: true,
      message: "Provider onboarding submitted successfully",
      providerId: provider.id
    })

  } catch (error) {
    console.error("❌ Provider onboarding error:", error)
    
    if (error instanceof z.ZodError) {
      console.error("❌ Validation errors:", error.errors)
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 })
    }

    // Log more specific error information
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message)
      console.error("❌ Error stack:", error.stack)
    }

    console.error("❌ Returning 500 error response")
    return NextResponse.json({
      error: "Internal server error",
      message: "Failed to submit provider onboarding",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}