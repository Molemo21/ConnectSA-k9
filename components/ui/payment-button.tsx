'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentButton({ bookingId, amount, onSuccess, onError }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting payment process for booking:', bookingId);
      
      const response = await fetch(`/api/book-service/${bookingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callbackUrl: `${window.location.origin}/dashboard?payment=success&booking=${bookingId}`
        }),
      });

      const data = await response.json();
      console.log('📡 Payment API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Check if we got the authorization URL
      if (!data.authorizationUrl) {
        console.error('❌ No authorization URL received from API');
        throw new Error('No payment URL received from payment service');
      }

      console.log('✅ Payment initialized successfully, redirecting to:', data.authorizationUrl);
      
      // Show success toast
      toast({
        title: "Payment Initiated",
        description: "Redirecting to payment gateway...",
      });

      // Call onSuccess callback
      onSuccess?.();

      // CRITICAL FIX: Ensure redirect happens immediately
      console.log('🔄 Redirecting to payment gateway NOW...');
      
      // Try multiple redirect methods to ensure it works
      try {
        // Method 1: Direct window.location.href
        window.location.href = data.authorizationUrl;
      } catch (redirectError) {
        console.error('❌ Primary redirect method failed:', redirectError);
        
        // Method 2: Try window.open as fallback
        try {
          const newWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            console.log('✅ Payment gateway opened in new tab');
            // Focus the new window
            newWindow.focus();
          } else {
            throw new Error('Popup blocked');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback redirect method failed:', fallbackError);
          
          // Method 3: Show manual link
          toast({
            title: "Redirect Failed",
            description: "Please click the link to complete payment",
            action: {
              label: "Open Payment Gateway",
              onClick: () => window.open(data.authorizationUrl, '_blank')
            }
          });
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('❌ Payment error:', error);
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay R{amount.toFixed(2)}
        </>
      )}
    </Button>
  );
}
