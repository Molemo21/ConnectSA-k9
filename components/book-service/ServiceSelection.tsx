"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, ChevronRight, ArrowLeft } from "lucide-react"
import { SERVICE_CATEGORIES } from "@/config/service-categories"

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  features: string[];
  duration: number;
}

interface ServiceSelectionProps {
  value: string;
  onChange: (serviceId: string) => void;
  onNext: () => void;
}

export function ServiceSelection({ value, onChange, onNext }: ServiceSelectionProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Load categories with retry logic and fallback
  useEffect(() => {
    let mounted = true;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    async function loadCategories() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/service-categories');
        if (!response.ok) {
          throw new Error(`Failed to fetch service categories: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (mounted) {
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            // Auto-select the first category if available
            if (data.length > 0) {
              setSelectedCategory(data[0]);
            }
          } else {
            // Fallback: fetch services directly from services API and group by category
            try {
              const servicesResponse = await fetch('/api/services');
              if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                if (Array.isArray(servicesData) && servicesData.length > 0) {
                  // Group services by category
                  const servicesByCategory = servicesData.reduce((acc, service) => {
                    const categoryName = service.categoryName || 'Other Services';
                    const categoryId = service.categoryId || `cat_${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
                    
                    if (!acc[categoryId]) {
                      acc[categoryId] = {
                        id: categoryId,
                        name: categoryName,
                        description: `${categoryName} for your needs`,
                        icon: service.categoryIcon || '🔧',
                        isActive: true,
                        services: []
                      };
                    }
                    
                    acc[categoryId].services.push({
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      basePrice: service.basePrice,
                      features: [
                        'Professional service',
                        'Quality guarantee',
                        'Satisfaction guaranteed',
                        'Experienced staff'
                      ],
                      duration: 60
                    });
                    
                    return acc;
                  }, {});
                  
                  const categoryArray = Object.values(servicesByCategory);
                  setCategories(categoryArray);
                  
                  // Auto-select the first category if available
                  if (categoryArray.length > 0) {
                    setSelectedCategory(categoryArray[0]);
                  }
                } else {
                  throw new Error('No services available');
                }
              } else {
                throw new Error('Failed to fetch services');
              }
            } catch (serviceError) {
              console.error("Failed to fetch services for fallback:", serviceError);
              setError("Unable to load services. Please refresh the page.");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (mounted) {
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryDelay);
          } else {
            // After max retries, try to fetch services directly and group by category
            try {
              const servicesResponse = await fetch('/api/services');
              if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                if (Array.isArray(servicesData) && servicesData.length > 0) {
                  // Group services by category
                  const servicesByCategory = servicesData.reduce((acc, service) => {
                    const categoryName = service.categoryName || 'Other Services';
                    const categoryId = service.categoryId || `cat_${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
                    
                    if (!acc[categoryId]) {
                      acc[categoryId] = {
                        id: categoryId,
                        name: categoryName,
                        description: `${categoryName} for your needs`,
                        icon: service.categoryIcon || '🔧',
                        isActive: true,
                        services: []
                      };
                    }
                    
                    acc[categoryId].services.push({
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      basePrice: service.basePrice,
                      features: [
                        'Professional service',
                        'Quality guarantee',
                        'Satisfaction guaranteed',
                        'Experienced staff'
                      ],
                      duration: 60
                    });
                    
                    return acc;
                  }, {});
                  
                  const categoryArray = Object.values(servicesByCategory);
                  setCategories(categoryArray);
                  
                  // Auto-select the first category if available
                  if (categoryArray.length > 0) {
                    setSelectedCategory(categoryArray[0]);
                  }
                  
                  setError(null); // Clear error since we have data
                } else {
                  setError("No services available. Please try again later.");
                }
              } else {
                setError("Unable to load services. Please refresh the page.");
              }
            } catch (serviceError) {
              console.error("Failed to fetch services after retries:", serviceError);
              setError("Unable to load services. Please refresh the page.");
            }
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  // Filter based on search term - only filter services when a category is selected
  const filteredItems = selectedCategory
    ? selectedCategory.services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Search bar skeleton */}
        <div className="h-12 bg-white/10 rounded-lg" />
        
        {/* Category tabs skeleton */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="h-6 bg-white/10 rounded w-48 mx-auto mb-2" />
            <div className="h-4 bg-white/10 rounded w-64 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-white/10 rounded-lg w-24" />
            ))}
          </div>
        </div>
        
        {/* Services grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <Button 
          onClick={() => {
            setRetryCount(0);
            setError(null);
          }} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Category Tabs */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Select Service Category</h3>
          <p className="text-sm text-white/70">Choose the type of service you need</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {/* Dynamic category buttons */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category);
                setSearchTerm("");
              }}
              className={`text-base font-medium transition-all duration-300 ${
                selectedCategory?.id === category.id
                  ? 'text-white border-b-2 border-white pb-1'
                  : 'text-white/60 hover:text-white hover:border-b-2 hover:border-white/50 pb-1'
              }`}
            >
              {category.icon && <span className="mr-2">{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Dropdown */}
      {selectedCategory && (
        <div className="space-y-4">
          {selectedCategory.services.length > 0 ? (
            <div className="max-w-md mx-auto">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredItems.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      onChange(service.id);
                      onNext();
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      value === service.id
                        ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                        : 'hover:bg-white/10 text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm text-blue-400 font-semibold">
                        R{service.basePrice.toFixed(0)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-xs text-white/60 mt-1">
                        {service.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {selectedCategory.name === 'Hairstyling' ? '💇‍♀️' : '💄'}
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                {selectedCategory.name} Services Coming Soon
              </h4>
              <p className="text-white/60">
                We're working on adding {selectedCategory.name.toLowerCase()} services. Check back soon!
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {selectedCategory && filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/60">
            No services found matching "{searchTerm}"
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchTerm("")}
            className="mt-2 text-white/80 hover:text-white"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* No Category Selected State */}
      {!selectedCategory && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white/60">
            Select a category above to see available services
          </p>
        </div>
      )}
    </div>
  );
}