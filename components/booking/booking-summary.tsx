'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, MapPin, DollarSign, Package, User, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCataloguePricing } from '@/lib/feature-flags';

interface CatalogueItem {
  id: string;
  title: string;
  shortDesc: string;
  price: number;
  currency: string;
  durationMins: number;
  images: string[];
  provider: {
    id: string;
    businessName?: string;
    location?: string;
    avgRating: number;
    totalReviews: number;
    user: {
      name: string;
      avatar?: string;
    };
  };
  service: {
    name: string;
    description: string;
  };
}

interface BookingSummaryProps {
  selectedCatalogueItem?: CatalogueItem;
  selectedProvider?: any; // Legacy provider object
  serviceId: string;
  date: string;
  time: string;
  address: string;
  notes?: string;
  onConfirm: (bookingData: any) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function BookingSummary({ 
  selectedCatalogueItem, 
  selectedProvider, 
  serviceId, 
  date, 
  time, 
  address, 
  notes, 
  onConfirm, 
  onBack,
  isLoading = false 
}: BookingSummaryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const cataloguePricingEnabled = useCataloguePricing();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        providerId: selectedCatalogueItem?.provider.id || selectedProvider?.id,
        serviceId,
        date,
        time,
        address,
        notes,
        ...(selectedCatalogueItem && { catalogueItemId: selectedCatalogueItem.id })
      };

      await onConfirm(bookingData);
    } catch (error) {
      console.error('Booking confirmation failed:', error);
      toast({
        title: "Error",
        description: "Failed to confirm booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUsingCatalogue = cataloguePricingEnabled && selectedCatalogueItem;
  const provider = selectedCatalogueItem?.provider || selectedProvider;
  const totalAmount = selectedCatalogueItem?.price || (selectedProvider?.hourlyRate || 150) * 2; // Default 2 hours
  const duration = selectedCatalogueItem?.durationMins || 120; // Default 2 hours in minutes
  const platformFee = totalAmount * 0.1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Package or Provider Info */}
          {isUsingCatalogue ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCatalogueItem.title}</h3>
                <p className="text-gray-600">{selectedCatalogueItem.shortDesc}</p>
                <Badge variant="outline" className="mt-2">
                  {selectedCatalogueItem.service.name}
                </Badge>
              </div>

              {selectedCatalogueItem.images.length > 0 && (
                <div>
                  <img
                    src={selectedCatalogueItem.images[0]}
                    alt={selectedCatalogueItem.title}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">
                    {selectedCatalogueItem.currency} {selectedCatalogueItem.price}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{formatDuration(selectedCatalogueItem.durationMins)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {provider?.businessName || provider?.user?.name}
                </h3>
                <p className="text-gray-600">Legacy pricing</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">
                    R{provider?.hourlyRate || 150}/hour
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Provider Info */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Service Provider
            </h4>
            <div className="space-y-2">
              <p className="font-medium">
                {provider?.businessName || provider?.user?.name}
              </p>
              {provider?.avgRating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">
                    {provider.avgRating.toFixed(1)} ({provider.totalReviews} reviews)
                  </span>
                </div>
              )}
              {provider?.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {provider.location}
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{formatDate(date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{formatTime(time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="text-right max-w-xs">{address}</span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Notes:</span>
                  <span className="text-right max-w-xs">{notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee:</span>
                <span>R{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (10%):</span>
                <span>R{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R{(totalAmount + platformFee).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Feature Flag Notice */}
          {cataloguePricingEnabled && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                You're using the new catalogue-based pricing system. 
                This ensures transparent pricing and better service packages.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={handleConfirmBooking} 
          disabled={isSubmitting || isLoading}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Confirming...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
}

