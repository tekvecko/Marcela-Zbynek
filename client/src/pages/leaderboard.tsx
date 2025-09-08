import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, Medal, Award, Crown, Zap, Target } from 'lucide-react';
import type { LeaderboardEntry, UserWithProgress } from '../../../shared/schema';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all-time');
  const [limit, setLimit] = useState(50);

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', { limit }],
  });

  const { data: currentUser } = useQuery<UserWithProgress>({
    queryKey: ['/api/users/me'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
      case 3:
        return 'bg-gradient-to-br from-amber-400 to-amber-600';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <main className="container mx-auto px-4 py-8" data-testid="leaderboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Trophy className="text-accent mr-3" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          See how you stack up against other photography enthusiasts
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40" data-testid="timeframe-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
          <SelectTrigger className="w-32" data-testid="limit-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="25">Top 25</SelectItem>
            <SelectItem value="50">Top 50</SelectItem>
            <SelectItem value="100">Top 100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card data-testid="leaderboard-loading">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-12 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : leaderboard && leaderboard.length > 0 ? (
            <Card data-testid="leaderboard-table">
              <CardContent className="p-6">
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const isCurrentUser = currentUser && entry.user.id === currentUser.id;
                    return (
                      <div
                        key={entry.user.id}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/20'
                        }`}
                        data-testid={`leaderboard-entry-${entry.user.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-8 text-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className={`w-10 h-10 ${getRankColor(entry.rank)}`}>
                            <AvatarFallback className={
                              entry.rank <= 3 ? 'text-white text-sm font-bold' : 'text-muted-foreground text-sm'
                            }>
                              {entry.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className={`font-medium ${
                              isCurrentUser ? 'text-primary' : ''
                            }`} data-testid="user-name">
                              {entry.user.name}
                              {isCurrentUser && <span className="text-xs ml-2 text-primary">(You)</span>}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              Level {entry.user.level}
                              {entry.rank <= 3 && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.rank === 1 && 'Champion'}
                                  {entry.rank === 2 && 'Runner-up'}
                                  {entry.rank === 3 && 'Third Place'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            isCurrentUser ? 'text-primary' : ''
                          }`} data-testid="user-points">
                            {entry.user.points.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="no-leaderboard-data">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">No leaderboard data yet</div>
                <div className="text-muted-foreground">
                  Be the first to participate in challenges and earn points!
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Current User Position */}
          {currentUser && (
            <Card data-testid="current-user-stats">
              <CardHeader>
                <CardTitle className="text-lg">Your Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      #{leaderboard?.find(e => e.user.id === currentUser.id)?.rank || '?'}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Position</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{currentUser.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Points</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{currentUser.level}</div>
                      <div className="text-xs text-muted-foreground">Level</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Achievements */}
          <Card data-testid="top-achievements">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Award className="w-5 h-5 mr-2 text-accent" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-lg">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="font-medium text-sm">Top Photographer</div>
                    <div className="text-xs text-muted-foreground">Reach #1 on leaderboard</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Speed Demon</div>
                    <div className="text-xs text-muted-foreground">Complete 5 challenges in a day</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-lg">
                  <Target className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="font-medium text-sm">Perfectionist</div>
                    <div className="text-xs text-muted-foreground">Get perfect scores on 10 challenges</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card data-testid="quick-stats">
            <CardHeader>
              <CardTitle className="text-lg">Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Participants</span>
                  <span className="font-semibold">{leaderboard?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Level</span>
                  <span className="font-semibold">
                    {leaderboard && leaderboard.length > 0
                      ? Math.round(leaderboard.reduce((sum, e) => sum + e.user.level, 0) / leaderboard.length)
                      : 0
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest Score</span>
                  <span className="font-semibold">
                    {leaderboard && leaderboard.length > 0 ? leaderboard[0].user.points.toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
