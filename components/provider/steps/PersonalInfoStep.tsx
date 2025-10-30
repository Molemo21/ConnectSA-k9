"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, User, MapPin, DollarSign, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface PersonalInfoStepProps {
  data: {
    businessName: string
    description: string
    experience: number
    location: string
  }
  onChange: (data: Partial<PersonalInfoStepProps['data']>) => void
  onNext: () => void
  onBack?: () => void
  errors?: Partial<Record<keyof PersonalInfoStepProps['data'], string>>
  isSubmitting?: boolean
}

export function PersonalInfoStep({ 
  data, 
  onChange, 
  onNext, 
  onBack, 
  errors = {}, 
  isSubmitting = false 
}: PersonalInfoStepProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleFieldChange = (field: keyof PersonalInfoStepProps['data'], value: string | number) => {
    onChange({ [field]: value })
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const isFormValid = () => {
    return (
      data.businessName.trim().length >= 2 &&
      data.description.trim().length >= 20 &&
      data.experience >= 0 &&
      data.location.trim().length >= 2
    )
  }

  const handleNext = () => {
    if (isFormValid()) {
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg shadow-blue-500/25">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
          Tell us about yourself
        </h2>
        <p className="text-white text-lg max-w-2xl mx-auto drop-shadow-lg font-medium">
          Help clients understand your business and expertise. This information will be displayed on your profile.
        </p>
      </div>

      <Card className="border-0 shadow-2xl bg-black/20 backdrop-blur-md border-white/30">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="businessName" className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>
                Business Name *
              </Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => handleFieldChange('businessName', e.target.value)}
                placeholder="e.g., John's Plumbing Services"
                className={cn(
                  "h-14 bg-black/30 border-white/30 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300",
                  errors.businessName && touched.businessName && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                )}
              />
              {errors.businessName && touched.businessName && (
                <p className="text-sm text-red-300 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full shadow-lg"></div>
                Location *
              </Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-blue-400 transition-colors duration-300" />
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="e.g., Cape Town, South Africa"
                  className={cn(
                    "h-14 pl-12 bg-black/30 border-white/30 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300",
                    errors.location && touched.location && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  )}
                />
              </div>
              {errors.location && touched.location && (
                <p className="text-sm text-red-300 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg"></div>
              Business Description *
            </Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe your business, specialties, and what makes you unique. Be specific about your experience and approach..."
              className={cn(
                "min-h-[140px] resize-none bg-black/30 border-white/30 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-300",
                errors.description && touched.description && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
              )}
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>Minimum 20 characters</span>
              <span className={data.description.length > 450 ? "text-yellow-400" : ""}>{data.description.length}/500</span>
            </div>
            {errors.description && touched.description && (
              <p className="text-sm text-red-300 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="experience" className="text-sm font-bold text-white flex items-center gap-2 drop-shadow-lg">
                <div className="w-2 h-2 bg-orange-400 rounded-full shadow-lg"></div>
                Years of Experience *
              </Label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-orange-400 transition-colors duration-300" />
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={data.experience || ''}
                  onChange={(e) => handleFieldChange('experience', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={cn(
                    "h-14 pl-12 bg-black/30 border-white/30 text-white placeholder:text-white/70 focus:bg-black/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-300",
                    errors.experience && touched.experience && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  )}
                />
              </div>
              {errors.experience && touched.experience && (
                <p className="text-sm text-red-300 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.experience}
                </p>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-8">
        {onBack && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack} 
            className="flex-1 h-14 sm:h-12 order-2 sm:order-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid() || isSubmitting}
          className="flex-1 h-14 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 order-1 sm:order-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <span className="font-semibold">Next: Services</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Button>
      </div>
    </div>
  )
}
