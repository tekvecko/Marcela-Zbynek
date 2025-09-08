interface StatsGridProps {
  stats: {
    totalPoints: number;
    level: number;
    completedChallenges: number;
    unlockedAchievements: number;
    totalAchievements: number;
    miniGamesPlayed: number;
    bestMiniGameScore: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const achievementPercentage = stats.totalAchievements > 0 
    ? Math.round((stats.unlockedAchievements / stats.totalAchievements) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Celkové body</p>
            <p className="text-2xl font-bold" data-testid="text-total-points">
              {stats.totalPoints.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <i className="fas fa-star text-primary text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-emerald-500 text-sm">Level {stats.level}</span>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Dokončené výzvy</p>
            <p className="text-2xl font-bold" data-testid="text-completed-challenges">
              {stats.completedChallenges}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <i className="fas fa-target text-emerald-500 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-emerald-500 text-sm">Výzvy splněny</span>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Achievementy</p>
            <p className="text-2xl font-bold" data-testid="text-achievements-ratio">
              {stats.unlockedAchievements}/{stats.totalAchievements}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <i className="fas fa-trophy text-amber-500 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-amber-500 text-sm" data-testid="text-achievement-percentage">
            {achievementPercentage}% dokončeno
          </span>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Mini-hry</p>
            <p className="text-2xl font-bold" data-testid="text-minigames-played">
              {stats.miniGamesPlayed}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
            <i className="fas fa-gamepad text-purple-500 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-purple-500 text-sm" data-testid="text-best-score">
            Nejlepší skóre: {stats.bestMiniGameScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
