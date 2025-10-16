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

// Structured logging utility for frontend
const createLogger = (context: string) => ({
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

export function PaymentButton({ bookingId, amount, onSuccess, onError }: PaymentButtonProps) {
  const logger = createLogger('PaymentButton');
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePaymentClick = () => {
    logger.info('Payment button clicked', { bookingId, amount });
    setShowConfirmation(true);
  };

  const handlePaymentConfirm = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setRedirecting(false);
    
    try {
      logger.info('Starting payment process', { bookingId, amount });
      
      const response = await fetch(`/api/book-service/${bookingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent for authentication
        body: JSON.stringify({
          callbackUrl: `${window.location.origin}/dashboard?payment=success&booking=${bookingId}`
        }),
      });

      const data = await response.json();
      logger.info('Payment API response received', { 
        bookingId, 
        status: response.status, 
        success: data.success,
        hasAuthorizationUrl: !!data.authorizationUrl 
      });

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Payment initialization failed';
        logger.error('Payment API error', { bookingId, status: response.status, error: errorMessage });
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          logger.warn('Authentication error, redirecting to login', { bookingId });
          
          // Show error message before redirect
          toast({
            title: "Authentication Required",
            description: "Please log in to complete your payment.",
            variant: "destructive",
          });
          
          // Small delay to show the message, then redirect
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
          
          // Don't reset loading state - keep button in loading state during redirect
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Validate response data
      if (!data.success) {
        const errorMessage = data.message || 'Payment initialization failed';
        logger.error('Payment initialization failed', { bookingId, error: errorMessage });
        throw new Error(errorMessage);
      }

      // Check if we got the authorization URL
      if (!data.authorizationUrl) {
        logger.error('No authorization URL received', { bookingId, responseData: data });
        throw new Error('No payment URL received from payment service');
      }

      logger.info('Payment initialized successfully, preparing redirect', { 
        bookingId, 
        authorizationUrl: data.authorizationUrl 
      });
      
      // Show success toast
      toast({
        title: "Payment Gateway Ready",
        description: "Redirecting to Paystack payment gateway...",
      });

      // Call onSuccess callback
      onSuccess?.();

      // Redirect to payment gateway
      logger.info('Redirecting to payment gateway', { bookingId });
      setRedirecting(true);
      
      // Multiple redirect methods for reliability
      try {
        // Method 1: Direct redirect (most reliable)
        window.location.href = data.authorizationUrl;
      } catch (redirectError) {
        logger.warn('Direct redirect failed, trying alternative methods', { 
          bookingId, 
          error: redirectError instanceof Error ? redirectError.message : 'Unknown error'
        });
        
        try {
          // Method 2: Location replace
          window.location.replace(data.authorizationUrl);
        } catch (replaceError) {
          logger.warn('Location replace failed, trying window.open', { 
            bookingId, 
            error: replaceError instanceof Error ? replaceError.message : 'Unknown error'
          });
          
          // Method 3: Window open (fallback)
          const paymentWindow = window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
          if (!paymentWindow) {
            logger.error('All redirect methods failed', { bookingId });
            throw new Error('Unable to redirect to payment gateway. Please allow popups or try again.');
          }
          
          // Show instruction toast
          toast({
            title: "Payment Window Opened",
            description: "Complete payment in the new window, then return to this page.",
            variant: "default",
          });
        }
      }

    } catch (error) {
      logger.error('Payment process failed', error, { bookingId });
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      
      // Show error toast
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Call onError callback
      onError?.(errorMessage);
      
    } finally {
      // Only reset loading state if we're not redirecting
      if (!redirecting) {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    logger.info('Payment cancelled by user', { bookingId });
    setShowConfirmation(false);
  };

  // Render confirmation dialog
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">Confirm Payment</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              You are about to pay <strong>R{amount.toFixed(2)}</strong> for this booking.
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to Paystack to complete the payment securely.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main payment button
  return (
    <Button
      onClick={handlePaymentClick}
      disabled={isLoading || redirecting}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {redirecting ? 'Redirecting...' : 'Processing...'}
        </>
      ) : redirecting ? (
        <>
          <ExternalLink className="h-4 w-4 animate-pulse mr-2" />
          Redirecting to Payment...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay R{amount.toFixed(2)}
        </>
      )}
    </Button>
  );
}

// Additional utility component for payment status display
interface PaymentStatusProps {
  status: 'PENDING' | 'ESCROW' | 'RELEASED' | 'FAILED';
  amount: number;
  paidAt?: Date;
  className?: string;
}

export function PaymentStatus({ status, amount, paidAt, className = '' }: PaymentStatusProps) {
  const logger = createLogger('PaymentStatus');
  
  const getStatusInfo = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Payment Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          description: 'Waiting for payment confirmation'
        };
      case 'ESCROW':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Payment Received',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: `R${amount.toFixed(2)} held in escrow`
        };
      case 'RELEASED':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Payment Released',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: `R${amount.toFixed(2)} released to provider`
        };
      case 'FAILED':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Payment Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Payment could not be processed'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Unknown Status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'Payment status unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  logger.info('Rendering payment status', { status, amount, paidAt });

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.color} ${className}`}>
      {statusInfo.icon}
      <span className="ml-2 font-medium">{statusInfo.text}</span>
      <span className="ml-2 text-xs opacity-75">({statusInfo.description})</span>
      {paidAt && (
        <span className="ml-2 text-xs opacity-50">
          {new Date(paidAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}