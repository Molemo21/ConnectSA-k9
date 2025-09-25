"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Building, User, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankDetailsFormProps {
  onBankDetailsChange?: (bankDetails: {
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
  }) => void
  initialBankDetails?: {
    bankName?: string
    bankCode?: string
    accountNumber?: string
    accountName?: string
  }
  disabled?: boolean
}

// South African banks
const SOUTH_AFRICAN_BANKS = [
  { name: "Standard Bank", code: "051" },
  { name: "First National Bank (FNB)", code: "250655" },
  { name: "Nedbank", code: "198765" },
  { name: "ABSA Bank", code: "632005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Investec Bank", code: "580105" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Discovery Bank", code: "679000" },
  { name: "TymeBank", code: "678910" },
  { name: "African Bank", code: "430000" }
]

export function BankDetailsForm({ onBankDetailsChange, initialBankDetails, disabled = false }: BankDetailsFormProps) {
  const { toast } = useToast()
  const [bankDetails, setBankDetails] = useState({
    bankName: initialBankDetails?.bankName || "",
    bankCode: initialBankDetails?.bankCode || "",
    accountNumber: initialBankDetails?.accountNumber || "",
    accountName: initialBankDetails?.accountName || ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!bankDetails.bankName) {
      newErrors.bankName = "Bank name is required"
    }

    if (!bankDetails.bankCode) {
      newErrors.bankCode = "Bank code is required"
    }

    if (!bankDetails.accountNumber) {
      newErrors.accountNumber = "Account number is required"
    } else if (!/^\d{10,12}$/.test(bankDetails.accountNumber)) {
      newErrors.accountNumber = "Account number must be 10-12 digits"
    }

    if (!bankDetails.accountName) {
      newErrors.accountName = "Account name is required"
    } else if (bankDetails.accountName.length < 2) {
      newErrors.accountName = "Account name must be at least 2 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBankChange = (bankName: string) => {
    const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === bankName)
    setBankDetails(prev => ({
      ...prev,
      bankName,
      bankCode: bank?.code || ""
    }))
    onBankDetailsChange?.({
      ...bankDetails,
      bankName,
      bankCode: bank?.code || ""
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }))
    onBankDetailsChange?.({
      ...bankDetails,
      [field]: value
    })
  }

  const handleSubmit = () => {
    if (validateForm()) {
      toast({
        title: "Bank details saved",
        description: "Your bank details have been saved successfully"
      })
      } else {
      toast({
        title: "Please fix errors",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      })
    }
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
                disabled={disabled}
              >
              <SelectTrigger>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                  {SOUTH_AFRICAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.name}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              {errors.bankName && (
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
              {errors.bankCode && (
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
              {errors.accountNumber && (
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
              {errors.accountName && (
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
              disabled={disabled}
              className="w-full"
            >
              Save Bank Details
            </Button>
          </div>
      </CardContent>
    </Card>
    </div>
  )
}
