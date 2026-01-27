"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  FileText, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  CalendarDays, 
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Home,
  CreditCard,
  Banknote,
  Package,
  AlertTriangle
} from "lucide-react"
import { reverseGeocode, searchAddresses, searchAddressesGoogle, type AddressSuggestion } from "@/lib/geocoding"
import { saveBookingDraft } from "@/lib/booking-draft"
import { ServiceSelection } from "./ServiceSelection"
import { ProviderDiscoveryPanel } from "@/components/book-service/ProviderDiscoveryPanel"

const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  address: z.string().min(3, 'Address is required'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['ONLINE', 'CASH']).default('ONLINE'),
})

const fetcher = (url: string, signal?: AbortSignal) => fetch(url, { signal }).then(async r => {
  if (!r.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP ${r.status}`;
    try {
      const errorData = await r.json();
      if (errorData.error) {
        errorMessage = translateApiError(r, errorData);
      } else {
        errorMessage = translateApiError(r);
      }
    } catch {
      // If response isn't JSON, use status code translation
      errorMessage = translateApiError(r);
    }
    throw new Error(errorMessage);
  }
  return r.json()
})

interface ModernBookingFormProps {
  value: { 
    serviceId: string
    date: string
    time: string
    address: string
    notes?: string
    paymentMethod: 'ONLINE' | 'CASH'
    selectedProviderId?: string | null
    selectedCatalogueItemId?: string | null
    selectedProviderData?: any
    selectedPackageData?: any
  }
  onChange: (next: ModernBookingFormProps["value"]) => void
  onNext: () => void
  onBack?: () => void
  submitting?: boolean
  onProviderSelected?: (providerId: string) => void
  onPackageSelected?: (providerId: string, catalogueItemId: string, providerData?: any, packageData?: any) => void
  onLoginSuccess?: () => void
  isAuthenticated?: boolean
  onShowLoginModal?: () => void
}

const steps = [
  { id: 'service', title: 'Choose Service', icon: FileText },
  { id: 'datetime', title: 'Date & Time', icon: CalendarDays },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'details', title: 'Service Details', icon: Home },
  { id: 'provider', title: 'Choose Provider', icon: Package },
  { id: 'payment', title: 'Payment Method', icon: CreditCard },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle },
]

// Standardized error messages for each step (defined outside component for better performance)
const stepErrorMessages: Record<number, string> = {
  0: 'Please select a service',
  1: 'Please select both date and time',
  2: 'Please enter your address',
  4: 'Please select a provider and package',
  5: 'Please select a payment method'
}

// Helper function to translate technical errors into user-friendly messages
function translateError(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('internet')) {
      return 'No internet connection. Please check your Wi-Fi or mobile data and try again.';
    }
    if (errorLower.includes('timeout')) {
      return 'Request took too long. Please try again - your information has been saved.';
    }
    if (errorLower.includes('unauthorized') || errorLower.includes('401') || errorLower.includes('session')) {
      return 'Your session expired. Please log in again and try booking.';
    }
    if (errorLower.includes('provider') && (errorLower.includes('unavailable') || errorLower.includes('not found'))) {
      return 'This provider is no longer available. Please choose a different provider.';
    }
    if (errorLower.includes('date') || errorLower.includes('time') || errorLower.includes('slot')) {
      return 'The selected date or time is no longer available. Please choose a different time.';
    }
    if (errorLower.includes('payment') || errorLower.includes('transaction')) {
      return 'There was a problem with payment processing. Please try again or choose a different payment method.';
    }
    if (errorLower.includes('database') || errorLower.includes('prisma') || errorLower.includes('connection')) {
      return 'Our system is temporarily busy. Please wait a moment and try again.';
    }
    if (errorLower.includes('validation') || errorLower.includes('required') || errorLower.includes('missing')) {
      return 'Some information is missing. Please check all fields and try again.';
    }
    
    return error; // Return original if we can't translate
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (error instanceof TypeError && message.includes('fetch')) {
      return 'No internet connection. Please check your Wi-Fi or mobile data and try again.';
    }
    if (message.includes('networkerror') || message.includes('network error')) {
      return 'Connection problem. Please check your internet connection and try again.';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Request timed out. Please try again - your information has been saved.';
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401') || message.includes('session expired')) {
      return 'Your session expired. Please log in again and try booking.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'You don\'t have permission to perform this action. Please contact support if this continues.';
    }
    
    // Provider/booking errors
    if (message.includes('provider') && (message.includes('unavailable') || message.includes('not found'))) {
      return 'This provider is no longer available. Please choose a different provider.';
    }
    if (message.includes('booking') && message.includes('exists')) {
      return 'A booking already exists for this time. Please choose a different date or time.';
    }
    if (message.includes('date') || message.includes('time') || message.includes('slot') || message.includes('unavailable')) {
      return 'The selected date or time is no longer available. Please choose a different time.';
    }
    
    // Payment errors
    if (message.includes('payment') || message.includes('transaction') || message.includes('card')) {
      return 'There was a problem with payment processing. Please try again or choose a different payment method.';
    }
    
    // System errors
    if (message.includes('database') || message.includes('prisma') || message.includes('connection')) {
      return 'Our system is temporarily busy. Please wait a moment and try again.';
    }
    if (message.includes('server') || message.includes('500') || message.includes('503')) {
      return 'Our servers are temporarily unavailable. Please try again in a few moments.';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('required') || message.includes('missing')) {
      return 'Some information is missing. Please check all fields and try again.';
    }
    
    // Return the original message if it's already user-friendly
    if (message.length < 100 && !message.includes('error') && !message.includes('failed')) {
      return error.message;
    }
    
    // Generic fallback for unknown errors
    return 'Something went wrong. Please check your information and try again.';
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

// Helper function to translate API error responses
function translateApiError(response: Response, errorData?: any): string {
  const status = response.status;
  const errorMessage = errorData?.error?.toLowerCase() || '';
  
  // Handle specific HTTP status codes
  if (status === 401) {
    return 'Your session expired. Please log in again and try booking.';
  }
  if (status === 403) {
    return 'You don\'t have permission to perform this action. Please contact support if this continues.';
  }
  if (status === 404) {
    if (errorMessage.includes('provider')) {
      return 'This provider is no longer available. Please choose a different provider.';
    }
    if (errorMessage.includes('service')) {
      return 'This service is no longer available. Please choose a different service.';
    }
    return 'The requested resource was not found. Please try again.';
  }
  if (status === 409) {
    if (errorMessage.includes('booking') || errorMessage.includes('time slot')) {
      return 'A booking already exists for this time. Please choose a different date or time.';
    }
    return 'This action conflicts with existing data. Please check your information and try again.';
  }
  if (status === 422) {
    return 'Some information is invalid. Please check all fields and try again.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (status === 500 || status === 502 || status === 503) {
    return 'Our servers are temporarily unavailable. Please try again in a few moments.';
  }
  if (status >= 400 && status < 500) {
    return 'There was a problem with your request. Please check your information and try again.';
  }
  if (status >= 500) {
    return 'Our system is experiencing issues. Please try again in a few moments.';
  }
  
  // Try to translate the error message if available
  if (errorData?.error) {
    return translateError(errorData.error);
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export function ModernBookingForm({ value, onChange, onNext, onBack, submitting, onProviderSelected, onPackageSelected, onLoginSuccess, isAuthenticated, onShowLoginModal }: ModernBookingFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof value, string>>>({})
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [serviceQuery, setServiceQuery] = useState("")
  const [recentServiceIds, setRecentServiceIds] = useState<string[]>([])
  const [notesCount, setNotesCount] = useState(value.notes?.length || 0)
  const [showRecentServices, setShowRecentServices] = useState(true)
  const [addressPlaceholder, setAddressPlaceholder] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>(value.paymentMethod || 'ONLINE')
  const [isSaved, setIsSaved] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null)
  const [stepInitialized, setStepInitialized] = useState(false)
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const NOTES_MAX = 500
  
  // Refs for date and time inputs
  const dateInputRef = React.useRef<HTMLInputElement>(null)
  const timeInputRef = React.useRef<HTMLInputElement>(null)

  // Service-specific information state
  const [serviceInfo, setServiceInfo] = useState({
    additionalServices: [] as string[]
  })

  // Address placeholder examples
  const addressExamples = [
    "123 Main Street, Cape Town, 8001",
    "45 Oak Avenue, Johannesburg, 2000", 
    "78 Pine Road, Durban, 4000",
    "12 Elm Street, Port Elizabeth, 6001",
    "90 Maple Drive, Pretoria, 0001"
  ]

  // Mthatha detailed address database with streets and townships
  const commonAddresses = [
    // Mthatha CBD Streets
    "123 Nelson Mandela Drive, Mthatha CBD, 5100",
    "45 Sutherland Street, Mthatha CBD, 5100",
    "78 Victoria Street, Mthatha CBD, 5100",
    "12 Madeira Street, Mthatha CBD, 5100",
    "90 Owen Street, Mthatha CBD, 5100",
    "34 York Road, Mthatha CBD, 5100",
    "56 Durham Street, Mthatha CBD, 5100",
    "23 Leeds Road, Mthatha CBD, 5100",
    "67 Leeds Street, Mthatha CBD, 5100",
    "89 Leeds Road, Mthatha CBD, 5100",
    
    // Mthatha Townships and Areas
    "Ngangelizwe, Mthatha, 5100",
    "Zimbane, Mthatha, 5100",
    "Norwood, Mthatha, 5100",
    "Ilinge, Mthatha, 5100",
    "Ncambedlana, Mthatha, 5100",
    "Mthatha CBD, Eastern Cape, 5100",
    "Mthatha Airport, Eastern Cape, 5100",
    "Mthatha University, Eastern Cape, 5100",
    "Mthatha Hospital, Eastern Cape, 5100",
    "Mthatha Mall, Eastern Cape, 5100",
    
    // Specific Township Streets
    "Ngangelizwe Main Road, Mthatha, 5100",
    "Zimbane Road, Mthatha, 5100",
    "Norwood Road, Mthatha, 5100",
    "Ilinge Road, Mthatha, 5100",
    "Ncambedlana Road, Mthatha, 5100",
    
    // Mthatha Suburbs
    "Southernwood, Mthatha, 5100",
    "Northcrest, Mthatha, 5100",
    "Riverside, Mthatha, 5100",
    "Westbrook, Mthatha, 5100",
    "Eastbrook, Mthatha, 5100",
    
    // Major Roads
    "N2 Highway, Mthatha, 5100",
    "R61 Road, Mthatha, 5100",
    "R409 Road, Mthatha, 5100",
    
    // General Mthatha
    "Mthatha, Eastern Cape, 5100"
  ]

  // Address search function with real geocoding API
  const searchAddressesDebounced = async (query: string) => {
    if (query.length < 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearchingAddress(true)
    
    try {
      // Check if Google Places API key is available
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      
      let suggestions: AddressSuggestion[] = []
      
      if (googleApiKey) {
        // Use Google Places API if available (better results)
        suggestions = await searchAddressesGoogle(query, googleApiKey, 8)
      } else {
        // Use OpenStreetMap Nominatim (free, no API key required)
        suggestions = await searchAddresses(query, 8)
      }
      
      // If no results from API, fall back to local addresses
      if (suggestions.length === 0) {
        const lowerQuery = query.toLowerCase()
        const filtered = commonAddresses
          .filter(address => address.toLowerCase().includes(lowerQuery))
          .slice(0, 8)
          .map(address => ({
            address: address,
            displayName: address
          }))
        suggestions = filtered
      }
      
      setAddressSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('Address search error:', error)
      // Fallback to local addresses on error
      const lowerQuery = query.toLowerCase()
      const filtered = commonAddresses
        .filter(address => address.toLowerCase().includes(lowerQuery))
        .slice(0, 8)
        .map(address => ({
          address: address,
          displayName: address
        }))
      setAddressSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } finally {
      setIsSearchingAddress(false)
    }
  }

  // Debounced address search
  const searchAddressesTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const searchAddressesLocal = (query: string) => {
    // Clear previous timeout
    if (searchAddressesTimeoutRef.current) {
      clearTimeout(searchAddressesTimeoutRef.current)
    }
    
    // Set new timeout for debouncing (300ms delay)
    searchAddressesTimeoutRef.current = setTimeout(() => {
      searchAddressesDebounced(query)
    }, 300)
  }

  // Handle address input change
  const handleAddressChange = (newAddress: string) => {
    handleFieldChange('address', newAddress)
    searchAddressesLocal(newAddress)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    handleFieldChange('address', suggestion.address)
    setShowSuggestions(false)
    setAddressSuggestions([])
    
    // If coordinates are available, store them for later use
    if (suggestion.latitude && suggestion.longitude) {
      // You can store coordinates in a separate state if needed
      console.log('Selected address coordinates:', {
        lat: suggestion.latitude,
        lng: suggestion.longitude
      })
    }
  }

  // Service-specific suggestions
  const getServiceSuggestions = (service: any) => {
    if (!service) return ['Parking info', 'Gate/Access code', 'Pet on premises', 'Preferred time window']
    
    const serviceName = service.name?.toLowerCase() || ''
    const category = service.categoryName?.toLowerCase() || service.category?.toLowerCase() || ''
    
    // Common suggestions for all services
    const commonSuggestions = ['Parking info', 'Gate/Access code', 'Pet on premises', 'Preferred time window']
    
    // Service-specific suggestions
    if (serviceName.includes('plumb') || category.includes('plumb')) {
      return [
        'Water shut-off location',
        'Previous plumbing issues',
        'Access to water meter',
        'Emergency contact available',
        'Gate/Access code',
        'Parking info'
      ]
    } else if (serviceName.includes('electr') || category.includes('electr')) {
      return [
        'Fuse box location',
        'Previous electrical issues',
        'Power outage history',
        'Emergency contact available',
        'Gate/Access code',
        'Parking info'
      ]
    } else if (serviceName.includes('clean') || category.includes('clean')) {
      return [
        'Cleaning supplies provided',
        'Specific areas to focus on',
        'Pet hair concerns',
        'Allergies to cleaning products',
        'Gate/Access code',
        'Parking info'
      ]
    } else if (serviceName.includes('paint') || category.includes('paint')) {
      return [
        'Color preferences',
        'Surface preparation needed',
        'Furniture to be moved',
        'Ventilation requirements',
        'Gate/Access code',
        'Parking info'
      ]
    } else if (serviceName.includes('garden') || category.includes('garden')) {
      return [
        'Plant care instructions',
        'Watering schedule',
        'Pest control needs',
        'Garden tools available',
        'Gate/Access code',
        'Parking info'
      ]
    } else if (serviceName.includes('hair') || serviceName.includes('beauty') || category.includes('beauty')) {
      return [
        'Hair type and length',
        'Previous color treatments',
        'Allergies to products',
        'Desired style reference',
        'Emergency contact available',
        'Parking info'
      ]
    } else if (serviceName.includes('move') || serviceName.includes('relocat') || category.includes('move')) {
      return [
        'Fragile items list',
        'Stairs or elevator access',
        'Parking restrictions',
        'Moving date flexibility',
        'Gate/Access code',
        'Emergency contact available'
      ]
    } else if (serviceName.includes('security') || category.includes('security')) {
      return [
        'Security system details',
        'Key locations',
        'Emergency procedures',
        'Access codes',
        'Previous security issues',
        'Parking info'
      ]
    } else if (serviceName.includes('carpent') || category.includes('carpent')) {
      return [
        'Wood type preferences',
        'Existing damage',
        'Measurements provided',
        'Tools available on site',
        'Gate/Access code',
        'Parking info'
      ]
    }
    
    return commonSuggestions
  }

  const { data: services, error, isLoading, mutate } = useSWR('/api/services', (url) => {
    const ctrl = new AbortController()
    const p = fetcher(url, ctrl.signal)
    ;(p as any).cancel = () => ctrl.abort()
    return p
  }, {
    onErrorRetry: (err: any, key, config, revalidate, { retryCount }) => {
      if (err?.status === 404 || retryCount >= 3) return
      setTimeout(() => revalidate({ retryCount: (retryCount || 0) + 1 }), 1500)
    }
  })

  useEffect(() => {
    // Prevent hydration mismatch by only running on client
    if (typeof window === 'undefined') return
    
    const recents = localStorage.getItem('recentServices') || '[]'
    try { setRecentServiceIds(JSON.parse(recents)) } catch { setRecentServiceIds([]) }
  }, [])

  // Restore to appropriate step based on available form data (only once on mount)
  useEffect(() => {
    if (stepInitialized) return // Only run once
    
    // Determine which step to start at based on available data
    let targetStep = 0
    
    if (value.serviceId) {
      targetStep = 1 // Service selected, go to date/time
    }
    if (value.serviceId && value.date && value.time) {
      targetStep = 2 // Date/time selected, go to address
    }
    if (value.serviceId && value.date && value.time && value.address) {
      targetStep = 3 // Address selected, go to details
    }
    if (value.serviceId && value.date && value.time && value.address && value.selectedProviderId && value.selectedCatalogueItemId) {
      targetStep = 4 // Provider/package selected, go to provider step (or payment if already selected)
    }
    if (value.serviceId && value.date && value.time && value.address && value.selectedProviderId && value.selectedCatalogueItemId && value.paymentMethod) {
      targetStep = 5 // Payment method selected, go to payment step
    }
    // If all data is complete, go to review step
    if (value.serviceId && value.date && value.time && value.address && value.selectedProviderId && value.selectedCatalogueItemId && value.paymentMethod) {
      // Could go to review, but let user navigate there manually
      // targetStep = 6
    }
    
    if (targetStep > 0) {
      setCurrentStep(targetStep)
    }
    setStepInitialized(true)
  }, [value, stepInitialized])

  // Cycle through address placeholders when on address step
  useEffect(() => {
    if (currentStep === 2 && !value.address) {
      let index = 0
      const interval = setInterval(() => {
        setAddressPlaceholder(addressExamples[index])
        index = (index + 1) % addressExamples.length
      }, 2000)
      return () => clearInterval(interval)
    } else {
      setAddressPlaceholder("")
    }
  }, [currentStep, value.address])

  const selectedService = React.useMemo(() => services?.find((s: any) => s.id === value.serviceId), [services, value.serviceId])

  // Update form data when payment method changes
  React.useEffect(() => {
    onChange({ ...value, paymentMethod })
  }, [paymentMethod])

  const handleFieldChange = (name: keyof typeof value, val: string) => {
    const next = { ...value, [name]: val }
    onChange(next)
    
    // Clear the error for this specific field when user starts typing/selecting
    setErrors(prev => ({ ...prev, [name]: undefined }))
    
    // Validate the entire form to check for other errors
    const res = bookingFormSchema.safeParse(next)
    if (!res.success) {
      const newErrors: Partial<Record<keyof typeof value, string>> = {}
      res.error.issues.forEach(issue => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as keyof typeof value] = issue.message
        }
      })
      setErrors(newErrors)
    }
    
    if (name === 'serviceId') {
      if (typeof window !== 'undefined') {
        const nextRecents = [val, ...recentServiceIds.filter(id => id !== val)].slice(0, 5)
        setRecentServiceIds(nextRecents)
        localStorage.setItem('recentServices', JSON.stringify(nextRecents))
      }
      // Hide recent services tab after selection
      setShowRecentServices(false)
    }
    if (name === 'notes') setNotesCount(val.length)
  }

  // Debounced server-backed autosave of drafts
  useEffect(() => {
    // Only autosave when meaningful fields are present or changed
    const payload = {
      serviceId: value.serviceId,
      date: value.date,
      time: value.time,
      address: value.address,
      notes: value.notes || ''
    }
    const hasAny = payload.serviceId || payload.date || payload.time || payload.address
    if (!hasAny) return

    setIsSaved(false)
    const id = setTimeout(() => {
      saveBookingDraft(payload)
        .then(() => {
          setIsSaved(true)
          // Hide the saved tick after a short delay
          setTimeout(() => setIsSaved(false), 1500)
        })
        .catch(() => {})
    }, 600)
    return () => clearTimeout(id)
  }, [value.serviceId, value.date, value.time, value.address, value.notes])

  // Save on page unload to reduce data loss
  useEffect(() => {
    const onBeforeUnload = () => {
      const payload = {
        serviceId: value.serviceId,
        date: value.date,
        time: value.time,
        address: value.address,
        notes: value.notes || ''
      }
      saveBookingDraft(payload).catch(() => {})
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onBeforeUnload)
      return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [value.serviceId, value.date, value.time, value.address, value.notes])

  const canUseGeo = typeof window !== 'undefined' && !!navigator.geolocation

  const handleCurrentLocation = async () => {
    // Check if geolocation is available
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrors(prev => ({ ...prev, address: 'Geolocation is not supported by this browser' }))
      return
    }

    // Check if we're on HTTPS or localhost (required for geolocation)
    // Note: Modern browsers allow geolocation on localhost even without HTTPS
    const hostname = window.location.hostname.toLowerCase()
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       hostname.startsWith('172.16.') ||
                       hostname.endsWith('.local')
    const isSecure = window.location.protocol === 'https:' || isLocalhost
    
    // Only warn about HTTPS if not localhost (browsers handle this differently)
    if (!isSecure && !isLocalhost) {
      console.warn('Geolocation may require HTTPS. Current protocol:', window.location.protocol)
      // Don't block - let the browser handle it and show its own error
    }

    // Check permission status if Permissions API is available
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        console.log('Geolocation permission status:', permissionStatus.state)
        
        if (permissionStatus.state === 'denied') {
          setErrors(prev => ({ ...prev, address: 'Location access is blocked. Please enable it in your browser settings.' }))
          return
        }
      } catch (permError) {
        // Permissions API might not be fully supported, continue anyway
        console.log('Permissions API not fully supported, continuing...')
      }
    }

    setIsGeocoding(true)
    setErrors(prev => ({ ...prev, address: undefined }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        // Use watchPosition with a timeout to get better error handling
        const options = {
          enableHighAccuracy: false, // Changed to false for better compatibility
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 60000 // 1 minute - use cached position if available
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve(pos)
          },
          (err) => {
            console.error('Geolocation error details:', {
              code: err.code,
              message: err.message,
              PERMISSION_DENIED: err.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
              TIMEOUT: err.TIMEOUT
            })
            reject(err)
          },
          options
        )
      })

      const { latitude, longitude } = position.coords
      
      // Show coordinates temporarily while geocoding
      handleFieldChange('address', `Getting your location...`)
      
      // Reverse geocode to get readable address
      const result = await reverseGeocode(latitude, longitude)
      
      if (result.error) {
        // Fallback to coordinates if geocoding fails
        handleFieldChange('address', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setErrors(prev => ({ ...prev, address: 'Could not get readable address, using coordinates' }))
      } else {
        handleFieldChange('address', result.address)
        setErrors(prev => ({ ...prev, address: undefined }))
      }
      
    } catch (error: any) {
      console.error('Geolocation error:', error)
      let errorMessage = 'Failed to get your location'
      
      // Check if it's a GeolocationPositionError
      if (error && typeof error.code === 'number') {
        const PERMISSION_DENIED = 1
        const POSITION_UNAVAILABLE = 2
        const TIMEOUT = 3
        
        switch (error.code) {
          case PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please check your browser settings and allow location access for this site.'
            break
          case POSITION_UNAVAILABLE:
            errorMessage = 'Location information is currently unavailable. Please try again or enter your address manually.'
            break
          case TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or enter your address manually.'
            break
          default:
            errorMessage = `Unable to get location (Error code: ${error.code}). Please enter your address manually.`
        }
      } else if (error?.message) {
        // If there's a message, use it
        errorMessage = error.message
      }
      
      setErrors(prev => ({ ...prev, address: errorMessage }))
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleNext = async () => {
    // Validate current step
    const stepValidations = {
      0: () => value.serviceId,
      1: () => value.date && value.time,
      2: () => value.address,
      3: () => true, // Notes are optional
      4: () => value.selectedProviderId && value.selectedCatalogueItemId, // Provider & package selection step
      5: () => paymentMethod === 'ONLINE' || paymentMethod === 'CASH', // Payment method step - ensure it's explicitly set
      6: () => true, // Review & confirm step (no validation needed, buttons are hidden)
    }

    if (!stepValidations[currentStep]()) {
      // Get error message for current step (if available)
      const errorMessage = stepErrorMessages[currentStep]
      if (errorMessage) {
        // Map step to appropriate error field
        const errorField = currentStep === 0 ? 'serviceId' 
          : currentStep === 1 ? 'date' 
          : currentStep === 2 ? 'address'
          : currentStep === 4 ? 'selectedProviderId'
          : currentStep === 5 ? 'paymentMethod'
          : 'serviceId'
        setErrors({ [errorField]: errorMessage })
      } else {
        // Fallback error message if step doesn't have a specific message
        console.warn(`No error message defined for step ${currentStep}`)
        setErrors({ serviceId: 'Please complete this step before continuing' })
      }
      return
    }

    // Check if user is trying to go to provider selection step (step 4) without being authenticated
    if (currentStep === 3 && !isAuthenticated && onShowLoginModal) {
      onShowLoginModal()
      return
    }

    // Only proceed if not on the last step (step 6 - Review)
    // Step 6 has its own "Confirm Booking" button, so navigation buttons are hidden
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true)
      // Enhanced transition timing for smoother effect
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        // Add a small delay before showing new content for smoother transition
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 300)
    }
    // Note: Step 6 (Review) navigation buttons are hidden, so this code path should never execute
  }

  const handleLoginSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess()
    }
    // After successful login, automatically proceed to provider selection step
    if (currentStep === 3) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(4) // Move to provider selection step
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 300)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      // Enhanced transition timing for smoother effect
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        // Add a small delay before showing new content for smoother transition
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 300)
    } else if (onBack) {
      onBack()
    }
  }

  const filteredServices = React.useMemo(() => {
    if (!services) return []
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return services
    return services.filter((s: any) => 
      s.name?.toLowerCase().includes(q) || 
      s.categoryName?.toLowerCase().includes(q) || 
      s.category?.toLowerCase().includes(q)
    )
  }, [services, serviceQuery])

  const timeSlots = React.useMemo(() => {
    const slots: string[] = []
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        slots.push(`${hh}:${mm}`)
      }
    }
    return slots
  }, [])

  // Check if selected date is today
  const isToday = React.useMemo(() => {
    if (!value.date) return false
    const today = new Date()
    const selectedDate = new Date(value.date)
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    )
  }, [value.date])

  // Helper function to check if a time slot is in the past
  const isTimeSlotPast = React.useCallback((timeSlot: string): boolean => {
    if (!isToday || !value.date) return false
    
    const now = new Date()
    const [hours, minutes] = timeSlot.split(':').map(Number)
    const slotTime = new Date(now)
    slotTime.setHours(hours, minutes, 0, 0)
    
    // Add a buffer of 30 minutes - can't book less than 30 minutes in advance
    const bufferTime = new Date(now.getTime() + 30 * 60 * 1000)
    
    return slotTime < bufferTime
  }, [isToday, value.date])

  // Calculate minimum time for today (current time + 30 minutes buffer)
  const minTimeForToday = React.useMemo(() => {
    if (!isToday) return undefined
    
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30) // Add 30 minute buffer
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(Math.ceil(now.getMinutes() / 30) * 30).padStart(2, '0') // Round up to nearest 30 minutes
    return `${hours}:${minutes}`
  }, [isToday])

  // Clear invalid time when date changes or becomes invalid
  React.useEffect(() => {
    if (value.date && value.time && isTimeSlotPast(value.time)) {
      // Clear the selected time if it's now in the past
      onChange({ ...value, time: '' })
      setErrors(prev => ({ ...prev, time: 'The selected time has passed. Please choose a future time.' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.date, value.time, isTimeSlotPast])

  const isValid = bookingFormSchema.safeParse(value).success

  // Keyboard navigation for address suggestions
  const onAddressKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showSuggestions || addressSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex(prev => {
        const next = prev === null ? 0 : Math.min(addressSuggestions.length - 1, prev + 1)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex(prev => {
        const next = prev === null ? addressSuggestions.length - 1 : Math.max(0, prev - 1)
        return next
      })
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex !== null) {
        e.preventDefault()
        handleSuggestionSelect(addressSuggestions[activeSuggestionIndex])
      }
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Service Type
        return (
          <ServiceSelection
            value={value.serviceId}
            onChange={(serviceId) => handleFieldChange('serviceId', serviceId)}
            onNext={() => handleNext()}
          />
        )

      case 1: // Date & Time
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">When do you need this service?</h3>
              <p className="text-sm sm:text-base text-white/80">Select your preferred date and time</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <Label className="text-sm sm:text-base font-medium text-white">Date</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                    aria-label="Open date picker"
                  >
                    <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 hover:text-blue-300" />
                  </button>
                  <Input
                    ref={dateInputRef}
                    type="date"
                    value={value.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-14 sm:pl-16 pr-4 py-4 sm:py-5 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:h-0 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="text-xs text-white/60 bg-white/5 p-2 rounded-lg">
                  💡 <strong>Tip:</strong> Click the calendar icon or type the date directly (e.g., "2024-01-15")
                </div>
                {errors.date ? (
                  <p className="text-xs sm:text-sm text-red-400">{errors.date}</p>
                ) : value.date ? (
                  <p className="text-xs sm:text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Date selected
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-400">Select a date</p>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <Label className="text-sm sm:text-base font-medium text-white">Time</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.click()}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                    aria-label="Open time picker"
                  >
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 hover:text-blue-300" />
                  </button>
                  <Input
                    ref={timeInputRef}
                    type="time"
                    value={value.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                    min={minTimeForToday}
                    className="pl-14 sm:pl-16 pr-4 py-4 sm:py-5 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:h-0 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="text-xs text-white/60 bg-white/5 p-2 rounded-lg">
                  💡 <strong>Tip:</strong> Click the clock icon or type the time directly (e.g., "14:30" for 2:30 PM)
                </div>
                {value.date && (
                  <div className="mt-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{ scrollbarWidth: 'thin' }}>
                      {timeSlots.map((t) => {
                        const isPast = isTimeSlotPast(t)
                        const isDisabled = isPast
                        
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              if (!isDisabled) {
                                handleFieldChange('time', t)
                              }
                            }}
                            disabled={isDisabled}
                            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                              isDisabled
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                : value.time === t
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                            title={isDisabled ? 'This time has already passed' : `Select ${t}`}
                            aria-disabled={isDisabled}
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                    {isToday && (
                      <p className="text-xs text-white/60 mt-2">
                        ⏰ Times in the past are disabled. You can book at least 30 minutes in advance.
                      </p>
                    )}
                  </div>
                )}
                {errors.time ? (
                  <p className="text-xs sm:text-sm text-red-400">{errors.time}</p>
                ) : value.time ? (
                  <p className="text-xs sm:text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Time selected
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-400">Select a time</p>
                )}
              </div>
            </div>
          </div>
        )

      case 2: // Address
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Where should we come?</h3>
              <p className="text-sm sm:text-base text-white/80">Enter the service address</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2 sm:space-y-3 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <Label className="text-sm sm:text-base font-medium text-white">Service Address</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10" />
                    <Input
                      value={value.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onKeyDown={onAddressKeyDown}
                      onFocus={() => value.address.length >= 2 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder={addressPlaceholder || "Start typing your address..."}
                      className="pl-10 sm:pl-12 pr-4 sm:pr-12 py-3 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="street-address"
                      aria-autocomplete="list"
                      aria-expanded={showSuggestions}
                    />
                    
                    {/* Location icon inside input for desktop */}
                    {!isSearchingAddress && !isGeocoding && (
                      <button
                        type="button"
                        onClick={handleCurrentLocation}
                        disabled={isGeocoding}
                        className="hidden sm:block absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Use current location"
                        title="Click to use your current location"
                      >
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 hover:text-blue-300 cursor-pointer" />
                      </button>
                    )}
                    
                    {/* Loading indicator inside input for desktop */}
                    {(isSearchingAddress || isGeocoding) && (
                      <div className="hidden sm:block absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Location button - outside input on mobile */}
                  {!isSearchingAddress && !isGeocoding && (
                    <button
                      type="button"
                      onClick={handleCurrentLocation}
                      disabled={isGeocoding}
                      className="flex-shrink-0 sm:hidden p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-2 border-gray-600"
                      aria-label="Use current location"
                      title="Click to use your current location"
                    >
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </button>
                  )}
                  
                  {/* Loading indicator for mobile - outside input */}
                  {(isSearchingAddress || isGeocoding) && (
                    <div className="flex-shrink-0 sm:hidden p-3 bg-gray-700 rounded-xl border-2 border-gray-600">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    </div>
                  )}
                </div>
                
                {/* Address suggestions dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="relative -mt-2">
                    <div className="absolute top-0 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto" role="listbox">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={`w-full text-left px-4 py-3 text-white text-sm border-b border-gray-700 last:border-b-0 transition-colors ${activeSuggestionIndex === index ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                          role="option"
                          aria-selected={activeSuggestionIndex === index}
                        >
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{suggestion.address}</div>
                              {suggestion.displayName !== suggestion.address && (
                                <div className="text-xs text-gray-400 truncate mt-0.5">{suggestion.displayName}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Address format guidance */}
                <div className="text-xs sm:text-sm text-white/70 bg-gray-800/50 p-3 rounded-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <p className="font-medium mb-1">💡 Address search tips:</p>
                  <p>• Start typing to see suggestions (e.g., "Cape Town", "Johannesburg")</p>
                  <p>• Include street number + street name, City, Postal code</p>
                  <p className="text-white/60 mt-1">e.g., 123 Main Street, Cape Town, 8001</p>
                </div>
                
                {errors.address && <p className="text-xs sm:text-sm text-red-600">{errors.address}</p>}
              </div>
            </div>
          </div>
        )

      case 3: // Service Details
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Service Details</h3>
              <p className="text-sm sm:text-base text-white/80">
                {selectedService ? `Add any specific requirements for your ${selectedService.name} service` : 'Select a service to add specific requirements'}
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Service-specific suggestions */}
              <div className="bg-blue-900/30 p-3 rounded-lg animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-xs sm:text-sm text-blue-200 font-medium mb-2">
                  {selectedService ? `Additional requirements for ${selectedService.name}:` : 'Common requirements:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {getServiceSuggestions(selectedService).map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleFieldChange('notes', `${(value.notes || '').trim()}${value.notes ? '\n' : ''}${chip}: `)}
                      className="px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm border border-blue-400 text-blue-200 hover:bg-blue-800/50 hover:border-blue-300 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                {!selectedService && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Select a service above to see specific suggestions
                  </p>
                )}
              </div>
              
              <div className="space-y-2 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                <Label className="text-sm sm:text-base font-medium text-white">Additional Notes</Label>
                <Textarea
                  value={value.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Any specific requirements or details..."
                  rows={4}
                  className="text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={NOTES_MAX}
                />
                <div className="text-xs sm:text-sm text-white/70 text-right">{notesCount}/{NOTES_MAX} characters</div>
              </div>
            </div>
          </div>
        )

      case 4: // Choose Provider & Package
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Choose Your Provider</h3>
              <p className="text-sm sm:text-base text-white/80">Select from available providers in your area</p>
            </div>
            
            {/* Provider Discovery Panel */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              <ProviderDiscoveryPanel
                form={value}
                onProviderSelected={onProviderSelected}
                onPackageSelected={(providerId, catalogueItemId, providerData, packageData) => {
                  // Update form state with selected provider and package
                  onChange({
                    ...value,
                    selectedProviderId: providerId,
                    selectedCatalogueItemId: catalogueItemId,
                    selectedProviderData: providerData,
                    selectedPackageData: packageData
                  });
                  
                  // Call parent handler if provided
                  if (onPackageSelected) {
                    onPackageSelected(providerId, catalogueItemId, providerData, packageData);
                  }
                  
                  // Navigate to payment step
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentStep(5); // Move to payment step
                    setTimeout(() => {
                      setIsTransitioning(false);
                    }, 50);
                  }, 300);
                }}
                onBack={() => {
                  // Go back to step 3 (Service Details)
                  setCurrentStep(3);
                }}
                onLoginSuccess={handleLoginSuccess}
                onCancelBooking={() => {
                  // Reset form and go to first step
                  onChange({
                    ...value,
                    serviceId: "",
                    date: "",
                    time: "",
                    address: "",
                    notes: "",
                    selectedProviderId: null,
                    selectedCatalogueItemId: null,
                    selectedProviderData: null,
                    selectedPackageData: null
                  });
                  setCurrentStep(0);
                }}
              />
            </div>
          </div>
        )

      case 5: // Payment Method
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Choose Payment Method</h3>
              <p className="text-sm sm:text-base text-white/80">Select how you'd like to pay for this service</p>
            </div>
            
            {/* Show selected package price if available */}
            {value.selectedPackageData && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Selected Package</p>
                    <p className="text-lg font-semibold text-white">
                      {value.selectedPackageData.title || value.selectedPackageData.name || 'Package'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Total Price</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {value.selectedPackageData.currency || 'R'}
                      {value.selectedPackageData.price?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Online Payment Option */}
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'ONLINE' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
                onClick={() => {
                  setPaymentMethod('ONLINE')
                  // Clear any payment method errors when user selects
                  if (errors.paymentMethod) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.paymentMethod
                      return newErrors
                    })
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    paymentMethod === 'ONLINE' ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Pay Online (Secure)</h4>
                    <p className="text-sm text-white/80 mb-2">Pay securely with your card. Money held in escrow until service completion.</p>
                    <ul className="text-xs text-white/70 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        Secure payment processing
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        Money protected in escrow
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        Automatic refund if service not completed
                      </li>
                    </ul>
                  </div>
                  {paymentMethod === 'ONLINE' && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>

              {/* Cash Payment Option */}
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'CASH' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
                onClick={() => {
                  setPaymentMethod('CASH')
                  // Clear any payment method errors when user selects
                  if (errors.paymentMethod) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.paymentMethod
                      return newErrors
                    })
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    paymentMethod === 'CASH' ? 'bg-green-500' : 'bg-gray-600'
                  }`}>
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Pay with Cash</h4>
                    <p className="text-sm text-white/80 mb-2">Pay directly to your provider after service completion.</p>
                    <ul className="text-xs text-white/70 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        No processing fees
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        Pay only after service completion
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-400" />
                        Direct payment to provider
                      </li>
                    </ul>
                  </div>
                  {paymentMethod === 'CASH' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Error message display */}
            {errors.paymentMethod && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{errors.paymentMethod}</p>
              </div>
            )}
          </div>
        )

      case 6: // Review & Confirm
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Review & Confirm Booking</h3>
              <p className="text-sm sm:text-base text-white/80">Please review your booking details before confirming</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Service</span>
                  <span className="text-white/80 text-sm sm:text-base flex items-center gap-2">
                    {selectedService?.name || 'Not selected'}
                    <button onClick={() => setCurrentStep(0)} className="text-blue-400 text-xs underline">Edit</button>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Date</span>
                  <span className="text-white/80 text-sm sm:text-base flex items-center gap-2">
                    {value.date || 'Not selected'}
                    <button onClick={() => setCurrentStep(1)} className="text-blue-400 text-xs underline">Edit</button>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Time</span>
                  <span className="text-white/80 text-sm sm:text-base flex items-center gap-2">
                    {value.time || 'Not selected'}
                    <button onClick={() => setCurrentStep(1)} className="text-blue-400 text-xs underline">Edit</button>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Address</span>
                  <span className="text-white/80 text-sm sm:text-base text-right max-w-xs break-words flex items-center gap-2 justify-end">
                    {value.address || 'Not provided'}
                    <button onClick={() => setCurrentStep(2)} className="text-blue-400 text-xs underline">Edit</button>
                  </span>
                </div>
                {/* Provider - Always show if we have providerId */}
                {value.selectedProviderId ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-white text-sm sm:text-base">Provider</span>
                    <span className="text-white/80 text-sm sm:text-base flex items-center gap-2">
                      {value.selectedProviderData?.businessName || 
                       value.selectedProviderData?.user?.name || 
                       value.selectedProviderData?.name || 
                       'Provider selected'}
                      <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline">Edit</button>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-white text-sm sm:text-base">Provider</span>
                    <span className="text-red-400 text-sm sm:text-base flex items-center gap-2">
                      Not selected
                      <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline">Select</button>
                    </span>
                  </div>
                )}
                {/* Package - Always show if we have catalogueItemId */}
                {value.selectedCatalogueItemId ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-white text-sm sm:text-base">Package</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-sm sm:text-base">
                        {value.selectedPackageData?.title || 
                         value.selectedPackageData?.name || 
                         'Package selected'}
                      </span>
                      {value.selectedPackageData?.price && (
                        <span className="text-blue-400 font-semibold text-sm sm:text-base">
                          {value.selectedPackageData?.currency || 'R'}
                          {value.selectedPackageData.price.toLocaleString()}
                        </span>
                      )}
                      <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline">Edit</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                    <span className="font-medium text-white text-sm sm:text-base">Package</span>
                    <span className="text-red-400 text-sm sm:text-base flex items-center gap-2">
                      Not selected
                      <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline">Select</button>
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Payment Method</span>
                  <div className="flex items-center space-x-2">
                    {paymentMethod === 'ONLINE' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm sm:text-base">Pay Online</span>
                        <button onClick={() => setCurrentStep(5)} className="text-blue-400 text-xs underline ml-2">Edit</button>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm sm:text-base">Pay with Cash</span>
                        <button onClick={() => setCurrentStep(5)} className="text-blue-400 text-xs underline ml-2">Edit</button>
                      </>
                    )}
                  </div>
                </div>
                {value.notes && (
                  <div className="pt-2 border-t border-gray-600">
                    <span className="font-medium text-white block mb-1 text-sm sm:text-base">Notes</span>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-white/80 text-xs sm:text-sm whitespace-pre-line">{value.notes}</span>
                      <button onClick={() => setCurrentStep(3)} className="text-blue-400 text-xs underline">Edit</button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Confirm Booking Button */}
              <div className="pt-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                {isConfirmingBooking && !bookingSuccess && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <div className="absolute inset-0 w-6 h-6 border-2 border-blue-400/30 rounded-full animate-ping opacity-75" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-200">
                          Creating your booking request...
                        </p>
                        <p className="text-xs text-blue-300/80 mt-1">
                          Sending your request to the provider
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {bookingSuccess && successMessage && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-200 mb-1">
                          {successMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="w-4 h-4 animate-spin text-green-300" />
                          <p className="text-xs text-green-300/90">
                            Taking you to the waiting room...
                          </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-500/30">
                          <p className="text-xs text-green-200/70">
                            💡 You'll wait here for the provider to accept or decline your request
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  onClick={async () => {
                    if (!value.selectedProviderId || !value.selectedCatalogueItemId) {
                      const missingItems = [];
                      if (!value.selectedProviderId) missingItems.push('provider');
                      if (!value.selectedCatalogueItemId) missingItems.push('package');
                      
                      const missingText = missingItems.length === 1 
                        ? `a ${missingItems[0]}` 
                        : `a ${missingItems.join(' and a ')}`;
                      
                      setBookingError(
                        `Please go back and select ${missingText}. ` +
                        `Click "Edit" next to ${missingItems[0] === 'provider' ? 'Provider' : 'Package'} above to choose one.`
                      );
                      return;
                    }
                    
                    if (isConfirmingBooking || submitting) return;
                    
                    setIsConfirmingBooking(true);
                    setBookingError(null);
                    setErrors({});
                    
                    try {
                      // Call the booking API
                      const response = await fetch('/api/book-service/send-offer-enhanced', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          providerId: value.selectedProviderId,
                          serviceId: value.serviceId,
                          date: value.date,
                          time: value.time,
                          address: value.address,
                          notes: value.notes,
                          catalogueItemId: value.selectedCatalogueItemId,
                          paymentMethod: paymentMethod,
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          timezoneOffsetMinutes: new Date().getTimezoneOffset()
                        })
                      });
                      
                      if (!response.ok) {
                        let errorData;
                        try {
                          errorData = await response.json();
                        } catch {
                          // If response isn't JSON, use status code
                          errorData = { error: `HTTP ${response.status}` };
                        }
                        
                        const userMessage = translateApiError(response, errorData);
                        throw new Error(userMessage);
                      }
                      
                      const bookingData = await response.json();
                      
                      // Show success message
                      console.log('✅ Booking created successfully:', bookingData);
                      
                      // Show success state
                      setIsConfirmingBooking(false);
                      setBookingSuccess(true);
                      setSuccessMessage(bookingData.message || 'Booking created successfully!');
                      
                      // Redirect to lobby page to wait for provider response
                      setTimeout(() => {
                        if (bookingData.booking?.id) {
                          router.push(`/book-service/${bookingData.booking.id}/lobby`);
                        } else {
                          // Fallback if booking ID not in response
                          router.push('/dashboard?booking=success');
                        }
                      }, 2000);
                      
                      // Call onNext to trigger parent component's confirmation handling
                      if (onNext) {
                        onNext();
                      }
                    } catch (error) {
                      console.error('Booking creation failed:', error);
                      setIsConfirmingBooking(false);
                      setBookingSuccess(false);
                      setSuccessMessage(null);
                      
                      // Use the translation helper
                      const userFriendlyMessage = translateError(error);
                      setBookingError(userFriendlyMessage);
                    }
                  }}
                  disabled={isConfirmingBooking || submitting || !value.selectedProviderId || !value.selectedCatalogueItemId}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 text-lg shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirmingBooking || submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
                {bookingError && (
                  <div className="mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">{bookingError}</p>
              </div>
            )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-white/80">Loading services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <p className="text-white font-semibold text-lg mb-2">Unable to Load Services</p>
            <p className="text-white/80 text-sm mb-4">
              {translateError(error)}
            </p>
            <Button 
              onClick={() => mutate()} 
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 animate-fade-in pb-20 sm:pb-8">
      {/* Progress Bar - Mobile Optimized */}
      <div className={`mb-6 sm:mb-8 transition-all duration-300 ${
        isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}>
        {/* Mobile Progress - Horizontal Scroll */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex items-center space-x-4 min-w-max">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isClickable = index <= currentStep || isCompleted
              
              const handleStepClick = () => {
                if (isClickable && index !== currentStep) {
                  setCurrentStep(index)
                  setErrors({}) // Clear errors when navigating
                }
              }
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={handleStepClick}
                  disabled={!isClickable}
                  className="flex flex-col items-center space-y-2 min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded-lg p-1 transition-all"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white scale-110' 
                      : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white scale-110 animate-pulse' 
                      : isClickable
                      ? 'bg-white border-gray-300 text-gray-400 scale-100 active:scale-95'
                      : 'bg-gray-100 border-gray-200 text-gray-300 scale-100 opacity-50'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-300' : isClickable ? 'text-white/70' : 'text-white/40'
                  }`}>
                    {step.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop Progress - Full Width */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isClickable = index <= currentStep || isCompleted
              
              const handleStepClick = () => {
                if (isClickable && index !== currentStep) {
                  setCurrentStep(index)
                  setErrors({}) // Clear errors when navigating
                }
              }
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={handleStepClick}
                    disabled={!isClickable}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white scale-110 hover:scale-125 hover:shadow-lg cursor-pointer' 
                        : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white scale-110 animate-pulse cursor-default' 
                        : isClickable
                        ? 'bg-white border-gray-300 text-gray-400 scale-100 hover:scale-110 hover:border-gray-400 cursor-pointer'
                        : 'bg-gray-100 border-gray-200 text-gray-300 scale-100 cursor-not-allowed opacity-50'
                    }`}
                    title={isClickable ? `Go to: ${step.title}` : 'Complete previous steps first'}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className={`text-center transition-all duration-300 ${
          isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}>
          <p className="text-sm font-medium text-white">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>
      </div>

      {/* Main Card - Mobile Optimized */}
      <Card className={`shadow-xl border-0 bg-black/90 backdrop-blur-sm transition-all duration-500 animate-slide-in-up ${
        isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
      }`}>
        <CardContent className="p-4 sm:p-6 lg:p-8 relative">
          {/* Transition overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}
          <div className={`transition-all duration-300 ${
            isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}>
            {renderStepContent()}
          </div>
          {/* Saved indicator */}
          {isSaved && (
            <div className="absolute bottom-2 right-3 text-xs text-green-400">Saved</div>
          )}
        </CardContent>
      </Card>

      {/* Navigation - Mobile Optimized - Hidden on Review Step (step 6) */}
      {currentStep !== 6 && (
      <div className={`flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 space-y-3 sm:space-y-0 transition-all duration-300 ${
        isTransitioning ? 'opacity-50 translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
          {/* Back Button - Hidden on first step only */}
          {currentStep > 0 && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center px-4 sm:px-6 py-3 w-full sm:w-auto order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
          )}

        <Button
          onClick={handleNext}
          disabled={submitting}
            className={`flex items-center px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg shadow-lg w-full sm:w-auto ${
              currentStep === 0 ? 'w-full' : 'order-1 sm:order-2'
            }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : currentStep === 3 ? (
            'Choose Provider'
          ) : currentStep === steps.length - 2 ? (
            'Review Booking'
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      )}
    </div>
  )
}

