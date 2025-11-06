"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Image, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadProps {
  onDocumentsChange: (documents: {
    idDocument?: string
    proofOfAddress?: string
    certifications: string[]
    profileImages: string[]
  }) => void
  initialDocuments?: {
    idDocument?: string
    proofOfAddress?: string
    certifications: string[]
    profileImages: string[]
  }
  disabled?: boolean
}

export function DocumentUpload({ onDocumentsChange, initialDocuments, disabled = false }: DocumentUploadProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState({
    idDocument: initialDocuments?.idDocument || "",
    proofOfAddress: initialDocuments?.proofOfAddress || "",
    certifications: initialDocuments?.certifications || [],
    profileImages: initialDocuments?.profileImages || []
  })

  const [uploading, setUploading] = useState<string | null>(null)

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return

    // Validate file type and size
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or PDF files only",
        variant: "destructive"
      })
      return
    }

    // Map component type to API document type
    const getDocumentType = (type: string): string => {
      if (type === 'idDocument') return 'id-document'
      if (type === 'proofOfAddress') return 'proof-of-address'
      if (type.startsWith('certification')) return 'certification'
      if (type.startsWith('profileImage')) return 'profile-image'
      return 'certification' // default
    }

    const documentType = getDocumentType(type)
    setUploading(type)

    try {
      // Delete old file if replacing ID document or proof of address
      if (type === 'idDocument' && documents.idDocument) {
        await handleDeleteDocument(documents.idDocument);
      }
      if (type === 'proofOfAddress' && documents.proofOfAddress) {
        await handleDeleteDocument(documents.proofOfAddress);
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      // Upload to API
      const response = await fetch('/api/upload/onboarding-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      const fileUrl = data.url || data.signedUrl

      if (!fileUrl) {
        throw new Error('No URL returned from upload')
      }

      // Update documents state
      const updatedDocs = { ...documents }
      if (type === 'idDocument') {
        updatedDocs.idDocument = fileUrl
      } else if (type === 'proofOfAddress') {
        updatedDocs.proofOfAddress = fileUrl
      } else if (type.startsWith('certification')) {
        const index = parseInt(type.split('-')[1])
        // Ensure array is large enough
        while (updatedDocs.certifications.length <= index) {
          updatedDocs.certifications.push('')
        }
        updatedDocs.certifications[index] = fileUrl
      } else if (type.startsWith('profileImage')) {
        const index = parseInt(type.split('-')[1])
        // Ensure array is large enough
        while (updatedDocs.profileImages.length <= index) {
          updatedDocs.profileImages.push('')
        }
        updatedDocs.profileImages[index] = fileUrl
      }

      setDocuments(updatedDocs)

      // Notify parent component of changes
      onDocumentsChange({
        idDocument: updatedDocs.idDocument,
        proofOfAddress: updatedDocs.proofOfAddress,
        certifications: updatedDocs.certifications,
        profileImages: updatedDocs.profileImages,
      })
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(null)
    }
  }

  const addCertification = () => {
    setDocuments(prev => ({
      ...prev,
      certifications: [...prev.certifications, ""]
    }))
  }

  const handleDeleteDocument = async (url: string) => {
    if (!url || !url.includes('supabase.co')) return;

    try {
      const response = await fetch('/api/upload/onboarding-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Delete failed' }));
        console.warn('Failed to delete from storage:', error);
        // Continue anyway - remove from UI
        return false;
      } else {
        toast({
          title: 'Document deleted',
          description: 'Document has been removed from storage',
        });
        return true;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      // Continue anyway - remove from UI
      return false;
    }
  };

  const removeCertification = async (index: number) => {
    const url = documents.certifications[index];

    // If URL exists and is a Supabase URL, try to delete from storage
    if (url) {
      await handleDeleteDocument(url);
    }

    // Remove from local state (always happens, even if storage delete fails)
    const updatedCertifications = documents.certifications.filter((_, i) => i !== index);
    setDocuments(prev => ({
      ...prev,
      certifications: updatedCertifications,
    }));

    // Notify parent
    onDocumentsChange({
      ...documents,
      certifications: updatedCertifications,
    });
  };

  const addProfileImage = () => {
    setDocuments(prev => ({
      ...prev,
      profileImages: [...prev.profileImages, ""]
    }))
  }

  const removeProfileImage = async (index: number) => {
    const url = documents.profileImages[index];

    // If URL exists and is a Supabase URL, try to delete from storage
    if (url) {
      await handleDeleteDocument(url);
    }

    // Remove from local state (always happens)
    const updatedProfileImages = documents.profileImages.filter((_, i) => i !== index);
    setDocuments(prev => ({
      ...prev,
      profileImages: updatedProfileImages,
    }));

    // Notify parent
    onDocumentsChange({
      ...documents,
      profileImages: updatedProfileImages,
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Verification</h3>
        <p className="text-gray-600">Upload required documents for verification</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ID Document */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>ID Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="idDocument">Government ID (Required)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a clear photo of your ID document (passport, driver's license, or national ID)
                </p>
                <Input
                  id="idDocument"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'idDocument')
                  }}
                  disabled={disabled || uploading === 'idDocument'}
                />
              </div>
              {documents.idDocument && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">ID document uploaded</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proof of Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Proof of Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="proofOfAddress">Address Verification (Required)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Upload a utility bill, bank statement, or lease agreement (not older than 3 months)
                </p>
                <Input
                  id="proofOfAddress"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'proofOfAddress')
                  }}
                  disabled={disabled || uploading === 'proofOfAddress'}
                />
              </div>
              {documents.proofOfAddress && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Proof of address uploaded</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Professional Certifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload any professional certifications, licenses, or qualifications
            </p>
            
            {documents.certifications.map((cert, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, `certification-${index}`)
                  }}
                  disabled={disabled || uploading === `certification-${index}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCertification(index)}
                  disabled={disabled}
                >
                  Remove
                </Button>
                {cert && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addCertification}
              disabled={disabled}
              className="w-full"
            >
              Add Certification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Profile Images</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload photos of your work, tools, or completed projects (optional but recommended)
            </p>
            
            {documents.profileImages.map((image, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, `profileImage-${index}`)
                  }}
                  disabled={disabled || uploading === `profileImage-${index}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProfileImage(index)}
                  disabled={disabled}
                >
                  Remove
                </Button>
                {image && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addProfileImage}
              disabled={disabled}
              className="w-full"
            >
              Add Profile Image
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Uploading {uploading}...</span>
        </div>
      )}
    </div>
  )
}
