"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, CreditCard, Shield, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BankingStepProps {
  data: {
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
  }
  onChange: (data: Partial<BankingStepProps['data']>) => void
  onNext: () => void
  onBack?: () => void
  errors?: Partial<Record<keyof BankingStepProps['data'], string>>
  isSubmitting?: boolean
}

// Bank type from Paystack API
interface Bank {
  code: string
  name: string
  slug?: string
  type?: string
  country?: string
  currency?: string
}

// Fallback banks in case API fails (using correct Paystack codes)
// NOTE: "470010" (Capitec) removed - it's invalid according to Paystack API
const FALLBACK_BANKS: Bank[] = [
  { name: "Standard Bank", code: "198774" },
  { name: "First National Bank (FNB)", code: "198767" },
  { name: "Nedbank", code: "198770" },
  { name: "ABSA Bank", code: "044" },
  { name: "Investec Bank", code: "198769" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Discovery Bank", code: "679000" },
  { name: "TymeBank", code: "198775" },
  { name: "African Bank", code: "431150" }
]

export function BankingStep({ 
  data, 
  onChange, 
  onNext, 
  onBack, 
  errors = {}, 
  isSubmitting = false 
}: BankingStepProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [banks, setBanks] = useState<Bank[]>(FALLBACK_BANKS)
  const [isLoadingBanks, setIsLoadingBanks] = useState(true)
  const [banksError, setBanksError] = useState<string | null>(null)

  // Fetch banks from Paystack API on mount
  useEffect(() => {
    let isMounted = true
    
    const fetchBanks = async () => {
      setIsLoadingBanks(true)
      setBanksError(null)
      
      try {
        const response = await fetch('/api/paystack/banks?country=ZA&currency=ZAR')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch banks: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (isMounted) {
          if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            setBanks(result.data)
            console.log(`✅ Loaded ${result.data.length} banks from Paystack API`)
          } else {
            console.warn('⚠️ No banks returned from API, using fallback')
            setBanks(FALLBACK_BANKS)
          }
          setIsLoadingBanks(false)
        }
      } catch (error) {
        console.error('❌ Failed to fetch banks from Paystack:', error)
        if (isMounted) {
          setBanksError(error instanceof Error ? error.message : 'Failed to load banks')
          setBanks(FALLBACK_BANKS) // Use fallback on error
          setIsLoadingBanks(false)
        }
      }
    }
    
    fetchBanks()
    
    return () => {
      isMounted = false
    }
  }, [])

  const handleFieldChange = (field: keyof BankingStepProps['data'], value: string) => {
    // If bank name changes, auto-update bank code
    if (field === 'bankName') {
      const selectedBank = banks.find(b => b.name === value)
      if (selectedBank) {
        onChange({ 
          [field]: value,
          bankCode: selectedBank.code 
        })
      } else {
        onChange({ [field]: value })
      }
    } else {
      onChange({ [field]: value })
    }
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const isFormValid = () => {
    return (
      data.bankName.trim().length > 0 &&
      data.bankCode.trim().length > 0 &&
      data.accountNumber.trim().length >= 8 &&
      data.accountName.trim().length > 0
    )
  }

  const handleNext = () => {
    if (isFormValid()) {
      onNext()
    }
  }

  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 20 digits
    return digits.slice(0, 20)
  }

  const formatBankCode = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Banking details</h2>
        <p className="text-gray-600">We need your banking information to process payments</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-sm font-medium">
                Bank Name *
              </Label>
              <select
                id="bankName"
                value={data.bankName}
                onChange={(e) => handleFieldChange('bankName', e.target.value)}
                disabled={isLoadingBanks}
                className={cn(
                  "w-full h-12 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.bankName && touched.bankName && "border-red-500 focus:border-red-500",
                  isLoadingBanks && "opacity-50 cursor-not-allowed"
                )}
              >
                <option value="">
                  {isLoadingBanks ? "Loading banks..." : "Select your bank"}
                </option>
                {banks
                  .filter(bank => bank && bank.name && bank.code)
                  .map(bank => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
              </select>
              {banksError && (
                <p className="text-xs text-yellow-600">
                  ⚠️ Using default bank list. Some banks may not be available.
                </p>
              )}
              {errors.bankName && touched.bankName && (
                <p className="text-sm text-red-600">{errors.bankName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCode" className="text-sm font-medium">
                Bank Code *
              </Label>
              <Input
                id="bankCode"
                value={data.bankCode}
                onChange={(e) => handleFieldChange('bankCode', formatBankCode(e.target.value))}
                placeholder="Auto-filled when bank is selected"
                disabled={!!data.bankName}
                className={cn(
                  "h-12",
                  errors.bankCode && touched.bankCode && "border-red-500 focus:border-red-500",
                  data.bankName && "bg-gray-50"
                )}
              />
              <p className="text-xs text-gray-500">
                Bank code is automatically filled when you select a bank
              </p>
              {errors.bankCode && touched.bankCode && (
                <p className="text-sm text-red-600">{errors.bankCode}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="text-sm font-medium">
              Account Number *
            </Label>
            <Input
              id="accountNumber"
              value={data.accountNumber}
              onChange={(e) => handleFieldChange('accountNumber', formatAccountNumber(e.target.value))}
              placeholder="e.g., 1234567890"
              className={cn(
                "h-12",
                errors.accountNumber && touched.accountNumber && "border-red-500 focus:border-red-500"
              )}
            />
            <p className="text-xs text-gray-500">
              Enter your account number (8-20 digits)
            </p>
            {errors.accountNumber && touched.accountNumber && (
              <p className="text-sm text-red-600">{errors.accountNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-sm font-medium">
              Account Holder Name *
            </Label>
            <Input
              id="accountName"
              value={data.accountName}
              onChange={(e) => handleFieldChange('accountName', e.target.value)}
              placeholder="e.g., John Smith"
              className={cn(
                "h-12",
                errors.accountName && touched.accountName && "border-red-500 focus:border-red-500"
              )}
            />
            <p className="text-xs text-gray-500">
              Must match the name on your bank account
            </p>
            {errors.accountName && touched.accountName && (
              <p className="text-sm text-red-600">{errors.accountName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Your banking information is secure:</p>
            <ul className="space-y-1 text-green-700">
              <li>• All data is encrypted and stored securely</li>
              <li>• We only use this information to process payments</li>
              <li>• Your banking details are never shared with clients</li>
              <li>• You can update this information anytime in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important:</p>
            <p className="text-yellow-700">
              Please double-check your banking details. Incorrect information may delay or prevent payments from reaching you.
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
            Back
          </Button>
        )}
        <Button 
          onClick={handleNext} 
          disabled={!isFormValid() || isSubmitting}
          className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 order-1 sm:order-2"
        >
          <div className="flex items-center space-x-2">
            <span>Next: Review</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  )
}


