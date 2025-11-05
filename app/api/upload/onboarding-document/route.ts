import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  uploadOnboardingDocument,
  validateDocumentFile,
  type OnboardingDocumentType,
} from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_DOCUMENT_TYPES: OnboardingDocumentType[] = [
  'id-document',
  'proof-of-address',
  'certification',
  'profile-image',
];

/**
 * POST /api/upload/onboarding-document
 * Upload a document for provider onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only providers can upload documents.' },
        { status: 401 }
      );
    }

    // Get or create provider record
    // Providers are usually created during signup, but we'll handle edge cases
    let provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true },
    });

    if (!provider) {
      // Create minimal provider record if it doesn't exist
      // This can happen in edge cases during onboarding
      try {
        provider = await prisma.provider.create({
          data: {
            userId: user.id,
            status: 'INCOMPLETE',
          },
          select: { id: true, status: true },
        });
      } catch (error) {
        console.error('Error creating provider record:', error);
        return NextResponse.json(
          { error: 'Failed to initialize provider record. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!VALID_DOCUMENT_TYPES.includes(documentType as OnboardingDocumentType)) {
      return NextResponse.json(
        {
          error: `Invalid document type. Allowed types: ${VALID_DOCUMENT_TYPES.join(', ')}`,
        },
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
      fileName = (file as any).name || 'document';
      fileType = (file as any).type || 'application/pdf';
      fileSize = (file as any).size || 0;
    } else {
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateDocumentFile(fileType, fileSize);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to Buffer for upload
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
    const finalFileName = fileName || 'document';
    const finalFileType = fileType || 'application/pdf';

    // Upload document
    const result = await uploadOnboardingDocument(
      buffer,
      provider.id,
      documentType as OnboardingDocumentType,
      finalFileName,
      finalFileType
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      signedUrl: result.signedUrl,
      path: result.path,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Error uploading onboarding document:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload document',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/onboarding-document
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Onboarding document upload endpoint',
    maxFileSize: '5MB',
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    documentTypes: VALID_DOCUMENT_TYPES,
  });
}

