import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createNotification, NotificationTemplates } from '@/lib/notification-service';

const prisma = new PrismaClient();

export interface SetupProgress {
  totalPackages: number;
  customizedPackages: number;
  completionPercentage: number;
  isCompleted: boolean;
  nextSteps: string[];
  estimatedTimeRemaining: number; // in minutes
}

/**
 * GET /api/provider/setup-progress
 * Get the current setup progress for a provider
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting provider setup progress...');

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider with catalogue items
    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      include: {
        catalogueItems: {
          where: { isActive: true },
          include: {
            service: {
              select: { name: true }
            }
          }
        },
        services: {
          include: {
            service: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const totalPackages = provider.catalogueItems.length;
    
    // Calculate customized packages (packages that have been modified from defaults)
    const customizedPackages = provider.catalogueItems.filter(item => {
      // Consider a package customized if:
      // 1. Title doesn't contain "Essential", "Professional", or "Premium" (default pattern)
      // 2. Short description is longer than 50 characters
      // 3. Price has been modified from standard tiers
      const isDefaultTitle = /^(Essential|Professional|Premium)\s/.test(item.title);
      const isCustomizedDesc = item.shortDesc.length > 50;
      const isCustomizedPrice = !isStandardPrice(item.price);
      
      return !isDefaultTitle || isCustomizedDesc || isCustomizedPrice;
    }).length;

    const completionPercentage = totalPackages > 0 
      ? Math.round((customizedPackages / totalPackages) * 100)
      : 0;

    const isCompleted = completionPercentage >= 100;

    // Generate next steps
    const nextSteps = generateNextSteps(provider, customizedPackages, totalPackages);

    // Estimate time remaining (5 minutes per uncustomized package)
    const estimatedTimeRemaining = (totalPackages - customizedPackages) * 5;

    const progress: SetupProgress = {
      totalPackages,
      customizedPackages,
      completionPercentage,
      isCompleted,
      nextSteps,
      estimatedTimeRemaining
    };

    console.log(`📊 Progress calculated: ${completionPercentage}% complete (${customizedPackages}/${totalPackages})`);

    return NextResponse.json(progress);

  } catch (error) {
    console.error('❌ Error getting setup progress:', error);
    return NextResponse.json(
      { error: 'Failed to get setup progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/setup-progress
 * Mark setup as completed
 */
export async function POST(request: NextRequest) {
  try {
    console.log('✅ Marking provider setup as completed...');

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completed } = body;

    if (completed) {
      // Update provider to mark setup as completed
      const updatedProvider = await prisma.provider.update({
        where: { userId: user.id },
        data: {
          catalogueSetupCompleted: true,
          catalogueSetupCompletedAt: new Date()
        }
      });

      // Send completion notification
      const completionTime = calculateCompletionTime(updatedProvider.createdAt, updatedProvider.catalogueSetupCompletedAt!);
      
      await createNotification({
        userId: user.id,
        type: 'CATALOGUE_SETUP_COMPLETED',
        title: '🎉 Setup Complete - You\'re Ready to Earn!',
        content: `Congratulations! You completed your service packages setup in ${completionTime}. You're now live and ready to receive bookings!`
      });

      console.log(`✅ Provider ${user.id} setup marked as completed`);

      return NextResponse.json({
        success: true,
        message: 'Setup marked as completed',
        completionTime
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('❌ Error marking setup as completed:', error);
    return NextResponse.json(
      { error: 'Failed to mark setup as completed' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if price is standard tier pricing
 */
function isStandardPrice(price: number): boolean {
  // Standard tier prices are typically multiples of common base prices
  const standardPrices = [150, 180, 200, 225, 250, 280, 300, 320, 350, 400];
  return standardPrices.includes(price);
}

/**
 * Generate next steps based on current progress
 */
function generateNextSteps(provider: any, customizedPackages: number, totalPackages: number): string[] {
  const nextSteps: string[] = [];

  if (customizedPackages === 0) {
    nextSteps.push('Start customizing your service packages');
    nextSteps.push('Add personalized descriptions to your packages');
    nextSteps.push('Set competitive pricing for your services');
  } else if (customizedPackages < totalPackages) {
    const remaining = totalPackages - customizedPackages;
    nextSteps.push(`Customize ${remaining} remaining package${remaining > 1 ? 's' : ''}`);
    nextSteps.push('Review and adjust pricing for consistency');
  } else {
    nextSteps.push('Review all packages for accuracy');
    nextSteps.push('Set your availability schedule');
    nextSteps.push('Start promoting your services');
  }

  return nextSteps;
}

/**
 * Calculate completion time in a human-readable format
 */
function calculateCompletionTime(startTime: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes} minutes`;
  }
}

