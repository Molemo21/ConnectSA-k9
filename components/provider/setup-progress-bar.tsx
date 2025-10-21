'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  ArrowRight, 
  Sparkles,
  Package,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupProgress {
  totalPackages: number;
  customizedPackages: number;
  completionPercentage: number;
  isCompleted: boolean;
  nextSteps: string[];
  estimatedTimeRemaining: number;
}

interface SetupProgressBarProps {
  className?: string;
}

export function SetupProgressBar({ className = '' }: SetupProgressBarProps) {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/setup-progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    try {
      const response = await fetch('/api/provider/setup-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as completed');
      }

      toast({
        title: '🎉 Congratulations!',
        description: 'Your service packages setup is complete! You\'re ready to start receiving bookings.',
      });

      // Refresh progress
      await fetchProgress();
    } catch (err) {
      console.error('Error marking as completed:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark setup as completed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Loading setup progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className={`bg-red-50 border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <span className="text-red-700">{error || 'Failed to load progress'}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchProgress}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progress.isCompleted) {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Setup Complete!</h3>
                <p className="text-sm text-green-600">You're ready to start receiving bookings</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Sparkles className="h-3 w-3 mr-1" />
              100% Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-blue-900">
          <Target className="h-5 w-5" />
          <span>Complete Your Service Packages</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {progress.completionPercentage}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-blue-700">
            <span>{progress.customizedPackages} of {progress.totalPackages} packages customized</span>
            <span>{progress.estimatedTimeRemaining} min remaining</span>
          </div>
          <Progress 
            value={progress.completionPercentage} 
            className="h-2"
          />
        </div>

        {/* Next Steps */}
        <div className="space-y-2">
          <h4 className="font-medium text-blue-900 flex items-center space-x-2">
            <ArrowRight className="h-4 w-4" />
            <span>Next Steps</span>
          </h4>
          <ul className="space-y-1">
            {progress.nextSteps.slice(0, 3).map((step, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/provider/dashboard?tab=catalogue'}
          >
            <Package className="h-4 w-4 mr-2" />
            Customize Packages
          </Button>
          
          {progress.completionPercentage >= 80 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={markAsCompleted}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-900">{progress.totalPackages}</div>
            <div className="text-xs text-blue-600">Total Packages</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-900">{progress.customizedPackages}</div>
            <div className="text-xs text-blue-600">Customized</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

