
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlassButton from "@/components/ui/glass-button";
import Navigation from "@/components/navigation";
import { 
  Trophy, 
  Medal, 
  Star, 
  Camera, 
  GamepadIcon, 
  Crown, 
  Users,
  Target,
  Timer,
  Award
} from "lucide-react";

interface LeaderboardEntry {
  participantName: string;
  completedQuests: number;
  totalPoints: number;
}

interface MiniGameScore {
  id: string;
  gameId: string;
  playerEmail: string;
  playerName: string;
  score: number;
  maxScore: number;
  timeSpent: number | null;
  createdAt: string;
}

interface MiniGame {
  id: string;
  title: string;
  description: string;
  gameType: string;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
}

interface QuestChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  isActive: boolean;
}

interface QuestProgressData {
  questId: string;
  participantName: string;
  photosUploaded: number;
  isCompleted: boolean;
}

// Helper function to get display name from email
const getDisplayName = (email: string) => {
  return email.split('@')[0];
};

// Helper function to get medal component
const getMedalComponent = (position: number) => {
  if (position === 1) return <Crown className="text-gold" size={20} />;
  if (position === 2) return <Medal className="text-gray-400" size={20} />;
  if (position === 3) return <Medal className="text-orange-400" size={20} />;
  return <Award className="text-gray-300" size={16} />;
};

// Helper function to get position styling
const getPositionStyling = (position: number) => {
  if (position === 1) return 'bg-gradient-to-r from-gold/20 to-yellow-400/20 border-gold/30';
  if (position === 2) return 'bg-gradient-to-r from-gray-100 to-gray-200/50 border-gray-300/30';
  if (position === 3) return 'bg-gradient-to-r from-orange-100 to-orange-200/50 border-orange-300/30';
  return 'bg-white/50 border-white/30 hover:bg-white/70';
};

