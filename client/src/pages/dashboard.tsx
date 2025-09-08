import { useQuery } from '@tanstack/react-query';
import UserProgressCard from '@/components/user-progress-card';
import ChallengeCard from '@/components/challenge-card';
import LeaderboardCard from '@/components/leaderboard-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Medal, Camera, Flame, Heart, BarChart3 } from 'lucide-react';
import type { ChallengeWithSubmissions, Achievement, UserStats } from '../../../shared/schema';

export default function Dashboard() {
  const { data: challenges, isLoading: challengesLoading } = useQuery<ChallengeWithSubmissions[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements/user/1'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/stats/user/1'],
  });

  const recentAchievements = achievements?.slice(0, 3) || [];

  return (
    <main className="container mx-auto px-4 py-8" data-testid="dashboard">
      <UserProgressCard />

      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Challenges</h2>
            <Button data-testid="browse-all-challenges">
              <Plus className="w-4 h-4 mr-2" />
              Browse All
            </Button>
          </div>

          {challengesLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden" data-testid={`challenge-skeleton-${i}`}>
                  <div className="animate-pulse">
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-6">
                      <div className="h-6 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="flex space-x-4">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-4 bg-muted rounded w-20"></div>
                        </div>
                        <div className="h-9 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : challenges && challenges.length > 0 ? (
            <div className="space-y-6" data-testid="challenges-list">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card data-testid="no-challenges">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">No active challenges available</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LeaderboardCard />

          {/* Recent Achievements */}
          <Card data-testid="achievements-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Medal className="text-accent mr-2" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-muted/10 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg"
                      data-testid={`achievement-${achievement.id}`}
                    >
                      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                        {achievement.type === 'first_submission' && <Camera className="w-5 h-5 text-accent-foreground" />}
                        {achievement.type === 'streak' && <Flame className="w-5 h-5 text-accent-foreground" />}
                        {achievement.type === 'community_favorite' && <Heart className="w-5 h-5 text-accent-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">+{achievement.points} points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No achievements yet. Complete challenges to earn achievements!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          <Card data-testid="weekly-stats-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="text-primary mr-2" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center animate-pulse">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-8"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Photos Submitted</span>
                    <span className="font-semibold" data-testid="stats-photos">
                      {stats?.photosSubmitted || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Challenges Joined</span>
                    <span className="font-semibold" data-testid="stats-challenges">
                      {stats?.challengesJoined || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="font-semibold text-accent" data-testid="stats-points">
                      +{stats?.pointsEarned || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rank Change</span>
                    <span className="font-semibold text-accent" data-testid="stats-rank">
                      {stats?.rankChange ? (stats.rankChange > 0 ? `+${stats.rankChange} ↗` : `${stats.rankChange} ↘`) : '0'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
