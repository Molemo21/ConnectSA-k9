"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Building, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// TypeScript interfaces for type safety
interface BankDetails {
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
}

interface InitialBankDetails {
    bankName?: string
    bankCode?: string
    accountNumber?: string
    accountName?: string
  }

interface BankDetailsFormProps {
  onBankDetailsChange?: (bankDetails: BankDetails) => void
  initialBankDetails?: InitialBankDetails | null
  disabled?: boolean
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
const FALLBACK_BANKS: Bank[] = [
  { name: "Standard Bank", code: "198774" },
  { name: "First National Bank (FNB)", code: "198767" },
  { name: "Nedbank", code: "198770" },
  { name: "ABSA Bank", code: "044" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Investec Bank", code: "198769" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Discovery Bank", code: "679000" },
  { name: "TymeBank", code: "198775" },
  { name: "African Bank", code: "431150" }
]

// Default form state
const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: ""
}

const BankDetailsFormComponent = function BankDetailsForm({ 
  onBankDetailsChange, 
  initialBankDetails, 
  disabled = false 
}: BankDetailsFormProps) {
  const { toast } = useToast()
  
  // Initialize form state with initial data if provided
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => {
    if (initialBankDetails && typeof initialBankDetails === 'object') {
      return {
        bankName: typeof initialBankDetails.bankName === 'string' ? initialBankDetails.bankName : "",
        bankCode: typeof initialBankDetails.bankCode === 'string' ? initialBankDetails.bankCode : "",
        accountNumber: typeof initialBankDetails.accountNumber === 'string' ? initialBankDetails.accountNumber : "",
        accountName: typeof initialBankDetails.accountName === 'string' ? initialBankDetails.accountName : ""
      }
    }
    return DEFAULT_BANK_DETAILS
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [banks, setBanks] = useState<Bank[]>(FALLBACK_BANKS)
  const [isLoadingBanks, setIsLoadingBanks] = useState(true)
  const [banksError, setBanksError] = useState<string | null>(null)
  
  // Ref for callback to prevent re-renders
  const onBankDetailsChangeRef = useRef(onBankDetailsChange)
  
  // Update ref when callback changes
  useEffect(() => {
    onBankDetailsChangeRef.current = onBankDetailsChange
  }, [onBankDetailsChange])

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
        
        const data = await response.json()
        
        if (isMounted) {
          if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
            setBanks(data.data)
            console.log(`✅ Loaded ${data.data.length} banks from Paystack API`)
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
          
          // Show non-intrusive warning toast
          toast({
            title: "Using default bank list",
            description: "Could not load latest banks. Using default list.",
            variant: "default"
          })
        }
      }
    }
    
    fetchBanks()
    
    return () => {
      isMounted = false
    }
  }, [toast])

  // Form validation - STABLE CALLBACK
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!bankDetails.bankName?.trim()) {
      newErrors.bankName = "Bank name is required"
    }

    if (!bankDetails.bankCode?.trim()) {
      newErrors.bankCode = "Bank code is required"
    }

    if (!bankDetails.accountNumber?.trim()) {
      newErrors.accountNumber = "Account number is required"
    } else if (!/^\d{10,12}$/.test(bankDetails.accountNumber.trim())) {
      newErrors.accountNumber = "Account number must be 10-12 digits"
    }

    if (!bankDetails.accountName?.trim()) {
      newErrors.accountName = "Account name is required"
    } else if (bankDetails.accountName.trim().length < 2) {
      newErrors.accountName = "Account name must be at least 2 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [bankDetails]) // Keep bankDetails dependency for validation

  // Handle bank selection - NUCLEAR SOLUTION (NO PARENT CALLBACKS)
  const handleBankChange = useCallback((bankName: string) => {
    if (!bankName || typeof bankName !== 'string') {
      console.warn('Invalid bank name:', bankName)
      return
    }
    
    // Find bank by name in the fetched banks list
    const bank = banks.find(b => b && b.name === bankName)
    
    if (!bank) {
      console.warn('Bank not found in list:', bankName)
      return
    }
    
    setBankDetails(prevDetails => {
      const newBankDetails = {
        ...prevDetails,
        bankName,
        bankCode: bank.code || ""
      }
      
      // DISABLED: No parent callbacks to prevent infinite loops
      // if (!isUpdatingFromParentRef.current && onBankDetailsChangeRef.current) {
      //   onBankDetailsChangeRef.current(newBankDetails)
      // }
      
      return newBankDetails
    })
  }, [banks]) // Include banks in dependencies

  // Handle input changes - NUCLEAR SOLUTION (NO PARENT CALLBACKS)
  const handleInputChange = useCallback((field: keyof BankDetails, value: string) => {
    if (!field || typeof field !== 'string' || typeof value !== 'string') {
      console.warn('Invalid input change:', { field, value })
      return
    }
    
    setBankDetails(prevDetails => {
      const newBankDetails = {
        ...prevDetails,
      [field]: value
      }
      
      // DISABLED: No parent callbacks to prevent infinite loops
      // if (!isUpdatingFromParentRef.current && onBankDetailsChangeRef.current) {
      //   onBankDetailsChangeRef.current(newBankDetails)
      // }
      
      return newBankDetails
    })
  }, []) // NO DEPENDENCIES - using refs and functional setState

  // Handle form submission - STABLE CALLBACK
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: "Please fix errors",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Get current user to get provider ID
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) {
        throw new Error('Failed to get user information')
      }
      
      const userData = await userResponse.json()
      if (!userData.user?.provider?.id) {
        throw new Error('Provider information not found')
      }

      const response = await fetch(`/api/provider/${userData.user.provider.id}/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bankDetails),
      })

      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "Bank details saved",
          description: "Your bank details have been saved successfully"
        })
        
        // Call callback if provided to notify parent of successful save
        // Parent can then refresh data if needed
        if (onBankDetailsChangeRef.current && data.provider) {
          try {
            // Fetch fresh bank details from API to pass to parent
            const refreshResponse = await fetch(`/api/provider/${userData.user.provider.id}/bank-details`)
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.bankDetails) {
                onBankDetailsChangeRef.current!(refreshData.bankDetails)
              }
            }
          } catch (refreshError) {
            // If refresh fails, still notify parent with API response data
            console.warn('Failed to refresh bank details after save:', refreshError)
            if (data.provider) {
              onBankDetailsChangeRef.current!({
                bankName: data.provider.bankName || '',
                bankCode: data.provider.bankCode || '',
                accountNumber: data.provider.accountNumber || '', // Already masked
                accountName: data.provider.accountName || '',
              })
            }
          }
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save bank details')
      }
    } catch (error) {
      console.error('Error saving bank details:', error)
      toast({
        title: "Error saving bank details",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [validateForm, toast, bankDetails]) // Keep necessary dependencies

  // Render error fallback
  const renderErrorFallback = (error: Error) => (
    <div className="text-center py-8">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Error</h3>
      <p className="text-gray-600 mb-4">
        There was an error loading the bank details form.
      </p>
      <div className="text-xs text-gray-500 mb-4">
        Error: {error?.message || error?.toString() || 'Unknown error'}
      </div>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-blue-400 hover:bg-blue-500 text-white"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )

  // Main render function with error boundary
  try {
    // Validate that all required UI components are available
    if (!Button || !Card || !Input || !Label || !Select) {
      throw new Error('Required UI components are not available')
  }

    return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank Details</h3>
        <p className="text-gray-600">Add your bank account details for payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Banking Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Bank Selection */}
          <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Select
                value={bankDetails.bankName}
                onValueChange={handleBankChange}
                disabled={disabled || isLoadingBanks}
              >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : "Select your bank"} />
              </SelectTrigger>
              <SelectContent>
                    {isLoadingBanks ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm text-gray-500">Loading banks...</span>
                      </div>
                    ) : (
                      banks
                        .filter(bank => bank && bank.name && bank.code)
                        .map((bank) => (
                          <SelectItem key={bank.code} value={bank.name}>
                            {bank.name}
                          </SelectItem>
                        ))
                    )}
              </SelectContent>
            </Select>
                {banksError && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Using default bank list. Some banks may not be available.
                  </p>
                )}
                {errors.bankName && typeof errors.bankName === 'string' && (
                <p className="text-sm text-red-600">{errors.bankName}</p>
              )}
            </div>

            {/* Bank Code */}
            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank Code *</Label>
              <Input
                id="bankCode"
                value={bankDetails.bankCode}
                onChange={(e) => handleInputChange('bankCode', e.target.value)}
                placeholder="Bank code"
                disabled={disabled || !!bankDetails.bankName}
                className={errors.bankCode ? "border-red-500" : ""}
              />
                {errors.bankCode && typeof errors.bankCode === 'string' && (
                <p className="text-sm text-red-600">{errors.bankCode}</p>
              )}
              <p className="text-xs text-gray-500">
                Bank code is automatically filled when you select a bank
              </p>
          </div>

            {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
                value={bankDetails.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your account number"
                maxLength={12}
                disabled={disabled}
                className={errors.accountNumber ? "border-red-500" : ""}
              />
                {errors.accountNumber && typeof errors.accountNumber === 'string' && (
                <p className="text-sm text-red-600">{errors.accountNumber}</p>
              )}
            <p className="text-xs text-gray-500">
                Enter your account number (10-12 digits)
            </p>
          </div>

            {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Holder Name *</Label>
            <Input
              id="accountName"
                value={bankDetails.accountName}
              onChange={(e) => handleInputChange('accountName', e.target.value)}
                placeholder="Enter the account holder's name"
                disabled={disabled}
                className={errors.accountName ? "border-red-500" : ""}
            />
                {errors.accountName && typeof errors.accountName === 'string' && (
                <p className="text-sm text-red-600">{errors.accountName}</p>
              )}
            <p className="text-xs text-gray-500">
                Enter the name as it appears on your bank account
            </p>
          </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">!</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    Your bank details are encrypted and stored securely. We only use this information 
                    to process payments to your account. We never share your banking information 
                    with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
                disabled={disabled || isSaving}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Bank Details'
                )}
            </Button>
          </div>
      </CardContent>
    </Card>
    </div>
  )
  } catch (error) {
    console.error('BankDetailsForm rendering error:', error)
    return renderErrorFallback(error instanceof Error ? error : new Error('Unknown error'))
  }
}

// Memoize the component to prevent unnecessary re-renders
export const BankDetailsForm = React.memo(BankDetailsFormComponent, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  const prevBankDetails = prevProps.initialBankDetails
  const nextBankDetails = nextProps.initialBankDetails
  
  // Compare initialBankDetails deeply
  if (prevBankDetails === nextBankDetails) return true
  if (!prevBankDetails && !nextBankDetails) return true
  if (!prevBankDetails || !nextBankDetails) return false
  
  return (
    prevBankDetails.bankName === nextBankDetails.bankName &&
    prevBankDetails.bankCode === nextBankDetails.bankCode &&
    prevBankDetails.accountNumber === nextBankDetails.accountNumber &&
    prevBankDetails.accountName === nextBankDetails.accountName &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onBankDetailsChange === nextProps.onBankDetailsChange
  )
})

export default BankDetailsForm