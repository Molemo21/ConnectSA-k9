import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadCatalogueImage } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/upload/catalogue-image
 * Upload a single image for catalogue items
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only providers can upload images.' },
        { status: 401 }
      );
    }

    // Get provider
    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (provider.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Provider must be approved to upload images' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const catalogueItemId = formData.get('catalogueItemId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Handle file - Next.js formData returns File-like object
    let fileName: string;
    let fileType: string;
    let fileSize: number;

    // Check if file has File-like properties
    if (typeof file === 'object' && file !== null) {
      // Extract file properties (works with File, Blob, or File-like objects)
      fileName = (file as any).name || 'image';
      fileType = (file as any).type || 'image/jpeg';
      fileSize = (file as any).size || 0;
    } else {
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // If catalogueItemId is provided, verify it belongs to the provider
    if (catalogueItemId) {
      const catalogueItem = await prisma.catalogueItem.findFirst({
        where: {
          id: catalogueItemId,
          providerId: provider.id,
        },
      });

      if (!catalogueItem) {
        return NextResponse.json(
          { error: 'Catalogue item not found or does not belong to provider' },
          { status: 404 }
        );
      }
    }

    // Convert file to Buffer for upload
    // file should have arrayBuffer() method (File or Blob)
    let buffer: Buffer;
    try {
      const arrayBuffer = await (file as any).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error converting file to buffer:', error);
      return NextResponse.json(
        { error: 'Failed to process file. Please try again.' },
        { status: 400 }
      );
    }

    // Ensure we have valid fileName and fileType
    const finalFileName = fileName || 'image';
    const finalFileType = fileType || 'image/jpeg';
    const finalCatalogueItemId = catalogueItemId && catalogueItemId.trim() ? catalogueItemId.trim() : undefined;

    // Upload image
    const result = await uploadCatalogueImage(
      buffer,
      provider.id,
      finalCatalogueItemId,
      finalFileName,
      finalFileType
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error('Error uploading catalogue image:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/catalogue-image
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Catalogue image upload endpoint',
    maxFileSize: '5MB',
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  });
}

