"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, User, MapPin, DollarSign, Briefcase, FileText, CreditCard, CheckCircle } from "lucide-react"

interface ReviewStepProps {
  data: {
    // Personal Info
    businessName: string
    description: string
    experience: number
    location: string
    // Services
    selectedServices: string[]
    // Documents
    idDocument: string
    proofOfAddress: string
    certifications: string[]
    profileImages: string[]
    // Banking
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
  }
  onNext: () => void
  onBack?: () => void
  isSubmitting?: boolean
  availableServices?: Array<{ id: string; name: string; category: string }>
}

export function ReviewStep({ 
  data, 
  onNext, 
  onBack, 
  isSubmitting = false,
  availableServices = []
}: ReviewStepProps) {
  const getServiceName = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId)
    return service ? service.name : serviceId
  }

  const getServiceCategory = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId)
    return service ? service.category : 'Unknown'
  }

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review your information</h2>
        <p className="text-gray-600">Please verify all details before submitting your application</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-blue-600" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Business Name</label>
                <p className="text-gray-900">{data.businessName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {data.location}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Experience</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  {data.experience} years
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900 mt-1">{data.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Services Offered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.selectedServices.map(serviceId => (
                <Badge key={serviceId} variant="secondary" className="text-sm">
                  {getServiceName(serviceId)}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {data.selectedServices.length} service{data.selectedServices.length !== 1 ? 's' : ''} selected
            </p>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">ID Document</span>
              <div className="flex items-center gap-2">
                {data.idDocument ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Uploaded</span>
                  </>
                ) : (
                  <span className="text-sm text-red-600">Required</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Proof of Address</span>
              <div className="flex items-center gap-2">
                {data.proofOfAddress ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Uploaded</span>
                  </>
                ) : (
                  <span className="text-sm text-red-600">Required</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Certifications</span>
              <span className="text-sm text-gray-600">
                {data.certifications.length} file{data.certifications.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Profile Images</span>
              <span className="text-sm text-gray-600">
                {data.profileImages.length} image{data.profileImages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Banking */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Bank</label>
                <p className="text-gray-900">{data.bankName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bank Code</label>
                <p className="text-gray-900">{data.bankCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Account Number</label>
                <p className="text-gray-900 font-mono">{maskAccountNumber(data.accountNumber)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Account Name</label>
                <p className="text-gray-900">{data.accountName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Ready to submit?</p>
            <p className="text-blue-700">
              Your application will be reviewed within 2-3 business days. You'll receive an email notification once the review is complete.
            </p>
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
            Back to Edit
          </Button>
        )}
        <Button 
          onClick={onNext} 
          disabled={isSubmitting}
          className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 order-1 sm:order-2"
        >
          <div className="flex items-center space-x-2">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
}


