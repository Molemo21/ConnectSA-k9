"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Clock, MapPin, FileText, CheckCircle, Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ProviderDiscovery } from "@/components/provider-discovery/provider-discovery"

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🔴 Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-900 mb-4">Something went wrong</h1>
            <p className="text-red-700 mb-6">
              The page encountered an error during loading. This might be a hydration issue.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Reload Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600">Error Details</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function BookServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [showProviderDiscovery, setShowProviderDiscovery] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Debug logging function
  const addDebugInfo = (message: string) => {
    console.log(`🔍 [BookService] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check for sessionStorage booking data after login
  useEffect(() => {
    addDebugInfo('Component mounted, checking sessionStorage');
    if (typeof window !== "undefined" && searchParams?.get("intent") === "booking") {
      const stored = sessionStorage.getItem("bookingDetails");
      if (stored) {
        addDebugInfo('Found stored booking details in sessionStorage');
        setForm(JSON.parse(stored));
        setShowReview(true);
        sessionStorage.removeItem("bookingDetails");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    addDebugInfo('Starting services fetch useEffect');
    
    async function fetchServices() {
      try {
        addDebugInfo('Setting loading state to true');
      setLoadingServices(true);
      setServicesError(null);
        
        addDebugInfo('Making fetch request to /api/services');
        const res = await fetch("/api/services");
        addDebugInfo(`Fetch response status: ${res.status}, ok: ${res.ok}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        addDebugInfo('Parsing JSON response');
        const data = await res.json();
        addDebugInfo(`Parsed ${data.length} services from response`);
        
                      // Validate service IDs (Prisma custom ID format)
        const invalidServices = data.filter((service: any) => {
                const serviceIdRegex = /^[a-z0-9]{25}$/i;
                return !serviceIdRegex.test(service.id);
        });
        
        if (invalidServices.length > 0) {
                addDebugInfo(`Found ${invalidServices.length} services with invalid ID format`);
                console.error('Found services with invalid ID format:', invalidServices);
        }
        
        addDebugInfo('Setting services state');
        setServices(data);
        addDebugInfo('Services state set successfully');
        
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebugInfo(`Error fetching services: ${errorMessage}`);
        console.error('❌ Error fetching services:', err);
        setServicesError(`Could not load services: ${errorMessage}`);
      } finally {
        addDebugInfo('Setting loading state to false');
        setLoadingServices(false);
      }
    }
    
    addDebugInfo('Calling fetchServices function');
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Check auth status before booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugInfo(`Form submitted with data: ${JSON.stringify(form)}`);
    
    // Validate required fields
    if (!form.serviceId || !form.date || !form.time || !form.address) {
      addDebugInfo("Validation failed - missing required fields");
      setSubmitError("Please fill in all required fields.");
      return;
    }
    
    addDebugInfo("Validation passed, checking authentication...");
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);
    try {
      // Check if logged in
      const res = await fetch("/api/auth/me");
      addDebugInfo(`Auth check response: ${res.status}`);
      if (!res.ok) {
        // Not logged in: save form data and redirect to login
        addDebugInfo("User not authenticated, redirecting to login...");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("bookingDetails", JSON.stringify(form));
        }
        router.push("/login?intent=booking");
        return;
      }
      // If logged in, show review step before final submission
      addDebugInfo("User authenticated, showing review step...");
      setShowReview(true);
    } catch (err: any) {
      addDebugInfo(`Auth check error: ${err.message}`);
      console.error("Auth check error:", err);
      setSubmitError("Could not check authentication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show provider discovery after review
  const handleShowProviderDiscovery = () => {
    addDebugInfo('Starting provider discovery with form data');
    
    // Validate serviceId format (Prisma custom ID format)
    const serviceIdRegex = /^[a-z0-9]{25}$/i;
    if (!serviceIdRegex.test(form.serviceId)) {
      addDebugInfo(`Invalid serviceId format: ${form.serviceId}`);
      setSubmitError('Invalid service selection. Please try again.');
      return;
    }
    
    setShowProviderDiscovery(true);
    setShowReview(false);
  };

  // Handle provider selection
  const handleProviderSelected = (providerId: string) => {
    addDebugInfo(`Provider selected: ${providerId}`);
    setSelectedProviderId(providerId);
    // The booking is already created by send-offer, just show confirmation
    setConfirmation({
      success: true,
      message: "Provider selected successfully! Your job offer has been sent.",
      providerId: providerId
    });
    setShowProviderDiscovery(false);
    setShowReview(false);
  };

  const selectedService = services.find(s => s.id === form.serviceId);

  // Debug info display
  const debugInfoDisplay = process.env.NODE_ENV === 'development' && (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md max-h-64 overflow-auto text-xs z-50">
      <h4 className="font-bold mb-2">Debug Info</h4>
      <div className="space-y-1">
        <div>Services: {services?.length || 0}</div>
        <div>Loading: {loadingServices.toString()}</div>
        <div>Error: {servicesError || 'none'}</div>
        <div>Selected Service: {selectedService?.name || 'none'}</div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer">Logs</summary>
        <div className="mt-1 space-y-1">
          {debugInfo.slice(-10).map((log, i) => (
            <div key={i} className="text-green-300">{log}</div>
          ))}
        </div>
      </details>
    </div>
  );

  if (loadingServices) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading services...</p>
            <p className="text-sm text-gray-500 mt-2">
              If this takes too long, there might be a JavaScript error. Check the browser console.
            </p>
            {debugInfoDisplay}
          </div>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-4">Failed to Load Services</h2>
            <p className="text-red-600 mb-6">{servicesError}</p>
            <div className="space-y-4">
              <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
              <Button variant="outline" onClick={() => window.location.href = '/api/services'} className="w-full">
                Test API Directly
              </Button>
            </div>
            {debugInfoDisplay}
          </div>
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Offer Sent!</h2>
                <p className="text-gray-600 mb-6">
                  Your job offer has been sent to the selected provider. They will respond within 2 hours.
                </p>
                <div className="space-y-4">
                  <Button asChild className="w-full">
                    <a href="/dashboard">View My Bookings</a>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <a href="/book-service">Book Another Service</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Book a Service</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tell us what you need and we'll connect you with trusted professionals in your area
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>{showReview ? "Review Booking" : "Service Details"}</span>
                  </CardTitle>
                  <CardDescription>
                    {showReview ? "Please review your booking details before confirming" : "Fill in the details below to book your service"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600">{submitError}</p>
                    </div>
                  )}

                  {showReview ? (
                    // Review Step
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Review Your Booking</h3>
                        <p className="text-blue-700 text-sm">
                          Please review your booking details before confirming.
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Selected Service</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium">{selectedService?.name}</span>
                              <Badge variant="secondary" className="ml-2">{selectedService?.category}</Badge>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{form.date}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{form.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Service Address</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <span>{form.address}</span>
                              </div>
                            </div>
                          </div>
                          
                          {form.notes && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <span>{form.notes}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReview(false)}
                          className="flex-1"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Edit Details
                        </Button>
                        <Button
                          onClick={handleShowProviderDiscovery}
                          disabled={submitting}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Choose Provider</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </Button>
                      </div>
                    </div>
                  ) : showProviderDiscovery ? (
                    // Provider Discovery Step
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Provider</h2>
                        <p className="text-gray-600">
                          Review available providers and select the one that best fits your needs
                        </p>
                      </div>
                      
                      <ProviderDiscovery
                        serviceId={form.serviceId}
                        date={form.date}
                        time={form.time}
                        address={form.address}
                        notes={form.notes}
                        onProviderSelected={handleProviderSelected}
                        onBack={() => setShowProviderDiscovery(false)}
                      />
                      
                      {/* Debug info */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
                          <p><strong>Debug Info:</strong></p>
                          <p>Service ID: {form.serviceId}</p>
                          <p>Date: {form.date}</p>
                          <p>Time: {form.time}</p>
                          <p>Address: {form.address}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Form Step
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Service Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="serviceId">Service Type *</Label>
                        <Select name="serviceId" value={form.serviceId} onValueChange={(value) => setForm({ ...form, serviceId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services && services.length > 0 ? (
                              services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{service.name}</span>
                                  <Badge variant="secondary">{service.category}</Badge>
                                </div>
                              </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                <span className="text-gray-500">No services available</span>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {services && services.length === 0 && (
                          <p className="text-sm text-gray-500">No services found. Please try refreshing the page.</p>
                        )}
                        {services && services.length > 0 && (
                          <p className="text-sm text-green-600">✓ {services.length} services loaded successfully</p>
                        )}
                      </div>

                      {/* Date and Time */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time *</Label>
                          <Input
                            type="time"
                            name="time"
                            value={form.time}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address">Service Address *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Enter your address"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="Any specific requirements or details..."
                          rows={4}
                        />
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Selected Service Info */}
              {selectedService && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{selectedService.name}</h3>
                        <p className="text-sm text-gray-600">{selectedService.category}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{selectedService.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Tips */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Booking Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p>Book at least 24 hours in advance for best availability</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <p>Provide accurate address for better service matching</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-purple-600 mt-0.5" />
                      <p>Include specific details in notes for better service quality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug info overlay */}
      {debugInfoDisplay}
    </div>
  );
}

export default function BookServicePage() {
  return (
    <ErrorBoundary>
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading booking service...</p>
        </div>
      </div>
    }>
      <BookServiceContent />
    </Suspense>
    </ErrorBoundary>
  )
}
