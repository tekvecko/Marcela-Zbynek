import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '../../../shared/schema';

export default function LeaderboardCard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <Card data-testid="leaderboard-loading">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="text-accent mr-2" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-muted rounded"></div>
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-3 bg-muted rounded w-10"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card data-testid="leaderboard-empty">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="text-accent mr-2" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No leaderboard data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <Card data-testid="leaderboard-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="text-accent mr-2" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div 
              key={entry.user.id} 
              className={`flex items-center justify-between py-2 rounded-lg px-2 -mx-2 ${
                entry.rank === 4 ? 'bg-primary/10' : ''
              }`}
              data-testid={`leaderboard-entry-${entry.user.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className={`w-8 h-8 ${
                  entry.rank === 1 
                    ? 'bg-gradient-to-br from-primary to-accent' 
                    : 'bg-secondary'
                }`}>
                  <AvatarFallback className={
                    entry.rank === 1 ? 'text-white text-xs' : 'text-muted-foreground text-xs'
                  }>
                    {entry.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className={`font-medium text-sm ${
                    entry.rank === 4 ? 'text-primary' : ''
                  }`} data-testid="user-name">
                    {entry.user.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Level <span data-testid="user-level">{entry.user.level}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium text-sm ${
                  entry.rank === 4 ? 'text-primary' : ''
                }`} data-testid="user-points">
                  {entry.user.points.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-primary hover:text-primary/80"
          data-testid="view-full-leaderboard"
        >
          View Full Leaderboard
        </Button>
      </CardContent>
    </Card>
  );
}
