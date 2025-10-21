"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  X, 
  Star, 
  Package,
  Users
} from "lucide-react"

interface Provider {
  id: string
  businessName: string
  description: string
  experience: number
  location: string
  hourlyRate: number
    user: {
      name: string
    email: string
    phone?: string
      avatar?: string
    }
    service: {
      name: string
    description: string
      category: string
    }
    averageRating: number
    totalReviews: number
  completedJobs: number
  recentReviews: Array<{
    id: string
    rating: number
    comment?: string
    client?: { name?: string }
    booking?: { client?: { name?: string } }
    createdAt: string
  }>
  isAvailable: boolean
}

interface ServiceCatalogueModalProps {
  provider: Provider
  serviceId: string
  isOpen: boolean
  onClose: () => void
  onSelect?: (item: {
    id: string
    title: string
    price: number
    currency: string
    durationMins: number
  }) => void
}

type CatalogueItem = {
  id: string
  providerId: string
  serviceId: string
  title: string
  shortDesc: string
  price: number
  currency: string
  durationMins: number
  isActive: boolean
}

export function ServiceCatalogueModal({ provider, serviceId, isOpen, onClose, onSelect }: ServiceCatalogueModalProps) {
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (serviceId) params.set('serviceId', serviceId)
        params.set('limit', '50')
        const res = await fetch(`/api/catalogue?${params.toString()}`, { cache: 'no-cache' })
        if (!res.ok) throw new Error(`Failed to load catalogue (${res.status})`)
        const data = await res.json()
        const list: any[] = Array.isArray(data) ? data : (data.items || [])
        const filtered: CatalogueItem[] = list
          .filter((i: any) => i && i.providerId === provider.id && i.isActive)
          .map((i: any) => ({
            id: i.id,
            providerId: i.providerId,
            serviceId: i.serviceId,
            title: i.title,
            shortDesc: i.shortDesc,
            price: i.price,
            currency: i.currency || 'ZAR',
            durationMins: i.durationMins,
            isActive: i.isActive,
          }))
        setItems(filtered)
      } catch (e: any) {
        setError(e?.message || 'Failed to load catalogue')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) run()
  }, [isOpen, serviceId, provider.id])

  const formatExperience = (years: number) => {
    if (years === 1) return "1 year"
    return `${years} years`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate dynamic pricing based on service specifications
  const calculatePrice = (service: any, specs: any) => {
    const basePrice = parseInt(service.price.replace('From R', ''))
    let totalPrice = basePrice

    if (service.id === 'house-cleaning' || service.id === 'deep-cleaning') {
      // Room-based pricing
      const rooms = specs.rooms || 1
      const bathrooms = specs.bathrooms || 1
      const additionalRooms = Math.max(0, rooms - 2) // First 2 rooms included
      const additionalBathrooms = Math.max(0, bathrooms - 1) // First bathroom included
      
      totalPrice += (additionalRooms * 50) + (additionalBathrooms * 30)
    } else if (service.id === 'window-cleaning') {
      // Window-based pricing
      const windows = specs.windows || 5
      const additionalWindows = Math.max(0, windows - 5) // First 5 windows included
      totalPrice += additionalWindows * 20
    } else if (service.id === 'carpet-cleaning') {
      // Area-based pricing
      const area = specs.area || 50 // square meters
      const additionalArea = Math.max(0, area - 50) // First 50 sqm included
      totalPrice += additionalArea * 5
    }

    return totalPrice
  }

  const handleSpecChange = (serviceId: string, specKey: string, value: any) => {
    setServiceSpecs(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [specKey]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <Card className="shadow-2xl border-0 bg-black/95 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12 ring-2 ring-purple-500/30">
                  <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                  <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {provider.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl text-white">
                    {provider.businessName || provider.user.name}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Service Catalogue • {provider.service.category}
                  </CardDescription>
                </div>
              </div>
            <Button
              variant="ghost"
              size="sm"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
            >
                <X className="w-5 h-5" />
            </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Available Packages</h3>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {items.length} Packages
                </Badge>
              </div>

              {loading && <div className="text-white/70 text-sm">Loading packages...</div>}
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {!loading && !error && items.length === 0 && (
                <div className="text-white/60 text-sm">No active packages for this service.</div>
              )}
              {!loading && !error && items.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <Card key={item.id} className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-base">{item.title}</CardTitle>
                        <CardDescription className="text-white/70 text-sm">{item.shortDesc}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <div className="text-green-400 font-semibold">R{item.price}</div>
                          <div className="text-white/60 text-sm">{item.durationMins} min</div>
                        </div>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => onSelect?.(item)}
                        >
                          Select Package
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Reviews */}
            {provider.recentReviews.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {provider.recentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-500"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {review.client?.name || review.booking?.client?.name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-white/60">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-white/80">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>

        {/* Footer */}
          <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
                Select a package to continue to booking
            </div>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Close Catalogue
              </Button>
            </div>
          </div>
        </Card>
          </div>
        </div>
  )
}