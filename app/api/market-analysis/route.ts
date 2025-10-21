import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MarketAnalysis {
  serviceId: string;
  serviceName: string;
  marketStats: {
    totalProviders: number;
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
      median: number;
    };
    popularDurations: number[];
    topPricingTiers: Array<{
      tier: string;
      price: number;
      count: number;
    }>;
  };
  competitiveInsights: {
    yourPosition: 'below_market' | 'at_market' | 'above_market';
    recommendedPrice: number;
    priceAdjustment: number; // percentage
    marketShare: number;
  };
  trends: {
    priceTrend: 'increasing' | 'decreasing' | 'stable';
    demandTrend: 'high' | 'medium' | 'low';
    seasonality: string[];
  };
}

/**
 * GET /api/market-analysis
 * Get market analysis for a specific service or all services
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting market analysis...');

    const user = await getCurrentUser();
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Verify provider ownership
    const provider = await prisma.provider.findFirst({
      where: {
        id: providerId,
        userId: user.id
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const servicesToAnalyze = serviceId 
      ? provider.services.filter(ps => ps.serviceId === serviceId)
      : provider.services;

    if (servicesToAnalyze.length === 0) {
      return NextResponse.json({ error: 'No services found' }, { status: 404 });
    }

    const analyses: MarketAnalysis[] = [];

    for (const providerService of servicesToAnalyze) {
      const analysis = await generateMarketAnalysis(providerService.serviceId, providerId);
      analyses.push(analysis);
    }

    console.log(`✅ Generated market analysis for ${analyses.length} services`);

    return NextResponse.json({
      success: true,
      analyses,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting market analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get market analysis' },
      { status: 500 }
    );
  }
}

/**
 * Generate market analysis for a specific service
 */
async function generateMarketAnalysis(serviceId: string, providerId: string): Promise<MarketAnalysis> {
  // Get service information
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Get all catalogue items for this service
  const catalogueItems = await prisma.catalogueItem.findMany({
    where: {
      serviceId,
      isActive: true
    },
    include: {
      provider: {
        select: {
          id: true,
          businessName: true,
          location: true
        }
      }
    }
  });

  // Get provider's own items for comparison
  const providerItems = catalogueItems.filter(item => item.providerId === providerId);
  const competitorItems = catalogueItems.filter(item => item.providerId !== providerId);

  // Calculate market statistics
  const prices = competitorItems.map(item => item.price);
  const durations = competitorItems.map(item => item.durationMins);

  const marketStats = {
    totalProviders: new Set(competitorItems.map(item => item.providerId)).size,
    averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      median: prices.length > 0 ? calculateMedian(prices) : 0
    },
    popularDurations: getPopularDurations(durations),
    topPricingTiers: getTopPricingTiers(competitorItems)
  };

  // Calculate competitive insights
  const providerAveragePrice = providerItems.length > 0 
    ? providerItems.reduce((sum, item) => sum + item.price, 0) / providerItems.length
    : 0;

  const competitiveInsights = {
    yourPosition: getPosition(providerAveragePrice, marketStats.averagePrice),
    recommendedPrice: calculateRecommendedPrice(marketStats, providerAveragePrice),
    priceAdjustment: calculatePriceAdjustment(providerAveragePrice, marketStats.averagePrice),
    marketShare: calculateMarketShare(providerItems.length, catalogueItems.length)
  };

  // Generate trends (simplified for now)
  const trends = {
    priceTrend: 'stable' as const,
    demandTrend: 'medium' as const,
    seasonality: getSeasonality(service.name)
  };

  return {
    serviceId,
    serviceName: service.name,
    marketStats,
    competitiveInsights,
    trends
  };
}

/**
 * Helper functions
 */
function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  } else {
    return sorted[middle];
  }
}

function getPopularDurations(durations: number[]): number[] {
  const durationCounts = durations.reduce((acc, duration) => {
    acc[duration] = (acc[duration] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Object.entries(durationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([duration]) => parseInt(duration));
}

function getTopPricingTiers(items: any[]): Array<{ tier: string; price: number; count: number }> {
  const priceRanges = [
    { tier: 'Budget', min: 0, max: 200 },
    { tier: 'Standard', min: 200, max: 400 },
    { tier: 'Premium', min: 400, max: 600 },
    { tier: 'Luxury', min: 600, max: Infinity }
  ];

  return priceRanges.map(range => {
    const count = items.filter(item => 
      item.price >= range.min && item.price < range.max
    ).length;
    
    const avgPrice = items
      .filter(item => item.price >= range.min && item.price < range.max)
      .reduce((sum, item) => sum + item.price, 0) / count || 0;

    return {
      tier: range.tier,
      price: Math.round(avgPrice),
      count
    };
  }).filter(tier => tier.count > 0);
}

function getPosition(providerPrice: number, marketPrice: number): 'below_market' | 'at_market' | 'above_market' {
  const difference = Math.abs(providerPrice - marketPrice) / marketPrice;
  
  if (difference < 0.1) return 'at_market';
  return providerPrice < marketPrice ? 'below_market' : 'above_market';
}

function calculateRecommendedPrice(marketStats: any, providerPrice: number): number {
  // Recommend price that's 5% below market average for competitiveness
  return Math.round(marketStats.averagePrice * 0.95);
}

function calculatePriceAdjustment(providerPrice: number, marketPrice: number): number {
  if (marketPrice === 0) return 0;
  return Math.round(((providerPrice - marketPrice) / marketPrice) * 100);
}

function calculateMarketShare(providerItems: number, totalItems: number): number {
  if (totalItems === 0) return 0;
  return Math.round((providerItems / totalItems) * 100);
}

function getSeasonality(serviceName: string): string[] {
  const seasonalityMap: Record<string, string[]> = {
    'house_cleaning': ['Spring cleaning peak', 'Holiday preparation'],
    'office_cleaning': ['Year-end deep clean', 'Post-holiday reset'],
    'deep_cleaning': ['Spring cleaning', 'Moving season'],
    'window_cleaning': ['Spring cleaning', 'Pre-holiday'],
    'carpet_cleaning': ['Winter preparation', 'Post-holiday']
  };

  const key = serviceName.toLowerCase().replace(/\s+/g, '_');
  return seasonalityMap[key] || ['Year-round demand'];
}

