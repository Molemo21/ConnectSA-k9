import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const bulkUpdateSchema = z.object({
  providerId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    title: z.string().min(1),
    shortDesc: z.string().min(1),
    longDesc: z.string().optional(),
    price: z.number().positive(),
    durationMins: z.number().positive(),
    isActive: z.boolean()
  }))
});

/**
 * POST /api/provider/catalogue/bulk-update
 * Bulk update catalogue items for a provider
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Bulk updating catalogue items...');

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = bulkUpdateSchema.parse(body);

    // Verify provider ownership
    const provider = await prisma.provider.findFirst({
      where: {
        id: validated.providerId,
        userId: user.id
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update items in batches
    const updatePromises = validated.items.map(async (item) => {
      return prisma.catalogueItem.update({
        where: {
          id: item.id,
          providerId: validated.providerId // Ensure ownership
        },
        data: {
          title: item.title,
          shortDesc: item.shortDesc,
          longDesc: item.longDesc || '',
          price: item.price,
          durationMins: item.durationMins,
          isActive: item.isActive,
          updatedAt: new Date()
        }
      });
    });

    const updatedItems = await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${updatedItems.length} catalogue items`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedItems.length} items`,
      updatedCount: updatedItems.length
    });

  } catch (error) {
    console.error('❌ Error bulk updating catalogue items:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update catalogue items' },
      { status: 500 }
    );
  }
}

