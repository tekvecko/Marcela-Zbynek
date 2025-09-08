interface Activity {
  id: string;
  action: string;
  details: any;
  pointsEarned: number;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'před chvilkou';
    if (diffInSeconds < 3600) return `před ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `před ${Math.floor(diffInSeconds / 3600)} h`;
    return `před ${Math.floor(diffInSeconds / 86400)} dny`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'challenge_completed':
        return { icon: 'fas fa-check', color: 'bg-emerald-500' };
      case 'achievement_unlocked':
        return { icon: 'fas fa-trophy', color: 'bg-amber-500' };
      case 'minigame_played':
        return { icon: 'fas fa-gamepad', color: 'bg-purple-500' };
      case 'level_up':
        return { icon: 'fas fa-arrow-up', color: 'bg-blue-500' };
      default:
        return { icon: 'fas fa-star', color: 'bg-gray-500' };
    }
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.action) {
      case 'challenge_completed':
        return `Dokončil výzvu "${activity.details?.challengeTitle || 'Výzva'}"`;
      case 'achievement_unlocked':
        return `Odemkl achievement "${activity.details?.achievementTitle || 'Achievement'}"`;
      case 'minigame_played':
        return `Hrál Mini-hru (Skóre: ${activity.details?.score || 0})`;
      case 'level_up':
        return `Dosáhl Level ${activity.details?.newLevel || 'N/A'}`;
      default:
        return 'Aktivita';
    }
  };

  if (!activities?.length) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-semibold flex items-center">
            <i className="fas fa-clock text-blue-500 mr-2"></i>
            Nedávná Aktivita
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            <i className="fas fa-history text-2xl mb-2"></i>
            <p>Zatím žádná aktivita</p>
            <p className="text-sm">Začni plnit výzvy pro zobrazení aktivity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-semibold flex items-center">
          <i className="fas fa-clock text-blue-500 mr-2"></i>
          Nedávná Aktivita
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon, color } = getActivityIcon(activity.action);
            return (
              <div key={activity.id} className="flex items-center space-x-3" data-testid={`activity-${activity.id}`}>
                <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-xs`}>
                  <i className={`${icon} text-white`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{getActivityDescription(activity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.pointsEarned > 0 && `+${activity.pointsEarned} XP • `}
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
