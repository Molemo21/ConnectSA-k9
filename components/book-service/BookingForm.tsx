"use client"

import React, { useEffect } from "react"
import useSWR from "swr"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, MapPin, ArrowRight, ArrowLeft, Search, CalendarDays, Clock, X, CheckCircle } from "lucide-react"
import { ProviderDiscoveryPanel } from "@/components/book-service/ProviderDiscoveryPanel";
import { reverseGeocode } from "@/lib/geocoding"

const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  address: z.string().min(3, 'Address is required'),
  notes: z.string().optional(),
})

const fetcher = (url: string, signal?: AbortSignal) => fetch(url, { signal }).then(r => {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

interface BookingFormProps {
  value: { serviceId: string; date: string; time: string; address: string; notes?: string }
  onChange: (next: BookingFormProps["value"]) => void
  onNext: () => void
  onBack?: () => void
  submitting?: boolean
  isAuthenticated?: boolean | null
  onShowLoginModal?: () => void
}

export function BookingForm({ value, onChange, onNext, onBack, submitting, isAuthenticated: parentIsAuthenticated, onShowLoginModal }: BookingFormProps) {
  // Use parent's authentication state
  const isAuthenticated = parentIsAuthenticated;

  const onProviderSelected = (providerId: string) => {
    console.log("Provider selected:", providerId);
    // Handle provider selection logic here
  };

  const handleSignInClick = () => {
    if (onShowLoginModal) {
      onShowLoginModal();
    }
  };

  const handleSignInRequired = async () => {
    if (!isAuthenticated) {
      // Save current booking data as a draft before showing login modal
      try {
        const { saveBookingDraft } = await import('@/lib/booking-draft')
        const draft = await saveBookingDraft(value)
        console.log('📝 Booking draft saved before login:', draft.id)
        handleSignInClick();
      } catch (error) {
        console.error('Failed to save booking draft:', error)
        // Show error to user
        alert('Failed to save your booking. Please try again.')
        // Fallback: save to sessionStorage for same-device flow
        sessionStorage.setItem("bookingDetails", JSON.stringify(value))
        handleSignInClick();
      }
    }
  };

  useEffect(() => {
    console.log("isAuthenticated state changed:", isAuthenticated);
  }, [isAuthenticated]);

  const { data: services, error, isLoading } = useSWR('/api/services', (url) => {
    const ctrl = new AbortController()
    const p = fetcher(url, ctrl.signal)
    // Optional: return a cleanup to abort if SWR revalidates quickly
    ;(p as any).cancel = () => ctrl.abort()
    return p
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof value, string>>>({})
  const [isGeocoding, setIsGeocoding] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null)
  const [serviceQuery, setServiceQuery] = React.useState("")
  const [recentServiceIds, setRecentServiceIds] = React.useState<string[]>([])
  const [notesCount, setNotesCount] = React.useState(value.notes?.length || 0)
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = React.useState(false)
  const [isTimeSlotsOpen, setIsTimeSlotsOpen] = React.useState(false)
  const NOTES_MAX = 500

  React.useEffect(() => {
    const recents = (typeof window !== 'undefined' && localStorage.getItem('recentServices')) || '[]'
    try { setRecentServiceIds(JSON.parse(recents)) } catch { setRecentServiceIds([]) }
  }, [])

  const selectedService = React.useMemo(() => services?.find((s: any) => s.id === value.serviceId), [services, value.serviceId])

  function handleFieldChange(name: keyof typeof value, val: string) {
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
      setIsServiceDropdownOpen(false)
    }
    if (name === 'notes') setNotesCount(val.length)
  }

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = bookingFormSchema.safeParse(value)
    if (!res.success) {
      const errs: any = {}
      res.error.issues.forEach(i => { if (i.path[0]) errs[i.path[0] as string] = i.message })
      setErrors(errs)
      // Announce and focus first invalid field
      const firstKey = Object.keys(errs)[0] as keyof typeof value
      if (firstKey && formRef.current) {
        const el = formRef.current.querySelector(`[name="${firstKey}"]`) as HTMLElement | null
        if (el && typeof el.focus === 'function') {
          el.focus()
          el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = 'Please correct the highlighted fields.'
      }
      return
    }
    
    // Check if user is authenticated before proceeding
    if (isAuthenticated === false) {
      handleSignInRequired();
    } else {
      onNext()
    }
  }

  const filteredServices = React.useMemo(() => {
    if (!services) return []
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return services
    return services.filter((s: any) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Service Details</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Fill in the details below to book your service. You'll choose a provider next.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6 sm:pb-8">
        {isLoading && (
          <div className="space-y-3">
            <div className="h-10 sm:h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 sm:h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 sm:h-12 bg-gray-100 rounded animate-pulse" />
          </div>
        )}

        {!isLoading && (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
            <div ref={liveRegionRef} className="sr-only" aria-live="polite" />
            {/* Service Selection - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="serviceId" className="text-sm font-medium">Service Type *</Label>
              <div className="relative">
                <div className="flex items-center px-3 py-3 border border-gray-200 rounded-md bg-white">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    aria-label="Search services"
                    className="ml-2 w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
                    placeholder="Search by name or category"
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    onFocus={() => setIsServiceDropdownOpen(true)}
                  />
                  {serviceQuery && (
                    <button
                      type="button"
                      onClick={() => setServiceQuery("")}
                      className="ml-2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown - Mobile Optimized */}
                {(isServiceDropdownOpen || serviceQuery) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
                    {recentServiceIds.length > 0 && !serviceQuery && (
                      <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500 font-medium">Recent</div>
                    )}
                    {recentServiceIds.map((id) => {
                      const s = services?.find((x: any) => x.id === id)
                      if (!s || serviceQuery) return null
                      return (
                        <button 
                          type="button" 
                          key={`recent-${id}`} 
                          onClick={() => handleFieldChange('serviceId', id)} 
                          className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${value.serviceId===id?'bg-indigo-50':''}`}
                        >
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{s.category}</div>
                        </button>
                      )
                    })}
                    {filteredServices && filteredServices.length > 0 ? (
                      filteredServices.map((service: any) => (
                        <button 
                          type="button" 
                          key={service.id} 
                          onClick={() => handleFieldChange('serviceId', service.id)} 
                          className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${value.serviceId===service.id?'bg-indigo-50':''}`}
                        >
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{service.category}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-gray-500 text-center">No services found</div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Required. Start typing to filter; your recent choices appear first.</p>
              {errors.serviceId && <p className="text-xs text-red-600" role="alert">{errors.serviceId}</p>}
            </div>

            {/* Date and Time - Mobile Optimized Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="date" 
                    name="date" 
                    value={value.date} 
                    onChange={(e) => handleFieldChange('date', e.target.value)} 
                    min={new Date().toISOString().split('T')[0]} 
                    required 
                    className="pl-10 h-12 text-base" 
                    aria-invalid={!!errors.date} 
                  />
                </div>
                {errors.date ? (
                  <p className="text-xs text-red-600" role="alert">{errors.date}</p>
                ) : value.date ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Date selected
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Select a date</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium">Time *</Label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="time" 
                    name="time" 
                    value={value.time} 
                    onChange={(e) => handleFieldChange('time', e.target.value)} 
                    required 
                    className="pl-10 h-12 text-base" 
                    aria-invalid={!!errors.time} 
                  />
                </div>
                {!errors.time && value.date && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setIsTimeSlotsOpen(!isTimeSlotsOpen)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isTimeSlotsOpen ? 'Hide' : 'Show'} quick time slots
                    </button>
                    {isTimeSlotsOpen && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {timeSlots.slice(0, 8).map((t) => (
                          <button
                            type="button"
                            key={t}
                            aria-label={`Select ${t}`}
                            onClick={() => handleFieldChange('time', t)}
                            className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                              value.time===t
                                ?'bg-indigo-50 border-indigo-200 text-indigo-700'
                                :'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {errors.time ? (
                  <p className="text-xs text-red-600" role="alert">{errors.time}</p>
                ) : value.time ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Time selected
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Select a time</p>
                )}
              </div>
            </div>

            {/* Address - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Service Address *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    name="address" 
                    value={value.address} 
                    onChange={(e) => handleFieldChange('address', e.target.value)} 
                    placeholder="Enter your address" 
                    className="pl-10 h-12 text-base" 
                    required 
                    aria-invalid={!!errors.address} 
                    autoComplete="street-address" 
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto text-sm" 
                  onClick={handleCurrentLocation}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      📍 Use my location
                    </>
                  )}
                </Button>
              </div>
              {value.address && (
                <div className="text-xs text-gray-500">
                  We only use your address to match local providers.
                </div>
              )}
              {errors.address && <p className="text-xs text-red-600" role="alert">{errors.address}</p>}
            </div>

            {/* Notes - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['Parking info','Gate/Access code','Pet on premises','Preferred time window'].map((chip) => (
                  <button 
                    type="button" 
                    key={chip} 
                    onClick={() => handleFieldChange('notes', `${(value.notes||'').trim()}${value.notes? '\n' : ''}${chip}: `)} 
                    className="px-3 py-1 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <Textarea 
                name="notes" 
                value={value.notes} 
                onChange={(e) => handleFieldChange('notes', e.target.value)} 
                placeholder="Any specific requirements or details..." 
                rows={4} 
                className="text-base min-h-[4rem] resize-none whitespace-pre-line" 
                maxLength={NOTES_MAX} 
              />
              <div className="text-xs text-gray-500">{notesCount}/{NOTES_MAX} characters</div>
            </div>

            {/* Selected Service Display */}
            {selectedService && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Selected:</span> {selectedService.name} • {selectedService.category}
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center justify-between pt-4">
              {onBack ? (
                <Button type="button" variant="outline" onClick={onBack} className="h-12">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : <span />}
              <Button 
                type="submit" 
                disabled={!isValid || submitting} 
                className="h-12 px-8 text-base font-medium"
              >
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
            </div>
          </form>
        )}

        {/* Mobile Fixed Bottom Button */}
        <div className="sm:hidden fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-4 z-40">
          <Button 
            type="submit" 
            disabled={!isValid || submitting} 
            className="w-full h-14 text-base font-medium shadow-lg"
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>


        {/* Provider Discovery Panel */}
        {isAuthenticated && (
          <ProviderDiscoveryPanel
            form={value}
            onProviderSelected={onProviderSelected}
            onBack={onBack || (() => {})}
          />
        )}
      </CardContent>
    </Card>
    </div>
  )
}


