
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award,
  TrendingUp,
  Calendar,
  Clock,
  Camera,
  GamepadIcon
} from "lucide-react";

export default function Profile() {
  // Fetch user level
  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["/api/user/level"],
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch user achievements
  const { data: userAchievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/user/achievements"],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch all achievements for comparison
  const { data: allAchievements = [], isLoading: allAchievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user streaks
  const { data: userStreaks, isLoading: streaksLoading } = useQuery({
    queryKey: ["/api/user/streaks"],
    staleTime: 30 * 1000, // 30 seconds
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera size={16} />;
      case 'mini_game': return <GamepadIcon size={16} />;
      case 'social': return <Star size={16} />;
      case 'special': return <Zap size={16} />;
      default: return <Award size={16} />;
    }
  };

  if (levelLoading || achievementsLoading || streaksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-romantic"></div>
            <p className="mt-4 text-charcoal/70">Načítání profilu...</p>
          </div>
        </div>
      </div>
    );
  }

  const experienceProgress = userLevel?.experienceToNext && userLevel?.experience
    ? ((userLevel.experience % 1000) / 1000) * 100 
    : 0;

  const unlockedAchievementIds = Array.isArray(userAchievements) 
    ? userAchievements.map((ua: any) => ua.achievementId).filter(Boolean)
    : [];
  const unlockedAchievements = Array.isArray(allAchievements) 
    ? allAchievements.filter((a: any) => a && a.id && unlockedAchievementIds.includes(a.id))
    : [];
  const lockedAchievements = Array.isArray(allAchievements)
    ? allAchievements.filter((a: any) => a && a.id && !unlockedAchievementIds.includes(a.id))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage">
      <Navigation />
      <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 pt-20 md:pt-24">
        
        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-4xl">{userLevel?.badge || "🌟"}</span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold text-charcoal mb-2">
                {userLevel?.title || "Svatební nováček"}
              </h1>
              <p className="text-lg text-charcoal/70 mb-4">
                Úroveň {userLevel?.level || 1} • {userLevel?.experience || 0} XP
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-charcoal/60">
                  <span>Pokrok k další úrovni</span>
                  <span>{userLevel?.experienceToNext || 0} XP zbývá</span>
                </div>
                <Progress value={experienceProgress} className="w-full" />
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div className="bg-romantic/10 rounded-lg p-4">
                <div className="font-bold text-2xl text-romantic">{unlockedAchievements.length}</div>
                <div className="text-xs text-charcoal/60">achievementů</div>
              </div>
              <div className="bg-gold/10 rounded-lg p-4">
                <div className="font-bold text-2xl text-gold">{userStreaks?.photo?.currentStreak || 0}</div>
                <div className="text-xs text-charcoal/60">denní série</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Tabs */}
        <Tabs defaultValue="achievements" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy size={16} />
              Achievementy
            </TabsTrigger>
            <TabsTrigger value="streaks" className="flex items-center gap-2">
              <TrendingUp size={16} />
              Denní série
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Target size={16} />
              Statistiky
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Unlocked Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-gold" size={20} />
                    Odemčené achievementy ({unlockedAchievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {unlockedAchievements.map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gold/10 to-yellow-400/10 rounded-lg border border-gold/20">
                      <span className="text-2xl">{achievement.icon || "🏆"}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-charcoal">{achievement.title || "Neznámý achievement"}</h4>
                        <p className="text-sm text-charcoal/60">{achievement.description || "Popis není k dispozici"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getTypeIcon(achievement.type || "special")}
                          <Badge className={getRarityColor(achievement.rarity || "common")}>
                            {achievement.rarity || "common"}
                          </Badge>
                          <span className="text-xs text-gold">+{achievement.points || 0} bodů</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {unlockedAchievements.length === 0 && (
                    <div className="text-center py-8">
                      <Trophy size={48} className="text-charcoal/30 mx-auto mb-4" />
                      <p className="text-charcoal/60">Zatím žádné achievementy.</p>
                      <p className="text-charcoal/50 text-sm">Začněte fotografovat a hrát mini-hry!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Locked Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="text-charcoal/60" size={20} />
                    K odemčení ({lockedAchievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lockedAchievements.slice(0, 8).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-4 p-4 bg-white/50 rounded-lg border border-white/30 opacity-70">
                      <span className="text-2xl grayscale">{achievement.icon || "🏆"}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-charcoal">{achievement.title || "Neznámý achievement"}</h4>
                        <p className="text-sm text-charcoal/60">{achievement.description || "Popis není k dispozici"}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getTypeIcon(achievement.type || "special")}
                          <Badge variant="outline" className="text-xs">
                            {achievement.rarity || "common"}
                          </Badge>
                          <span className="text-xs text-charcoal/50">+{achievement.points || 0} bodů</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="text-blue-600" size={20} />
                    Foto série
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-blue-600">
                      {userStreaks?.photo?.currentStreak || 0}
                    </div>
                    <p className="text-sm text-charcoal/60">dnů v řadě</p>
                    <div className="text-xs text-charcoal/50">
                      Nejdelší: {userStreaks?.photo?.longestStreak || 0} dnů
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="text-green-600" size={20} />
                    Přihlášení
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-green-600">
                      {userStreaks?.login?.currentStreak || 0}
                    </div>
                    <p className="text-sm text-charcoal/60">dnů v řadě</p>
                    <div className="text-xs text-charcoal/50">
                      Nejdelší: {userStreaks?.login?.longestStreak || 0} dnů
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="text-purple-600" size={20} />
                    Výzvy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-purple-600">
                      {userStreaks?.challenge?.currentStreak || 0}
                    </div>
                    <p className="text-sm text-charcoal/60">dnů v řadě</p>
                    <div className="text-xs text-charcoal/50">
                      Nejdelší: {userStreaks?.challenge?.longestStreak || 0} dnů
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Celkové statistiky</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Celková úroveň</span>
                    <span className="font-bold">{userLevel?.level || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Celkové XP</span>
                    <span className="font-bold">{userLevel?.experience || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Achievementy</span>
                    <span className="font-bold">{unlockedAchievements.length}/{allAchievements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Completion rate</span>
                    <span className="font-bold">
                      {allAchievements.length > 0 
                        ? Math.round((unlockedAchievements.length / allAchievements.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aktivita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Nejdelší foto série</span>
                    <span className="font-bold">{userStreaks?.photo?.longestStreak || 0} dnů</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Aktuální série</span>
                    <span className="font-bold">{userStreaks?.photo?.currentStreak || 0} dnů</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Poslednia aktivita</span>
                    <span className="font-bold text-sm">
                      {userStreaks?.photo?.lastActivityDate 
                        ? new Date(userStreaks.photo.lastActivityDate).toLocaleDateString('cs-CZ')
                        : 'Nikdy'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
