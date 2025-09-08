import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UserWithProgress } from '../../../shared/schema';

export default function UserProgressCard() {
  const { data: user, isLoading } = useQuery<UserWithProgress>({
    queryKey: ['/api/users/me'],
  });

  if (isLoading) {
    return (
      <Card data-testid="user-progress-loading">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-32"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-8 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-40"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card data-testid="user-progress-error">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load user progress
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.min(100, (user.nextLevelProgress / 1000) * 100);

  return (
    <Card data-testid="user-progress-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              Level <span className="gradient-text" data-testid="user-level">{user.level}</span>
            </h2>
            <p className="text-muted-foreground">Photography Enthusiast</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid="user-total-points">
              {user.points.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress to Level {user.level + 1}</span>
            <span data-testid="level-progress">{user.nextLevelProgress} / 1000</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
            data-testid="progress-bar"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          <span className="font-medium" data-testid="points-to-next-level">
            {user.pointsToNextLevel}
          </span> more points needed for next level
        </p>
      </CardContent>
    </Card>
  );
}
