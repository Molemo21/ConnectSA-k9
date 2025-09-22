"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ProviderStepIndicator } from "@/components/provider/ProviderStepIndicator"
import { PersonalInfoStep } from "@/components/provider/steps/PersonalInfoStep"
import { ServicesStep } from "@/components/provider/steps/ServicesStep"
import { DocumentsStep } from "@/components/provider/steps/DocumentsStep"
import { BankingStep } from "@/components/provider/steps/BankingStep"
import { ReviewStep } from "@/components/provider/steps/ReviewStep"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle } from "lucide-react"

type Step = 'PERSONAL' | 'SERVICES' | 'DOCUMENTS' | 'BANKING' | 'REVIEW' | 'SUBMIT'

interface FormData {
  // Personal Info
  businessName: string
  description: string
  experience: number
  hourlyRate: number
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

const initialFormData: FormData = {
  businessName: "",
  description: "",
  experience: 0,
  hourlyRate: 0,
  location: "",
  selectedServices: [],
  idDocument: "",
  proofOfAddress: "",
  certifications: [],
  profileImages: [],
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: "",
}

export default function ProviderOnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>('PERSONAL')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [completedSteps, setCompletedSteps] = useState<Step[]>([])

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('provider-onboarding-data')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to load saved form data:', error)
      }
    }
  }, [])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('provider-onboarding-data', JSON.stringify(formData))
  }, [formData])

  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (response.ok) {
          const services = await response.json()
          setAvailableServices(services)
        }
      } catch (error) {
        console.error('Failed to fetch services:', error)
      }
    }

    fetchServices()
  }, [])

  const handleStepChange = (step: Step) => {
    setCurrentStep(step)
  }

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    const stepOrder: Step[] = ['PERSONAL', 'SERVICES', 'DOCUMENTS', 'BANKING', 'REVIEW', 'SUBMIT']
    const currentIndex = stepOrder.indexOf(currentStep)
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep])
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    const stepOrder: Step[] = ['PERSONAL', 'SERVICES', 'DOCUMENTS', 'BANKING', 'REVIEW', 'SUBMIT']
    const currentIndex = stepOrder.indexOf(currentStep)
    
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1]
      setCurrentStep(prevStep)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      console.log('Submitting provider onboarding data:', formData)
      
      const response = await fetch('/api/provider/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Success response:', result)
        
        // Clear saved data
        localStorage.removeItem('provider-onboarding-data')
        
        toast({
          title: "Application Submitted",
          description: "Your provider application has been submitted successfully. We'll review it within 2-3 business days.",
        })
        
        setCurrentStep('SUBMIT')
        setCompletedSteps(['PERSONAL', 'SERVICES', 'DOCUMENTS', 'BANKING', 'REVIEW', 'SUBMIT'])
  } else {
        const error = await response.json()
        console.error('Error response:', error)
        throw new Error(error.message || error.details || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'PERSONAL':
        return (
          <PersonalInfoStep
            data={{
              businessName: formData.businessName,
              description: formData.description,
              experience: formData.experience,
              hourlyRate: formData.hourlyRate,
              location: formData.location,
            }}
            onChange={(data) => handleFormDataChange(data)}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        )
      
      case 'SERVICES':
        return (
          <ServicesStep
            data={{
              selectedServices: formData.selectedServices,
            }}
            onChange={(data) => handleFormDataChange(data)}
            onNext={handleNext}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )
      
      case 'DOCUMENTS':
        return (
          <DocumentsStep
            data={{
              idDocument: formData.idDocument,
              proofOfAddress: formData.proofOfAddress,
              certifications: formData.certifications,
              profileImages: formData.profileImages,
            }}
            onChange={(data) => handleFormDataChange(data)}
            onNext={handleNext}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )
      
      case 'BANKING':
        return (
          <BankingStep
            data={{
              bankName: formData.bankName,
              bankCode: formData.bankCode,
              accountNumber: formData.accountNumber,
              accountName: formData.accountName,
            }}
            onChange={(data) => handleFormDataChange(data)}
            onNext={handleNext}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )
      
      case 'REVIEW':
        return (
          <ReviewStep
            data={formData}
            onNext={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            availableServices={availableServices}
          />
        )
      
      case 'SUBMIT':
        return (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for submitting your provider application. We'll review your information and get back to you within 2-3 business days.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/provider/pending')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Application Status
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden gradient-bg-dark">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/onboarding.jpg')"
          }}
        />
        {/* Dim overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-purple-900/20 to-slate-900/20"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <BrandHeaderClient />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Step Indicator */}
          <div className="mb-12">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-xl">
              <ProviderStepIndicator 
                step={currentStep} 
                completedSteps={completedSteps}
              />
            </div>
          </div>

          {/* Step Content with Enhanced Styling */}
          <div className="relative">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl"></div>
            <div className="relative bg-black/30 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl p-8 md:p-12">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileBottomNav userRole="PROVIDER" />
      <MobileFloatingActionButton userRole="PROVIDER" />
    </div>
  )
}