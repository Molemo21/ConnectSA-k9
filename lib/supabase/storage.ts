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

    console.log('Deleting image from storage:', {
      bucket: BUCKET_NAME,
      filePath,
    });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Supabase storage delete error:', {
        error,
        filePath,
        bucket: BUCKET_NAME,
      });
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    console.log('Successfully deleted image:', {
      filePath,
      bucket: BUCKET_NAME,
      data,
    });
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

    console.log('Deleting document from storage:', {
      bucket: DOCUMENTS_BUCKET_NAME,
      filePath,
    });

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Supabase storage delete error:', {
        error,
        filePath,
        bucket: DOCUMENTS_BUCKET_NAME,
      });
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    console.log('Successfully deleted document:', {
      filePath,
      bucket: DOCUMENTS_BUCKET_NAME,
      data,
    });
  } catch (error) {
    console.error('Error in deleteOnboardingDocument:', error);
    throw error;
  }
}

/**
 * Extract file path from signed URL
 * Supabase signed URL format: https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
 */
export function extractFilePathFromSignedUrl(signedUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(signedUrl);
    
    // Extract path from signed URL structure
    // Path format: /storage/v1/object/sign/{bucket}/{path}
    const escapedBucket = bucketName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/sign/${escapedBucket}/(.+)$`));
    
    if (pathMatch && pathMatch[1]) {
      // Decode the path (it might be URL-encoded)
      // Try decoding, but if it fails, use the original
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(pathMatch[1]);
      } catch {
        // If decoding fails, use the original path
        decodedPath = pathMatch[1];
      }
      
      // Log for debugging
      console.log('Extracted path from signed URL:', {
        originalPath: pathMatch[1],
        decodedPath,
        fullUrl: signedUrl,
      });
      
      return decodedPath;
    }
    
    // Try alternative: check if path is in query params (some Supabase versions)
    const pathFromQuery = url.searchParams.get('path');
    if (pathFromQuery) {
      console.log('Found path in query params:', pathFromQuery);
      return decodeURIComponent(pathFromQuery);
    }
    
    console.warn('Could not extract path from signed URL:', {
      pathname: url.pathname,
      bucketName,
      fullUrl: signedUrl,
    });
    
    return null;
  } catch (error) {
    console.error('Error extracting file path from signed URL:', error, {
      signedUrl,
      bucketName,
    });
    return null;
  }
}

/**
 * Extract file path from public URL
 * Supabase public URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 */
export function extractFilePathFromPublicUrl(publicUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(publicUrl);
    
    // Extract path from public URL structure
    // Path format: /storage/v1/object/public/{bucket}/{path}
    const escapedBucket = bucketName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/public/${escapedBucket}/(.+)$`));
    
    if (pathMatch && pathMatch[1]) {
      // Decode the path (it might be URL-encoded)
      // Try decoding, but if it fails, use the original
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(pathMatch[1]);
      } catch {
        // If decoding fails, use the original path
        decodedPath = pathMatch[1];
      }
      
      // Log for debugging
      console.log('Extracted path from public URL:', {
        originalPath: pathMatch[1],
        decodedPath,
        fullUrl: publicUrl,
      });
      
      return decodedPath;
    }
    
    console.warn('Could not extract path from public URL:', {
      pathname: url.pathname,
      bucketName,
      fullUrl: publicUrl,
    });
    
    return null;
  } catch (error) {
    console.error('Error extracting file path from public URL:', error, {
      publicUrl,
      bucketName,
    });
    return null;
  }
}

/**
 * List all documents for a provider (admin access)
 * Returns all document paths organized by type
 */
