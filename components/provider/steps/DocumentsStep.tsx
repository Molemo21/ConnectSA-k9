"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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

  const handleFileUpload = async (field: keyof DocumentsStepProps['data'], file: File) => {
    setUploading(field)
    try {
      // Simulate file upload - replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, just store the file name
      const fileName = `${field}_${Date.now()}_${file.name}`
      
      if (field === 'certifications' || field === 'profileImages') {
        onChange({ [field]: [...(data[field] as string[]), fileName] })
      } else {
        onChange({ [field]: fileName })
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(null)
    }
  }

  const removeFile = (field: keyof DocumentsStepProps['data'], index?: number) => {
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
              <li>• Maximum file size: 10MB per file</li>
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


