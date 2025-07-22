import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProviderStatus } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { status, comment } = await request.json();

  if (!Object.values(ProviderStatus).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Get the admin user from the request
  const admin = await getUserFromRequest(request);
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: { status },
    });

    // Create a ProviderReview record
    await prisma.providerReview.create({
      data: {
        providerId: id,
        adminId: admin.id,
        comment: comment || '',
        status,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 