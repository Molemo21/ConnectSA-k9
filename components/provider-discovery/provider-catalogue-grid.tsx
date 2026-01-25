"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Package,
  Eye,
  Shield,
  Award,
  TrendingUp
} from "lucide-react"
import Image from "next/image"
import { showToast } from "@/lib/toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  booking?: {
    client?: {
      name?: string
    }
  }
}

interface CatalogueItem {
  id: string
  title: string
  price: number
  currency: string
  durationMins: number
  images: string[]
  featuredImageIndex?: number
  serviceId: string
  service: {
    name: string
    category: {
      name: string
    }
  }
  reviews: Review[]
}

interface Provider {
  id: string
  businessName: string
  description: string
  experience: number
  location: string
  hourlyRate: number
  status?: string // 'APPROVED', 'PENDING', etc.
  available?: boolean
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
  isAvailable: boolean
  catalogueItems: CatalogueItem[]
}

interface ProviderCatalogueGridProps {
  providers: Provider[]
  serviceId: string
  onProviderSelected?: (providerId: string, catalogueItemId: string) => void
  onPackageSelected?: (providerId: string, catalogueItemId: string, providerData?: Provider, packageData?: CatalogueItem) => void
  onBack?: () => void
  isProcessing?: boolean
  providerCount?: number
}

