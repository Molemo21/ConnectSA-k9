'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Package, 
  Clock, 
  TrendingUp,
  Users,
  Star,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Copy,
  BarChart3,
  Calendar,
  Zap,
  Crown,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  Settings,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CatalogueItemForm } from './catalogue-item-form';

interface CatalogueItem {
  id: string;
  title: string;
  shortDesc: string;
  longDesc?: string;
  price: number;
  currency: string;
  durationMins: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  service: {
    id: string;
    name: string;
  };
  _count: {
    bookings: number;
  };
}

interface ServiceGroup {
  serviceName: string;
  serviceId: string;
  items: CatalogueItem[];
  stats: {
    total: number;
    active: number;
    totalBookings: number;
    totalRevenue: number;
    avgPrice: number;
  };
}

interface CatalogueManagerProps {
  providerId: string;
}

export function CatalogueManager({ providerId }: CatalogueManagerProps) {
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogueItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped'>('grouped');
  const [filterTier, setFilterTier] = useState<'all' | 'basic' | 'standard' | 'premium'>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Smart caching with refs to prevent unnecessary re-renders
  const lastFetchTime = useRef(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown between fetches

  // Debounced fetch function with smart caching
  const fetchCatalogueItems = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Skip if fetched recently and not forced
    if (!force && now - lastFetchTime.current < FETCH_COOLDOWN) {
      console.log('Skipping fetch - within cooldown period');
      return;
    }

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce rapid calls
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        if (force) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch('/api/provider/catalogue', {
          cache: 'no-cache', // Ensure fresh data when forced
          headers: {
            'Cache-Control': force ? 'no-cache' : 'max-age=30'
          }
        });

        if (response.ok) {
          const items = await response.json();
          setCatalogueItems(items);
          lastFetchTime.current = Date.now();
          
          // Auto-expand all services initially
          const serviceNames = [...new Set(items.map((item: CatalogueItem) => item.service.name))];
          setExpandedServices(new Set(serviceNames));
          
          console.log(`Catalogue items fetched successfully (${items.length} items)`);
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
          description: "Failed to load catalogue items",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    }, force ? 0 : 300); // Immediate for forced refresh, 300ms debounce for others
  }, [toast]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchCatalogueItems(true);
  }, [fetchCatalogueItems]);

  // Initial load only
  useEffect(() => {
    fetchCatalogueItems();
  }, []); // Empty dependency array - only run once

  const handleToggleActive = async (item: CatalogueItem) => {
    try {
      const response = await fetch(`/api/provider/catalogue/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive })
      });

      if (response.ok) {
        setCatalogueItems(items =>
          items.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i)
        );
        toast({
          title: "Success",
          description: `Catalogue item ${!item.isActive ? 'activated' : 'deactivated'}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update catalogue item",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (item: CatalogueItem) => {
    if (!confirm('Are you sure you want to delete this catalogue item?')) return;

    try {
      const response = await fetch(`/api/provider/catalogue/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCatalogueItems(items => items.filter(i => i.id !== item.id));
        toast({
          title: "Success",
          description: "Catalogue item deleted"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete catalogue item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete catalogue item",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchCatalogueItems(true); // Force refresh after form submission
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getPackageTier = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('basic')) return 'basic';
    if (lowerTitle.includes('premium')) return 'premium';
    return 'standard';
  };

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'basic':
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/20',
          borderColor: 'border-gray-400/30',
          icon: Shield,
          gradient: 'from-gray-500/20 to-gray-600/20'
        };
      case 'premium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/20',
          borderColor: 'border-yellow-400/30',
          icon: Crown,
          gradient: 'from-yellow-500/20 to-yellow-600/20'
        };
      default:
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/20',
          borderColor: 'border-blue-400/30',
          icon: Star,
          gradient: 'from-blue-500/20 to-blue-600/20'
        };
    }
  };

  // Group items by service
  const groupItemsByService = (items: CatalogueItem[]): ServiceGroup[] => {
    const groups: { [key: string]: ServiceGroup } = {};

    items.forEach(item => {
      const serviceName = item.service.name;
      if (!groups[serviceName]) {
        groups[serviceName] = {
          serviceName,
          serviceId: item.service.id,
          items: [],
          stats: {
            total: 0,
            active: 0,
            totalBookings: 0,
            totalRevenue: 0,
            avgPrice: 0
          }
        };
      }
      groups[serviceName].items.push(item);
    });

    // Calculate stats for each group
    Object.values(groups).forEach(group => {
      group.stats.total = group.items.length;
      group.stats.active = group.items.filter(item => item.isActive).length;
      group.stats.totalBookings = group.items.reduce((sum, item) => sum + item._count.bookings, 0);
      group.stats.totalRevenue = group.items.reduce((sum, item) => sum + (item.price * item._count.bookings), 0);
      group.stats.avgPrice = group.items.reduce((sum, item) => sum + item.price, 0) / group.items.length;
    });

    return Object.values(groups).sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  };

  const filteredItems = catalogueItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || getPackageTier(item.title) === filterTier;
    const matchesService = filterService === 'all' || item.service.name === filterService;
    return matchesSearch && matchesTier && matchesService;
  });

  const serviceGroups = groupItemsByService(filteredItems);
  const uniqueServices = [...new Set(catalogueItems.map(item => item.service.name))].sort();

  const stats = {
    total: catalogueItems.length,
    active: catalogueItems.filter(item => item.isActive).length,
    totalBookings: catalogueItems.reduce((sum, item) => sum + item._count.bookings, 0),
    totalRevenue: catalogueItems.reduce((sum, item) => sum + (item.price * item._count.bookings), 0)
  };

  const toggleServiceExpansion = (serviceName: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceName)) {
      newExpanded.delete(serviceName);
    } else {
      newExpanded.add(serviceName);
    }
    setExpandedServices(newExpanded);
  };

  const toggleAllServices = () => {
    if (expandedServices.size === serviceGroups.length) {
      setExpandedServices(new Set());
    } else {
      setExpandedServices(new Set(serviceGroups.map(group => group.serviceName)));
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllInService = (serviceName: string) => {
    const serviceItems = filteredItems.filter(item => item.service.name === serviceName);
    const newSelected = new Set(selectedItems);
    serviceItems.forEach(item => newSelected.add(item.id));
    setSelectedItems(newSelected);
  };

  const bulkToggleActive = async (itemIds: string[], active: boolean) => {
    try {
      const promises = itemIds.map(id => 
        fetch(`/api/provider/catalogue/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: active })
        })
      );

      await Promise.all(promises);
      
      setCatalogueItems(items =>
        items.map(item => 
          itemIds.includes(item.id) ? { ...item, isActive: active } : item
        )
      );

      toast({
        title: "Success",
        description: `${itemIds.length} items ${active ? 'activated' : 'deactivated'}`
      });

      setSelectedItems(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update items",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-700/50 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-700/30 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-700/50 rounded animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-sm border border-gray-300/20 rounded-lg p-6">
              <div className="space-y-3">
                <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-700/50 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-sm border border-gray-300/20 rounded-lg p-6">
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-700/30 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-700/30 rounded animate-pulse"></div>
                <div className="h-8 w-full bg-gray-700/50 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-400/20 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Service Packages</h2>
              <p className="text-xs sm:text-sm text-gray-400">Manage your service offerings and pricing</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            <span className="sm:hidden">{isRefreshing ? '...' : '↻'}</span>
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Create Package</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Modern Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Total Packages</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-400/20 rounded-full">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Active Packages</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-400/20 rounded-full">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Total Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-400">{stats.totalBookings}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-400/20 rounded-full">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-400">Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">R{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-400/20 rounded-full">
                <span className="text-sm sm:text-lg font-bold text-yellow-400">R</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Controls */}
      <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm bg-black/60 border border-gray-300/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Service Filter */}
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="flex-1 sm:flex-none min-w-[120px] px-2 sm:px-3 py-2 text-xs sm:text-sm bg-black/60 border border-gray-300/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
                >
                  <option value="all">All Services</option>
                  {uniqueServices.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>

                {/* Tier Filter */}
                {(['all', 'basic', 'standard', 'premium'] as const).map((tier) => (
                  <Button
                    key={tier}
                    variant={filterTier === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterTier(tier)}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto ${
                      filterTier === tier ? 
                        "bg-blue-400 hover:bg-blue-500 text-white" : 
                        "border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              <Button
                variant={viewMode === 'grouped' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className={`p-2 sm:px-3 sm:py-2 h-auto ${
                  viewMode === 'grouped' ? 
                    "bg-blue-400 hover:bg-blue-500 text-white" : 
                    "border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
                }`}
                title="Grouped View"
              >
                <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:px-3 sm:py-2 h-auto ${
                  viewMode === 'grid' ? 
                    "bg-blue-400 hover:bg-blue-500 text-white" : 
                    "border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`p-2 sm:px-3 sm:py-2 h-auto ${
                  viewMode === 'list' ? 
                    "bg-blue-400 hover:bg-blue-500 text-white" : 
                    "border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
                }`}
                title="List View"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="bg-blue-500/10 border-blue-400/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-blue-300 font-medium text-sm sm:text-base">
                  {selectedItems.size} package{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => bulkToggleActive(Array.from(selectedItems), true)}
                  className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-400/30 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Activate All</span>
                  <span className="sm:hidden">Activate</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => bulkToggleActive(Array.from(selectedItems), false)}
                  className="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border-orange-400/30 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                >
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Deactivate All</span>
                  <span className="sm:hidden">Deactivate</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedItems(new Set())}
                  className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-sm border border-gray-300/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CatalogueItemForm
              item={editingItem}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {/* Group Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllServices}
                className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
              >
                {expandedServices.size === serviceGroups.length ? (
                  <>
                    <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Collapse All</span>
                    <span className="sm:hidden">Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Expand All</span>
                    <span className="sm:hidden">Expand</span>
                  </>
                )}
              </Button>
              <span className="text-xs sm:text-sm text-gray-400">
                {serviceGroups.length} service{serviceGroups.length !== 1 ? 's' : ''} • {filteredItems.length} packages
              </span>
            </div>
          </div>

          {/* Service Groups */}
          {serviceGroups.map((group) => {
            const isExpanded = expandedServices.has(group.serviceName);
            
            return (
              <Card key={group.serviceName} className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                <CardHeader 
                  className="cursor-pointer hover:bg-black/60 transition-colors duration-200 p-3 sm:p-6"
                  onClick={() => toggleServiceExpansion(group.serviceName)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="p-1.5 sm:p-2 bg-blue-400/20 rounded-lg flex-shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg text-white truncate">{group.serviceName}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mt-1">
                          <span>{group.stats.total} packages</span>
                          <span>{group.stats.active} active</span>
                          <span>{group.stats.totalBookings} bookings</span>
                          <span className="hidden sm:inline">R{group.stats.totalRevenue.toFixed(2)} revenue</span>
                          <span className="sm:hidden">R{group.stats.totalRevenue.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInService(group.serviceName);
                        }}
                        className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                      >
                        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Select All</span>
                        <span className="sm:hidden">Select</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((item) => {
                        const tier = getPackageTier(item.title);
                        const tierConfig = getTierConfig(tier);
                        const TierIcon = tierConfig.icon;
                        const isSelected = selectedItems.has(item.id);

                        return (
                          <Card 
                            key={item.id} 
                            className={`relative bg-black/60 backdrop-blur-sm border-gray-300/20 hover:bg-black/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${
                              item.isActive ? 'ring-2 ring-green-400/20' : 'ring-2 ring-gray-400/20'
                            } ${isSelected ? 'ring-2 ring-blue-400/50' : ''}`}
                          >
                            {/* Selection Checkbox */}
                            <div className="absolute -top-2 -left-2 z-10">
                              <button
                                onClick={() => toggleItemSelection(item.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-blue-400 border-blue-400 text-white' 
                                    : 'bg-black/60 border-gray-400 text-transparent hover:border-blue-400'
                                }`}
                              >
                                {isSelected && <CheckSquare className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* Tier Badge */}
                            <div className={`absolute -top-2 -right-2 z-10 ${tierConfig.bgColor} ${tierConfig.borderColor} border rounded-full p-2`}>
                              <TierIcon className={`w-4 h-4 ${tierConfig.color}`} />
                            </div>

                            <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base sm:text-lg text-white group-hover:text-blue-400 transition-colors duration-200 truncate">
                                    {item.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${tierConfig.color} ${tierConfig.borderColor}`}
                                    >
                                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                    </Badge>
                                    <Badge 
                                      variant={item.isActive ? "default" : "secondary"}
                                      className={`text-xs ${item.isActive ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-gray-400/20 text-gray-400 border-gray-400/30'}`}
                                    >
                                      {item.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                              <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">{item.shortDesc}</p>
                              
                              {/* Package Details */}
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-green-400">R</span>
                                    Price
                                  </span>
                                  <span className="font-bold text-green-400 text-base sm:text-lg">
                                    {item.currency} {item.price}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Duration
                                  </span>
                                  <span className="text-white font-medium text-xs sm:text-sm">
                                    {formatDuration(item.durationMins)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Bookings
                                  </span>
                                  <span className="text-white font-medium text-xs sm:text-sm">
                                    {item._count.bookings}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setShowForm(true);
                                  }}
                                  className="flex-1 border-gray-300/20 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleActive(item)}
                                  className={`flex-1 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto ${
                                    item.isActive 
                                      ? 'border-orange-300/20 text-orange-300 hover:bg-orange-700/50' 
                                      : 'border-green-300/20 text-green-300 hover:bg-green-700/50'
                                  }`}
                                >
                                  {item.isActive ? (
                                    <>
                                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                      Show
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item)}
                                  className="border-red-300/20 text-red-300 hover:bg-red-700/50 hover:text-white transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-auto"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const tier = getPackageTier(item.title);
            const tierConfig = getTierConfig(tier);
            const TierIcon = tierConfig.icon;

            return (
              <Card 
                key={item.id} 
                className={`relative bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${
                  item.isActive ? 'ring-2 ring-green-400/20' : 'ring-2 ring-gray-400/20'
                }`}
              >
                {/* Tier Badge */}
                <div className={`absolute -top-2 -right-2 z-10 ${tierConfig.bgColor} ${tierConfig.borderColor} border rounded-full p-2`}>
                  <TierIcon className={`w-4 h-4 ${tierConfig.color}`} />
                </div>

                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors duration-200">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${tierConfig.color} ${tierConfig.borderColor}`}
                        >
                          {item.service.name}
                        </Badge>
                        <Badge 
                          variant={item.isActive ? "default" : "secondary"}
                          className={`text-xs ${item.isActive ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-gray-400/20 text-gray-400 border-gray-400/30'}`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-300 line-clamp-2">{item.shortDesc}</p>
                  
                  {/* Package Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <span className="text-sm font-bold text-green-400">R</span>
                        Price
                      </span>
                      <span className="font-bold text-green-400 text-lg">
                        {item.currency} {item.price}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duration
                      </span>
                      <span className="text-white font-medium">
                        {formatDuration(item.durationMins)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Bookings
                      </span>
                      <span className="text-white font-medium">
                        {item._count.bookings}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="flex-1 border-gray-300/20 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(item)}
                      className={`flex-1 transition-all duration-200 ${
                        item.isActive 
                          ? 'border-orange-300/20 text-orange-300 hover:bg-orange-700/50' 
                          : 'border-green-300/20 text-green-300 hover:bg-green-700/50'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="border-red-300/20 text-red-300 hover:bg-red-700/50 hover:text-white transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const tier = getPackageTier(item.title);
            const tierConfig = getTierConfig(tier);
            const TierIcon = tierConfig.icon;

            return (
              <Card 
                key={item.id} 
                className={`bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200 ${
                  item.isActive ? 'ring-2 ring-green-400/20' : 'ring-2 ring-gray-400/20'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 ${tierConfig.bgColor} rounded-lg`}>
                        <TierIcon className={`w-6 h-6 ${tierConfig.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${tierConfig.color} ${tierConfig.borderColor}`}
                          >
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </Badge>
                          <Badge 
                            variant={item.isActive ? "default" : "secondary"}
                            className={`text-xs ${item.isActive ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-gray-400/20 text-gray-400 border-gray-400/30'}`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{item.shortDesc}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="text-sm font-bold text-green-400">R</span>
                            {item.currency} {item.price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(item.durationMins)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {item._count.bookings} bookings
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                        className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                        className={`${
                          item.isActive 
                            ? 'border-orange-300/20 text-orange-300 hover:bg-orange-700/50' 
                            : 'border-green-300/20 text-green-300 hover:bg-green-700/50'
                        }`}
                      >
                        {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="border-red-300/20 text-red-300 hover:bg-red-700/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-gray-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No packages found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterTier !== 'all' || filterService !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first service package to get started'
              }
            </p>
            {!searchTerm && filterTier === 'all' && filterService === 'all' && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Package
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}