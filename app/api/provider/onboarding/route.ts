import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const onboardingSchema = z.object({
  businessName: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  experience: z.number().min(0, "Experience must be 0 or greater"),
  hourlyRate: z.number().min(1, "Hourly rate must be greater than 0"),
  location: z.string().min(1, "Location is required"),
  selectedServices: z.array(z.string()).min(1, "At least one service must be selected"),
  isDraft: z.boolean().optional().default(false), // Add draft support
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = onboardingSchema.parse(body)

    // Check if all required fields are filled
    const isComplete = (
      validatedData.businessName &&
      validatedData.description &&
      validatedData.experience > 0 &&
      validatedData.hourlyRate > 0 &&
      validatedData.location &&
      validatedData.selectedServices && validatedData.selectedServices.length > 0
    )

    // Get current provider status
    let provider = await prisma.provider.findUnique({ where: { userId: user.id } })
    if (!provider) {
      // Create a new provider record for this user
      provider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: validatedData.businessName,
          description: validatedData.description,
          experience: validatedData.experience,
          hourlyRate: validatedData.hourlyRate,
          location: validatedData.location,
          status: validatedData.isDraft ? "INCOMPLETE" : (isComplete ? "PENDING" : "INCOMPLETE"),
        },
      });
    }

    let newStatus = provider.status;
    if (validatedData.isDraft) {
      // For drafts, keep current status or set to INCOMPLETE
      newStatus = provider.status === "PENDING" ? "PENDING" : "INCOMPLETE";
    } else if (provider.status === "REJECTED") {
      newStatus = isComplete ? "PENDING" : "INCOMPLETE";
    } else if (isComplete) {
      newStatus = "PENDING";
    } else {
      newStatus = "INCOMPLETE";
    }

    // Atomic update: provider profile and services
    await prisma.$transaction(async (tx) => {
      // Update provider profile
      await tx.provider.update({
        where: { userId: user.id },
        data: {
          businessName: validatedData.businessName,
          description: validatedData.description,
          experience: validatedData.experience,
          hourlyRate: validatedData.hourlyRate,
          location: validatedData.location,
          status: newStatus,
        },
      });

      // Remove all existing ProviderService records for this provider
      await tx.providerService.deleteMany({ where: { providerId: provider.id } });

      // Add new ProviderService records for selected services
      const newServices = validatedData.selectedServices.map((serviceId: string) => ({
        providerId: provider.id,
        serviceId,
      }));
      if (newServices.length > 0) {
        await tx.providerService.createMany({ data: newServices });
      }
    });

    return NextResponse.json({ 
      message: validatedData.isDraft ? "Draft saved successfully" : "Profile submitted successfully",
      isDraft: validatedData.isDraft,
      status: newStatus
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 })
    }

    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
