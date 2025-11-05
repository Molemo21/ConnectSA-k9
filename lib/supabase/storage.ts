import { createSupabaseServerClient } from './client';

const BUCKET_NAME = 'catalogue-images';
const DOCUMENTS_BUCKET_NAME = 'provider-documents';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for catalogue image
 * Structure: providers/{providerId}/catalogue/{itemId}/{timestamp}-{filename}
 */
export function generateImagePath(
  providerId: string,
  catalogueItemId?: string,
  filename?: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const sanitizedFilename = filename
    ? filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    : 'image';

  const itemId = catalogueItemId || 'new';
  return `providers/${providerId}/catalogue/${itemId}/${timestamp}-${randomId}-${sanitizedFilename}`;
}

/**
 * Upload a single image to Supabase Storage
 * Note: This function only accepts Buffer to avoid File class issues in Node.js
 */
export async function uploadCatalogueImage(
  fileBuffer: Buffer,
  providerId: string,
  catalogueItemId: string | undefined,
  fileName: string,
  fileType: string
): Promise<{ url: string; path: string }> {
  try {
    const supabase = createSupabaseServerClient();

    // Generate file path
    const filename = fileName || 'image';
    const filePath = generateImagePath(providerId, catalogueItemId, filename);

    // Use provided content type or default to jpeg
    const contentType = fileType || 'image/jpeg';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600', // Cache for 1 hour
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Error uploading catalogue image:', error);
    throw error;
  }
}

/**
 * Upload multiple images to Supabase Storage
 * Note: This function expects Buffers with metadata, not File objects
 */
export async function uploadCatalogueImages(
  files: Array<{ buffer: Buffer; fileName: string; fileType: string }>,
  providerId: string,
  catalogueItemId?: string
): Promise<{ url: string; path: string }[]> {
  const uploadPromises = files.map((file) =>
    uploadCatalogueImage(
      file.buffer,
      providerId,
      catalogueItemId,
      file.fileName,
      file.fileType
    )
  );

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteCatalogueImage(filePath: string): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteCatalogueImage:', error);
    throw error;
  }
}

/**
 * Get public URL for an image
 */
export function getImagePublicUrl(filePath: string): string {
  const supabase = createSupabaseServerClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

// ============================================================================
// ONBOARDING DOCUMENT UPLOAD FUNCTIONS
// ============================================================================

export type OnboardingDocumentType = 
  | 'id-document' 
  | 'proof-of-address' 
  | 'certification' 
  | 'profile-image';

/**
 * Generate a unique file path for onboarding documents
 * Structure: providers/{providerId}/onboarding/{documentType}/{timestamp}-{filename}
 */
export function generateDocumentPath(
  providerId: string,
  documentType: OnboardingDocumentType,
  filename?: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const sanitizedFilename = filename
    ? filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    : documentType === 'certification' ? 'certification' : 'document';

  return `providers/${providerId}/onboarding/${documentType}/${timestamp}-${randomId}-${sanitizedFilename}`;
}

/**
 * Validate document file (supports PDF and images)
 */
export function validateDocumentFile(
  fileType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Upload an onboarding document to Supabase Storage (private bucket)
 * Returns signed URL for secure access
 */
export async function uploadOnboardingDocument(
  fileBuffer: Buffer,
  providerId: string,
  documentType: OnboardingDocumentType,
  fileName: string,
  fileType: string
): Promise<{ url: string; path: string; signedUrl: string; expiresAt: string }> {
  try {
    const supabase = createSupabaseServerClient();

    // Generate file path
    const filePath = generateDocumentPath(providerId, documentType, fileName);

    // Upload to Supabase Storage (private bucket)
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600', // Cache for 1 hour
      });

    if (error) {
      console.error('Supabase document upload error:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    // Generate signed URL (24 hour expiry)
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      throw new Error('Failed to generate signed URL for document');
    }

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      url: signedUrlData.signedUrl, // Use signed URL as the main URL
      path: filePath,
      signedUrl: signedUrlData.signedUrl,
      expiresAt,
    };
  } catch (error) {
    console.error('Error uploading onboarding document:', error);
    throw error;
  }
}

/**
 * Get signed URL for an onboarding document (regenerate if expired)
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn: number = 24 * 60 * 60 // 24 hours default
): Promise<{ signedUrl: string; expiresAt: string }> {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      signedUrl: data.signedUrl,
      expiresAt,
    };
  } catch (error) {
    console.error('Error getting document signed URL:', error);
    throw error;
  }
}

/**
 * Delete an onboarding document from Supabase Storage
 */
export async function deleteOnboardingDocument(filePath: string): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteOnboardingDocument:', error);
    throw error;
  }
}

