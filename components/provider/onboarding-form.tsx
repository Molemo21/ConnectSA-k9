"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { User, Briefcase, FileText, Upload, CheckCircle, AlertCircle, MapPin, DollarSign } from "lucide-react"
import type { AuthUser } from "@/lib/auth"
import type { Provider } from "@prisma/client"

interface ProviderOnboardingFormProps {
  user: AuthUser
  provider: Provider & {
    services: Array<{
      service: {
        id: string
        name: string
        category: string
      }
    }>
  }
}

export function ProviderOnboardingForm({ user, provider }: ProviderOnboardingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: provider.businessName || "",
    description: provider.description || "",
    experience: provider.experience || 0,
    hourlyRate: provider.hourlyRate || 0,
    location: provider.location || "",
    selectedServices: provider.services.map((s) => s.service.id) || [],
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const availableServices = [
    { id: "1", name: "House Cleaning", category: "Cleaning" },
    { id: "2", name: "Plumbing", category: "Maintenance" },
    { id: "3", name: "Electrical Work", category: "Maintenance" },
    { id: "4", name: "Painting", category: "Home Improvement" },
    { id: "5", name: "Garden Services", category: "Outdoor" },
    { id: "6", name: "Moving Services", category: "Logistics" },
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
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
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }))
  }

  const getStepIcon = (step: number) => {
    if (step < currentStep) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (step === currentStep) return <div className="w-5 h-5 bg-primary rounded-full" />
    return <div className="w-5 h-5 bg-gray-300 rounded-full" />
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-gray-600">Tell us about yourself and your business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName">Business Name (Optional)</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., John's Cleaning Services"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={formData.experience || ""}
                  onChange={(e) => setFormData({ ...formData, experience: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="location">Service Area</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="e.g., Cape Town, Johannesburg"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">About You</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience, specialties, and what makes you unique..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Services & Pricing</h2>
              <p className="text-gray-600">Select the services you offer and set your rates</p>
            </div>

            <div>
              <Label className="text-base font-medium">Services You Offer</Label>
              <p className="text-sm text-gray-600 mb-4">Select all services you can provide</p>
              <div className="grid md:grid-cols-2 gap-3">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.selectedServices.includes(service.id)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.category}</p>
                      </div>
                      {formData.selectedServices.includes(service.id) && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="hourlyRate">Base Hourly Rate (ZAR)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  placeholder="e.g., 150"
                  className="pl-10"
                  value={formData.hourlyRate || ""}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                This is your base rate. You can adjust pricing for specific services later.
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
              <p className="text-gray-600">Upload required documents for verification</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">ID Document</Label>
                <p className="text-sm text-gray-600 mb-3">Upload a clear photo of your South African ID</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Proof of Address</Label>
                <p className="text-sm text-gray-600 mb-3">Recent utility bill or bank statement</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Certifications (Optional)</Label>
                <p className="text-sm text-gray-600 mb-3">Any relevant certificates or qualifications</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB each</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
              <p className="text-gray-600">Review your information before submitting</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business Name:</span>
                    <span>{formData.businessName || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span>{formData.experience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Area:</span>
                    <span>{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span>R{formData.hourlyRate}/hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedServices.map((serviceId) => {
                      const service = availableServices.find((s) => s.id === serviceId)
                      return service ? (
                        <Badge key={serviceId} variant="secondary">
                          {service.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Your profile will be reviewed by our team</li>
                      <li>• We'll verify your documents and information</li>
                      <li>• You'll receive an email notification once approved</li>
                      <li>• Approval typically takes 1-3 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Profile Completion</h3>
            <span className="text-sm text-gray-600">
              {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center space-x-2">
                  {getStepIcon(step)}
                  <span className={`text-sm ${step <= currentStep ? "text-gray-900" : "text-gray-500"}`}>
                    Step {step}
                  </span>
                </div>
                {step < 4 && <div className="w-8 h-px bg-gray-300 mx-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit for Review"}
          </Button>
        )}
      </div>
    </div>
  )
}
