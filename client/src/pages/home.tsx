import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { StatsGrid } from "@/components/profile/stats-grid";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
}

interface UserStats {
  totalPoints: number;
  level: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  completedChallenges: number;
  unlockedAchievements: number;
  totalAchievements: number;
  miniGamesPlayed: number;
  bestMiniGameScore: number;
}

export default function Home() {
  const { user } = useAuth();

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
  });

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (challengesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-card h-32 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card h-24 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Vítej zpět, {(user as any)?.displayName || 'Hráči'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Jsi na Level {stats?.level || 1} s {stats?.totalPoints || 0} body. Pokračuj ve svých výzvách!
          </p>
        </div>

        {/* Stats Overview */}
        {stats && <StatsGrid stats={stats} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Available Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-target text-emerald-500 mr-2"></i>
                Dostupné výzvy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenges?.slice(0, 3).map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">{challenge.title}</h4>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-semibold">{challenge.points} XP</div>
                      <Button size="sm" variant="outline" className="mt-1" data-testid={`button-challenge-${challenge.id}`}>
                        Začít
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" data-testid="button-view-all-challenges">
                  Zobrazit všechny výzvy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-clock text-blue-500 mr-2"></i>
                Poslední aktivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs">
                    <i className="fas fa-check text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Systém sleduje tvůj pokrok</p>
                    <p className="text-xs text-muted-foreground">Dokončuj výzvy pro získání bodů</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-xs">
                    <i className="fas fa-trophy text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Achievementy se automaticky odemykají</p>
                    <p className="text-xs text-muted-foreground">Pokračuj v hraní pro více odměn</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full" data-testid="button-view-profile">
                  Zobrazit profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
