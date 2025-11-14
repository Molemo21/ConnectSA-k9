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
      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-200 mx-2 sm:mx-0">
        <AlertDescription className="text-xs sm:text-sm">
          Catalogue pricing is not currently enabled. Please contact support to activate this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-700/50 rounded animate-pulse"></div>
            <div className="h-3 sm:h-4 w-36 sm:w-48 bg-gray-700/30 rounded animate-pulse"></div>
          </div>
          <div className="h-9 sm:h-10 w-24 sm:w-32 bg-gray-700/50 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-400/20 rounded-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Catalogue Dashboard</h2>
              <p className="text-xs sm:text-sm text-gray-400">Overview of your service packages</p>
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
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
            <span className="sm:hidden">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

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