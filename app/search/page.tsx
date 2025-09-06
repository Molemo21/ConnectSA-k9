"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, Star, Clock, DollarSign, ArrowRight, Loader2 } from "lucide-react"
import { MobileCard, MobileServiceCard } from "@/components/ui/mobile-card"
import { MobilePageWrapper, MobileHeader } from "@/components/ui/mobile-bottom-navigation"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Load services on component mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/services")
        if (response.ok) {
          const data = await response.json()
          setServices(data.services || [])
        }
      } catch (error) {
        console.error("Failed to load services:", error)
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  // Filter services based on search criteria
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    const matchesLocation = !selectedLocation || service.location === selectedLocation
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  // Get unique categories and locations
  const categories = [...new Set(services.map(s => s.category))].filter(Boolean)
  const locations = [...new Set(services.map(s => s.location))].filter(Boolean)

  const handleServiceClick = (serviceId: string) => {
    router.push(`/book-service?service=${serviceId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile First */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Find Services</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover trusted professionals in your area
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 sm:mb-8">
            <MobileCard className="bg-white">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-12 h-12 text-base"
                  />
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 h-10"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </Button>
                  
                  <div className="text-sm text-gray-600">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Location</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All locations</SelectItem>
                          {locations.map(location => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Price Range</Label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Any price" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any price</SelectItem>
                          <SelectItem value="0-100">R0 - R100</SelectItem>
                          <SelectItem value="100-300">R100 - R300</SelectItem>
                          <SelectItem value="300-500">R300 - R500</SelectItem>
                          <SelectItem value="500+">R500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </MobileCard>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading services...</p>
              </div>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredServices.map((service) => (
                <MobileServiceCard
                  key={service.id}
                  title={service.name}
                  description={service.description}
                  price={`R${service.hourlyRate}/hr`}
                  rating={4.5} // Mock rating
                  reviews={12} // Mock reviews
                  category={service.category}
                  provider={service.provider?.businessName || "Professional"}
                  onClick={() => handleServiceClick(service.id)}
                  className="hover:shadow-lg transition-all duration-200"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all services
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("")
                  setSelectedLocation("")
                  setPriceRange("")
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Popular Categories */}
          {categories.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">Popular Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    onClick={() => setSelectedCategory(category)}
                    className={`h-12 sm:h-14 text-sm sm:text-base ${
                      selectedCategory === category 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
