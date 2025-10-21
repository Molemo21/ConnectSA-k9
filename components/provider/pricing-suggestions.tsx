'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  DollarSign,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketAnalysis {
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
    priceAdjustment: number;
    marketShare: number;
  };
  trends: {
    priceTrend: 'increasing' | 'decreasing' | 'stable';
    demandTrend: 'high' | 'medium' | 'low';
    seasonality: string[];
  };
}

interface PricingSuggestionsProps {
  providerId: string;
  serviceId?: string;
  onApplySuggestion?: (suggestion: any) => void;
}

export function PricingSuggestions({ providerId, serviceId, onApplySuggestion }: PricingSuggestionsProps) {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMarketAnalysis();
  }, [providerId, serviceId]);

  const fetchMarketAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = serviceId 
        ? `/api/market-analysis?providerId=${providerId}&serviceId=${serviceId}`
        : `/api/market-analysis?providerId=${providerId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market analysis');
      }

      const data = await response.json();
      setAnalysis(data.analyses[0] || null);
    } catch (err) {
      console.error('Error fetching market analysis:', err);
      setError('Failed to load market analysis');
    } finally {
      setLoading(false);
    }
  };

  const applyPricingSuggestion = async (suggestion: any) => {
    try {
      setApplyingSuggestion(true);
      
      // Apply the pricing suggestion
      const response = await fetch('/api/provider/catalogue/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          items: suggestion.items
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply pricing suggestion');
      }

      toast({
        title: 'Success',
        description: 'Pricing suggestions applied successfully',
      });

      onApplySuggestion?.(suggestion);
    } catch (err) {
      console.error('Error applying pricing suggestion:', err);
      toast({
        title: 'Error',
        description: 'Failed to apply pricing suggestion',
        variant: 'destructive',
      });
    } finally {
      setApplyingSuggestion(false);
    }
  };

  const generatePricingSuggestions = () => {
    if (!analysis) return [];

    const suggestions = [];

    // Competitive pricing suggestion
    if (analysis.competitiveInsights.yourPosition !== 'at_market') {
      suggestions.push({
        id: 'competitive',
        title: 'Competitive Pricing',
        description: `Price your packages at R${analysis.competitiveInsights.recommendedPrice} to match market rates`,
        icon: Target,
        color: 'blue',
        action: 'Apply Competitive Pricing',
        items: [] // Would be populated with actual items
      });
    }

    // Premium positioning suggestion
    if (analysis.marketStats.averagePrice < 300) {
      suggestions.push({
        id: 'premium',
        title: 'Premium Positioning',
        description: `Consider premium pricing at R${Math.round(analysis.marketStats.averagePrice * 1.2)} for higher value perception`,
        icon: TrendingUp,
        color: 'purple',
        action: 'Apply Premium Pricing',
        items: []
      });
    }

    // Duration optimization suggestion
    const popularDuration = analysis.marketStats.popularDurations[0];
    if (popularDuration) {
      suggestions.push({
        id: 'duration',
        title: 'Duration Optimization',
        description: `Most popular duration is ${popularDuration} minutes. Consider adjusting your packages to match`,
        icon: Clock,
        color: 'green',
        action: 'Optimize Durations',
        items: []
      });
    }

    return suggestions;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing market data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'No market analysis available'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const suggestions = generatePricingSuggestions();

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Market Analysis: {analysis.serviceName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{analysis.marketStats.totalProviders}</div>
              <div className="text-sm text-blue-700">Competitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">R{analysis.marketStats.averagePrice}</div>
              <div className="text-sm text-blue-700">Market Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{analysis.competitiveInsights.marketShare}%</div>
              <div className="text-sm text-blue-700">Your Market Share</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center space-x-2">
              {analysis.competitiveInsights.yourPosition === 'below_market' && (
                <TrendingDown className="h-5 w-5 text-green-600" />
              )}
              {analysis.competitiveInsights.yourPosition === 'at_market' && (
                <Target className="h-5 w-5 text-blue-600" />
              )}
              {analysis.competitiveInsights.yourPosition === 'above_market' && (
                <TrendingUp className="h-5 w-5 text-purple-600" />
              )}
              <span className="font-medium text-blue-900">
                You're {analysis.competitiveInsights.yourPosition.replace('_', ' ')} market
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-200 text-blue-800">
              {analysis.competitiveInsights.priceAdjustment > 0 ? '+' : ''}{analysis.competitiveInsights.priceAdjustment}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Smart Pricing Suggestions</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion) => {
              const IconComponent = suggestion.icon;
              return (
                <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full bg-${suggestion.color}-100`}>
                        <IconComponent className={`h-5 w-5 text-${suggestion.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applyPricingSuggestion(suggestion)}
                      disabled={applyingSuggestion}
                      className={`bg-${suggestion.color}-600 hover:bg-${suggestion.color}-700`}
                    >
                      {applyingSuggestion ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {suggestion.action}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Market Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Price Trend</span>
              </div>
              <Badge variant={analysis.trends.priceTrend === 'increasing' ? 'default' : 'secondary'}>
                {analysis.trends.priceTrend}
              </Badge>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Demand Level</span>
              </div>
              <Badge variant={analysis.trends.demandTrend === 'high' ? 'default' : 'secondary'}>
                {analysis.trends.demandTrend}
              </Badge>
            </div>
          </div>

          {analysis.trends.seasonality.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Seasonal Opportunities</span>
              </div>
              <div className="space-y-1">
                {analysis.trends.seasonality.map((season, index) => (
                  <div key={index} className="text-sm text-blue-700">• {season}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

