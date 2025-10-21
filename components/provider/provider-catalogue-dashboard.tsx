'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Plus, Eye, EyeOff, TrendingUp, Users, BarChart3, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCataloguePricing } from '@/lib/feature-flags';
import { CatalogueManager } from '@/components/provider/catalogue-manager';
import { BulkEditInterface } from '@/components/provider/bulk-edit-interface';
import { PricingSuggestions } from '@/components/provider/pricing-suggestions';

interface ProviderStats {
  totalCatalogueItems: number;
  activeCatalogueItems: number;
  totalBookings: number;
  totalRevenue: number;
}

interface ProviderCatalogueDashboardProps {
  providerId: string;
}

export function ProviderCatalogueDashboard({ providerId }: ProviderCatalogueDashboardProps) {
  const [stats, setStats] = useState<ProviderStats>({
    totalCatalogueItems: 0,
    activeCatalogueItems: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const cataloguePricingEnabled = useCataloguePricing();

  // Smart caching with refs
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown

  // Debounced fetch function with smart caching
  const fetchStats = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Skip if fetched recently and not forced
    if (!force && now - lastFetchTime.current < FETCH_COOLDOWN) {
      console.log('Skipping stats fetch - within cooldown period');
      return;
    }

    try {
      if (force) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/provider/catalogue', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': force ? 'no-cache' : 'max-age=30'
        }
      });

      if (response.ok) {
        const catalogueItems = await response.json();
        
        // Calculate stats from catalogue items
        const totalItems = catalogueItems.length;
        const activeItems = catalogueItems.filter((item: any) => item.isActive).length;
        const totalBookings = catalogueItems.reduce((sum: number, item: any) => sum + item._count.bookings, 0);
        const totalRevenue = catalogueItems.reduce((sum: number, item: any) => 
          sum + (item.price * item._count.bookings), 0
        );

        setStats({
          totalCatalogueItems: totalItems,
          activeCatalogueItems: activeItems,
          totalBookings,
          totalRevenue
        });

        lastFetchTime.current = now;
        console.log(`Stats fetched successfully (${totalItems} items)`);
      } else if (response.status === 503) {
        toast({
          title: "Feature Not Available",
          description: "Catalogue pricing is not currently enabled",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: "Error",
        description: "Failed to load catalogue statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  // Initial load only
  useEffect(() => {
    fetchStats();
  }, []); // Empty dependency array - only run once

  if (!cataloguePricingEnabled) {
    return (
      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-200">
        <AlertDescription>
          Catalogue pricing is not currently enabled. Please contact support to activate this feature.
        </AlertDescription>
      </Alert>
    );
  }

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400/20 rounded-lg">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Catalogue Dashboard</h2>
              <p className="text-gray-400">Overview of your service packages and performance</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
          </Button>
        </div>
      </div>

      {/* Modern Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Packages</p>
                <p className="text-2xl font-bold text-white">{stats.totalCatalogueItems}</p>
              </div>
              <div className="p-3 bg-blue-400/20 rounded-full">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Packages</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeCatalogueItems}</p>
              </div>
              <div className="p-3 bg-green-400/20 rounded-full">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalBookings}</p>
              </div>
              <div className="p-3 bg-purple-400/20 rounded-full">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-yellow-400">R{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-400/20 rounded-full">
                <span className="text-lg font-bold text-yellow-400">R</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {stats.totalCatalogueItems > 0 && (
        <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.totalCatalogueItems > 0 ? Math.round((stats.activeCatalogueItems / stats.totalCatalogueItems) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-400">Active Rate</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {stats.totalCatalogueItems > 0 ? Math.round(stats.totalBookings / stats.totalCatalogueItems) : 0}
                </div>
                <div className="text-sm text-gray-400">Avg Bookings per Package</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  R{stats.totalBookings > 0 ? (stats.totalRevenue / stats.totalBookings).toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-gray-400">Avg Revenue per Booking</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Catalogue Manager */}
      <CatalogueManager providerId={providerId} />

      {/* Bulk Edit Interface */}
      <BulkEditInterface 
        providerId={providerId} 
        onSave={() => {
          // Refresh stats when bulk edit is saved
          fetchStats();
        }} 
      />

      {/* Pricing Suggestions */}
      <PricingSuggestions 
        providerId={providerId}
        onApplySuggestion={() => {
          // Refresh stats when pricing suggestions are applied
          fetchStats();
        }}
      />
    </div>
  );
}