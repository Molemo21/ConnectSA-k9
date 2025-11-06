import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProviderDocumentUrls } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/providers/[id]/documents
 * Get signed URLs for all provider documents (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate admin
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: providerId } = await Promise.resolve(params);

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Get signed URLs for all provider documents
    // Use 24 hour expiry for admin viewing
    const expiresIn = 24 * 60 * 60; // 24 hours
    const documentUrls = await getProviderDocumentUrls(providerId, expiresIn);

    return NextResponse.json({
      success: true,
      documents: {
        idDocument: documentUrls.idDocument || [],
        proofOfAddress: documentUrls.proofOfAddress || [],
        certifications: documentUrls.certifications || [],
        profileImages: documentUrls.profileImages || [],
      },
    });
  } catch (error) {
    console.error('Error fetching provider documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

