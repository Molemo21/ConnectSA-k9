"use client"

import React, { useState, useEffect } from "react"
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
  Minus,
  Home,
  Bath,
  ChefHat,
  Sofa,
  Bed,
  Car,
  CreditCard,
  Banknote
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

const fetcher = (url: string, signal?: AbortSignal) => fetch(url, { signal }).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

interface ModernBookingFormProps {
  value: { serviceId: string; date: string; time: string; address: string; notes?: string; paymentMethod: 'ONLINE' | 'CASH' }
  onChange: (next: ModernBookingFormProps["value"]) => void
  onNext: () => void
  onBack?: () => void
  submitting?: boolean
  onProviderSelected?: (providerId: string) => void
  onLoginSuccess?: () => void
  isAuthenticated?: boolean
  onShowLoginModal?: () => void
}

const steps = [
  { id: 'service', title: 'Choose Service', icon: FileText },
  { id: 'datetime', title: 'Date & Time', icon: CalendarDays },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'details', title: 'Service Details', icon: Home },
  { id: 'payment', title: 'Payment Method', icon: CreditCard },
  { id: 'review', title: 'Review', icon: CheckCircle },
  { id: 'provider', title: 'Choose Provider', icon: CheckCircle },
]

export function ModernBookingForm({ value, onChange, onNext, onBack, submitting, onProviderSelected, onLoginSuccess, isAuthenticated, onShowLoginModal }: ModernBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof value, string>>>({})
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [serviceQuery, setServiceQuery] = useState("")
  const [recentServiceIds, setRecentServiceIds] = useState<string[]>([])
  const [notesCount, setNotesCount] = useState(value.notes?.length || 0)
  const [showRecentServices, setShowRecentServices] = useState(true)
  const [addressPlaceholder, setAddressPlaceholder] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>('ONLINE')
  const [isSaved, setIsSaved] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null)
  const NOTES_MAX = 500

  // Service-specific information state
  const [serviceInfo, setServiceInfo] = useState({
    selectedRooms: [] as string[],
    roomQuantities: {} as Record<string, number>,
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

  // Service-specific room options
  const getServiceRooms = (service: any) => {
    if (!service) return []
    
    const serviceName = service.name?.toLowerCase() || ''
    const category = service.categoryName?.toLowerCase() || service.category?.toLowerCase() || ''
    
    if (serviceName.includes('clean') || category.includes('clean')) {
      return [
        { id: 'kitchen', name: 'Kitchen', icon: ChefHat, defaultQuantity: 1 },
        { id: 'bathroom', name: 'Bathroom', icon: Bath, defaultQuantity: 1 },
        { id: 'living_room', name: 'Living Room', icon: Sofa, defaultQuantity: 1 },
        { id: 'bedroom', name: 'Bedroom', icon: Bed, defaultQuantity: 1 },
        { id: 'dining_room', name: 'Dining Room', icon: Home, defaultQuantity: 1 },
        { id: 'garage', name: 'Garage', icon: Car, defaultQuantity: 1 }
      ]
    } else if (serviceName.includes('paint') || category.includes('paint')) {
      return [
        { id: 'living_room', name: 'Living Room', icon: Sofa, defaultQuantity: 1 },
        { id: 'bedroom', name: 'Bedroom', icon: Bed, defaultQuantity: 1 },
        { id: 'kitchen', name: 'Kitchen', icon: ChefHat, defaultQuantity: 1 },
        { id: 'bathroom', name: 'Bathroom', icon: Bath, defaultQuantity: 1 },
        { id: 'dining_room', name: 'Dining Room', icon: Home, defaultQuantity: 1 }
      ]
    }
    
    return []
  }

  // Handle room selection
  const handleRoomToggle = (roomId: string) => {
    setServiceInfo(prev => {
      const isSelected = prev.selectedRooms.includes(roomId)
      const newSelectedRooms = isSelected 
        ? prev.selectedRooms.filter(id => id !== roomId)
        : [...prev.selectedRooms, roomId]
      
      const newQuantities = { ...prev.roomQuantities }
      if (!isSelected) {
        const room = getServiceRooms(selectedService).find(r => r.id === roomId)
        newQuantities[roomId] = room?.defaultQuantity || 1
      } else {
        delete newQuantities[roomId]
      }
      
      return {
        ...prev,
        selectedRooms: newSelectedRooms,
        roomQuantities: newQuantities
      }
    })
  }

  // Handle quantity change
  const handleQuantityChange = (roomId: string, change: number) => {
    setServiceInfo(prev => {
      const currentQuantity = prev.roomQuantities[roomId] || 1
      const newQuantity = Math.max(1, currentQuantity + change)
      
      return {
        ...prev,
        roomQuantities: {
          ...prev.roomQuantities,
          [roomId]: newQuantity
        }
      }
    })
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

    setIsGeocoding(true)
    setErrors(prev => ({ ...prev, address: undefined }))

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
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
      }
      
    } catch (error) {
      console.error('Geolocation error:', error)
      let errorMessage = 'Failed to get your location'
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
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
      4: () => paymentMethod, // Payment method step
      5: () => true, // Review step
      6: () => true, // Provider selection step
    }

    if (!stepValidations[currentStep]()) {
      setErrors({ [currentStep === 0 ? 'serviceId' : currentStep === 1 ? 'date' : 'address']: 'This field is required' })
      return
    }

    // Check if user is trying to go to provider selection step (step 6) without being authenticated
    if (currentStep === 5 && !isAuthenticated && onShowLoginModal) {
      onShowLoginModal()
      return
    }

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
    } else {
      onNext()
    }
  }

  const handleLoginSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess()
    }
    // After successful login, automatically proceed to provider selection step
    if (currentStep === 4) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(5) // Move to provider selection step
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
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
                  <Input
                    type="date"
                    value={value.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10 sm:pl-12 py-3 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-xs text-white/60 bg-white/5 p-2 rounded-lg">
                  💡 <strong>Tip:</strong> You can click the calendar icon or type the date directly (e.g., "2024-01-15")
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
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
                  <Input
                    type="time"
                    value={value.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                    className="pl-10 sm:pl-12 py-3 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-xs text-white/60 bg-white/5 p-2 rounded-lg">
                  💡 <strong>Tip:</strong> You can click the time picker or type the time directly (e.g., "14:30" for 2:30 PM)
                </div>
                {value.date && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    {timeSlots.slice(0, 6).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleFieldChange('time', t)}
                        className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                          value.time === t
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
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
                <div className="relative">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10" />
                  <Input
                    value={value.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onKeyDown={onAddressKeyDown}
                    onFocus={() => value.address.length >= 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={addressPlaceholder || "Start typing your address..."}
                    className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 text-base sm:text-lg border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="street-address"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                  />
                  
                  {/* Location icon on the right - clickable to get current location */}
                  {!isSearchingAddress && !isGeocoding && (
                    <button
                      type="button"
                      onClick={handleCurrentLocation}
                      disabled={isGeocoding}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-gray-700/50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Use current location"
                      title="Click to use your current location"
                    >
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 hover:text-blue-300 cursor-pointer" />
                    </button>
                  )}
                  
                  {/* Loading indicator - shows when searching address or getting location */}
                  {(isSearchingAddress || isGeocoding) && (
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-400" />
                    </div>
                  )}
                  
                  {/* Address suggestions dropdown */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto" role="listbox">
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
                  )}
                </div>
                
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
        const serviceRooms = getServiceRooms(selectedService)
        
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Service Details</h3>
              <p className="text-sm sm:text-base text-white/80">
                {selectedService ? `Customize your ${selectedService.name} service` : 'Select a service to see customization options'}
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Service-specific room selection */}
              {serviceRooms.length > 0 && (
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Select Areas to {selectedService?.name || 'Service'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceRooms.map((room) => {
                      const Icon = room.icon
                      const isSelected = serviceInfo.selectedRooms.includes(room.id)
                      const quantity = serviceInfo.roomQuantities[room.id] || room.defaultQuantity
                      
                      return (
                        <div
                          key={room.id}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                          }`}
                          onClick={() => handleRoomToggle(room.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`text-sm sm:text-base font-medium ${
                                isSelected ? 'text-white' : 'text-gray-300'
                              }`}>
                                {room.name}
                              </span>
                            </div>
                            
                            {isSelected && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuantityChange(room.id, -1)
                                  }}
                                  className="w-6 h-6 p-0 border-gray-500 text-gray-300 hover:bg-gray-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-semibold text-white min-w-[20px] text-center">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuantityChange(room.id, 1)
                                  }}
                                  className="w-6 h-6 p-0 border-gray-500 text-gray-300 hover:bg-gray-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {serviceInfo.selectedRooms.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-200 mb-2">Selected areas:</p>
                      <div className="flex flex-wrap gap-2">
                        {serviceInfo.selectedRooms.map(roomId => {
                          const room = serviceRooms.find(r => r.id === roomId)
                          const quantity = serviceInfo.roomQuantities[roomId]
                          return (
                            <span key={roomId} className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs">
                              {room?.name} ({quantity})
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      case 4: // Payment Method
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Choose Payment Method</h3>
              <p className="text-sm sm:text-base text-white/80">Select how you'd like to pay for this service</p>
            </div>
            
            <div className="space-y-4">
              {/* Online Payment Option */}
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'ONLINE' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
                onClick={() => setPaymentMethod('ONLINE')}
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
                onClick={() => setPaymentMethod('CASH')}
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
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Review Your Booking</h3>
              <p className="text-sm sm:text-base text-white/80">Please review your service details before proceeding</p>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="font-medium text-white text-sm sm:text-base">Payment Method</span>
                  <div className="flex items-center space-x-2">
                    {paymentMethod === 'ONLINE' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm sm:text-base">Pay Online</span>
                        <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline ml-2">Edit</button>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm sm:text-base">Pay with Cash</span>
                        <button onClick={() => setCurrentStep(4)} className="text-blue-400 text-xs underline ml-2">Edit</button>
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
            </div>
          </div>
        )

      case 6: // Choose Provider
        return (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="text-center animate-slide-in-up">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Choose Your Provider</h3>
              <p className="text-sm sm:text-base text-white/80">Select from available providers in your area</p>
            </div>
            
            {/* Provider Discovery Panel */}
            {onProviderSelected && (
              <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                <ProviderDiscoveryPanel
                  form={value}
                  onProviderSelected={onProviderSelected}
                  onBack={() => {
                    // Go back to step 4 (Review)
                    setCurrentStep(4);
                  }}
                  onLoginSuccess={handleLoginSuccess}
                  onCancelBooking={() => {
                    // Reset form and go to first step
                    onChange({
                      serviceId: "",
                      date: "",
                      time: "",
                      address: "",
                      notes: ""
                    });
                    setCurrentStep(0);
                  }}
                />
              </div>
            )}
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
        <div className="text-center space-y-3">
          <p className="text-white/80">Failed to load services.</p>
          <Button variant="outline" onClick={() => mutate()}>
            Retry
          </Button>
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
              
              return (
                <div key={step.id} className="flex flex-col items-center space-y-2 min-w-[60px]">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white scale-110' 
                      : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white scale-110 animate-pulse' 
                      : 'bg-white border-gray-300 text-gray-400 scale-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-white/70'
                  }`}>
                    {step.title}
                  </span>
                </div>
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
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white scale-110' 
                      : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white scale-110 animate-pulse' 
                      : 'bg-white border-gray-300 text-gray-400 scale-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
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

      {/* Navigation - Mobile Optimized - Hidden on Provider Selection Step */}
      {currentStep !== 6 && (
      <div className={`flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 space-y-3 sm:space-y-0 transition-all duration-300 ${
        isTransitioning ? 'opacity-50 translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
          {/* Back Button - Hidden on first step */}
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
          ) : currentStep === steps.length - 1 ? (
            'Complete Booking'
          ) : currentStep === steps.length - 2 ? (
            'Choose Provider'
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
