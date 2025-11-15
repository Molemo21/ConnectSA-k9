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
  ZoomIn,
  Package,
  Eye
} from "lucide-react"
import Image from "next/image"
import { showToast } from "@/lib/toast"

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
  onPackageSelected?: (providerId: string, catalogueItemId: string, providerData?: any, packageData?: any) => void
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
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({}) // providerId -> catalogueItemId
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({}) // catalogueItemId -> boolean
  const [showReviewsModal, setShowReviewsModal] = useState<string | null>(null) // providerId -> boolean
  const [showCatalogueModal, setShowCatalogueModal] = useState<string | null>(null) // providerId -> boolean
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null) // providerId -> boolean
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
      if (provider.catalogueItems.length > 0 && !selectedItems[provider.id]) {
        initialSelections[provider.id] = provider.catalogueItems[0].id
      }
    })
    if (Object.keys(initialSelections).length > 0) {
      setSelectedItems(prev => ({ ...prev, ...initialSelections }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersWithCatalogues])

  const formatExperience = (years: number) => {
    if (years === 1) return "1 year"
    return `${years} years`
  }

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
    const packageData = provider?.catalogueItems.find(item => item.id === selectedItemId)
    
    // Use onPackageSelected if available (new flow), otherwise fall back to onProviderSelected (old flow)
    if (onPackageSelected) {
      onPackageSelected(providerId, selectedItemId, provider, packageData)
    } else {
      onProviderSelected?.(providerId, selectedItemId)
    }
  }

  const getSelectedItem = (provider: Provider): CatalogueItem | null => {
    const selectedItemId = selectedItems[provider.id]
    if (!selectedItemId) return null
    return provider.catalogueItems.find(item => item.id === selectedItemId) || null
  }

  const getAverageRating = (reviews: Review[]): number => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
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

        {/* Providers Grid - Horizontal Scroll */}
        <div className="relative">
          {/* Navigation Arrows */}
          <div className="flex items-center justify-between mb-4">
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

          {/* Scroll container */}
          <div 
            ref={mainScrollContainerRef}
            className="flex overflow-x-auto hide-scrollbar gap-6 pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {providersWithCatalogues.map((provider, index) => {
              const selectedItem = getSelectedItem(provider)
              const selectedItemReviews = selectedItem?.reviews || []
              const selectedItemRating = getAverageRating(selectedItemReviews)

              return (
                <Card 
                  key={provider.id}
                  className="group flex-shrink-0 w-72 sm:w-80 md:w-96 snap-center shadow-xl border-0 bg-black/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-in-up overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                <CardContent className="p-0">
                  {selectedItem ? (
                    <>
                      {/* 1. Main Image at Top */}
                      <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-t-lg overflow-hidden bg-gray-800">
                        {selectedItem.images && selectedItem.images.length > 0 ? (
                          <>
                            <Image
                              src={selectedItem.images[0]}
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
                                  src={selectedItem.images[0]}
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
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                              onClick={() => handleImageClick(selectedItem.id)}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Package className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                      </div>

                      {/* 2. Thumbnail Photos Below Main Image */}
                      {provider.catalogueItems.length > 0 && (
                        <div className="px-4 pt-4 pb-2">
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
                                const thumbnailImage = item.images && item.images.length > 0 ? item.images[0] : null

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

                      {/* 3. Service Information */}
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{selectedItem.title}</h3>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            {selectedItem.service.name}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-white/60 text-xs mb-1">Price</p>
                            <p className="text-green-400 font-semibold text-lg sm:text-xl">
                              {selectedItem.currency} {selectedItem.price}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/60 text-xs mb-1">Duration</p>
                            <div className="flex flex-col">
                              <div className="flex items-center text-white/80 text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span>{formatDuration(selectedItem.durationMins)}</span>
                              </div>
                              {/* Clickable Reviews Link */}
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

                        {/* Catalogue Button */}
                        <div className="pt-2 border-t border-white/10">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCatalogueModal(provider.id)}
                            className="w-full text-purple-400 border-purple-500/50 hover:bg-purple-500/20 hover:border-purple-400 text-xs sm:text-sm"
                          >
                            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Catalogue
                          </Button>
                        </div>
                      </div>

                      {/* Details and Select Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDetailsModal(provider.id)}
                          className="text-blue-400 border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 text-xs sm:text-sm flex-1"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Portfolio
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSelectProvider(provider.id)}
                          disabled={isProcessing || !selectedItems[provider.id]}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm flex-1 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Select
                        </Button>
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

        {/* Scroll indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {providersWithCatalogues.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/30"
            />
          ))}
        </div>
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
                  {selectedItem.service.name} • {selectedItem.service.category.name}
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

      {/* Catalogue Modal */}
      {providersWithCatalogues.map((provider) => {
        if (!provider.catalogueItems || provider.catalogueItems.length === 0) return null

        return (
          <Dialog
            key={`catalogue-${provider.id}`}
            open={showCatalogueModal === provider.id}
            onOpenChange={(open) => setShowCatalogueModal(open ? provider.id : null)}
          >
            <DialogContent className="sm:max-w-4xl bg-black/95 border-white/20 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  Service Catalogue - {provider.businessName || provider.user.name}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Select a service to view details
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {provider.catalogueItems.map((item) => {
                  const thumbnailImage = item.images && item.images.length > 0 ? item.images[0] : null
                  const isSelected = selectedItems[provider.id] === item.id

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleItemSelect(provider.id, item.id)
                        setShowCatalogueModal(null)
                      }}
                      className={`
                        relative group cursor-pointer rounded-lg overflow-hidden
                        transition-all duration-300 border-2
                        ${isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105' 
                          : 'border-white/20 hover:border-purple-400/50 hover:scale-105'
                        }
                      `}
                    >
                      {/* Image */}
                      <div className="relative w-full h-48 sm:h-56 bg-gray-800">
                        {thumbnailImage ? (
                          <Image
                            src={thumbnailImage}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Package className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                        
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Price Badge */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="bg-green-500/90 backdrop-blur-sm rounded-lg px-3 py-2">
                            <p className="text-white font-bold text-lg sm:text-xl">
                              {item.currency} {item.price}
                            </p>
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-2">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors" />
                      </div>

                      {/* Service Info */}
                      <div className="p-3 bg-white/5 border-t border-white/10">
                        <h4 className="text-white font-semibold text-sm truncate mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            {item.service.name}
                          </Badge>
                          <div className="flex items-center text-white/70 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDuration(item.durationMins)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )
      })}

      {/* Details Modal */}
      {providersWithCatalogues.map((provider) => {
        const selectedItem = getSelectedItem(provider)
        const allCategoryImages: string[] = []
        
        // Collect all images from catalogue items in the selected category/service
        if (selectedItem) {
          provider.catalogueItems.forEach(item => {
            if (item.service.name === selectedItem.service.name || 
                item.service.category.name === selectedItem.service.category.name) {
              if (item.images && item.images.length > 0) {
                allCategoryImages.push(...item.images)
              }
            }
          })
        } else {
          // If no item selected, show all images
          provider.catalogueItems.forEach(item => {
            if (item.images && item.images.length > 0) {
              allCategoryImages.push(...item.images)
            }
          })
        }

        return (
          <Dialog
            key={`details-${provider.id}`}
            open={showDetailsModal === provider.id}
            onOpenChange={(open) => setShowDetailsModal(open ? provider.id : null)}
          >
            <DialogContent className="sm:max-w-4xl bg-black/95 border-white/20 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">
                  {provider.businessName || provider.user.name}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Provider Information & Portfolio
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="info" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                  <TabsTrigger 
                    value="info" 
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/70 data-[state=active]:border-purple-500/30"
                  >
                    Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="work"
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/70 data-[state=active]:border-purple-500/30"
                  >
                    My Work
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6 mt-6">
                  {/* Provider Avatar and Basic Info */}
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-20 h-20 ring-2 ring-purple-500/30">
                      <AvatarImage src={provider.user.avatar} alt={provider.user.name} />
                      <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                        {provider.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {provider.businessName || provider.user.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {provider.service.name}
                        </Badge>
                        {provider.service.category && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {provider.service.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {provider.description && (
                    <div>
                      <h4 className="text-white font-semibold mb-2">About</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {provider.description}
                      </p>
                    </div>
                  )}

                  {/* Provider Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60 text-xs">Location</span>
                      </div>
                      <p className="text-white font-medium">{provider.location || "Not specified"}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white/60 text-xs">Experience</span>
                      </div>
                      <p className="text-white font-medium">{formatExperience(provider.experience)}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-white/60 text-xs">Hourly Rate</span>
                      </div>
                      <p className="text-green-400 font-semibold text-lg">R{provider.hourlyRate}/hr</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white/60 text-xs">Rating</span>
                      </div>
                      <p className="text-white font-medium">
                        {provider.averageRating} ({provider.totalReviews} reviews)
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-around p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{provider.completedJobs}</div>
                      <span className="text-xs text-white/60">Completed Jobs</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{provider.averageRating}</div>
                      <span className="text-xs text-white/60">Average Rating</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{provider.totalReviews}</div>
                      <span className="text-xs text-white/60">Total Reviews</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {provider.user.email && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-white/80">
                          <span className="text-white/60">Email:</span> {provider.user.email}
                        </p>
                        {provider.user.phone && (
                          <p className="text-white/80">
                            <span className="text-white/60">Phone:</span> {provider.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* My Work Tab */}
                <TabsContent value="work" className="mt-6">
                  {allCategoryImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {allCategoryImages.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                          onClick={() => {
                            setExpandedImages(prev => ({
                              ...prev,
                              [`details-${provider.id}-${index}`]: !prev[`details-${provider.id}-${index}`]
                            }))
                          }}
                        >
                          <Image
                            src={imageUrl}
                            alt={`Work sample ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto text-white/40 mb-4" />
                      <p className="text-white/80 mb-2">No work samples available</p>
                      <p className="text-white/60 text-sm">
                        {selectedItem ? `No images for ${selectedItem.service.name}` : "No images available"}
                      </p>
                    </div>
                  )}

                  {/* Lightbox for expanded images */}
                  {allCategoryImages.map((imageUrl, index) => (
                    expandedImages[`details-${provider.id}-${index}`] && (
                      <div
                        key={`lightbox-${index}`}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => {
                          setExpandedImages(prev => ({
                            ...prev,
                            [`details-${provider.id}-${index}`]: false
                          }))
                        }}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Work sample ${index + 1}`}
                          width={1200}
                          height={800}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )
                  ))}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )
      })}

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
    </>
  )
}

// Label component for consistency
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-white/80 text-sm font-medium ${className}`}>{children}</label>
}

