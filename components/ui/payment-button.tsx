'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaymentButton({ bookingId, amount, onSuccess, onError }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePaymentClick = () => {
    setShowConfirmation(true);
  };

  const handlePaymentConfirm = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setRedirecting(false);
    
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
      
      // Show success toast and update UI
      toast({
        title: "Payment Gateway Ready",
        description: "Redirecting to Paystack payment gateway...",
      });

      // Call onSuccess callback
      onSuccess?.();

      // IMPROVED REDIRECT MECHANISM
      console.log('🔄 Redirecting to payment gateway NOW...');
      
      // Method 1: Direct redirect (most reliable)
      try {
        // Small delay to ensure toast is shown and state is updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔄 Attempting direct redirect...');
        
        // Set redirecting state for better UX
        setRedirecting(true);
        
        // Use the most reliable redirect method
        console.log('🔄 Using window.location.href for redirect...');
        window.location.href = data.authorizationUrl;
        
        // If we reach here, redirect didn't work (shouldn't happen)
        console.log('⚠️ Redirect didn\'t work as expected, trying fallback...');
        throw new Error('Redirect failed');
        
      } catch (redirectError) {
        console.log('⚠️ Direct redirect failed, trying fallback...');
        
        // Method 2: Try window.location.replace
        try {
          console.log('🔄 Trying window.location.replace...');
          window.location.replace(data.authorizationUrl);
        } catch (replaceError) {
          console.log('⚠️ Replace redirect failed, trying new tab...');
          
          // Method 3: Open in new tab with focus
          try {
            console.log('🔄 Opening payment gateway in new tab...');
            const newWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              console.log('✅ Payment gateway opened in new tab');
              newWindow.focus();
              
              // Show clear instruction to user
              toast({
                title: "Payment Gateway Opened",
                description: "Payment gateway opened in new tab. Please complete your payment there.",
                action: {
                  label: "Switch to Payment Tab",
                  onClick: () => {
                    newWindow.focus();
                  }
                }
              });
              
              // Reset button state since we're using new tab
              setRedirecting(false);
              setIsLoading(false);
              return;
            } else {
              throw new Error('Popup blocked');
            }
          } catch (newTabError) {
            console.log('⚠️ New tab failed, showing manual option...');
            
            // Method 4: Show manual link with copy functionality
            toast({
              title: "Manual Payment Required",
              description: "Please click the button below to complete payment",
              action: {
                label: "Open Payment Gateway",
                onClick: () => {
                  try {
                    window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
                  } catch (error) {
                    console.error('Manual redirect failed:', error);
                    // Last resort: copy URL to clipboard
                    navigator.clipboard.writeText(data.authorizationUrl).then(() => {
                      toast({
                        title: "URL Copied",
                        description: "Payment URL copied to clipboard. Please paste it in a new tab.",
                      });
                    });
                  }
                }
              }
            });
            
            // Reset button state
            setRedirecting(false);
            setIsLoading(false);
          }
        }
      }
      
      // Method 5: Force redirect using form submission (most aggressive)
      if (!redirecting) {
        console.log('🔄 Trying force redirect using form submission...');
        try {
          const form = document.createElement('form');
          form.method = 'GET';
          form.action = data.authorizationUrl;
          form.target = '_self';
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
          
          // Reset button state
          setRedirecting(false);
          setIsLoading(false);
          return;
        } catch (forceError) {
          console.log('⚠️ Force redirect also failed:', forceError);
          
          // Final fallback: show manual option
          toast({
            title: "Redirect Failed",
            description: "Please manually navigate to the payment gateway",
            action: {
              label: "Copy Payment URL",
              onClick: () => {
                navigator.clipboard.writeText(data.authorizationUrl).then(() => {
                  toast({
                    title: "URL Copied",
                    description: "Payment URL copied to clipboard. Please paste it in a new tab.",
                  });
                });
              }
            }
          });
          
          // Reset button state
          setRedirecting(false);
          setIsLoading(false);
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
      setRedirecting(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Payment Confirmation</span>
          </div>
          <p className="text-blue-700 mt-2 text-sm">
            You will be redirected to Paystack's secure payment gateway to complete your payment of <strong>R{amount.toFixed(2)}</strong>.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handlePaymentConfirm}
            disabled={isLoading}
            className="flex-1"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
          
          <Button
            onClick={handlePaymentCancel}
            variant="outline"
            disabled={isLoading}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePaymentClick}
      disabled={isLoading || redirecting}
      className="w-full"
      size="lg"
    >
      {redirecting ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Redirecting to Payment Gateway...
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
