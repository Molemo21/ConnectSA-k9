"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  Banknote, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  CreditCard, 
  ArrowLeft,
  Edit3,
  Save,
  X,
  Info,
  Lock
} from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { showToast } from "@/lib/toast"
import Link from "next/link"

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
// NOTE: These should match what Paystack actually accepts
const FALLBACK_BANKS: Bank[] = [
  { name: "Standard Bank", code: "051" },
  { name: "First National Bank (FNB)", code: "198767" },
  { name: "Nedbank", code: "198770" },
  { name: "ABSA Bank", code: "044" },
  { name: "Investec Bank", code: "198769" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Discovery Bank", code: "679000" },
  { name: "TymeBank", code: "198775" },
  { name: "African Bank", code: "431150" }
]

// Helper function to get bank name from code (uses fetched banks)
const getBankName = (code: string, banks: Bank[]): string => {
  const bank = banks.find(bank => bank.code === code)
  return bank?.name || ''
}

interface BankDetails {
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  recipientCode?: string
}

interface ProviderBankDetailsContentProps {
  providerId: string
}

export function ProviderBankDetailsContent({ providerId }: ProviderBankDetailsContentProps) {
  const [formData, setFormData] = useState<BankDetails>({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [existingDetails, setExistingDetails] = useState<BankDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [banks, setBanks] = useState<Bank[]>(FALLBACK_BANKS)
  const [isLoadingBanks, setIsLoadingBanks] = useState(true)
  const [banksError, setBanksError] = useState<string | null>(null)
  const [banksSource, setBanksSource] = useState<'api' | 'fallback' | 'loading'>('loading')
  const [banksCount, setBanksCount] = useState<number>(0)

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
        
        // Log full API response for debugging
        console.group('🔍 Paystack Banks API Response')
        console.log('Response Status:', response.status, response.statusText)
        console.log('Response Data:', data)
        console.log('Success:', data.success)
        console.log('Source:', data.source || 'paystack')
        console.log('Banks Count:', data.data?.length || 0)
        if (data.debug) {
          console.log('Debug Info:', data.debug)
        }
        console.groupEnd()
        
        if (isMounted) {
          if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
            setBanks(data.data)
            setBanksSource('api')
            setBanksCount(data.data.length)
            console.log(`✅ Loaded ${data.data.length} banks from Paystack API`)
            console.log('📋 Bank codes loaded:', data.data.map((b: Bank) => `${b.name} (${b.code})`).join(', '))
            console.log('📊 API Response source:', data.source || 'paystack')
            
            // Log sample bank structure for verification
            if (data.data.length > 0) {
              console.log('📝 Sample bank structure:', data.data[0])
            }
          } else {
            console.warn('⚠️ No banks returned from API, using fallback')
            setBanks(FALLBACK_BANKS)
            setBanksSource('fallback')
            setBanksCount(FALLBACK_BANKS.length)
            console.log('📋 Using fallback banks:', FALLBACK_BANKS.map(b => `${b.name} (${b.code})`).join(', '))
          }
          setIsLoadingBanks(false)
        }
      } catch (error) {
        console.error('❌ Failed to fetch banks from Paystack:', error)
        if (isMounted) {
          setBanksError(error instanceof Error ? error.message : 'Failed to load banks')
          setBanks(FALLBACK_BANKS) // Use fallback on error
          setBanksSource('fallback')
          setBanksCount(FALLBACK_BANKS.length)
          setIsLoadingBanks(false)
          console.log('📋 Using fallback banks due to error:', FALLBACK_BANKS.map(b => `${b.name} (${b.code})`).join(', '))
        }
      }
    }
    
    fetchBanks()
    
    return () => {
      isMounted = false
    }
  }, [])

  const loadBankDetails = useCallback(async () => {
    if (!providerId || banks.length === 0) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/provider/${providerId}/bank-details`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.bankDetails) {
          setExistingDetails(data.bankDetails)
          setFormData({
            ...data.bankDetails,
            accountNumber: '', // Force re-entry for security
            bankName: getBankName(data.bankDetails.bankCode, banks),
          })
        }
      } else if (response.status === 404) {
        // No bank details found yet, this is normal for new providers
        console.log('No existing bank details found')
      } else {
        showToast.error(`Failed to load bank details: ${response.status}`)
      }
    } catch (error) {
      console.error('Error loading bank details:', error)
      showToast.error('Failed to load bank details. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }, [providerId, banks])

  // Load existing bank details after banks are loaded
  useEffect(() => {
    if (providerId && !isLoadingBanks && banks.length > 0) {
      loadBankDetails()
    }
  }, [providerId, isLoadingBanks, banks.length, loadBankDetails])

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    const trimmedValue = field === 'accountName' ? value.trim() : value
    setFormData(prev => ({ ...prev, [field]: trimmedValue }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBankCodeChange = (bankCode: string) => {
    const bankName = getBankName(bankCode, banks)
    setFormData(prev => ({
      ...prev,
      bankCode,
      bankName
    }))
    
    // Clear validation error
    if (validationErrors.bankCode) {
      setValidationErrors(prev => ({ ...prev, bankCode: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.bankCode) {
      errors.bankCode = 'Please select a bank'
    } else {
      // Validate that the selected bank code exists in the fetched banks list
      const bankExists = banks.some(bank => bank.code === formData.bankCode)
      if (!bankExists) {
        errors.bankCode = 'Selected bank is not valid. Please refresh the page to reload bank list.'
      }
    }
    
    if (!formData.accountNumber) errors.accountNumber = 'Account number is required'
    
    // Validate account number format
    if (formData.accountNumber && !/^\d{6,17}$/.test(formData.accountNumber)) {
      errors.accountNumber = 'Account number should be 6-17 digits'
    }
    
    if (!formData.accountName) errors.accountName = 'Account holder name is required'
    
    // Validate account name is not just whitespace
    if (formData.accountName && formData.accountName.trim() === '') {
      errors.accountName = 'Account holder name cannot be empty'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (!providerId) {
      showToast.error('Provider ID not available. Please refresh the page.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/provider/${providerId}/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Reload bank details from API to ensure UI reflects database state
        // This ensures we display exactly what was saved, including any server-side transformations
        await loadBankDetails()
        
        setIsEditing(false)
        showToast.success('Bank details saved successfully!')
        
        // Clear form data
        setFormData({
          bankName: '',
          bankCode: '',
          accountNumber: '',
          accountName: '',
        })
      } else {
        let errorMessage = 'Failed to save bank details'
        let errorDetails = ''
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData.details || ''
          
          // If there's a field-specific error, set it in validation errors
          if (errorData.field && errorData.details) {
            setValidationErrors(prev => ({
              ...prev,
              [errorData.field]: errorData.details
            }))
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }
        
        // Show detailed error message
        if (errorDetails) {
          showToast.error(`${errorMessage}: ${errorDetails}`)
        } else {
          showToast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error saving bank details:', error)
      showToast.error('Failed to save bank details. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      ...existingDetails!,
      accountNumber: '', // Force re-entry for security
      bankName: getBankName(existingDetails!.bankCode, banks),
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setValidationErrors({})
    if (existingDetails) {
      setFormData({
        ...existingDetails,
        accountNumber: '', // Keep empty for security
        bankName: getBankName(existingDetails.bankCode, banks),
      })
    } else {
      setFormData({
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading your bank details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg-light">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Link 
                href="/provider/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Bank Account Details
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Set up your bank account to receive payments from completed jobs
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form/Details */}
            <div className="lg:col-span-2">
              {existingDetails && !isEditing ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Bank Details Configured
                        </CardTitle>
                        <CardDescription>
                          Your account is ready to receive payments
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Bank</Label>
                          <p className="text-lg font-semibold text-gray-900">{existingDetails.bankName}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                          <p className="text-lg font-mono font-semibold text-gray-900">{existingDetails.accountNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Account Holder Name</Label>
                        <p className="text-lg font-semibold text-gray-900">{existingDetails.accountName}</p>
                      </div>
                      
                      <Separator />
                      
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Payment Ready:</strong> Your bank details are configured and ready for receiving payments from completed jobs.
                        </AlertDescription>
                      </Alert>
                      
                      <Button onClick={handleEdit} className="w-full" size="lg">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update Bank Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Banknote className="w-5 h-5" />
                      {existingDetails ? 'Update Bank Details' : 'Add Bank Details'}
                    </CardTitle>
                    <CardDescription>
                      Provide your bank account information to receive payments from clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankCode" className="text-sm font-medium">
                            Bank *
                          </Label>
                          <Select 
                            value={formData.bankCode} 
                            onValueChange={handleBankCodeChange}
                            disabled={isLoadingBanks}
                          >
                            <SelectTrigger className={validationErrors.bankCode ? 'border-red-500' : ''}>
                              <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : "Select your bank"} />
                            </SelectTrigger>
                            <SelectContent>
                              {banks.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {validationErrors.bankCode && (
                            <p className="text-sm text-red-600">{validationErrors.bankCode}</p>
                          )}
                          {banksError && (
                            <p className="text-xs text-yellow-600">
                              ⚠️ Using fallback bank list. Some banks may not be available.
                            </p>
                          )}
                          {!isLoadingBanks && !banksError && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>
                                {banksSource === 'api' 
                                  ? `Loaded ${banksCount} banks from Paystack API`
                                  : `Using ${banksCount} fallback banks`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accountNumber" className="text-sm font-medium">
                            Account Number *
                          </Label>
                          <Input
                            id="accountNumber"
                            type="text"
                            placeholder="Enter your account number"
                            value={formData.accountNumber}
                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                            maxLength={17}
                            className={validationErrors.accountNumber ? 'border-red-500' : ''}
                          />
                          {validationErrors.accountNumber ? (
                            <p className="text-sm text-red-600">{validationErrors.accountNumber}</p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {existingDetails 
                                ? 'For security reasons, please re-enter your account number (6-17 digits)'
                                : 'Enter your bank account number (6-17 digits)'
                              }
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accountName" className="text-sm font-medium">
                            Account Holder Name *
                          </Label>
                          <Input
                            id="accountName"
                            type="text"
                            placeholder="Enter account holder name"
                            value={formData.accountName}
                            onChange={(e) => handleInputChange('accountName', e.target.value)}
                            className={validationErrors.accountName ? 'border-red-500' : ''}
                          />
                          {validationErrors.accountName ? (
                            <p className="text-sm text-red-600">{validationErrors.accountName}</p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              The name as it appears on your bank account
                            </p>
                          )}
                        </div>
                      </div>

                      {existingDetails && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Security Note:</strong> For your protection, you must re-enter your account number when updating bank details.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-3">
                        {existingDetails && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleCancel}
                            className="flex-1"
                            size="lg"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="flex-1"
                          size="lg"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {existingDetails ? 'Update Details' : 'Save Details'}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Info & Security */}
            <div className="space-y-6">
              {/* Security Info */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Security & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Encrypted Storage</p>
                      <p className="text-xs text-gray-600">Your bank details are encrypted and stored securely</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Access Control</p>
                      <p className="text-xs text-gray-600">Only you can view and update your bank details</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Verified Payments</p>
                      <p className="text-xs text-gray-600">Payments are processed through secure payment gateways</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Payment Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <p className="text-sm text-gray-700">Complete a job for a client</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <p className="text-sm text-gray-700">Payment is held in escrow</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">3</span>
                      </div>
                      <p className="text-sm text-gray-700">Funds transferred to your bank account</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank List Status */}
              <Card className={`shadow-lg border-0 ${
                banksSource === 'api' 
                  ? 'bg-green-50 border-green-200' 
                  : banksSource === 'fallback'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 text-lg ${
                    banksSource === 'api' 
                      ? 'text-green-900' 
                      : banksSource === 'fallback'
                      ? 'text-yellow-900'
                      : 'text-gray-900'
                  }`}>
                    {banksSource === 'api' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : banksSource === 'fallback' ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                    )}
                    Bank List Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingBanks ? (
                    <p className="text-sm text-gray-800">
                      Loading banks from Paystack API...
                    </p>
                  ) : banksSource === 'api' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-800">
                        <strong>✅ Successfully loaded {banksCount} banks from Paystack API</strong>
                      </p>
                      <p className="text-xs text-green-700">
                        All bank codes are validated and up-to-date from Paystack.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Using fallback bank list ({banksCount} banks)</strong>
                      </p>
                      <p className="text-xs text-yellow-700">
                        Could not fetch from Paystack API. Using cached list. Some banks may not be available.
                      </p>
                      {banksError && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Error: {banksError}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Mode Notice */}
              <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                    <Info className="w-5 h-5" />
                    Test Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800">
                    <strong>Currently in Test Mode:</strong> You're using Paystack test credentials. 
                    Bank details will be validated but no real transfers will occur.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
