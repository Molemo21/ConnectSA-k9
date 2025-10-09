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
            // Auto-select the cleaning category if it's the only one
            if (data.length === 1) {
              setSelectedCategory(data[0]);
            }
          } else {
            // Fallback to config data if API returns empty
            const cleaningCategory = {
              id: 'cat_cleaning',
              name: 'Cleaning Services',
              description: 'Professional cleaning services for homes and offices',
              icon: '🧹',
              isActive: true,
              services: SERVICE_CATEGORIES.HOME_SERVICES.categories.CLEANING?.services || []
            };
            setCategories([cleaningCategory]);
            setSelectedCategory(cleaningCategory);
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
            // After max retries, use fallback data
            const cleaningCategory = {
              id: 'cat_cleaning',
              name: 'Cleaning Services',
              description: 'Professional cleaning services for homes and offices',
              icon: '🧹',
              isActive: true,
              services: SERVICE_CATEGORIES.HOME_SERVICES.categories.CLEANING?.services || []
            };
            setCategories([cleaningCategory]);
            setSelectedCategory(cleaningCategory);
            setError(null); // Clear error since we have fallback data
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

  // Filter based on search term
  const filteredItems = selectedCategory
    ? selectedCategory.services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg" />
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
          placeholder={selectedCategory ? "Search services..." : "Search categories..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Back Button */}
      {selectedCategory && (
        <Button
          variant="ghost"
          className="mb-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            setSelectedCategory(null);
            setSearchTerm("");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>
      )}

      {/* Categories or Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedCategory ? (
          // Show services for selected category
          filteredItems.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                value === service.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50 bg-white/5 border-white/10"
              }`}
              onClick={() => {
                onChange(service.id);
                onNext();
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <span className="text-lg">R{service.basePrice.toFixed(2)}</span>
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {service.features.length > 3 && (
                    <p className="text-sm text-gray-400 pl-6">
                      +{service.features.length - 3} more features
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Show categories
          filteredItems.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-white/5 border-white/10 hover:border-primary/50"
              onClick={() => {
                setSelectedCategory(category);
                setSearchTerm("");
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <div className="flex-1">
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  {category.services.length} services available
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* No Results */}
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No {selectedCategory ? 'services' : 'categories'} found matching "{searchTerm}"
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchTerm("")}
            className="mt-2"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}