"use client"

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react"
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
import { BookingLoginModal } from "@/components/ui/booking-login-modal"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { z } from "zod"
import { StepIndicator as Stepper } from "@/components/book-service/StepIndicator"
import { ModernBookingForm as BookingFormPanel } from "@/components/book-service/ModernBookingForm"
import { BookingSummary as SummaryPanel } from "@/components/book-service/BookingSummary"
import { ProviderDiscoveryPanel } from "@/components/book-service/ProviderDiscoveryPanel"
import { ConfirmPanel } from "@/components/book-service/ConfirmPanel"

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

// Step indicator for better wayfinding
function StepIndicator({ step }: { step: 'FORM' | 'REVIEW' | 'DISCOVERY' | 'CONFIRM' }) {
  const steps = [
    { id: 'FORM', label: 'Service Details' },
    { id: 'REVIEW', label: 'Review' },
    { id: 'DISCOVERY', label: 'Choose Provider' },
    { id: 'CONFIRM', label: 'Confirmation' },
  ] as const
  const currentIndex = steps.findIndex(s => s.id === step)
  return (
    <div className="flex items-center justify-center sm:justify-start space-x-2 overflow-x-auto py-2" aria-label="Booking steps">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${idx <= currentIndex ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            aria-current={s.id === step ? 'step' : undefined}
          >
            {idx + 1}
          </div>
          <span className={`ml-2 text-xs sm:text-sm ${idx <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{s.label}</span>
          {idx < steps.length - 1 && (
            <div className={`mx-2 h-0.5 w-6 sm:w-10 ${idx < currentIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Zod schema for inline form validation
const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  address: z.string().min(3, 'Address is required'),
  notes: z.string().optional(),
})

function BookServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null)

  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  } as {
    serviceId: string;
    date: string;
    time: string;
    address: string;
    notes?: string;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [showProviderDiscovery, setShowProviderDiscovery] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'FORM' | 'REVIEW' | 'DISCOVERY' | 'CONFIRM'>('FORM')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking, true = logged in, false = not logged in
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Debug logging function
  const addDebugInfo = (message: string) => {
    console.log(`🔍 [BookService] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        addDebugInfo("Checking authentication status...");
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setIsAuthenticated(true);
          addDebugInfo("User is authenticated");
        } else {
          setIsAuthenticated(false);
          addDebugInfo("User is not authenticated");
          // Don't show login prompt immediately - let user fill form first
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        // Don't show login prompt immediately - let user fill form first
      }
    };

    checkAuth();
  }, []);

  // Check for sessionStorage booking data after login
  useEffect(() => {
    addDebugInfo('Component mounted, checking sessionStorage');
    if (typeof window !== "undefined" && searchParams?.get("intent") === "booking") {
      const stored = sessionStorage.getItem("bookingDetails");
      if (stored) {
        addDebugInfo('Found stored booking details in sessionStorage');
        setForm(JSON.parse(stored));
        setShowReview(true);
        setActiveStep('REVIEW')
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
        
        // Check if we have cached services
        const cachedServices = localStorage.getItem('cached_services');
        const cacheTimestamp = localStorage.getItem('services_cache_timestamp');
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        if (cachedServices && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          addDebugInfo('Using cached services');
          setServices(JSON.parse(cachedServices));
          setLoadingServices(false);
          return;
        }
        
        addDebugInfo('Making fetch request to /api/services');
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()
        const res = await fetch("/api/services", { 
          signal: abortRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes cache
          }
        });
        addDebugInfo(`Fetch response status: ${res.status}, ok: ${res.ok}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        addDebugInfo('Parsing JSON response');
        const data = await res.json();
        addDebugInfo(`Parsed ${data.length} services from response`);
        
                      // Validate service IDs (Prisma custom ID format)
        const invalidServices = data.filter((service: any) => {
                const cuidLike = /^[a-z0-9]{25}$/i;
                const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return !(cuidLike.test(service.id) || uuid.test(service.id));
        });
        
        if (invalidServices.length > 0) {
                addDebugInfo(`Found ${invalidServices.length} services with invalid ID format`);
                console.error('Found services with invalid ID format:', invalidServices);
        }
        
        addDebugInfo('Setting services state');
        setServices(data);
        
        // Cache the services
        localStorage.setItem('cached_services', JSON.stringify(data));
        localStorage.setItem('services_cache_timestamp', now.toString());
        
        addDebugInfo('Services state set successfully and cached');
        
      } catch (err: any) {
        // Ignore abort errors caused by fast re-renders or navigation
        if (err?.name === 'AbortError') {
          addDebugInfo('Services fetch aborted (ignored)');
          return;
        }
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
    const next = { ...form, [e.target.name]: e.target.value }
    setForm(next);
    // Real-time validation
    const validation = bookingFormSchema.safeParse(next)
    if (!validation.success) {
      const fieldError = validation.error.issues[0]
      if (fieldError && fieldError.path[0]) setErrors(prev => ({ ...prev, [fieldError.path[0] as keyof typeof form]: fieldError.message }))
    } else {
      setErrors({})
    }
  };

  // Check auth status before booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugInfo(`Form submitted with data: ${JSON.stringify(form)}`);
    
    // Zod validation first
    const result = bookingFormSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { if (i.path[0]) errs[i.path[0] as string] = i.message })
      setErrors(errs)
      setSubmitError("Please correct the highlighted fields.")
      return
    }
    
    addDebugInfo("Validation passed, showing review step...");
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);
    
    // Show review step for all users (authenticated or not)
    addDebugInfo("Showing review step...");
    setShowReview(true);
    setActiveStep('REVIEW');
    setSubmitting(false);
  };

  // Show provider discovery after review
  const handleShowProviderDiscovery = () => {
    addDebugInfo('Starting provider discovery with form data');
    
    // Check if user is authenticated before proceeding to provider discovery
    if (!isAuthenticated) {
      addDebugInfo("User not authenticated, showing sign-in popup...");
      setShowLoginPrompt(true);
      return;
    }
    
    // Validate serviceId format (Prisma custom ID format)
    const cuidLike = /^[a-z0-9]{25}$/i;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!(cuidLike.test(form.serviceId) || uuid.test(form.serviceId))) {
      addDebugInfo(`Invalid serviceId format: ${form.serviceId}`);
      setSubmitError('Invalid service selection. Please try again.');
      return;
    }
    
    setShowProviderDiscovery(true);
    setShowReview(false);
    setActiveStep('DISCOVERY')
    // Smoothly scroll to the top of the main content when step changes
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
    setActiveStep('CONFIRM')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  };

  // Handle login success from prompt
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginPrompt(false);
    setShowLoginModal(false);
    addDebugInfo("User successfully logged in, continuing with booking");
    
    // Automatically proceed to provider discovery after successful login
    if (showReview) {
      setShowProviderDiscovery(true);
      setActiveStep('DISCOVERY');
      addDebugInfo("Proceeding to provider discovery after login");
    }
  };

  // Handle closing login prompt
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
    setShowLoginModal(false);
    // Redirect to home page if user closes without logging in
    router.push("/");
  };

  // Handle closing login modal
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    // Don't show the popup again if user is authenticated
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  };

  const selectedService = services.find(s => s.id === form.serviceId);

  // Debug info display
  const debugInfoDisplay = null

  if (loadingServices) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading Services...</h2>
              <p className="text-white/80">Please wait while we prepare your booking options</p>
            </div>
            
            {/* Enhanced loading skeleton */}
            <div className="space-y-6">
              {/* Search bar skeleton */}
              <div className="h-14 bg-white/10 rounded-xl animate-pulse" />
              
              {/* Service cards skeleton */}
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Progress indicator */}
              <div className="flex justify-center space-x-2 mt-8">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
            {debugInfoDisplay}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
          <div className="max-w-2xl mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Services</h2>
            <p className="text-red-200 mb-6">{servicesError}</p>
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
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
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
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen relative overflow-hidden animate-fade-in">
        {/* Background image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
          style={{ backgroundImage: "url('/booker.jpg')" }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
        style={{ backgroundImage: "url('/booker.jpg')" }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 animate-slide-in-up">
        <div className="max-w-2xl mx-auto">
          {showProviderDiscovery ? (
            <ProviderDiscoveryPanel
              form={form}
              onProviderSelected={handleProviderSelected}
              onBack={() => { setShowProviderDiscovery(false); setActiveStep('REVIEW') }}
              onLoginSuccess={() => {
                // User successfully logged in, continue with booking
                console.log('User logged in successfully, continuing booking flow')
              }}
            />
          ) : showReview ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Review Booking</CardTitle>
                <CardDescription>Please review your booking details before confirming</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Selected Service</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-sm sm:text-base">{selectedService?.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">{selectedService?.category}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm sm:text-base">{form.date} • {form.time}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowReview(false); setActiveStep('FORM') }} className="flex-1 h-12 sm:h-11 order-2 sm:order-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button onClick={handleShowProviderDiscovery} disabled={submitting} className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 order-1 sm:order-2">
                    <div className="flex items-center space-x-2">
                      <span>Choose Provider</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <BookingFormPanel
              value={form}
              onChange={(next) => {
                setForm({
                  serviceId: next.serviceId,
                  date: next.date,
                  time: next.time,
                  address: next.address,
                  notes: next.notes || "",
                });
              }}
              onNext={() => {
                // When the modern form completes all steps, proceed to review
                setShowReview(true);
                setActiveStep('REVIEW');
              }}
              submitting={submitting}
            />
          )}
        </div>
      </div>
      
        {/* Mobile Navigation */}
        <MobileBottomNav userRole="CLIENT" />
        <MobileFloatingActionButton userRole="CLIENT" />
        
        {/* Sign-in Required Popup */}
        {showLoginPrompt && !isAuthenticated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Popup Card */}
            <Card className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
                  <p className="text-gray-600">
                    Please sign in to your account to continue with your booking
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCloseLoginPrompt}
                    className="w-full"
                  >
                    Go Back Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Login Modal */}
        <BookingLoginModal
          isOpen={showLoginModal}
          onClose={handleCloseLoginModal}
          onLoginSuccess={handleLoginSuccess}
          bookingData={{
            serviceId: form.serviceId || "",
            date: form.date || "",
            time: form.time || "",
            address: form.address || "",
            notes: form.notes || ""
          }}
        />
        
        {/* Debug info overlay */}
        {debugInfoDisplay}
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <ErrorBoundary>
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading booking service...</p>
        </div>
      </div>
    }>
      <BookServiceContent />
    </Suspense>
    </ErrorBoundary>
  )
}
