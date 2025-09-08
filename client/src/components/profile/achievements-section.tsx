interface Achievement {
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
}

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (progress: number, maxProgress: number) => {
    return Math.min((progress / maxProgress) * 100, 100);
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-semibold flex items-center">
          <i className="fas fa-trophy text-amber-500 mr-2"></i>
          Achievementy
        </h3>
        <p className="text-muted-foreground mt-1">Tvoje dosažení a pokrok</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((userAchievement) => (
            <div 
              key={userAchievement.id} 
              className={`bg-muted rounded-lg p-4 ${userAchievement.isUnlocked ? 'achievement-glow' : 'opacity-75'}`}
              data-testid={`card-achievement-${userAchievement.achievement.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userAchievement.isUnlocked 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-500 text-gray-300'
                }`}>
                  <i className={userAchievement.achievement.icon}></i>
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${!userAchievement.isUnlocked ? 'text-gray-400' : ''}`}>
                    {userAchievement.achievement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {userAchievement.achievement.description}
                  </p>
                  
                  {userAchievement.isUnlocked ? (
                    <div className="flex items-center mt-2">
                      <span className="bg-emerald-500 text-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                        DOKONČENO
                      </span>
                      <span className="text-emerald-500 ml-2 text-sm">
                        +{userAchievement.achievement.points} XP
                      </span>
                      {userAchievement.unlockedAt && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDate(userAchievement.unlockedAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Postup</span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-progress-${userAchievement.achievement.id}`}>
                          {userAchievement.progress}/{userAchievement.maxProgress}
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getProgressPercentage(userAchievement.progress, userAchievement.maxProgress)}%` }}
                          data-testid={`progress-achievement-${userAchievement.achievement.id}`}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Odměna: +{userAchievement.achievement.points} XP
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