export function ProviderCatalogueGrid({ 
  providers,
  serviceId, 
  onProviderSelected, 
  onPackageSelected,
  onBack,
  isProcessing = false,
  providerCount
}: ProviderCatalogueGridProps) {
  // serviceId is kept for potential future use or API calls
  void serviceId
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({}) // providerId -> catalogueItemId
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({}) // catalogueItemId -> boolean
  const [showReviewsModal, setShowReviewsModal] = useState<string | null>(null) // providerId -> boolean
  const [showCatalogueModal, setShowCatalogueModal] = useState<string | null>(null) // providerId -> boolean
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null) // providerId -> boolean
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({}) // packageId -> boolean (defaults to true)
  const scrollContainersRef = useRef<Record<string, HTMLDivElement | null>>({})
  const mainScrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Filter out providers with no catalogue items
  const providersWithCatalogues = providers.filter(
    p => p.catalogueItems && p.catalogueItems.length > 0
  )

  const displayProviderCount = providerCount !== undefined ? providerCount : providersWithCatalogues.length
  const firstProvider = providersWithCatalogues[0]
  const serviceName = firstProvider?.catalogueItems?.[0]?.service?.name || firstProvider?.service?.name || "Service"
  const categoryName = firstProvider?.catalogueItems?.[0]?.service?.category?.name || firstProvider?.service?.category || "Category"

  // Auto-select first catalogue item for each provider
  useEffect(() => {
    const initialSelections: Record<string, string> = {}
    providersWithCatalogues.forEach(provider => {
      if (provider.catalogueItems && provider.catalogueItems.length > 0 && !selectedItems[provider.id]) {
        const firstItem = provider.catalogueItems[0]
        if (firstItem && firstItem.id) {
          initialSelections[provider.id] = firstItem.id
        }
      }
    })
    if (Object.keys(initialSelections).length > 0) {
      setSelectedItems(prev => ({ ...prev, ...initialSelections }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersWithCatalogues])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const scrollLeft = (providerId?: string) => {
    if (providerId) {
      const container = scrollContainersRef.current[providerId]
      if (container) {
        container.scrollBy({ left: -200, behavior: 'smooth' })
      }
    } else {
      // Main scroll container
      if (mainScrollContainerRef.current) {
        mainScrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = (providerId?: string) => {
    if (providerId) {
      const container = scrollContainersRef.current[providerId]
      if (container) {
        container.scrollBy({ left: 200, behavior: 'smooth' })
      }
    } else {
      // Main scroll container
      if (mainScrollContainerRef.current) {
        mainScrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
      }
    }
  }

  const setScrollContainerRef = (providerId: string) => (el: HTMLDivElement | null) => {
    scrollContainersRef.current[providerId] = el
  }

  const handleItemSelect = (providerId: string, itemId: string) => {
    setSelectedItems(prev => ({ ...prev, [providerId]: itemId }))
  }

  const handleImageClick = (itemId: string) => {
    setExpandedImages(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleSelectProvider = (providerId: string) => {
    const selectedItemId = selectedItems[providerId]
    if (!selectedItemId) {
      showToast.error("Please select a service first")
      return
    }
    
    // Find provider and package data
    const provider = providers.find(p => p.id === providerId)
    const packageData = provider?.catalogueItems?.find(item => item && item.id === selectedItemId)
    
    // Use onPackageSelected if available (new flow), otherwise fall back to onProviderSelected (old flow)
    if (onPackageSelected) {
      onPackageSelected(providerId, selectedItemId, provider, packageData)
    } else {
      onProviderSelected?.(providerId, selectedItemId)
    }
  }

  const getSelectedItem = (provider: Provider): CatalogueItem | null => {
    const selectedItemId = selectedItems[provider.id]
    if (!selectedItemId || !provider.catalogueItems || provider.catalogueItems.length === 0) return null
    return provider.catalogueItems.find(item => item && item.id === selectedItemId) || null
  }

  const getAverageRating = (reviews: Review[]): number => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  // Helper function to determine trust badges
  const getTrustBadges = (provider: Provider) => {
    const badges: Array<{ label: string; icon: React.ReactNode; color: string }> = []
    
    // Verified badge (status === 'APPROVED')
    if (provider.status === 'APPROVED') {
      badges.push({
        label: 'Verified',
        icon: <Shield className="w-3 h-3" />,
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      })
    }
    
    // Top Rated badge (rating >= 4.5 and reviews >= 10)
    const rating = provider.averageRating ?? 0
    const reviews = provider.totalReviews ?? 0
    if (rating >= 4.5 && reviews >= 10) {
      badges.push({
        label: 'Top Rated',
        icon: <Award className="w-3 h-3" />,
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      })
    }
    
    // Popular badge (completedJobs >= 20)
    const jobs = provider.completedJobs ?? 0
    if (jobs >= 20) {
      badges.push({
        label: 'Popular',
        icon: <TrendingUp className="w-3 h-3" />,
        color: 'bg-green-500/20 text-green-300 border-green-500/30'
      })
    }
    
    return badges
  }

  const formatExperience = (years: number | null | undefined) => {
    if (!years || years === 0) return "No experience listed"
    if (years === 1) return "1 year"
    return `${years} years`
  }

  // Helper function to get hero image (featured or first)
  const getHeroImage = (item: CatalogueItem): string | null => {
    if (!item.images || item.images.length === 0) return null
    
    // Use featured image if specified and valid
    if (item.featuredImageIndex !== undefined && 
        item.featuredImageIndex >= 0 && 
        item.featuredImageIndex < item.images.length) {
      return item.images[item.featuredImageIndex]
    }
    
    // Fallback to first image
    return item.images[0]
  }

  // Helper function to detect before/after pairs
  const detectBeforeAfterPairs = (images: string[]) => {
    const pairs: Array<{ before: string; after: string; index: number }> = []
    const singles: string[] = []
    
    // Extract before and after images with their numbers
    const beforeImages: Array<{ url: string; number: number }> = []
    const afterImages: Array<{ url: string; number: number }> = []
    
    images.forEach((url, index) => {
      const lowerUrl = url.toLowerCase()
      // Match patterns like: _before_1, _before1, _before, before_1, etc.
      const beforeMatch = lowerUrl.match(/(?:^|[/_-])(before)[/_-]?(\d+)?/i)
      // Match patterns like: _after_1, _after1, _after, after_1, etc.
      const afterMatch = lowerUrl.match(/(?:^|[/_-])(after)[/_-]?(\d+)?/i)
      
      if (beforeMatch) {
        const number = beforeMatch[2] ? parseInt(beforeMatch[2]) : index
        beforeImages.push({ url, number })
      } else if (afterMatch) {
        const number = afterMatch[2] ? parseInt(afterMatch[2]) : index
        afterImages.push({ url, number })
      } else {
        singles.push(url)
      }
    })
    
    // Match pairs by number
    beforeImages.forEach((before) => {
      const matchingAfter = afterImages.find(after => after.number === before.number)
      if (matchingAfter) {
        pairs.push({ 
          before: before.url, 
          after: matchingAfter.url,
          index: before.number 
        })
        // Remove matched after from array
        const afterIndex = afterImages.indexOf(matchingAfter)
        if (afterIndex > -1) afterImages.splice(afterIndex, 1)
      } else {
        singles.push(before.url)
      }
    })
    
    // Add unmatched after images
    afterImages.forEach(after => singles.push(after.url))
    
    return { pairs, singles }
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl text-white">Choose Your Provider</CardTitle>
                <CardDescription className="text-white/80 text-sm sm:text-base">
                  Browse and select from {displayProviderCount} available providers
                </CardDescription>
              </div>
              {onBack && (
                <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-white/70">
              <span>
                {displayProviderCount} providers available
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {serviceName}
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  {categoryName}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Providers Grid - Desktop: Horizontal Scroll, Mobile: Vertical Stack */}
        <div className="relative">
          {/* Desktop Navigation Arrows - Hidden on Mobile */}
          <div className="hidden sm:flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollLeft()}
              className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white/70 text-xs sm:text-sm text-center px-4">
              Swipe or use arrows to browse providers
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollRight()}
              className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-10 h-10 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop: Horizontal Scroll Container */}
          <div 
            ref={mainScrollContainerRef}
            className="hidden sm:flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {providersWithCatalogues.map((provider, index) => {
              const selectedItem = getSelectedItem(provider)
              const selectedItemReviews = selectedItem?.reviews || []
              const trustBadges = getTrustBadges(provider)

              return (
                <Card 
                  key={provider.id}
                  className="group flex-shrink-0 w-72 sm:w-80 md:w-96 snap-center shadow-xl border-0 bg-black/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-in-up overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                <CardContent className="p-0">
                  {selectedItem ? (
                    <>
                      {/* 1. Hero Image with Price Overlay and Trust Badges */}
                      <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-t-lg overflow-hidden bg-gray-800">
                        {(() => {
                          const heroImage = getHeroImage(selectedItem);
                          return heroImage ? (
                            <>
                              <Image
                                src={heroImage}
                                alt={selectedItem.title}
                                fill
                                className="object-cover cursor-zoom-in group-hover/image:scale-110 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, 768px"
                                onClick={() => handleImageClick(selectedItem.id)}
                              />
                              {expandedImages[selectedItem.id] && (
                                <div 
                                  className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                                  onClick={() => handleImageClick(selectedItem.id)}
                                >
                                  <Image
                                    src={heroImage}
                                    alt={selectedItem.title}
                                    width={1200}
                                    height={800}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white z-10"
                                onClick={() => handleImageClick(selectedItem.id)}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                              <Package className="w-16 h-16 text-white/50" />
                            </div>
                          )
                        })()}
                        
                        {/* Trust Badges - Top Left */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {trustBadges.map((badge, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className={`${badge.color} text-xs flex items-center gap-1 px-2 py-0.5`}
                            >
                              {badge.icon}
                              {badge.label}
                            </Badge>
                          ))}
                      </div>

                        {/* Price Badge - Top Right (Prominent) */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-green-500/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border-2 border-green-400/50">
                            <p className="text-white font-bold text-lg sm:text-xl">
                              {selectedItem.currency} {selectedItem.price.toLocaleString()}
                            </p>
                            {provider.catalogueItems.length > 1 && (
                              <p className="text-white/80 text-xs">Starting from</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Provider Info Section */}
                      <div className="px-4 pt-4 pb-2 space-y-2">
                        {/* Provider Name and Rating */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                              {provider.businessName || provider.user.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-white font-medium text-sm">
                                  {(provider.averageRating ?? 0).toFixed(1)}
                                </span>
                              </div>
                              <span className="text-white/60 text-xs">
                                ({(provider.totalReviews ?? 0)} reviews)
                              </span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60 text-xs">
                                {formatExperience(provider.experience)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs flex-shrink-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-white/70 text-xs">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          <span className="truncate">{provider.location || "Location not specified"}</span>
                        </div>
                      </div>

                      {/* 3. Service Thumbnails */}
                      {provider.catalogueItems.length > 0 && (
                        <div className="px-4 pt-2 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-white/70 text-xs sm:text-sm font-medium">Select Service</Label>
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              {provider.catalogueItems.length} Service{provider.catalogueItems.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          {/* Horizontal Scrollable Thumbnails */}
                          <div className="relative">
                            {provider.catalogueItems.length > 4 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => scrollLeft(provider.id)}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white/20 w-8 h-8 p-0 rounded-full"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => scrollRight(provider.id)}
                                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 border-white/20 text-white hover:bg-white/20 w-8 h-8 p-0 rounded-full"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <div 
                              ref={setScrollContainerRef(provider.id)}
                              className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x snap-mandatory scroll-smooth"
                            >
                              {provider.catalogueItems.map((item) => {
                                const isSelected = selectedItems[provider.id] === item.id
                                const thumbnailImage = getHeroImage(item) // Use featured image if available, otherwise first image

                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => handleItemSelect(provider.id, item.id)}
                                    className={`
                                      flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer
                                      transition-all duration-200 snap-center border-2
                                      ${isSelected 
                                        ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105' 
                                        : 'border-white/20 hover:border-white/40 hover:scale-102'
                                      }
                                    `}
                                  >
                                    {thumbnailImage ? (
                                      <div className="relative w-full h-full group">
                                        <Image
                                          src={thumbnailImage}
                                          alt={item.title}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 64px, 80px"
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                        {isSelected && (
                                          <div className="absolute inset-0 bg-purple-400/20 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-purple-400" />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {/* Empty placeholder to maintain spacing */}
                              {provider.catalogueItems.length < 4 && (
                                <div className="h-16 sm:h-20" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Selected Service Info */}
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{selectedItem.title}</h3>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            {selectedItem.service?.name || 'Service'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-white/60 text-xs mb-1">Price</p>
                            <p className="text-green-400 font-semibold text-lg sm:text-xl">
                              {selectedItem.currency} {selectedItem.price.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs mb-1">Duration</p>
                            <div className="flex flex-col">
                              <div className="flex items-center text-white/80 text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span>{formatDuration(selectedItem.durationMins)}</span>
                              </div>
                              {selectedItemReviews.length > 0 && (
                                <button
                                  onClick={() => setShowReviewsModal(provider.id)}
                                  className="text-purple-400 hover:text-purple-300 text-xs mt-1 underline decoration-purple-400/50 hover:decoration-purple-300 transition-colors text-left"
                                >
                                  {selectedItemReviews.length} review{selectedItemReviews.length !== 1 ? 's' : ''}
                                </button>
                              )}
                            </div>
                            </div>
                          </div>
                        </div>

                      {/* 5. Primary CTA - Single Button */}
                      <div className="px-4 pb-4 border-t border-white/10 pt-4">
                          <Button
                            size="sm"
                          onClick={() => handleSelectProvider(provider.id)}
                          disabled={isProcessing || !selectedItems[provider.id]}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg"
                          >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Select This Package
                          </Button>

                        {/* Secondary Actions - Smaller, Less Prominent */}
                        <div className="flex items-center justify-center gap-3 mt-3">
                        <Button
                            variant="ghost"
                          size="sm"
                            onClick={() => setShowCatalogueModal(provider.id)}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
                        >
                            <Package className="w-3 h-3 mr-1" />
                            All Services
                        </Button>
                        <Button
                            variant="ghost"
                          size="sm"
                            onClick={() => setShowDetailsModal(provider.id)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs"
                        >
                            <Eye className="w-3 h-3 mr-1" />
                            Portfolio
                        </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <Package className="w-12 h-12 mx-auto text-white/40 mb-2" />
                      <p className="text-white/60 text-sm">No service selected</p>
                    </div>
                  )}
              </CardContent>
                </Card>
              )
            })}
        </div>

          {/* Scroll indicators - Desktop only */}
          <div className="hidden sm:flex justify-center mt-4 space-x-2">
          {providersWithCatalogues.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/30"
            />
          ))}
        </div>

          {/* Mobile: Vertical Stack */}
          <div className="sm:hidden space-y-4">
          {providersWithCatalogues.map((provider, index) => {
            const selectedItem = getSelectedItem(provider)
            const trustBadges = getTrustBadges(provider)

            return (
              <Card 
                key={provider.id}
                className="shadow-xl border-0 bg-black/90 backdrop-blur-sm animate-slide-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  {selectedItem ? (
                    <>
                      {/* Mobile: Hero Image with Overlays */}
                      <div className="relative w-full h-56 rounded-t-lg overflow-hidden bg-gray-800">
                        {(() => {
                          const heroImage = getHeroImage(selectedItem);
                          return heroImage ? (
                            <>
                              <Image
                                src={heroImage}
                                alt={selectedItem.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                onClick={() => handleImageClick(selectedItem.id)}
                              />
                              {expandedImages[selectedItem.id] && (
                                <div 
                                  className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                                  onClick={() => handleImageClick(selectedItem.id)}
                                >
                                  <Image
                                    src={heroImage}
                                    alt={selectedItem.title}
                                    width={1200}
                                    height={800}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                              <Package className="w-16 h-16 text-white/50" />
                            </div>
                          )
                        })()}
                        
                        {/* Trust Badges - Top Left */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {trustBadges.map((badge, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className={`${badge.color} text-xs flex items-center gap-1 px-2 py-0.5`}
                            >
                              {badge.icon}
                              {badge.label}
                            </Badge>
                          ))}
                        </div>

                        {/* Price Badge - Top Right (Prominent) */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-green-500/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border-2 border-green-400/50">
                            <p className="text-white font-bold text-lg">
                              {selectedItem.currency} {selectedItem.price.toLocaleString()}
                            </p>
                            {provider.catalogueItems.length > 1 && (
                              <p className="text-white/80 text-xs">Starting from</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Provider Info */}
                      <div className="px-4 pt-4 pb-2 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {provider.businessName || provider.user.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-white font-medium text-sm">
                                  {(provider.averageRating ?? 0).toFixed(1)}
                                </span>
                              </div>
                              <span className="text-white/60 text-xs">
                                ({(provider.totalReviews ?? 0)} reviews)
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-white/70 text-xs">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          <span className="truncate">{provider.location || "Location not specified"}</span>
                        </div>
                      </div>

                      {/* Mobile: Service Thumbnails */}
                      {provider.catalogueItems.length > 0 && (
                        <div className="px-4 pt-2 pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-white/70 text-sm font-medium">Select Service</Label>
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              {provider.catalogueItems.length} Service{provider.catalogueItems.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div 
                            ref={setScrollContainerRef(provider.id)}
                            className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x snap-mandatory scroll-smooth"
                          >
                            {provider.catalogueItems.map((item) => {
                              const isSelected = selectedItems[provider.id] === item.id
                              const thumbnailImage = getHeroImage(item) // Use featured image if available, otherwise first image

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleItemSelect(provider.id, item.id)}
                                  className={`
                                    flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer
                                    transition-all duration-200 snap-center border-2
                                    ${isSelected 
                                      ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105' 
                                      : 'border-white/20 hover:border-white/40'
                                    }
                                  `}
                                >
                                  {thumbnailImage ? (
                                    <div className="relative w-full h-full">
                                      <Image
                                        src={thumbnailImage}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-purple-400/20 flex items-center justify-center">
                                          <CheckCircle className="w-4 h-4 text-purple-400" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                      <Package className="w-8 h-8 text-white/50" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mobile: Selected Service Info */}
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{selectedItem.title}</h3>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            {selectedItem.service?.name || 'Service'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-white/60 text-xs mb-1">Price</p>
                            <p className="text-green-400 font-semibold text-lg">
                              {selectedItem.currency} {selectedItem.price.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs mb-1">Duration</p>
                            <div className="flex items-center text-white/80 text-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatDuration(selectedItem.durationMins)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Primary CTA */}
                      <div className="px-4 pb-4 border-t border-white/10 pt-4">
                        <Button
                          size="sm"
                          onClick={() => handleSelectProvider(provider.id)}
                          disabled={isProcessing || !selectedItems[provider.id]}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg py-3"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Select This Package
                        </Button>
                        
                        <div className="flex items-center justify-center gap-4 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCatalogueModal(provider.id)}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                          >
                            <Package className="w-3 h-3 mr-1" />
                            Services
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetailsModal(provider.id)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Portfolio
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <Package className="w-12 h-12 mx-auto text-white/40 mb-2" />
                      <p className="text-white/60 text-sm">No service selected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          </div>
        </div>

        {/* Empty State */}
        {providersWithCatalogues.length === 0 && (
          <Card className="shadow-xl border-0 bg-black/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-white/40 mb-4" />
              <p className="text-white/80 mb-2">No providers with services available</p>
              <p className="text-white/60 text-sm">Providers need to have catalogue items to appear here</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviews Modal */}
      {providersWithCatalogues.map((provider) => {
        const selectedItem = getSelectedItem(provider)
        const selectedItemReviews = selectedItem?.reviews || []
        const selectedItemRating = getAverageRating(selectedItemReviews)

        if (!selectedItem || selectedItemReviews.length === 0) return null

        return (
          <Dialog
            key={`reviews-${provider.id}`}
            open={showReviewsModal === provider.id}
            onOpenChange={(open) => setShowReviewsModal(open ? provider.id : null)}
          >
            <DialogContent className="sm:max-w-lg bg-black/95 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  Reviews for {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {selectedItem.service?.name || 'Service'} • {selectedItem.service?.category?.name || 'Category'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Duration */}
                <div className="flex items-center text-white/80 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  <span>Duration: {formatDuration(selectedItem.durationMins)}</span>
                </div>

                {/* Average Rating */}
                <div className="flex items-center space-x-2 pb-4 border-b border-white/10">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold text-lg">{selectedItemRating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm">({selectedItemReviews.length} reviews)</span>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedItemReviews.map((review) => (
                    <div key={review.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/90 text-sm font-medium">
                          {review.booking?.client?.name || 'Anonymous'}
                        </span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-yellow-400 fill-current" : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-white/70 text-sm leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-white/50 text-xs mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })}

      {/* Catalogue Modal - Enhanced */}
      {providersWithCatalogues.map((provider) => {
        if (!provider.catalogueItems || provider.catalogueItems.length === 0) return null
        const trustBadges = getTrustBadges(provider)

        return (
          <Dialog
            key={`catalogue-${provider.id}`}
            open={showCatalogueModal === provider.id}
            onOpenChange={(open) => setShowCatalogueModal(open ? provider.id : null)}
          >
            <DialogContent className="sm:max-w-5xl bg-black/95 border-white/20 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b border-white/10">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <DialogTitle className="text-white text-2xl">
                        {provider.businessName || provider.user.name}
                </DialogTitle>
                      {/* Trust Badges in Header - moved to left */}
                      <div className="flex items-center gap-1">
                        {trustBadges.map((badge, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`${badge.color} text-xs flex items-center gap-1 px-2 py-0.5`}
                          >
                            {badge.icon}
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                      {/* Reviews - moved to left */}
                      <div className="flex items-center gap-1 text-white/70">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{(provider.averageRating ?? 0).toFixed(1)}</span>
                        <span className="text-sm">({(provider.totalReviews ?? 0)})</span>
                      </div>
                    </div>
                <DialogDescription className="text-white/70">
                      {provider.catalogueItems.length} Service{provider.catalogueItems.length !== 1 ? 's' : ''} Available • Select one to continue
                </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Services Grid - Enhanced */}
              <div className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {provider.catalogueItems.map((item) => {
                  const thumbnailImage = getHeroImage(item) // Use featured image if available, otherwise first image
                  const isSelected = selectedItems[provider.id] === item.id
                    const itemReviews = item.reviews || []
                    const itemRating = getAverageRating(itemReviews)

                  return (
                    <div
                      key={item.id}
                      className={`
                          relative group cursor-pointer rounded-xl overflow-hidden
                          transition-all duration-300 border-2 bg-black/50
                        ${isSelected 
                            ? 'border-green-500 ring-2 ring-green-500/50 scale-105 shadow-lg shadow-green-500/20' 
                            : 'border-white/20 hover:border-purple-400/50 hover:scale-105 hover:shadow-xl'
                        }
                      `}
                        onClick={() => handleItemSelect(provider.id, item.id)}
                    >
                        {/* Image with Price Overlay */}
                      <div className="relative w-full h-48 sm:h-56 bg-gray-800">
                        {thumbnailImage ? (
                            <>
                          <Image
                            src={thumbnailImage}
                            alt={item.title}
                            fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                            </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Package className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                        
                          {/* Price Badge - Top Right (Prominent) */}
                          <div className="absolute top-2 right-2 z-10">
                            <div className="bg-green-500/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border-2 border-green-400/50">
                              <p className="text-white font-bold text-lg">
                                {item.currency} {item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>

                          {/* Selected Indicator - Top Left */}
                        {isSelected && (
                            <div className="absolute top-2 left-2 z-10 bg-green-500 rounded-full p-1.5 shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}

                          {/* Rating Badge - Bottom Left */}
                          {itemRating > 0 && (
                            <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-white text-xs font-medium">{itemRating.toFixed(1)}</span>
                                {itemReviews.length > 0 && (
                                  <span className="text-white/60 text-xs">({itemReviews.length})</span>
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Service Info */}
                        <div className="p-4 bg-white/5 border-t border-white/10">
                          <h4 className="text-white font-semibold text-base mb-2 line-clamp-2 min-h-[2.5rem]">
                          {item.title}
                        </h4>
                          <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                              {item.service?.name || 'Service'}
                          </Badge>
                          <div className="flex items-center text-white/70 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDuration(item.durationMins)}</span>
                          </div>
                        </div>
                          
                          {/* Quick Action Button */}
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemSelect(provider.id, item.id)
                              setShowCatalogueModal(null)
                            }}
                            className={`w-full mt-2 ${
                              isSelected
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Selected
                              </>
                            ) : (
                              <>
                                <Package className="w-4 h-4 mr-2" />
                                Select This
                              </>
                            )}
                          </Button>
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>

              {/* Footer with Quick Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white/70 text-sm">
                  {selectedItems[provider.id] ? (
                    <span>Service selected: <span className="text-white font-medium">
                      {provider.catalogueItems?.find(i => i && i.id === selectedItems[provider.id])?.title || 'Selected'}
                    </span></span>
                  ) : (
                    <span>Select a service to continue</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCatalogueModal(null)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedItems[provider.id]) {
                        handleSelectProvider(provider.id)
                        setShowCatalogueModal(null)
                      } else {
                        showToast.error("Please select a service first")
                      }
                    }}
                    disabled={!selectedItems[provider.id]}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Select & Continue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })}

      {/* Details Modal - Enhanced */}
      {providersWithCatalogues.map((provider) => {
        const selectedItem = getSelectedItem(provider)
        const trustBadges = getTrustBadges(provider)
        
        // Group images by package (catalogue item) with package metadata
        interface PackageGroup {
          packageId: string
          packageTitle: string
          serviceName: string
          price: number
          currency: string
          durationMins: number
          images: string[]
        }
        
        const packageGroups: PackageGroup[] = []
        
        // Collect images grouped by package
        if (selectedItem) {
          // Show only packages from same service/category as selected item
          provider.catalogueItems.forEach(item => {
            if ((item.service?.name && selectedItem.service?.name && item.service.name === selectedItem.service.name) || 
                (item.service?.category?.name && selectedItem.service?.category?.name && item.service.category.name === selectedItem.service.category.name)) {
              if (item.images && item.images.length > 0) {
                packageGroups.push({
                  packageId: item.id,
                  packageTitle: item.title,
                  serviceName: item.service?.name || 'Service',
                  price: item.price,
                  currency: item.currency,
                  durationMins: item.durationMins,
                  images: item.images
                })
              }
            }
          })
        } else {
          // Show all packages
          provider.catalogueItems.forEach(item => {
            if (item.images && item.images.length > 0) {
              packageGroups.push({
                packageId: item.id,
                packageTitle: item.title,
                serviceName: item.service?.name || 'Service',
                price: item.price,
                currency: item.currency,
                durationMins: item.durationMins,
                images: item.images
              })
            }
          })
        }
        
        // Calculate total images for header
        const totalImages = packageGroups.reduce((sum, group) => sum + group.images.length, 0)

        return (
          <Dialog
            key={`details-${provider.id}`}
            open={showDetailsModal === provider.id}
            onOpenChange={(open) => setShowDetailsModal(open ? provider.id : null)}
          >
            <DialogContent className="sm:max-w-5xl bg-black/95 border-white/20 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b border-white/10">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-purple-500/30 flex-shrink-0">
                    <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                    <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                      {provider.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <DialogTitle className="text-white text-xl sm:text-2xl">
                  {provider.businessName || provider.user.name}
                </DialogTitle>
                      {/* Trust Badges - moved to left, inline with title */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {trustBadges.map((badge, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`${badge.color} text-xs flex items-center gap-1 px-2 py-0.5`}
                          >
                            {badge.icon}
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                <DialogDescription className="text-white/70">
                      {provider.service?.name || 'Service'} • {provider.service?.category || 'Category'}
                </DialogDescription>
                    
                    {/* Quick Stats Row */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{(provider.averageRating ?? 0).toFixed(1)}</span>
                        <span className="text-white/60 text-sm">({(provider.totalReviews ?? 0)} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/70 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{(provider.completedJobs ?? 0)} jobs completed</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/70 text-sm">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>{formatExperience(provider.experience)} experience</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="info" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                  <TabsTrigger 
                    value="info" 
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/70 data-[state=active]:border-purple-500/30"
                  >
                    Provider Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="work"
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/70 data-[state=active]:border-purple-500/30"
                  >
                    Portfolio ({totalImages})
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab - Enhanced */}
                <TabsContent value="info" className="space-y-6 mt-6">
                  {/* Description */}
                  {provider.description && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        About
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {provider.description}
                      </p>
                    </div>
                  )}

                  {/* Provider Details Grid - Enhanced */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60 text-xs">Location</span>
                      </div>
                      <p className="text-white font-medium text-sm">{provider.location || "Not specified"}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white/60 text-xs">Experience</span>
                      </div>
                      <p className="text-white font-medium text-sm">{formatExperience(provider.experience)}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white/60 text-xs">Rating</span>
                      </div>
                      <p className="text-white font-medium text-sm">
                        {(provider.averageRating ?? 0).toFixed(1)} ({(provider.totalReviews ?? 0)})
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards - Enhanced */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-500/30 text-center">
                      <div className="text-3xl font-bold text-white mb-1">{provider.completedJobs ?? 0}</div>
                      <span className="text-white/70 text-xs">Completed Jobs</span>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30 text-center">
                      <div className="text-3xl font-bold text-white mb-1">{(provider.averageRating ?? 0).toFixed(1)}</div>
                      <span className="text-white/70 text-xs">Average Rating</span>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30 text-center">
                      <div className="text-3xl font-bold text-white mb-1">{provider.totalReviews ?? 0}</div>
                      <span className="text-white/70 text-xs">Total Reviews</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Portfolio Tab - Enhanced with Package Grouping */}
                <TabsContent value="work" className="mt-6">
                  {packageGroups.length > 0 ? (
                    <>
                      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-white/70 text-sm">
                            {totalImages} work sample{totalImages !== 1 ? 's' : ''} across {packageGroups.length} package{packageGroups.length !== 1 ? 's' : ''}
                          </p>
                          {selectedItem && (
                            <p className="text-white/50 text-xs mt-1">
                              Showing images from {selectedItem.service?.name || 'selected service'}
                          </p>
                        )}
                      </div>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <ZoomIn className="w-3 h-3 mr-1" />
                          Click to view full size
                        </Badge>
                    </div>

                      {/* Package Groups */}
                      <div className="space-y-6">
                        {packageGroups.map((packageGroup) => {
                          const { pairs, singles } = detectBeforeAfterPairs(packageGroup.images)
                          const allPackageImages = [...pairs.map(p => [p.before, p.after]).flat(), ...singles]
                          const isExpanded = expandedPackages[packageGroup.packageId] ?? true // Default to expanded
                          
                          return (
                            <Collapsible
                              key={packageGroup.packageId}
                              open={isExpanded}
                              onOpenChange={(open) => {
                                setExpandedPackages(prev => ({
                                  ...prev,
                                  [packageGroup.packageId]: open
                                }))
                              }}
                            >
                              <Card className="bg-white/5 border-white/10">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="pb-3 cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-white text-base sm:text-lg mb-1">
                                          {packageGroup.packageTitle}
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                            {packageGroup.serviceName}
                                          </Badge>
                                          <span className="text-white/60">•</span>
                                          <span className="text-green-400 font-semibold">
                                            {packageGroup.currency} {packageGroup.price.toLocaleString()}
                                          </span>
                                          <span className="text-white/60">•</span>
                                          <div className="flex items-center gap-1 text-white/70">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDuration(packageGroup.durationMins)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                          {packageGroup.images.length} image{packageGroup.images.length !== 1 ? 's' : ''}
                                        </Badge>
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                          {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-white" />
                                          ) : (
                                            <ChevronDown className="w-5 h-5 text-white" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent>
                                  <CardContent className="space-y-4">
                                {/* Before/After Pairs for this package */}
                                {pairs.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-white font-medium text-sm">Before & After</h5>
                                      <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                        {pairs.length} pair{pairs.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {pairs.map((pair, pairIndex) => (
                                        <div key={pairIndex} className="space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            {/* Before Image */}
                                            <div
                          className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                          onClick={() => {
                                                const imageKey = `package-${packageGroup.packageId}-${pair.before}`
                            setExpandedImages(prev => ({
                              ...prev,
                                                  [imageKey]: !prev[imageKey]
                            }))
                          }}
                        >
                          <Image
                                                src={pair.before}
                                                alt={`Before - ${packageGroup.packageTitle} ${pairIndex + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                sizes="(max-width: 640px) 100vw, 50vw"
                          />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                              <Badge className="absolute top-1.5 left-1.5 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-1.5 py-0.5">
                                                Before
                                              </Badge>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5">
                                                  <ZoomIn className="w-4 h-4 text-white" />
                                                </div>
                                              </div>
                                            </div>

                                            {/* After Image */}
                                            <div
                                              className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                                              onClick={() => {
                                                const imageKey = `package-${packageGroup.packageId}-${pair.after}`
                                                setExpandedImages(prev => ({
                                                  ...prev,
                                                  [imageKey]: !prev[imageKey]
                                                }))
                                              }}
                                            >
                                              <Image
                                                src={pair.after}
                                                alt={`After - ${packageGroup.packageTitle} ${pairIndex + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                sizes="(max-width: 640px) 100vw, 50vw"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                              <Badge className="absolute top-1.5 right-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-1.5 py-0.5">
                                                After
                                              </Badge>
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5">
                                                  <ZoomIn className="w-4 h-4 text-white" />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  )}

                                {/* Other Images for this package */}
                                {singles.length > 0 && (
                                  <div className="space-y-3">
                                    {pairs.length > 0 && (
                                      <h5 className="text-white font-medium text-sm">Other Work Samples</h5>
                                    )}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                      {singles.map((imageUrl, index) => {
                                        const imageKey = `package-${packageGroup.packageId}-${imageUrl}`
                                        return (
                                          <div
                                            key={imageKey}
                                            className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                                            onClick={() => {
                                              setExpandedImages(prev => ({
                                                ...prev,
                                                [imageKey]: !prev[imageKey]
                                              }))
                                            }}
                                          >
                                            <Image
                                              src={imageUrl}
                                              alt={`${packageGroup.packageTitle} - Work sample ${index + 1}`}
                                              fill
                                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                              loading={index < 4 ? "eager" : "lazy"}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <div className="bg-black/70 backdrop-blur-sm rounded-full p-2">
                                                <ZoomIn className="w-5 h-5 text-white" />
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                  </CardContent>
                                </CollapsibleContent>

                                {/* Lightbox for this package's images - Outside CollapsibleContent so it works when collapsed */}
                                {allPackageImages.map((imageUrl) => {
                                  const imageKey = `package-${packageGroup.packageId}-${imageUrl}`
                                  if (!expandedImages[imageKey]) return null
                                  
                                  return (
                                    <div
                                      key={`lightbox-${imageKey}`}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => {
                          setExpandedImages(prev => ({
                            ...prev,
                                          [imageKey]: false
                          }))
                        }}
                      >
                        <Image
                          src={imageUrl}
                                        alt={`${packageGroup.packageTitle} - Work sample`}
                          width={1200}
                          height={800}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )
                                })}
                              </Card>
                            </Collapsible>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-white/40 mb-4" />
                      <p className="text-white/80 mb-2">No work samples available</p>
                      <p className="text-white/60 text-sm">
                        {selectedItem ? `No images for ${selectedItem.service?.name || 'this service'}` : "No images available"}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Footer with CTA */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white/70 text-sm">
                  {selectedItems[provider.id] ? (
                    <span>Ready to book with <span className="text-white font-medium">{provider.businessName || provider.user.name}</span>?</span>
                  ) : (
                    <span>Select a service package to continue</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(null)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                  {selectedItems[provider.id] && (
                    <Button
                      onClick={() => {
                        handleSelectProvider(provider.id)
                        setShowDetailsModal(null)
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Select This Provider
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })}
    </>
  )
}

// Label component for consistency (moved before usage for clarity)
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-white/80 text-sm font-medium ${className || ''}`}>{children}</label>
}