export async function listProviderDocuments(
  providerId: string
): Promise<{
  idDocument?: string[];
  proofOfAddress?: string[];
  certifications: string[];
  profileImages: string[];
}> {
  try {
    const supabase = createSupabaseServerClient();
    const basePath = `providers/${providerId}/onboarding/`;

    const result = {
      idDocument: [] as string[],
      proofOfAddress: [] as string[],
      certifications: [] as string[],
      profileImages: [] as string[],
    };

    // List each document type folder separately
    const documentTypes: Array<{ type: 'id-document' | 'proof-of-address' | 'certification' | 'profile-image', key: keyof typeof result }> = [
      { type: 'id-document', key: 'idDocument' },
      { type: 'proof-of-address', key: 'proofOfAddress' },
      { type: 'certification', key: 'certifications' },
      { type: 'profile-image', key: 'profileImages' },
    ];

    for (const { type, key } of documentTypes) {
      const folderPath = `${basePath}${type}/`;
      
      try {
        const { data, error } = await supabase.storage
          .from(DOCUMENTS_BUCKET_NAME)
          .list(folderPath, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (error) {
          // Folder might not exist yet, which is fine
          if (error.message?.includes('not found')) {
            continue;
          }
          console.error(`Error listing ${type}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          // Filter out folders (folders don't have metadata like id)
          const files = data.filter((item) => item.id !== null && item.name);
          
          for (const file of files) {
            if (file.name) {
              result[key].push(`${folderPath}${file.name}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${type} folder:`, error);
        // Continue with other document types
      }
    }

    return result;
  } catch (error) {
    console.error('Error in listProviderDocuments:', error);
    throw error;
  }
}

/**
 * Get signed URLs for multiple document paths (admin access)
 * Returns signed URLs organized by document type
 */
export async function getProviderDocumentUrls(
  providerId: string,
  expiresIn: number = 24 * 60 * 60 // 24 hours default
): Promise<{
  idDocument?: string[];
  proofOfAddress?: string[];
  certifications: string[];
  profileImages: string[];
}> {
  try {
    // List all documents for the provider
    const documents = await listProviderDocuments(providerId);

    // Generate signed URLs for each document
    const supabase = createSupabaseServerClient();
    const result = {
      idDocument: [] as string[],
      proofOfAddress: [] as string[],
      certifications: [] as string[],
      profileImages: [] as string[],
    };

    // Process ID documents
    if (documents.idDocument && documents.idDocument.length > 0) {
      for (const path of documents.idDocument) {
        try {
          const { data, error } = await supabase.storage
            .from(DOCUMENTS_BUCKET_NAME)
            .createSignedUrl(path, expiresIn);

          if (!error && data?.signedUrl) {
            result.idDocument.push(data.signedUrl);
          }
        } catch (error) {
          console.error(`Error generating signed URL for ${path}:`, error);
        }
      }
    }

    // Process proof of address
    if (documents.proofOfAddress && documents.proofOfAddress.length > 0) {
      for (const path of documents.proofOfAddress) {
        try {
          const { data, error } = await supabase.storage
            .from(DOCUMENTS_BUCKET_NAME)
            .createSignedUrl(path, expiresIn);

          if (!error && data?.signedUrl) {
            result.proofOfAddress.push(data.signedUrl);
          }
        } catch (error) {
          console.error(`Error generating signed URL for ${path}:`, error);
        }
      }
    }

    // Process certifications
    if (documents.certifications && documents.certifications.length > 0) {
      for (const path of documents.certifications) {
        try {
          const { data, error } = await supabase.storage
            .from(DOCUMENTS_BUCKET_NAME)
            .createSignedUrl(path, expiresIn);

          if (!error && data?.signedUrl) {
            result.certifications.push(data.signedUrl);
          }
        } catch (error) {
          console.error(`Error generating signed URL for ${path}:`, error);
        }
      }
    }

    // Process profile images
    if (documents.profileImages && documents.profileImages.length > 0) {
      for (const path of documents.profileImages) {
        try {
          const { data, error } = await supabase.storage
            .from(DOCUMENTS_BUCKET_NAME)
            .createSignedUrl(path, expiresIn);

          if (!error && data?.signedUrl) {
            result.profileImages.push(data.signedUrl);
          }
        } catch (error) {
          console.error(`Error generating signed URL for ${path}:`, error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error in getProviderDocumentUrls:', error);
    throw error;
  }
}

