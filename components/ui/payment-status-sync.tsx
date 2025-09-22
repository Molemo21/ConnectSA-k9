/**
 * Synchronized Payment Status Display Component
 * 
 * This component ensures the payment status is always synchronized with the backend
 * and never displays stale data. It implements:
 * - Real-time payment status synchronization
 * - Automatic refresh for pending payments
 * - Manual refresh capability
 * - Proper loading and error states
 * - Optimistic updates with rollback
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePaymentSync, isPaymentPaid, getPaymentDisplayStatus, invalidatePaymentCache } from '@/hooks/use-payment-sync';
import { showToast } from '@/lib/utils';

interface PaymentStatusSyncProps {
  bookingId?: string;
  paymentRef?: string;
  payment?: any; // Legacy payment object for backward compatibility
  className?: string;
  showRefreshButton?: boolean;
  onStatusChange?: (newStatus: string) => void;
}

export function PaymentStatusSync({
  bookingId,
  paymentRef,
  payment: legacyPayment,
  className = '',
  showRefreshButton = true,
  onStatusChange
}: PaymentStatusSyncProps) {
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);

  // Use the new payment sync hook
  const {
    payment: syncedPayment,
    booking: syncedBooking,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refreshPayment,
    verifyPayment,
    invalidateCache
  } = usePaymentSync({
    bookingId,
    paymentRef,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // Use synced payment if available, otherwise fall back to legacy payment
  const currentPayment = syncedPayment || legacyPayment;
  const currentBooking = syncedBooking;

  // Notify parent component of status changes
  useEffect(() => {
    if (currentPayment?.status && onStatusChange) {
      onStatusChange(currentPayment.status);
    }
  }, [currentPayment?.status, onStatusChange]);

  // Handle manual refresh
  const handleManualRefresh = async () => {
    if (isManuallyRefreshing || isRefreshing) return;

    setIsManuallyRefreshing(true);
    try {
      await refreshPayment();
      setLastManualRefresh(new Date());
      showToast.success('Payment status refreshed');
    } catch (error) {
      showToast.error('Failed to refresh payment status');
    } finally {
      setIsManuallyRefreshing(false);
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async () => {
    if (!paymentRef) return;

    try {
      const verified = await verifyPayment();
      if (verified) {
        showToast.success('Payment verified successfully');
      } else {
        showToast.error('Payment verification failed');
      }
    } catch (error) {
      showToast.error('Failed to verify payment');
    }
  };

  // Show loading state
  if (isLoading && !currentPayment) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-gray-600">Loading payment status...</span>
      </div>
    );
  }

  // Show error state
  if (error && !currentPayment) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">Failed to load payment status</span>
            {showRefreshButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isManuallyRefreshing}
                className="ml-2"
              >
                {isManuallyRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          <p className="text-xs mt-1">{error}</p>
        </AlertDescription>
      </Alert>
    );
  }

  // No payment data
  if (!currentPayment) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <Clock className="w-4 h-4" />
        <span>No payment information available</span>
      </div>
    );
  }

  const displayStatus = getPaymentDisplayStatus(currentPayment);
  const isPaid = isPaymentPaid(currentPayment);
  const isProcessing = currentPayment.status === 'PENDING' && isRefreshing;
  const isStuck = currentPayment.status === 'PENDING' && 
    currentPayment.createdAt && 
    (Date.now() - new Date(currentPayment.createdAt).getTime()) > 8 * 60 * 1000; // 8 minutes

  // Get icon component
  const getIcon = () => {
    switch (displayStatus.icon) {
      case 'CheckCircle': return CheckCircle;
      case 'Clock': return Clock;
      case 'DollarSign': return DollarSign;
      case 'XCircle': return XCircle;
      case 'AlertCircle': return AlertCircle;
      default: return Clock;
    }
  };

  const IconComponent = getIcon();

  // Processing state with refresh indicator
  if (isProcessing) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center space-x-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          <span className="text-orange-600 font-medium">Processing Payment...</span>
        </div>
        {showRefreshButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isManuallyRefreshing}
            className="text-xs"
          >
            {isManuallyRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Stuck payment warning
  if (isStuck) {
    return (
      <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium mb-1 block">Payment Taking Longer Than Expected</span>
              <p className="text-xs mb-2">
                Your payment is still processing. This may take a few more minutes.
              </p>
            </div>
            {showRefreshButton && (
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isManuallyRefreshing}
                >
                  {isManuallyRefreshing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
                {paymentRef && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyPayment}
                  >
                    Verify
                  </Button>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Normal payment status display
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2 text-sm">
        <IconComponent className={`w-4 h-4 ${displayStatus.color}`} />
        <span className={`font-medium ${displayStatus.color}`}>
          {displayStatus.status}
        </span>
        {isRefreshing && (
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        )}
      </div>
      
      {showRefreshButton && (
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isManuallyRefreshing || isRefreshing}
            className="text-xs"
            title="Refresh payment status"
          >
            {isManuallyRefreshing || isRefreshing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
          {paymentRef && currentPayment.status === 'PENDING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyPayment}
              className="text-xs"
              title="Verify payment with Paystack"
            >
              Verify
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Export utility functions for use in other components
export { isPaymentPaid, getPaymentDisplayStatus, invalidatePaymentCache };
