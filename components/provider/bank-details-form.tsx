'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
];

// Helper function to get bank name from code
const getBankName = (code: string): string => {
  const bank = SA_BANKS.find(bank => bank.code === code);
  return bank?.name || '';
};

interface BankDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

interface BankDetailsFormProps {
  providerId: string;
  onSuccess?: () => void;
}

export default function BankDetailsForm({ providerId, onSuccess }: BankDetailsFormProps) {
  const [formData, setFormData] = useState<BankDetails>({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingDetails, setExistingDetails] = useState<BankDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing bank details
  useEffect(() => {
    if (providerId) {
      loadBankDetails();
    }
    
    // Cleanup function to clear any pending operations
    return () => {
      // Clear any pending operations when component unmounts
      setIsLoading(false);
      setIsSaving(false);
    };
  }, [providerId]);

  const loadBankDetails = async () => {
    if (!providerId) {
      console.warn('Provider ID not available yet');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Loading bank details for provider:', providerId);
      const url = `/api/provider/${providerId}/bank-details`;
      console.log('GET API URL:', url);
      console.log('Provider ID type:', typeof providerId);
      console.log('Provider ID length:', providerId?.length);
      console.log('Provider ID value:', JSON.stringify(providerId));
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Bank details loaded:', data);
        if (data.bankDetails) {
          setExistingDetails(data.bankDetails);
          // For form data, we need to handle masked account numbers
          // The API returns masked account numbers for display, but we need the original for editing
          // For now, we'll set empty account number in form data to force user to re-enter
          setFormData({
            ...data.bankDetails,
            accountNumber: '', // Force re-entry for security
            bankName: getBankName(data.bankDetails.bankCode), // Ensure bank name is set
          });
        }
      } else {
        console.error('Failed to load bank details:', response.status, response.statusText);
        if (response.status === 404) {
          // No bank details found yet, this is normal for new providers
          console.log('No existing bank details found');
        } else {
          toast.error(`Failed to load bank details: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error loading bank details:', error);
      toast.error('Failed to load bank details. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    // Trim whitespace for text fields
    const trimmedValue = field === 'accountName' ? value.trim() : value;
    
    setFormData(prev => ({ ...prev, [field]: trimmedValue }));
    
    // Clear any existing error messages when user starts typing
    if (field === 'accountNumber' || field === 'accountName') {
      toast.dismiss();
    }
  };

  const handleBankCodeChange = (bankCode: string) => {
    const bankName = getBankName(bankCode);
    setFormData(prev => ({
      ...prev,
      bankCode,
      bankName
    }));
    
    // Clear any existing error messages when user selects a bank
    toast.dismiss();
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.bankCode) errors.push('Please select a bank');
    if (!formData.bankName) errors.push('Please select a valid bank');
    if (!formData.accountNumber) errors.push('Account number is required');
    if (!formData.accountName) errors.push('Account holder name is required');
    
    // Validate that the selected bank code exists in our list
    if (formData.bankCode && !SA_BANKS.find(bank => bank.code === formData.bankCode)) {
      errors.push('Please select a valid bank from the list');
    }
    
    // Validate account number format (basic validation)
    if (formData.accountNumber && !/^\d{6,17}$/.test(formData.accountNumber)) {
      errors.push('Account number should be 6-17 digits');
    }
    
    // Additional validation for account number length
    if (formData.accountNumber && (formData.accountNumber.length < 6 || formData.accountNumber.length > 17)) {
      errors.push('Account number must be between 6 and 17 digits');
    }
    
    // Validate account name is not just whitespace
    if (formData.accountName && formData.accountName.trim() === '') {
      errors.push('Account holder name cannot be empty');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim account name before validation
    const trimmedFormData = {
      ...formData,
      accountName: formData.accountName.trim()
    };
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    
    // Additional validation to ensure bank name is set
    if (!trimmedFormData.bankName || trimmedFormData.bankName.trim() === '') {
      toast.error('Please select a valid bank');
      return;
    }
    
    // Additional validation to ensure account name is not just whitespace
    if (!trimmedFormData.accountName || trimmedFormData.accountName.trim() === '') {
      toast.error('Account holder name cannot be empty');
      return;
    }

    if (!providerId) {
      toast.error('Provider ID not available. Please refresh the page.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Submitting bank details for provider:', providerId, trimmedFormData);
      const url = `/api/provider/${providerId}/bank-details`;
      console.log('API URL:', url);
      console.log('Provider ID type:', typeof providerId);
      console.log('Provider ID length:', providerId?.length);
      console.log('Provider ID value:', JSON.stringify(providerId));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedFormData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        // Update existing details with the response data (which includes masked account number)
        const updatedDetails = {
          ...trimmedFormData,
          accountNumber: data.provider?.accountNumber || '****' + trimmedFormData.accountNumber.slice(-4)
        };
        setExistingDetails(updatedDetails);
        setIsEditing(false);
        toast.success('Bank details saved successfully!');
        onSuccess?.();
      } else {
        let errorMessage = 'Failed to save bank details';
        console.error('Bank details save failed:', response.status, response.statusText);
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // If we can't parse the response, check if it's HTML (likely a 404 page)
          if (response.headers.get('content-type')?.includes('text/html')) {
            errorMessage = 'API endpoint not found. Please check the server configuration.';
            console.error('Received HTML response instead of JSON. This usually means a 404 error.');
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details. Please try again.');
      // Reset form to previous state on error
      if (existingDetails) {
        setFormData({
          ...existingDetails,
          accountNumber: '', // Keep empty for security
          bankName: getBankName(existingDetails.bankCode), // Ensure bank name is set
        });
      } else {
        // Reset to empty form on error
        setFormData({
          bankName: '',
          bankCode: '',
          accountNumber: '',
          accountName: '',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Reset form data to existing details but clear account number for security
    setFormData({
      ...existingDetails!,
      accountNumber: '', // Force re-entry for security
      bankName: getBankName(existingDetails!.bankCode), // Ensure bank name is set
    });
  };

  const handleCancel = () => {
    if (existingDetails) {
      // Restore original data but keep account number empty for security
      setFormData({
        ...existingDetails,
        accountNumber: '', // Keep empty for security
        bankName: getBankName(existingDetails.bankCode), // Ensure bank name is set
      });
    } else {
      // Reset to empty form
      setFormData({
        bankName: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
      });
    }
    setIsEditing(false);
    // Clear any validation errors
    toast.dismiss();
  };

  if (!providerId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading provider information...</span>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading bank details...</span>
        </CardContent>
      </Card>
    );
  }

  if (existingDetails && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Bank Account Details
          </CardTitle>
          <CardDescription>
            Your bank account information for receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Bank</Label>
                <p className="text-sm font-medium">{existingDetails.bankName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                <p className="text-sm font-medium">{existingDetails.accountNumber}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Account Holder Name</Label>
              <p className="text-sm font-medium">{existingDetails.accountName}</p>
            </div>
            
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your bank details are configured and ready for receiving payments.
              </AlertDescription>
            </Alert>
            
            <Button onClick={handleEdit} variant="outline" className="w-full">
              Edit Bank Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          {existingDetails ? 'Edit Bank Details' : 'Add Bank Details'}
        </CardTitle>
        <CardDescription>
          Provide your bank account information to receive payments from clients
        </CardDescription>
        <div className="text-xs text-gray-500 mt-2">
          Provider ID: {providerId || 'Not set'}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank *</Label>
            <Select value={formData.bankCode} onValueChange={handleBankCodeChange}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              type="text"
              placeholder="Enter your account number"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              maxLength={17}
            />
            <p className="text-xs text-gray-500">
              {existingDetails 
                ? 'For security reasons, please re-enter your account number (6-17 digits)'
                : 'Enter your bank account number (6-17 digits)'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Holder Name *</Label>
            <Input
              id="accountName"
              type="text"
              placeholder="Enter account holder name"
              value={formData.accountName}
              onChange={(e) => handleInputChange('accountName', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              The name as it appears on your bank account
            </p>
          </div>

          {existingDetails && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Security Note:</strong> For your protection, you must re-enter your account number when updating bank details.
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Test Mode:</strong> You're currently using Paystack test credentials. 
              Bank details will be validated but no real transfers will occur.
            </AlertDescription>
          </Alert>

          {/* Test API Route Buttons */}
          <div className="space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/provider/test');
                  const data = await response.json();
                  console.log('Test API response:', data);
                  toast.success('API routing is working!');
                } catch (error) {
                  console.error('Test API error:', error);
                  toast.error('API routing test failed');
                }
              }}
              className="w-full"
            >
              Test API Routing
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/provider/health');
                  const data = await response.json();
                  console.log('Health check response:', data);
                  toast.success('Health check passed!');
                } catch (error) {
                  console.error('Health check error:', error);
                  toast.error('Health check failed');
                }
              }}
              className="w-full"
            >
              Health Check
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/provider/db-test');
                  const data = await response.json();
                  console.log('Database test response:', data);
                  if (data.status === 'success') {
                    toast.success(`Database working! Found ${data.providerCount} providers`);
                  } else {
                    toast.error('Database test failed');
                  }
                } catch (error) {
                  console.error('Database test error:', error);
                  toast.error('Database test failed');
                }
              }}
              className="w-full"
            >
              Test Database
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/me');
                  const data = await response.json();
                  console.log('Auth test response:', data);
                  if (data.provider?.id) {
                    toast.success(`Auth working! Provider ID: ${data.provider.id}`);
                  } else {
                    toast.error('Auth test failed - no provider ID');
                  }
                } catch (error) {
                  console.error('Auth test error:', error);
                  toast.error('Auth test failed');
                }
              }}
              className="w-full"
            >
              Test Auth
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={async () => {
                if (!providerId) {
                  toast.error('No provider ID available');
                  return;
                }
                try {
                  const response = await fetch(`/api/provider/${providerId}/bank-details`);
                  console.log('Direct bank details test response:', response.status, response.statusText);
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Direct bank details test data:', data);
                    toast.success('Direct bank details API working!');
                  } else {
                    toast.error(`Direct bank details API failed: ${response.status}`);
                  }
                } catch (error) {
                  console.error('Direct bank details test error:', error);
                  toast.error('Direct bank details test failed');
                }
              }}
              className="w-full"
            >
              Test Direct Bank Details API
            </Button>
          </div>

          <div className="flex gap-2">
            {existingDetails && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                existingDetails ? 'Update Details' : 'Save Details'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
