"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DocumentsStepProps {
  data: {
    idDocument: string
    proofOfAddress: string
    certifications: string[]
    profileImages: string[]
  }
  onChange: (data: Partial<DocumentsStepProps['data']>) => void
  onNext: () => void
  onBack?: () => void
  errors?: Partial<Record<keyof DocumentsStepProps['data'], string>>
  isSubmitting?: boolean
}

export function DocumentsStep({ 
  data, 
  onChange, 
  onNext, 
  onBack, 
  errors = {}, 
  isSubmitting = false 
}: DocumentsStepProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileUpload = async (field: keyof DocumentsStepProps['data'], file: File) => {
    setUploading(field)
    
    try {
      // Validate file type and size
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload files smaller than 5MB',
          variant: 'destructive',
        })
        return
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload JPG, PNG, or PDF files only',
          variant: 'destructive',
        })
        return
      }

      // Map field name to API document type
      const getDocumentType = (field: string): string => {
        if (field === 'idDocument') return 'id-document'
        if (field === 'proofOfAddress') return 'proof-of-address'
        if (field === 'certifications') return 'certification'
        if (field === 'profileImages') return 'profile-image'
        return 'certification'
      }

      const documentType = getDocumentType(field)
      
      // Delete old file if replacing ID document or proof of address
      if (field === 'idDocument' && data.idDocument) {
        await handleDeleteDocument(data.idDocument);
      }
      if (field === 'proofOfAddress' && data.proofOfAddress) {
        await handleDeleteDocument(data.proofOfAddress);
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

      const result = await response.json()
      const fileUrl = result.url || result.signedUrl

      if (!fileUrl) {
        throw new Error('No URL returned from upload')
      }

      // Update form data with the signed URL
      if (field === 'certifications' || field === 'profileImages') {
        onChange({ [field]: [...(data[field] as string[]), fileUrl] })
      } else {
        onChange({ [field]: fileUrl })
      }

      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded`,
      })
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(null)
    }
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

  const removeFile = async (field: keyof DocumentsStepProps['data'], index?: number) => {
    let urlToDelete: string | undefined;

    if (field === 'certifications' || field === 'profileImages') {
      const files = data[field] as string[]
      if (index !== undefined && files[index]) {
        urlToDelete = files[index];
      }
    } else {
      urlToDelete = data[field] as string;
    }

    // Try to delete from storage if URL exists
    if (urlToDelete) {
      await handleDeleteDocument(urlToDelete);
    }

    // Remove from local state (always happens, even if storage delete fails)
    if (field === 'certifications' || field === 'profileImages') {
      const files = data[field] as string[]
      const newFiles = index !== undefined ? files.filter((_, i) => i !== index) : []
      onChange({ [field]: newFiles })
    } else {
      onChange({ [field]: '' })
    }
  }

  const isFormValid = () => {
    return data.idDocument && data.proofOfAddress
  }

  const handleNext = () => {
    if (isFormValid()) {
      onNext()
    }
  }

  const FileUploadArea = ({ 
    field, 
    title, 
    description, 
    required = false,
    multiple = false,
    accept = "image/*,.pdf"
  }: {
    field: keyof DocumentsStepProps['data']
    title: string
    description: string
    required?: boolean
    multiple?: boolean
    accept?: string
  }) => {
    const hasValue = multiple ? (data[field] as string[]).length > 0 : !!data[field]
    const isUploadingField = uploading === field

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {required && <span className="text-red-500">*</span>}
          {hasValue && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            id={field}
            accept={accept}
            multiple={multiple}
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                if (multiple) {
                  Array.from(files).forEach(file => handleFileUpload(field, file))
                } else {
                  handleFileUpload(field, files[0])
                }
              }
            }}
            className="hidden"
            disabled={isUploadingField}
          />
          <label htmlFor={field} className="cursor-pointer">
            {isUploadingField ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  {accept.includes('image') ? 'Images or PDF' : 'PDF only'}
                </span>
              </div>
            )}
          </label>
        </div>

        {/* Display uploaded files */}
        {hasValue && (
          <div className="space-y-2">
            {multiple ? (
              (data[field] as string[]).map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(field, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{data[field]}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(field)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {errors[field] && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors[field]}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your documents</h2>
        <p className="text-gray-600">We need to verify your identity and qualifications</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <FileUploadArea
            field="idDocument"
            title="ID Document"
            description="Upload a clear photo or scan of your South African ID, passport, or driver's license"
            required
            accept="image/*,.pdf"
          />

          <FileUploadArea
            field="proofOfAddress"
            title="Proof of Address"
            description="Upload a recent utility bill, bank statement, or municipal account (not older than 3 months)"
            required
            accept="image/*,.pdf"
          />

          <FileUploadArea
            field="certifications"
            title="Professional Certifications"
            description="Upload any relevant certificates, licenses, or qualifications (optional but recommended)"
            multiple
            accept="image/*,.pdf"
          />

          <FileUploadArea
            field="profileImages"
            title="Profile Photos"
            description="Upload 2-3 photos of your work or yourself for your profile (optional)"
            multiple
            accept="image/*"
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Requirements:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• All documents must be clear and readable</li>
              <li>• Photos should be well-lit and in focus</li>
              <li>• PDF files are preferred for documents</li>
              <li>• Maximum file size: 5MB per file</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        {onBack && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 h-12 sm:h-11 order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid() || isSubmitting}
          className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 order-1 sm:order-2"
        >
          <div className="flex items-center space-x-2">
            <span>Next: Banking</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  )
}


