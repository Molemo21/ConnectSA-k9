/**
 * Pagination Hook for Infinite Scroll
 * 
 * Provides cursor-based pagination functionality with:
 * - Infinite scroll / "Load more" button
 * - Real-time updates integration
 * - Proper loading indicators and error handling
 * - Data consistency management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logDashboard } from '@/lib/logger';

export interface PaginationData<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
  pageSize: number;
  count: number;
}

export interface UsePaginationOptions<T> {
  fetchFunction: (cursor?: string, limit?: number) => Promise<{
    success: boolean;
    data: T[];
    pagination: PaginationData<T>;
  }>;
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableLoadMore?: boolean;
  onNewItem?: (item: T) => void; // For real-time updates
  onItemUpdate?: (item: T) => void; // For real-time updates
  onItemDelete?: (itemId: string) => void; // For real-time updates
}

export interface UsePaginationReturn<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  pageSize: number;
  count: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addItem: (item: T) => void; // For real-time updates
  updateItem: (item: T) => void; // For real-time updates
  removeItem: (itemId: string) => void; // For real-time updates
}

export function usePagination<T extends { id: string; createdAt: string }>({
  fetchFunction,
  pageSize = 20,
  enableInfiniteScroll = true,
  enableLoadMore = true,
  onNewItem,
  onItemUpdate,
  onItemDelete
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch data function
  const fetchData = useCallback(async (cursor?: string, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      logDashboard.success('pagination', 'fetch_data', `Fetching ${isLoadMore ? 'more' : 'initial'} data`, {
        metadata: { cursor, pageSize, isLoadMore }
      });

      const response = await fetchFunction(cursor, pageSize);

      if (!response.success) {
        throw new Error('Failed to fetch data');
      }

      const { data, pagination } = response;

      if (isLoadMore) {
        // Append new items for load more
        setItems(prev => [...prev, ...data]);
        logDashboard.success('pagination', 'load_more', 'More data loaded', {
          metadata: { 
            newItemsCount: data.length,
            totalItems: items.length + data.length
          }
        });
      } else {
        // Replace items for initial load or refresh
        setItems(data);
        logDashboard.success('pagination', 'initial_load', 'Initial data loaded', {
          metadata: { itemsCount: data.length }
        });
      }

      setHasMore(pagination.hasMore);
      setNextCursor(pagination.nextCursor);
      setCount(pagination.count);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      logDashboard.error('pagination', 'fetch_error', 'Failed to fetch data', err as Error, {
        error_code: 'FETCH_ERROR',
        metadata: { cursor, pageSize, isLoadMore }
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isInitialLoad.current = false;
    }
  }, [fetchFunction, pageSize, items.length]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    await fetchData(nextCursor, true);
  }, [fetchData, hasMore, loadingMore, loading, nextCursor]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingMore && !loading) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableInfiniteScroll, hasMore, loadingMore, loading, loadMore]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time update functions
  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
    setCount(prev => prev + 1);
    
    logDashboard.success('pagination', 'add_item', 'New item added via real-time update', {
      metadata: { itemId: item.id }
    });

    if (onNewItem) {
      onNewItem(item);
    }
  }, [onNewItem]);

  const updateItem = useCallback((item: T) => {
    setItems(prev => prev.map(existingItem => 
      existingItem.id === item.id ? item : existingItem
    ));
    
    logDashboard.success('pagination', 'update_item', 'Item updated via real-time update', {
      metadata: { itemId: item.id }
    });

    if (onItemUpdate) {
      onItemUpdate(item);
    }
  }, [onItemUpdate]);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setCount(prev => Math.max(0, prev - 1));
    
    logDashboard.success('pagination', 'remove_item', 'Item removed via real-time update', {
      metadata: { itemId }
    });

    if (onItemDelete) {
      onItemDelete(itemId);
    }
  }, [onItemDelete]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    nextCursor,
    pageSize,
    count,
    loadMore,
    refresh,
    addItem,
    updateItem,
    removeItem
  };
}

// Hook specifically for bookings pagination
export function useBookingsPagination(
  userRole: 'CLIENT' | 'PROVIDER',
  userId?: string
) {
  const fetchBookings = useCallback(async (cursor?: string, limit?: number) => {
    const url = userRole === 'CLIENT' 
      ? '/api/user/bookings' 
      : '/api/provider/dashboard';
    
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch bookings');
    }

    return {
      success: true,
      data: data.bookings || [],
      pagination: data.pagination || {
        hasMore: false,
        nextCursor: null,
        pageSize: limit || 20,
        count: data.bookings?.length || 0
      }
    };
  }, [userRole]);

  return usePagination({
    fetchFunction: fetchBookings,
    pageSize: 20,
    enableInfiniteScroll: true,
    enableLoadMore: true
  });
}

// Hook for infinite scroll with load more button
export function useInfiniteScrollWithLoadMore<T extends { id: string; createdAt: string }>(
  options: UsePaginationOptions<T>
) {
  const pagination = usePagination(options);

  const LoadMoreButton = () => {
    if (!pagination.hasMore || pagination.loading) return null;

    return (
      <div className="flex justify-center py-4">
        <button
          onClick={pagination.loadMore}
          disabled={pagination.loadingMore}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pagination.loadingMore ? 'Loading...' : 'Load More'}
        </button>
      </div>
    );
  };

  const InfiniteScrollTrigger = () => {
    if (!options.enableInfiniteScroll || !pagination.hasMore) return null;

    return (
      <div 
        ref={(el) => {
          if (el) {
            // Store ref for intersection observer
            (pagination as any).loadMoreRef = el;
          }
        }}
        className="h-4"
      />
    );
  };

  return {
    ...pagination,
    LoadMoreButton,
    InfiniteScrollTrigger
  };
}
