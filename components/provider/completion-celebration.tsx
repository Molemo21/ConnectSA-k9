'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Trophy, 
  Star, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp,
  Users,
  Calendar,
  Gift,
  PartyPopper,
  Crown,
  Award,
  Rocket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompletionCelebrationProps {
  providerId: string;
  onComplete?: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  points: number;
}

export function CompletionCelebration({ providerId, onComplete }: CompletionCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    checkCompletionStatus();
  }, [providerId]);

  const checkCompletionStatus = async () => {
    try {
      const response = await fetch(`/api/provider/setup-progress?providerId=${providerId}`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.isCompleted && !data.celebrated) {
        setShowCelebration(true);
        generateAchievements();
      }
    } catch (error) {
      console.error('Error checking completion status:', error);
    }
  };

  const generateAchievements = () => {
    const allAchievements: Achievement[] = [
      {
        id: 'first_package',
        title: 'Package Pioneer',
        description: 'Created your first service package',
        icon: Package,
        unlocked: true,
        points: 50
      },
      {
        id: 'complete_setup',
        title: 'Setup Master',
        description: 'Completed your service package setup',
        icon: CheckCircle,
        unlocked: true,
        points: 100
      },
      {
        id: 'market_ready',
        title: 'Market Ready',
        description: 'Ready to start receiving bookings',
        icon: Target,
        unlocked: true,
        points: 75
      },
      {
        id: 'professional_pricing',
        title: 'Pricing Pro',
        description: 'Set competitive pricing for your services',
        icon: TrendingUp,
        unlocked: true,
        points: 60
      },
      {
        id: 'complete_profile',
        title: 'Profile Perfectionist',
        description: 'Completed your provider profile',
        icon: Star,
        unlocked: true,
        points: 40
      }
    ];

    setAchievements(allAchievements);
    setTotalPoints(allAchievements.reduce((sum, achievement) => sum + achievement.points, 0));
    setLevel(Math.floor(totalPoints / 100) + 1);
  };

  const handleCelebrationComplete = async () => {
    try {
      // Mark celebration as completed
      await fetch('/api/provider/setup-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          completed: true,
          celebrated: true 
        }),
      });

      setShowCelebration(false);
      
      toast({
        title: '🎉 Congratulations!',
        description: 'You\'re now ready to start earning! Welcome to ConnectSA!',
      });

      onComplete?.();
    } catch (error) {
      console.error('Error completing celebration:', error);
    }
  };

  if (!showCelebration) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-yellow-200 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <PartyPopper className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold text-orange-900 mb-2">
            🎉 Congratulations! 🎉
          </CardTitle>
          
          <div className="text-lg text-orange-700 mb-4">
            You've successfully completed your service package setup!
          </div>

          <div className="flex justify-center space-x-4">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
              <Trophy className="w-4 h-4 mr-2" />
              Level {level}
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-lg px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              {totalPoints} Points
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Achievements */}
          <div>
            <h3 className="text-xl font-semibold text-orange-900 mb-4 text-center">
              🏆 Achievements Unlocked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg border border-orange-200">
                    <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-orange-900">{achievement.title}</div>
                      <div className="text-sm text-orange-700">{achievement.description}</div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      +{achievement.points}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
              <Rocket className="w-5 h-5 mr-2" />
              What's Next?
            </h4>
            <div className="space-y-2 text-sm text-orange-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Your packages are now live and visible to clients</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Start receiving booking requests from clients</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Set your availability schedule</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Track your earnings and performance</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleCelebrationComplete}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Earning Now!
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowCelebration(false)}
              className="px-6"
            >
              Close
            </Button>
          </div>

          {/* Motivational Message */}
          <div className="text-center text-sm text-orange-600 italic">
            "Every expert was once a beginner. Every pro was once an amateur. 
            Every icon was once an unknown. You're on your way to success!" 🚀
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