export default function Leaderboards() {
  const [selectedGame, setSelectedGame] = useState<string>("all");

  // Fetch photo quest leaderboard
  const { data: photoLeaderboard = [], isLoading: photoLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/quest-leaderboard"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch mini-games
  const { data: miniGames = [], isLoading: gamesLoading } = useQuery<MiniGame[]>({
    queryKey: ["/api/mini-games"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch quest challenges
  const { data: challenges = [], isLoading: challengesLoading } = useQuery<QuestChallenge[]>({
    queryKey: ["/api/quest-challenges"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch quest progress data
  const { data: questProgress = [], isLoading: progressLoading } = useQuery<QuestProgressData[]>({
    queryKey: ["/api/quest-progress"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch mini-game scores for selected game
  const { data: miniGameScores = [], isLoading: scoresLoading } = useQuery<MiniGameScore[]>({
    queryKey: [`/api/mini-games/${selectedGame}/scores`],
    enabled: selectedGame !== "all" && selectedGame !== "",
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate individual challenge leaderboards
  const getChallengeLeaderboard = (challengeId: string) => {
    const challengeProgress = questProgress.filter(p => p.questId === challengeId && p.isCompleted);
    const challenge = challenges.find(c => c.id === challengeId);
    
    return challengeProgress.map(progress => ({
      participantName: progress.participantName,
      points: challenge?.points || 0,
      photosUploaded: progress.photosUploaded
    })).sort((a, b) => b.points - a.points);
  };

  // Calculate mini-games aggregate leaderboard
  const getMiniGamesAggregateLeaderboard = () => {
    const playerStats: Record<string, { playerName: string; totalScore: number; gamesPlayed: number; avgScore: number }> = {};

    miniGames.forEach(game => {
      // This would need individual game scores - for now showing placeholder structure
      // In real implementation, you'd fetch scores for each game
    });

    return Object.values(playerStats).sort((a, b) => b.totalScore - a.totalScore);
  };

  if (photoLoading || gamesLoading || challengesLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-romantic"></div>
            <p className="mt-4 text-charcoal/70">Načítání žebříčků...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage">
      <Navigation />
      <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 pt-20 md:pt-24">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-romantic/5 to-love/5 rounded-3xl -z-10"></div>
          
          <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30">
            <div className="w-24 h-24 bg-gradient-to-br from-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Trophy className="text-white drop-shadow-lg" size={32} />
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
              Žebříčky nejlepších
            </h1>

            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed mb-8">
              Podívejte se, kdo jsou nejlepší svatební fotografové a hráči mini-her. Soutěžte o první místa!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/photo-quest">
                <GlassButton variant="outline" size="lg">
                  <Camera size={20} />
                  Photo Quest
                </GlassButton>
              </Link>
              <Link href="/mini-games">
                <GlassButton variant="primary" size="lg">
                  <GamepadIcon size={20} />
                  Mini-hry
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Leaderboards Tabs */}
        <Tabs defaultValue="photo-overall" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="photo-overall" className="flex items-center gap-2">
              <Trophy size={16} />
              <span className="hidden sm:inline">Celkový Photo Quest</span>
              <span className="sm:hidden">Photo Quest</span>
            </TabsTrigger>
            <TabsTrigger value="photo-challenges" className="flex items-center gap-2">
              <Target size={16} />
              <span className="hidden sm:inline">Jednotlivé výzvy</span>
              <span className="sm:hidden">Výzvy</span>
            </TabsTrigger>
            <TabsTrigger value="mini-games-overall" className="flex items-center gap-2">
              <GamepadIcon size={16} />
              <span className="hidden sm:inline">Celkové Mini-hry</span>
              <span className="sm:hidden">Mini-hry</span>
            </TabsTrigger>
            <TabsTrigger value="mini-games-individual" className="flex items-center gap-2">
              <Star size={16} />
              <span className="hidden sm:inline">Jednotlivé hry</span>
              <span className="sm:hidden">Hry</span>
            </TabsTrigger>
          </TabsList>

          {/* Overall Photo Quest Leaderboard */}
          <TabsContent value="photo-overall">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-gold" size={24} />
                  Celkový žebříček Photo Quest
                </CardTitle>
                <p className="text-charcoal/60">Nejlepší svatební fotografové podle získaných bodů</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoLeaderboard.slice(0, 20).map((entry, index) => (
                    <div
                      key={entry.participantName}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${getPositionStyling(index + 1)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-2">
                          {getMedalComponent(index + 1)}
                          <span className="font-bold text-charcoal text-lg">
                            #{index + 1}
                          </span>
                        </div>
                        <span className="font-medium text-charcoal">
                          {getDisplayName(entry.participantName)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-charcoal/70">
                        <div className="text-center">
                          <div className="font-bold text-romantic">{entry.completedQuests}</div>
                          <div className="text-xs">výzev</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gold text-lg">{entry.totalPoints}</div>
                          <div className="text-xs">bodů</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {photoLeaderboard.length === 0 && (
                    <div className="text-center py-8">
                      <Camera size={48} className="text-charcoal/30 mx-auto mb-4" />
                      <p className="text-charcoal/60">Zatím nejsou k dispozici žádné výsledky.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Photo Challenges Leaderboard */}
          <TabsContent value="photo-challenges">
            <div className="space-y-6">
              {challenges.filter(c => c.isActive).map(challenge => {
                const leaderboard = getChallengeLeaderboard(challenge.id);
                
                return (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="text-romantic" size={20} />
                          {challenge.title}
                        </div>
                        <div className="bg-gradient-to-r from-gold to-yellow-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {challenge.points} bodů
                        </div>
                      </CardTitle>
                      <p className="text-charcoal/60 text-sm">{challenge.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {leaderboard.slice(0, 10).map((entry, index) => (
                          <div
                            key={entry.participantName}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${getPositionStyling(index + 1)}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center gap-2">
                                {getMedalComponent(index + 1)}
                                <span className="font-medium text-charcoal">
                                  #{index + 1}
                                </span>
                              </div>
                              <span className="text-charcoal">
                                {getDisplayName(entry.participantName)}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-romantic">{entry.photosUploaded}</div>
                                <div className="text-xs text-charcoal/60">fotek</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-gold">{entry.points}</div>
                                <div className="text-xs text-charcoal/60">bodů</div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {leaderboard.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-charcoal/60 text-sm">Zatím nikdo nesplnil tuto výzvu.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Overall Mini-Games Leaderboard */}
          <TabsContent value="mini-games-overall">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GamepadIcon className="text-purple-600" size={24} />
                  Celkový žebříček Mini-her
                </CardTitle>
                <p className="text-charcoal/60">Nejlepší hráči napříč všemi mini-hrami</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <GamepadIcon size={48} className="text-charcoal/30 mx-auto mb-4" />
                  <p className="text-charcoal/60">Agregovaný žebříček mini-her bude dostupný brzy.</p>
                  <p className="text-charcoal/50 text-sm mt-2">
                    Zatím si můžete prohlédnout žebříčky jednotlivých her.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Mini-Games Leaderboard */}
          <TabsContent value="mini-games-individual">
            <div className="space-y-6">
              {/* Game Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Vyberte mini-hru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {miniGames.map(game => (
                      <GlassButton
                        key={game.id}
                        variant={selectedGame === game.id ? "primary" : "outline"}
                        className="w-full justify-start p-4 h-auto"
                        onClick={() => setSelectedGame(game.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{game.title}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {game.points} bodů • {game.timeLimit ? `${game.timeLimit}s` : 'Bez limitu'}
                          </div>
                        </div>
                      </GlassButton>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Game Leaderboard */}
              {selectedGame && selectedGame !== "all" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="text-blue-600" size={20} />
                      {miniGames.find(g => g.id === selectedGame)?.title || "Vybraná hra"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scoresLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-romantic"></div>
                        <p className="mt-2 text-charcoal/70">Načítání výsledků...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {miniGameScores.slice(0, 15).map((score, index) => (
                          <div
                            key={score.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${getPositionStyling(index + 1)}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center gap-2">
                                {getMedalComponent(index + 1)}
                                <span className="font-medium text-charcoal">
                                  #{index + 1}
                                </span>
                              </div>
                              <span className="text-charcoal">
                                {getDisplayName(score.playerEmail)}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{score.score}</div>
                                <div className="text-xs text-charcoal/60">skóre</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-600">
                                  {Math.round((score.score / score.maxScore) * 100)}%
                                </div>
                                <div className="text-xs text-charcoal/60">úspěšnost</div>
                              </div>
                              {score.timeSpent && (
                                <div className="text-center">
                                  <div className="font-bold text-orange-600">{score.timeSpent}s</div>
                                  <div className="text-xs text-charcoal/60">čas</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {miniGameScores.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-charcoal/60">Zatím nikdo nehrál tuto hru.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-romantic/10 to-love/10 rounded-3xl p-8 text-center border border-white/30">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
            Chcete být v žebříčku?
          </h3>
          <p className="text-charcoal/70 mb-6 max-w-2xl mx-auto">
            Zapojte se do Photo Quest a mini-her, sbírejte body a bojujte o první místo!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/photo-quest">
              <GlassButton variant="primary" size="lg">
                <Camera size={20} />
                Začít fotografovat
              </GlassButton>
            </Link>
            <Link href="/mini-games">
              <GlassButton variant="outline" size="lg">
                <GamepadIcon size={20} />
                Hrát mini-hry
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
