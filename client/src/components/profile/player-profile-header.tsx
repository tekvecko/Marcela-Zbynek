interface PlayerProfileHeaderProps {
  user: {
    id: string;
    displayName: string;
    level: number;
    totalPoints: number;
    registrationDate: string;
  };
  stats: {
    level: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
  };
}

export function PlayerProfileHeader({ user, stats }: PlayerProfileHeaderProps) {
  const progressPercentage = (stats.currentLevelPoints / stats.nextLevelPoints) * 100;
  const pointsToNextLevel = stats.nextLevelPoints - stats.currentLevelPoints;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-card rounded-lg p-8 mb-8 border border-border">
      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* Avatar a základní info */}
        <div className="flex items-center space-x-6">
          {/* Gaming avatar with dynamic styling based on level */}
          <div 
            className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold level-up-animation"
            data-testid="img-player-avatar"
          >
            {stats.level}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2" data-testid="text-player-name">
              {user.displayName}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-primary" data-testid="text-player-level">
                Level {stats.level}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground" data-testid="text-registration-date">
                Registrován: {formatDate(user.registrationDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Postup na Level {stats.level + 1}</span>
            <span className="text-sm text-muted-foreground" data-testid="text-progress-points">
              {stats.currentLevelPoints.toLocaleString()} / {stats.nextLevelPoints.toLocaleString()} XP
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="level-progress h-3 rounded-full transition-all duration-300"
              style={{ '--progress': `${progressPercentage}%` } as React.CSSProperties}
              data-testid="progress-level"
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-points-to-next">
            Zbývá {pointsToNextLevel.toLocaleString()} XP do dalšího levelu
          </p>
        </div>
      </div>
    </div>
  );
}
