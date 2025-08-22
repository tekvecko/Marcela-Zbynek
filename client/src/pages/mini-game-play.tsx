import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GlassButton from "@/components/ui/glass-button";
import { 
  ArrowLeft, 
  Clock, 
  Star, 
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw
} from "lucide-react";
import { TriviaGame } from "@/components/mini-games/trivia-game";
import { MemoryGame } from "@/components/mini-games/memory-game";
import { WordMatchGame } from "@/components/mini-games/word-match-game";
import { CoupleFactsGame } from "@/components/mini-games/couple-facts-game";
import { ReactionSpeedGame } from "@/components/mini-games/reaction-speed-game";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useOnboardingContext } from "@/components/onboarding/onboarding-context";

interface MiniGame {
  id: string;
  title: string;
  description: string;
  gameType: string;
  gameData: any;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
}

interface GameResult {
  score: number;
  maxScore: number;
  timeSpent: number;
  gameData?: any;
}

interface MiniGameScore {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  maxScore: number;
  timeSpent: number | null;
  createdAt: string;
}

export default function MiniGamePlay() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/mini-games/:gameId");
  const gameId = params?.gameId;
  const queryClient = useQueryClient();
  const { startOnboarding } = useOnboardingContext();

  const [gameState, setGameState] = useState<"playing" | "finished" | "loading">("loading");
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const { data: game, isLoading: gameLoading } = useQuery<MiniGame>({
    queryKey: ["/api/mini-games", gameId],
    enabled: !!gameId,
  });

  const { data: playerScore } = useQuery<MiniGameScore | null>({
    queryKey: ["/api/mini-games", gameId, "my-score"],
    enabled: !!gameId,
  });

  const { data: topScores = [] } = useQuery<MiniGameScore[]>({
    queryKey: ["/api/mini-games", gameId, "scores"],
    enabled: !!gameId,
  });

  const saveScoreMutation = useMutation({
    mutationFn: async (scoreData: GameResult) => {
      return apiRequest(`/api/mini-games/${gameId}/score`, {
        method: "POST",
        body: JSON.stringify({
          score: scoreData.score,
          maxScore: scoreData.maxScore,
          timeSpent: scoreData.timeSpent,
          gameData: scoreData.gameData
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/mini-games", gameId, "scores"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/mini-games", gameId, "my-score"]
      });
    }
  });

  const handleGameFinish = async (result: GameResult) => {
    setGameResult(result);
    setGameState("finished");

    try {
      await saveScoreMutation.mutateAsync(result);
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  const handlePlayAgain = () => {
    setGameState("playing");
    setGameResult(null);
  };

  const renderGame = () => {
    if (!game) return null;

    const gameProps = {
      gameData: game.gameData,
      timeLimit: game.timeLimit,
      onFinish: handleGameFinish
    };

    switch (game.gameType) {
      case "trivia":
        return <TriviaGame {...gameProps} />;
      case "memory":
        return <MemoryGame {...gameProps} />;
      case "word_match":
        return <WordMatchGame {...gameProps} />;
      case "couple_facts":
        return <CoupleFactsGame {...gameProps} />;
      case "reaction_speed":
        return <ReactionSpeedGame {...gameProps} />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-charcoal/70">Nepodporovaný typ hry: {game.gameType}</p>
          </div>
        );
    }
  };

  if (gameLoading || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
        <Navigation onStartTutorial={startOnboarding} />
        <div className="max-w-4xl mx-auto pt-24">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-romantic"></div>
            <p className="mt-4 text-charcoal/70">Načítání hry...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
      <Navigation onStartTutorial={startOnboarding} />
      <div className="max-w-4xl mx-auto space-y-6 pt-24">

        {/* Header */}
        <div className="flex items-center justify-between">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setLocation("/mini-games")}
            data-testid="button-back-to-games"
          >
            <ArrowLeft size={16} />
            Zpět na mini-hry
          </GlassButton>

          <div className="flex items-center gap-4 text-charcoal/70">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500" />
              <span className="font-medium">{game.points} bodů</span>
            </div>
            {game.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock size={16} className="text-blue-500" />
                <span className="font-medium">{game.timeLimit}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Title */}
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-2">
            {game.title}
          </h1>
          <p className="text-charcoal/70 text-lg">
            {game.description}
          </p>
        </div>

        {/* Game Content */}
        {gameState === "loading" && (
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-charcoal/70">Příprava hry...</p>
              <GlassButton
                variant="primary"
                size="lg"
                className="mt-4"
                onClick={() => setGameState("playing")}
                data-testid="button-start-game"
              >
                Začít hrát
              </GlassButton>
            </CardContent>
          </Card>
        )}

        {gameState === "playing" && (
          <div className="space-y-6">
            {renderGame()}
          </div>
        )}

        {gameState === "finished" && gameResult && (
          <div className="space-y-6">
            {/* Results */}
            <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-white" size={24} />
                </div>
                <CardTitle className="font-display text-2xl text-charcoal">
                  Hra dokončena!
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-charcoal">
                    {gameResult.score} / {gameResult.maxScore}
                  </div>
                  <div className="text-charcoal/70">
                    Čas: {gameResult.timeSpent}s
                  </div>

                  <div className="flex justify-center">
                    {gameResult.score === gameResult.maxScore ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={20} />
                        <span className="font-medium">Perfektní výsledek!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Star size={20} />
                        <span className="font-medium">Skvělá práce!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <GlassButton
                    variant="outline"
                    size="lg"
                    onClick={handlePlayAgain}
                    data-testid="button-play-again"
                  >
                    <RotateCcw size={16} />
                    Hrát znovu
                  </GlassButton>

                  <GlassButton
                    variant="primary"
                    size="lg"
                    onClick={() => setLocation("/mini-games")}
                    data-testid="button-other-games"
                  >
                    Jiné hry
                  </GlassButton>
                </div>
              </CardContent>
            </Card>

            {/* Top Scores */}
            <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="font-display text-xl text-charcoal flex items-center gap-2">
                  <Trophy size={20} />
                  Nejlepší výsledky
                </CardTitle>
              </CardHeader>

              <CardContent>
                {topScores.length > 0 ? (
                  <div className="space-y-2">
                    {topScores.slice(0, 5).map((score, index) => (
                      <div key={score.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-200 text-charcoal'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-charcoal">
                            {score.playerName}
                          </span>
                        </div>

                        <div className="text-charcoal/70 text-sm">
                          {score.score}/{score.maxScore}
                          {score.timeSpent && ` (${score.timeSpent}s)`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-charcoal/70 text-center py-4">
                    Zatím žádné výsledky
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}