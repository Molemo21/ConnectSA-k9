"use client"

import React from "react"
import { ProviderCatalogueGrid } from "@/components/provider-discovery/provider-catalogue-grid"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data structure matching the expected provider interface
const mockProviders = [
  {
    id: "test-provider-1",
    businessName: "Elite Cleaning Services",
    description: "Professional cleaning services with over 10 years of experience. We provide top-quality service for homes and offices across South Africa.",
    experience: 10,
    location: "Cape Town, Western Cape",
    hourlyRate: 200,
    user: {
      name: "Sarah Johnson",
      email: "sarah@elitecleaning.co.za",
      phone: "+27 82 123 4567",
      avatar: "https://i.pravatar.cc/150?img=47"
    },
    service: {
      name: "Deep Cleaning",
      description: "Comprehensive deep cleaning service",
      category: "Home Services"
    },
    averageRating: 4.8,
    totalReviews: 24,
    completedJobs: 150,
    isAvailable: true,
    catalogueItems: [
      {
        id: "catalogue-1-1",
        title: "Essential Deep Clean",
        price: 450,
        currency: "ZAR",
        durationMins: 180,
        images: [
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
          "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800"
        ],
        serviceId: "service-1",
        service: {
          name: "Deep Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-1-1",
            rating: 5,
            comment: "Excellent service! The team was professional and thorough. My house looks brand new!",
            createdAt: "2024-01-15T10:00:00Z",
            booking: {
              client: {
                name: "John Doe"
              }
            }
          },
          {
            id: "review-1-2",
            rating: 4,
            comment: "Great value for money. Very satisfied with the results.",
            createdAt: "2024-01-10T14:30:00Z",
            booking: {
              client: {
                name: "Jane Smith"
              }
            }
          },
          {
            id: "review-1-3",
            rating: 5,
            comment: "Highly recommend! They cleaned every corner.",
            createdAt: "2024-01-05T09:15:00Z",
            booking: {
              client: {
                name: "Mike Wilson"
              }
            }
          }
        ]
      },
      {
        id: "catalogue-1-2",
        title: "Professional Deep Clean",
        price: 650,
        currency: "ZAR",
        durationMins: 240,
        images: [
          "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800"
        ],
        serviceId: "service-1",
        service: {
          name: "Deep Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-1-4",
            rating: 5,
            comment: "The professional package is worth every cent!",
            createdAt: "2024-01-12T11:20:00Z",
            booking: {
              client: {
                name: "Emma Brown"
              }
            }
          }
        ]
      },
      {
        id: "catalogue-1-3",
        title: "Premium Deep Clean",
        price: 850,
        currency: "ZAR",
        durationMins: 300,
        images: [
          "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800"
        ],
        serviceId: "service-1",
        service: {
          name: "Deep Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-1-5",
            rating: 5,
            comment: "Premium service exceeded all expectations!",
            createdAt: "2024-01-08T16:45:00Z",
            booking: {
              client: {
                name: "David Lee"
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: "test-provider-2",
    businessName: "Sparkle & Shine Cleaning",
    description: "Award-winning cleaning service specializing in eco-friendly solutions. We use only the best non-toxic products.",
    experience: 7,
    location: "Johannesburg, Gauteng",
    hourlyRate: 180,
    user: {
      name: "Michael Chen",
      email: "michael@sparkleshine.co.za",
      phone: "+27 83 987 6543",
      avatar: "https://i.pravatar.cc/150?img=12"
    },
    service: {
      name: "Regular Cleaning",
      description: "Regular maintenance cleaning service",
      category: "Home Services"
    },
    averageRating: 4.6,
    totalReviews: 32,
    completedJobs: 210,
    isAvailable: true,
    catalogueItems: [
      {
        id: "catalogue-2-1",
        title: "Weekly Maintenance",
        price: 350,
        currency: "ZAR",
        durationMins: 120,
        images: [
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800"
        ],
        serviceId: "service-2",
        service: {
          name: "Regular Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-2-1",
            rating: 5,
            comment: "Consistent quality every week. Love the eco-friendly approach!",
            createdAt: "2024-01-14T08:00:00Z",
            booking: {
              client: {
                name: "Lisa Anderson"
              }
            }
          },
          {
            id: "review-2-2",
            rating: 4,
            comment: "Very reliable service. They always show up on time.",
            createdAt: "2024-01-11T10:30:00Z",
            booking: {
              client: {
                name: "Robert Taylor"
              }
            }
          }
        ]
      },
      {
        id: "catalogue-2-2",
        title: "Bi-Weekly Service",
        price: 400,
        currency: "ZAR",
        durationMins: 150,
        images: [
          "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800"
        ],
        serviceId: "service-2",
        service: {
          name: "Regular Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-2-3",
            rating: 5,
            comment: "Perfect schedule for my busy lifestyle!",
            createdAt: "2024-01-09T13:20:00Z",
            booking: {
              client: {
                name: "Amanda White"
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: "test-provider-3",
    businessName: "Premium Window Cleaning",
    description: "Specialists in window and glass cleaning. We serve both residential and commercial clients with streak-free results.",
    experience: 5,
    location: "Durban, KwaZulu-Natal",
    hourlyRate: 250,
    user: {
      name: "Priya Patel",
      email: "priya@premiumwindows.co.za",
      phone: "+27 84 555 1234",
      avatar: "https://i.pravatar.cc/150?img=33"
    },
    service: {
      name: "Window Cleaning",
      description: "Professional window and glass cleaning",
      category: "Home Services"
    },
    averageRating: 4.9,
    totalReviews: 18,
    completedJobs: 95,
    isAvailable: true,
    catalogueItems: [
      {
        id: "catalogue-3-1",
        title: "Standard Window Clean",
        price: 300,
        currency: "ZAR",
        durationMins: 90,
        images: [
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800"
        ],
        serviceId: "service-3",
        service: {
          name: "Window Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-3-1",
            rating: 5,
            comment: "Crystal clear windows! Best service in town.",
            createdAt: "2024-01-13T07:45:00Z",
            booking: {
              client: {
                name: "Tom Johnson"
              }
            }
          },
          {
            id: "review-3-2",
            rating: 5,
            comment: "Extremely professional and thorough. No streaks at all!",
            createdAt: "2024-01-07T12:10:00Z",
            booking: {
              client: {
                name: "Susan Davis"
              }
            }
          }
        ]
      },
      {
        id: "catalogue-3-2",
        title: "Premium Window & Glass Service",
        price: 500,
        currency: "ZAR",
        durationMins: 150,
        images: [
          "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800"
        ],
        serviceId: "service-3",
        service: {
          name: "Window Cleaning",
          category: {
            name: "Home Services"
          }
        },
        reviews: [
          {
            id: "review-3-3",
            rating: 5,
            comment: "Premium service is worth it! Includes screens and frames.",
            createdAt: "2024-01-06T15:30:00Z",
            booking: {
              client: {
                name: "Chris Martin"
              }
            }
          }
        ]
      },
      {
        id: "catalogue-3-3",
        title: "Commercial Window Service",
        price: 1200,
        currency: "ZAR",
        durationMins: 240,
        images: [
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800"
        ],
        serviceId: "service-3",
        service: {
          name: "Window Cleaning",
          category: {
            name: "Commercial Services"
          }
        },
        reviews: [
          {
            id: "review-3-4",
            rating: 5,
            comment: "Perfect for our office building. Very efficient!",
            createdAt: "2024-01-04T09:00:00Z",
            booking: {
              client: {
                name: "Corporate Client"
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: "test-provider-4-no-items",
    businessName: "No Items Provider",
    description: "This provider should not appear as they have no catalogue items",
    experience: 3,
    location: "Pretoria, Gauteng",
    hourlyRate: 150,
    user: {
      name: "Test User",
      email: "test@example.com",
      phone: "+27 82 000 0000",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    service: {
      name: "Test Service",
      description: "Test service description",
      category: "Test Category"
    },
    averageRating: 4.0,
    totalReviews: 5,
    completedJobs: 10,
    isAvailable: true,
    catalogueItems: [] // Empty array - should be filtered out
  }
]

export default function TestProviderSelectionPage() {
  const router = useRouter()

  const handleProviderSelected = (providerId: string, catalogueItemId: string) => {
    console.log("Provider selected:", providerId, "Catalogue item:", catalogueItemId)
    alert(`Selected Provider: ${providerId}\nCatalogue Item: ${catalogueItemId}`)
  }

  const handleBack = () => {
    router.push("/")
  }

  const providerCount = mockProviders.filter(p => p.catalogueItems && p.catalogueItems.length > 0).length

  return (
    <div className="min-h-screen relative overflow-hidden animate-fade-in gradient-bg-dark">
      {/* Background image - matching booking page */}
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
            {/* Test Banner */}
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg animate-slide-in-up">
              <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                <div>
                  <h2 className="text-lg font-bold text-yellow-300 mb-1">🧪 TEST MODE - Provider Selection</h2>
                  <p className="text-sm text-yellow-200/80">
                    This is a test page for editing provider cards. Changes here won't affect the actual booking flow.
                  </p>
                </div>
                <a
                  href="/"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Back to Home
                </a>
              </div>
            </div>

            <ProviderCatalogueGrid
              providers={mockProviders}
              serviceId="test-service"
              onProviderSelected={handleProviderSelected}
              onBack={handleBack}
              providerCount={providerCount}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

