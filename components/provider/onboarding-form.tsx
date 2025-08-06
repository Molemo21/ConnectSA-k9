"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { User, Briefcase, FileText, Upload, CheckCircle, AlertCircle, MapPin, DollarSign, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import type { AuthUser } from "@/lib/auth"
import type { Provider } from "@prisma/client"

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

  useEffect(() => {
    async function fetchServices() {
      setLoadingServices(true);
      setServicesError(null);
      try {
        const res = await fetch("/api/services");
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

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (readOnly) return;
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

  const handleSubmit = async () => {
    if (readOnly) return;
    setIsLoading(true)
    try {
      const response = await fetch("/api/provider/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
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
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Enter your business name"
                  disabled={readOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Business Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your services, experience, and what makes you unique..."
                  rows={4}
                  disabled={readOnly}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    disabled={readOnly}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-sm font-medium">Hourly Rate (R) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="150"
                    min="0"
                    step="0.01"
                    disabled={readOnly}
                    required
                  />
                </div>
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
              <div className="grid md:grid-cols-2 gap-4">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedServices.includes(service.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.selectedServices.includes(service.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}>
                        {formData.selectedServices.includes(service.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Service Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Johannesburg, Pretoria, Cape Town"
                  disabled={readOnly}
                  required
                />
                <p className="text-xs text-gray-500">
                  Enter the city or area where you provide services
                </p>
              </div>
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
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
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
