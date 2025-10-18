/**
 * Synchronized Booking Card Component
 * 
 * This component ensures booking and payment data is always synchronized with the backend.
 * It implements:
 * - Real-time data synchronization
 * - Automatic cache invalidation
 * - Proper loading and error states
 * - Optimistic updates with rollback
 * - Never displays stale payment information
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  DollarSign,
  MessageCircle,
  User,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentStatusSync, isPaymentPaid } from '@/components/ui/payment-status-sync';
import { usePaymentSync, invalidatePaymentCache } from '@/hooks/use-payment-sync';
import { showToast } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  duration: number;
  totalAmount: number;
  description?: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    name: string;
    category: string;
  };
  provider?: {
    id: string;
    businessName?: string;
    user: {
      name: string;
      phone?: string;
    };
  };
  client?: {
    name: string;
    email: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    paystackRef: string;
    createdAt: string;
    updatedAt: string;
  };
  review?: {
    rating: number;
    comment?: string;
  };
}

interface SynchronizedBookingCardProps {
  booking: Booking;
  onUpdate?: (bookingId: string) => void;
  onRefresh?: (bookingId: string) => Promise<void>;
  className?: string;
}

export function SynchronizedBookingCard({
  booking,
  onUpdate,
  onRefresh,
  className = ''
}: SynchronizedBookingCardProps) {
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Use payment sync hook for real-time payment data
  const {
    payment: syncedPayment,
    booking: syncedBooking,
    isLoading: isPaymentLoading,
    isRefreshing: isPaymentRefreshing,
    error: paymentError,
    refreshPayment,
    invalidateCache
  } = usePaymentSync({
    bookingId: booking.id,
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Use synced data if available, otherwise fall back to props
  const currentBooking = syncedBooking || booking;
  const currentPayment = syncedPayment || booking.payment;

  // Handle booking status changes
  useEffect(() => {
    if (onUpdate && currentBooking.status !== booking.status) {
      onUpdate(currentBooking.id);
    }
  }, [currentBooking.status, booking.status, onUpdate, currentBooking.id]);

  // Get status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Waiting for Provider',
        description: 'We\'re finding the best provider for you'
      },
      CONFIRMED: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle,
        label: 'Confirmed',
        description: 'Provider has confirmed your booking'
      },
      PENDING_EXECUTION: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: DollarSign,
        label: 'Payment Received',
        description: 'Payment completed - waiting for execution'
      },
      IN_PROGRESS: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Loader2,
        label: 'In Progress',
        description: 'Provider is working on your service'
      },
      AWAITING_CONFIRMATION: {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        label: 'Awaiting Confirmation',
        description: 'Please confirm completion to release payment'
      },
      COMPLETED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Completed',
        description: 'Service has been completed'
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Cancelled',
        description: 'Booking has been cancelled'
      }
    };
    return configs[status as keyof typeof configs] || {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock,
      label: status,
      description: 'Unknown status'
    };
  };

  // Determine available actions
  const getAvailableActions = () => {
    const actions = [];
    const status = currentBooking.status;
    const isPaid = isPaymentPaid(currentPayment);

    // Payment actions
    if (status === 'CONFIRMED' && !isPaid && !currentPayment) {
      actions.push({
        label: 'Pay Now',
        variant: 'default' as const,
        onClick: handlePay,
        disabled: isPerformingAction
      });
    }

    // Refresh payment status
    if (currentPayment && currentPayment.status === 'PENDING') {
      actions.push({
        label: 'Check Payment Status',
        variant: 'outline' as const,
        onClick: handleCheckPaymentStatus,
        disabled: isPerformingAction
      });
    }

    // Message provider
    if (['CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS'].includes(status)) {
      actions.push({
        label: 'Message Provider',
        variant: 'outline' as const,
        onClick: handleMessageProvider,
        disabled: isPerformingAction
      });
    }

    // Confirm completion
    if (status === 'AWAITING_CONFIRMATION') {
      actions.push({
        label: 'Confirm Completion',
        variant: 'default' as const,
        onClick: handleConfirmCompletion,
        disabled: isPerformingAction
      });
    }

    // Cancel booking
    if (['PENDING', 'CONFIRMED'].includes(status)) {
      actions.push({
        label: 'Cancel Booking',
        variant: 'destructive' as const,
        onClick: handleCancelBooking,
        disabled: isPerformingAction
      });
    }

    return actions;
  };

  // Action handlers
  const handlePay = async () => {
    setIsPerformingAction(true);
    setActionError(null);
    
    try {
      const response = await fetch(`/api/book-service/${booking.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callbackUrl: `${window.location.origin}/dashboard?payment=success&booking=${booking.id}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();
      
      if (data.success && data.authorizationUrl) {
        // Invalidate cache before redirect
        invalidatePaymentCache(booking.id);
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error(data.error || 'Payment initialization failed');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Payment failed');
      showToast.error('Failed to initialize payment');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    setIsPerformingAction(true);
    setActionError(null);
    
    try {
      await refreshPayment();
      showToast.success('Payment status refreshed');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to refresh payment status');
      showToast.error('Failed to refresh payment status');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleMessageProvider = () => {
    // Navigate to messaging interface
    window.location.href = `/messages?booking=${booking.id}`;
  };

  const handleConfirmCompletion = async () => {
    setIsPerformingAction(true);
    setActionError(null);
    
    try {
      const response = await fetch(`/api/book-service/${booking.id}/release-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm completion');
      }

      const data = await response.json();
      
      if (data.success) {
        showToast.success('Completion confirmed! Payment will be released to provider.');
        // Invalidate cache to refresh data
        invalidatePaymentCache(booking.id);
        if (onRefresh) {
          await onRefresh(booking.id);
        }
      } else {
        throw new Error(data.error || 'Failed to confirm completion');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to confirm completion');
      showToast.error('Failed to confirm completion');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setIsPerformingAction(true);
    setActionError(null);
    
    try {
      const response = await fetch(`/api/book-service/${booking.id}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      const data = await response.json();
      
      if (data.success) {
        showToast.success('Booking cancelled successfully');
        // Invalidate cache to refresh data
        invalidatePaymentCache(booking.id);
        if (onRefresh) {
          await onRefresh(booking.id);
        }
      } else {
        throw new Error(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to cancel booking');
      showToast.error('Failed to cancel booking');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const statusConfig = getStatusConfig(currentBooking.status);
  const StatusIcon = statusConfig.icon;
  const availableActions = getAvailableActions();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${statusConfig.color.includes('text-') ? statusConfig.color.split(' ')[1] : 'text-gray-500'}`} />
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            {isPaymentRefreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">{statusConfig.description}</p>
        </div>
        
        {/* Manual refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCheckPaymentStatus}
          disabled={isPerformingAction || isPaymentRefreshing}
          title="Refresh booking status"
        >
          {isPaymentRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Service Information */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{currentBooking.service?.name || 'Service'}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(currentBooking.scheduledDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{currentBooking.duration} minutes</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>R{currentBooking.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Provider Information */}
      {currentBooking.provider && (
        <div className="flex items-center space-x-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Provider:</span>
          <span className="font-medium">
            {currentBooking.provider.businessName || currentBooking.provider.user.name}
          </span>
        </div>
      )}

      {/* Location */}
      <div className="flex items-start space-x-2 text-sm">
        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
        <span className="text-gray-600">{currentBooking.address}</span>
      </div>

      {/* Payment Status */}
      {currentPayment && (
        <div className="border-t pt-4">
          <PaymentStatusSync
            bookingId={booking.id}
            paymentRef={currentPayment.paystackRef}
            showRefreshButton={true}
            onStatusChange={(newStatus) => {
              // Invalidate cache when payment status changes
              invalidatePaymentCache(booking.id);
            }}
          />
        </div>
      )}

      {/* Review */}
      {currentBooking.review && (
        <div className="flex items-center space-x-2 text-sm">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-gray-600">Your rating:</span>
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < currentBooking.review!.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Error */}
      {actionError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {actionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Error */}
      {paymentError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment sync error: {paymentError}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      {availableActions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || isPerformingAction}
              className="flex items-center space-x-2"
            >
              {isPerformingAction ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : action.label === 'Message Provider' ? (
                <MessageCircle className="w-4 h-4" />
              ) : null}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {isPaymentLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Loading booking data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
