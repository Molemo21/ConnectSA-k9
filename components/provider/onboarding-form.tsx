"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { User, Briefcase, FileText, Upload, CheckCircle, AlertCircle, MapPin, DollarSign, ArrowRight, ArrowLeft, Loader2, Save } from "lucide-react"
import type { AuthUser } from "@/lib/auth"
import type { Provider } from "@prisma/client"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useFormValidation } from "@/hooks/use-form-validation"
import { MobileInputField, MobileTextareaField } from "@/components/ui/mobile-form-field"
import { MobileServiceSelector } from "@/components/ui/mobile-service-selector"

interface ProviderOnboardingFormProps {
  user: AuthUser
  provider?: Provider & {
    services: Array<{
      service: {
        id: string
        name: string
        category: string
      }
    }>
  }
  readOnly?: boolean
  feedback?: string
}

export function ProviderOnboardingForm({ user, provider, readOnly = false, feedback }: ProviderOnboardingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const safeProvider = provider || {
    businessName: "",
    description: "",
    experience: 0,
    hourlyRate: 0,
    location: "",
    services: []
  };
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: safeProvider.businessName || "",
    description: safeProvider.description || "",
    experience: safeProvider.experience || 0,
    hourlyRate: safeProvider.hourlyRate || 0,
    location: safeProvider.location || "",
    selectedServices: Array.isArray(safeProvider.services) ? safeProvider.services.map((s: any) => s.service.id) : [],
  })

  // Dynamic fetching of services
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Form validation rules
  const validationRules = {
    businessName: { required: true, minLength: 2, maxLength: 100 },
    description: { required: true, minLength: 20, maxLength: 500 },
    experience: { required: true, min: 0, max: 50 },
    hourlyRate: { required: true, min: 1, max: 10000 },
    location: { required: true, minLength: 2, maxLength: 100 },
    selectedServices: { 
      required: true, 
      custom: (value: string[]) => value.length === 0 ? "At least one service must be selected" : null 
    }
  }

  // Form validation
  const {
    errors,
    touched,
    isValid,
    getFieldError,
    hasFieldError,
    markTouched,
    markAllTouched
  } = useFormValidation(formData, validationRules, 1000) // 1 second debounce

  // Auto-save functionality
  const { loadFromLocalStorage, clearLocalStorage, manualSave, isSaving } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      // Save to API endpoint (draft mode)
      const response = await fetch("/api/provider/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isDraft: true }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save draft')
      }
    },
    saveInterval: 3000, // Save every 3 seconds
    localStorageKey: `provider-onboarding-${user.id}`,
    enableLocalStorage: true
  })

  useEffect(() => {
    async function fetchServices() {
      setLoadingServices(true);
      setServicesError(null);
      try {
        const res = await fetch("/api/services", {
          credentials: 'include'
        });
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setAvailableServices(data);
      } catch (err) {
        setServicesError("Could not load services. Please try again later.");
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = loadFromLocalStorage()
    if (savedDraft && !provider) {
      setFormData(prev => ({ ...prev, ...savedDraft }))
      toast({
        title: "Draft loaded",
        description: "Your previous progress has been restored",
        duration: 3000,
      })
    }
  }, [loadFromLocalStorage, provider, toast])

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (readOnly) return;
    
    // Mark current step fields as touched
    const currentStepFields = getCurrentStepFields()
    currentStepFields.forEach(field => markTouched(field))
    
    // Check if current step is valid
    const currentStepErrors = currentStepFields.filter(field => hasFieldError(field))
    if (currentStepErrors.length > 0) {
      toast({
        title: "Please fix errors",
        description: "Please complete all required fields before continuing",
        variant: "destructive",
      })
      return
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (readOnly) return;
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getCurrentStepFields = () => {
    switch (currentStep) {
      case 1: return ['businessName', 'description', 'experience', 'hourlyRate']
      case 2: return ['selectedServices']
      case 3: return ['location']
      default: return []
    }
  }

  const handleSubmit = async () => {
    if (readOnly) return;
    
    // Mark all fields as touched to show all errors
    markAllTouched()
    
    if (!isValid) {
      toast({
        title: "Please fix errors",
        description: "Please complete all required fields before submitting",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch("/api/provider/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Clear draft after successful submission
        clearLocalStorage()
        
        toast({
          title: "Profile submitted!",
          description: "Your profile has been submitted for review. We'll notify you once approved.",
        })
        router.push("/provider/pending")
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to submit profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleService = (serviceId: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }))
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return User
      case 2: return Briefcase
      case 3: return MapPin
      case 4: return FileText
      default: return User
    }
  }

  const renderStepContent = () => {
    const Icon = getStepIcon(currentStep)

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Information</h3>
              <p className="text-gray-600">Tell us about your business and experience</p>
            </div>

            <div className="space-y-4">
              <MobileInputField
                label="Business Name *"
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                error={getFieldError('businessName')}
                touched={touched.businessName}
                placeholder="Enter your business name"
                disabled={readOnly}
                required
              />

              <MobileTextareaField
                label="Business Description *"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={getFieldError('description')}
                touched={touched.description}
                placeholder="Describe your services, experience, and what makes you unique..."
                rows={4}
                disabled={readOnly}
                required
              />

              <div className="grid md:grid-cols-2 gap-4">
                <MobileInputField
                  label="Years of Experience *"
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  error={getFieldError('experience')}
                  touched={touched.experience}
                  placeholder="0"
                  min="0"
                  disabled={readOnly}
                  required
                />

                <MobileInputField
                  label="Hourly Rate (R) *"
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  error={getFieldError('hourlyRate')}
                  touched={touched.hourlyRate}
                  placeholder="150"
                  min="0"
                  step="0.01"
                  disabled={readOnly}
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Services Offered</h3>
              <p className="text-gray-600">Select the services you provide</p>
            </div>

            {loadingServices ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading services...</span>
                </div>
              </div>
            ) : servicesError ? (
              <div className="p-4 bg-red-50 rounded-lg text-red-700">
                {servicesError}
              </div>
            ) : (
              <MobileServiceSelector
                services={availableServices}
                selectedServices={formData.selectedServices}
                onServiceToggle={toggleService}
                maxSelections={20}
                disabled={readOnly}
              />
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Area</h3>
              <p className="text-gray-600">Where do you provide your services?</p>
            </div>

            <div className="space-y-4">
              <MobileInputField
                label="Service Location *"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={getFieldError('location')}
                touched={touched.location}
                placeholder="e.g., Johannesburg, Pretoria, Cape Town"
                disabled={readOnly}
                required
              />
              <p className="text-xs text-gray-500">
                Enter the city or area where you provide services
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h3>
              <p className="text-gray-600">Review your information before submitting</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Business Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {formData.businessName}</div>
                    <div><span className="font-medium">Experience:</span> {formData.experience} years</div>
                    <div><span className="font-medium">Rate:</span> R{formData.hourlyRate}/hour</div>
                    <div><span className="font-medium">Location:</span> {formData.location}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Services</h4>
                  <div className="space-y-1">
                    {formData.selectedServices.map((serviceId) => {
                      const service = availableServices.find(s => s.id === serviceId)
                      return (
                        <Badge key={serviceId} variant="secondary" className="mr-1 mb-1">
                          {service?.name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{formData.description}</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
          <div className="flex items-center space-x-4">
            {/* Auto-save indicator */}
            <div className="flex items-center space-x-2">
              {isSaving ? (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Auto-saved</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Manual Save Button */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={manualSave}
          disabled={isSaving || readOnly}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Progress'}</span>
        </Button>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 mb-1">Profile Review Feedback</h4>
              <p className="text-sm text-orange-700">{feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || readOnly}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={readOnly}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || readOnly}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Submit Profile</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
