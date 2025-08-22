import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GlassButton from "@/components/ui/glass-button";
import Navigation from "@/components/navigation";
import { OnboardingHighlight } from "@/components/onboarding/onboarding-highlight";
import { 
  Trophy, 
  Clock, 
  Star, 
  GamepadIcon, 
  Brain, 
  Heart, 
  Zap,
  Users
} from "lucide-react";

interface MiniGame {
  id: string;
  title: string;
  description: string;
  gameType: string;
  points: number;
  timeLimit: number | null;
  isActive: boolean;
}

interface MiniGameScore {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  maxScore: number;
  timeSpent: number | null;
}

const gameIcons = {
  trivia: Brain,
  memory: Heart,
  word_match: Star,
  couple_facts: Users,
  reaction_speed: Zap,
};

const gameColors = {
  trivia: "from-blue-500 to-purple-600",
  memory: "from-pink-500 to-red-600",
  word_match: "from-green-500 to-teal-600",
  couple_facts: "from-orange-500 to-yellow-600",
  reaction_speed: "from-indigo-500 to-blue-600",
};

export default function MiniGames() {
  const [, setLocation] = useLocation();

  const { data: games, isLoading, error } = useQuery<MiniGame[]>({
    queryKey: ["/api/mini-games"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Ensure games is always an array, never null
  const gamesArray = Array.isArray(games) ? games : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-romantic"></div>
            <p className="mt-4 text-charcoal/70">Načítání mini-her...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-charcoal/70">Chyba při načítání mini-her. Zkuste se přihlásit.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-cream to-sage">
      <Navigation />
      <div className="max-w-6xl mx-auto space-y-12 p-4 md:p-8 pt-20 md:pt-24">
        
        {/* Hero Section */}
        <OnboardingHighlight step="mini-games" className="relative">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-romantic to-love rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <GamepadIcon className="text-white drop-shadow-lg" size={32} />
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4">
              Mini-hry pro hosty
            </h1>

            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed mb-8">
              Bavte se mezi fotografováním! Zahrajte si naše svatební mini-hry, soutěžte s ostatními hosty a sbírejte body.
            </p>

            <GlassButton 
              variant="primary" 
              size="lg"
              onClick={() => setLocation('/gallery')}
              data-testid="button-view-gallery"
            >
              <Trophy size={20} />
              Zobrazit galerii fotek
            </GlassButton>
          </div>
        </OnboardingHighlight>

        {/* How to Play */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/30">
          <h2 className="font-display text-3xl font-bold text-center text-charcoal mb-8">
            Jak hrát mini-hry?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <GamepadIcon className="text-white" size={24} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal">1. Vyberte hru</h3>
              <p className="text-charcoal/70">Vyberte si ze seznamu dostupných mini-her níže. Každá má jiný typ zábavy a body.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="text-white" size={24} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal">2. Hrajte v limitu</h3>
              <p className="text-charcoal/70">Většina her má časový limit. Snažte se odpovědět správně a rychle pro vyšší skóre.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="text-white" size={24} />
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal">3. Sbírejte body</h3>
              <p className="text-charcoal/70">Za každou hru získáte body podle úspěšnosti. Soutěžte s ostatními hosty!</p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="space-y-8">
          <h2 className="font-display text-3xl font-bold text-center text-charcoal">
            Dostupné mini-hry
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesArray.map((game) => {
              const IconComponent = gameIcons[game.gameType as keyof typeof gameIcons] || GamepadIcon;
              const gradientColor = gameColors[game.gameType as keyof typeof gameColors] || "from-gray-500 to-gray-600";

              return (
                <Card key={game.id} className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradientColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <IconComponent className="text-white" size={24} />
                    </div>
                    <CardTitle className="font-display text-xl text-charcoal">
                      {game.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-charcoal/70 text-sm leading-relaxed">
                      {game.description}
                    </p>

                    <div className="flex justify-between items-center text-sm text-charcoal/60">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500" />
                        <span>{game.points} bodů</span>
                      </div>
                      
                      {game.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} className="text-blue-500" />
                          <span>{game.timeLimit}s</span>
                        </div>
                      )}
                    </div>

                    <GlassButton
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => setLocation(`/mini-games/${game.id}`)}
                      data-testid={`button-play-${game.gameType}`}
                    >
                      <GamepadIcon size={16} />
                      Hrát
                    </GlassButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {gamesArray.length === 0 && (
            <div className="text-center py-12">
              <GamepadIcon size={48} className="text-charcoal/30 mx-auto mb-4" />
              <p className="text-charcoal/60 text-lg">Zatím nejsou dostupné žádné mini-hry.</p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-romantic/10 to-love/10 rounded-3xl p-8 text-center border border-white/30">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
            Připraveni na zábavu?
          </h3>
          <p className="text-charcoal/70 mb-6 max-w-2xl mx-auto">
            Vyberte si svou oblíbenou mini-hru a zahajte soutěž s ostatními svatebními hosty!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/photo-quest">
              <GlassButton variant="outline" size="lg">
                Zpět na Photo Quest
              </GlassButton>
            </Link>
            <Link href="/gallery">
              <GlassButton variant="primary" size="lg">
                Zobrazit galerii
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}