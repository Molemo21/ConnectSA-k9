"use client"

import { useState, useEffect } from "react"
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

// South African Bank Codes (Paystack supported)
const SA_BANKS = [
  { code: '044', name: 'ABSA Bank' },
  { code: '632005', name: 'Access Bank' },
  { code: '431150', name: 'African Bank' },
  { code: '198765', name: 'Bank of Athens' },
  { code: '462005', name: 'Bidvest Bank' },
  { code: '470010', name: 'Capitec Bank' },
  { code: '198766', name: 'Citibank' },
  { code: '198767', name: 'FNB Bank' },
  { code: '580105', name: 'Grindrod Bank' },
  { code: '198768', name: 'HSBC Bank' },
  { code: '198769', name: 'Investec Bank' },
  { code: '198770', name: 'Nedbank' },
  { code: '198771', name: 'Postbank' },
  { code: '198772', name: 'Rand Merchant Bank' },
  { code: '198773', name: 'Sasfin Bank' },
  { code: '198774', name: 'Standard Bank' },
  { code: '198775', name: 'TymeBank' },
  { code: '198776', name: 'Ubank' },
  { code: '198777', name: 'VBS Mutual Bank' },
]

// Helper function to get bank name from code
const getBankName = (code: string): string => {
  const bank = SA_BANKS.find(bank => bank.code === code)
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

  // Load existing bank details
  useEffect(() => {
    if (providerId) {
      loadBankDetails()
    }
  }, [providerId])

  const loadBankDetails = async () => {
    if (!providerId) return
    
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
            bankName: getBankName(data.bankDetails.bankCode),
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
  }

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    const trimmedValue = field === 'accountName' ? value.trim() : value
    setFormData(prev => ({ ...prev, [field]: trimmedValue }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBankCodeChange = (bankCode: string) => {
    const bankName = getBankName(bankCode)
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
    
    if (!formData.bankCode) errors.bankCode = 'Please select a bank'
    if (!formData.accountNumber) errors.accountNumber = 'Account number is required'
    if (!formData.accountName) errors.accountName = 'Account holder name is required'
    
    // Validate account number format
    if (formData.accountNumber && !/^\d{6,17}$/.test(formData.accountNumber)) {
      errors.accountNumber = 'Account number should be 6-17 digits'
    }
    
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
        const data = await response.json()
        const updatedDetails = {
          ...formData,
          accountNumber: data.provider?.accountNumber || '****' + formData.accountNumber.slice(-4)
        }
        setExistingDetails(updatedDetails)
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
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }
        showToast.error(errorMessage)
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
      bankName: getBankName(existingDetails!.bankCode),
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setValidationErrors({})
    if (existingDetails) {
      setFormData({
        ...existingDetails,
        accountNumber: '', // Keep empty for security
        bankName: getBankName(existingDetails.bankCode),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
                          >
                            <SelectTrigger className={validationErrors.bankCode ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select your bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {SA_BANKS.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {validationErrors.bankCode && (
                            <p className="text-sm text-red-600">{validationErrors.bankCode}</p>
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
