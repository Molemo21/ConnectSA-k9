'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Clock, MapPin, User, Package, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CatalogueItem {
  id: string;
  title: string;
  shortDesc: string;
  price: number;
  currency: string;
  durationMins: number;
  images: string[];
  provider: {
    id: string;
    businessName?: string;
    location?: string;
    avgRating: number;
    totalReviews: number;
    user: {
      name: string;
      avatar?: string;
    };
  };
  service: {
    name: string;
    description: string;
  };
  _count: {
    bookings: number;
  };
}

interface CatalogueDiscoveryProps {
  serviceId?: string;
  onItemSelected: (item: CatalogueItem) => void;
}

export function CatalogueDiscovery({ serviceId, onItemSelected }: CatalogueDiscoveryProps) {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    durationMin: '',
    durationMax: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [serviceId, filters, searchTerm]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (serviceId) params.append('serviceId', serviceId);
      if (filters.priceMin) params.append('priceMin', filters.priceMin);
      if (filters.priceMax) params.append('priceMax', filters.priceMax);
      if (filters.durationMin) params.append('durationMin', filters.durationMin);
      if (filters.durationMax) params.append('durationMax', filters.durationMax);

      const response = await fetch(`/api/catalogue?${params}`);
      if (response.ok) {
        const data = await response.json();
        let filteredItems = data.items;

        // Client-side search filtering
        if (searchTerm) {
          filteredItems = filteredItems.filter((item: CatalogueItem) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.shortDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.provider.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.service.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setItems(filteredItems);
      } else if (response.status === 503) {
        toast({
          title: "Feature Not Available",
          description: "Catalogue pricing is not currently enabled",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch catalogue items:', error);
      toast({
        title: "Error",
        description: "Failed to load service packages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      durationMin: '',
      durationMax: ''
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Service Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search Packages</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="priceMin">Min Price</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="priceMax">Max Price</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="durationMin">Min Duration (mins)</Label>
                <Input
                  id="durationMin"
                  type="number"
                  value={filters.durationMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, durationMin: e.target.value }))}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="durationMax">Max Duration (mins)</Label>
                <Input
                  id="durationMax"
                  type="number"
                  value={filters.durationMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, durationMax: e.target.value }))}
                  placeholder="240"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <p className="text-sm text-gray-600">
                {items.length} package{items.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalogue Items */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <Badge variant="outline">{item.service.name}</Badge>
              </div>
              <p className="text-sm text-gray-600">{item.shortDesc}</p>
            </CardHeader>
            <CardContent>
              {item.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {item.currency} {item.price}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(item.durationMins)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">
                      {item.provider.avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({item.provider.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-1" />
                    {item._count.bookings} bookings
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {item.provider.location || 'Location not specified'}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.provider.businessName || item.provider.user.name}</p>
                </div>
                <Button onClick={() => onItemSelected(item)}>
                  Select Package
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No service packages found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

