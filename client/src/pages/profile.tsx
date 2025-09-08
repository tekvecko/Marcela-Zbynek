import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { PlayerProfileHeader } from "@/components/profile/player-profile-header";
import { StatsGrid } from "@/components/profile/stats-grid";
import { AchievementsSection } from "@/components/profile/achievements-section";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { CurrentChallenges } from "@/components/profile/current-challenges";
import { NotificationToast } from "@/components/notifications/notification-toast";
import { useWebSocket } from "@/hooks/useWebSocket";

interface UserProfile {
  user: {
    id: string;
    displayName: string;
    level: number;
    totalPoints: number;
    currentLevelPoints: number;
    registrationDate: string;
  };
  stats: {
    totalPoints: number;
    level: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
    completedChallenges: number;
    unlockedAchievements: number;
    totalAchievements: number;
    miniGamesPlayed: number;
    bestMiniGameScore: number;
  };
  achievements: Array<{
    id: string;
    isUnlocked: boolean;
    progress: number;
    maxProgress: number;
    unlockedAt?: string;
    achievement: {
      id: string;
      title: string;
      description: string;
      icon: string;
      points: number;
      category: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: any;
    pointsEarned: number;
    createdAt: string;
  }>;
}

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { lastMessage } = useWebSocket();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Neoprávněný přístup",
        description: "Přihlašuješ se znovu...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { 
    data: profile, 
    isLoading: profileLoading, 
    error,
    refetch 
  } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    retry: false,
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'achievement_unlocked':
          toast({
            title: "Nový Achievement!",
            description: `Odemkl jsi "${lastMessage.data.title}"`,
          });
          refetch(); // Refresh profile data
          break;
        case 'level_up':
          toast({
            title: "Level Up!",
            description: `Dosáhl jsi Level ${lastMessage.data.newLevel}`,
          });
          refetch();
          break;
        case 'points_earned':
          // Optionally show points notification
          refetch();
          break;
      }
    }
  }, [lastMessage, toast, refetch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Neoprávněný přístup",
          description: "Jsi odhlášen. Přihlašuješ se znovu...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      } else {
        toast({
          title: "Chyba",
          description: "Nepodařilo se načíst profil. Zkus to znovu.",
          variant: "destructive",
        });
      }
    }
  }, [error, toast]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-card rounded-lg p-8 h-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-card h-96 rounded-lg"></div>
              <div className="bg-card h-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Profil nenalezen</h2>
            <p className="text-muted-foreground">
              Nepodařilo se načíst data profilu. Zkontroluj internetové připojení.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />
      
      {/* Notification Toast - will show based on real-time updates */}
      <NotificationToast />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Player Profile Header */}
        <PlayerProfileHeader user={profile.user} stats={profile.stats} />

        {/* Stats Grid */}
        <StatsGrid stats={profile.stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Achievements Section */}
          <div className="lg:col-span-2">
            <AchievementsSection achievements={profile.achievements} />
          </div>

          {/* Activity Feed and Challenges */}
          <div className="space-y-6">
            <ActivityFeed activities={profile.recentActivity} />
            <CurrentChallenges />
          </div>
        </div>
      </div>
    </div>
  );
}
