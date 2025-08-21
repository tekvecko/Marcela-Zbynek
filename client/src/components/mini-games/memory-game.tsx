import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, RotateCcw } from "lucide-react";

interface MemoryPair {
  id: number;
  symbol: string;
  name: string;
}

interface MemoryCard extends MemoryPair {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  gameData: {
    pairs: MemoryPair[];
  };
  timeLimit: number | null;
  onFinish: (result: { score: number; maxScore: number; timeSpent: number; gameData?: any }) => void;
}

export function MemoryGame({ gameData, timeLimit, onFinish }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 90);
  const [startTime] = useState(Date.now());
  const [gameStarted, setGameStarted] = useState(false);

  const pairs = gameData.pairs || [];
  const totalPairs = pairs.length;

  // Initialize game
  useEffect(() => {
    if (pairs.length === 0) return;
    
    // Create pairs of cards
    const gameCards: MemoryCard[] = [];
    pairs.forEach(pair => {
      gameCards.push({
        ...pair,
        uniqueId: `${pair.id}-1`,
        isFlipped: false,
        isMatched: false
      });
      gameCards.push({
        ...pair,
        uniqueId: `${pair.id}-2`,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [pairs]);

  // Timer
  useEffect(() => {
    if (timeLimit && timeLeft > 0 && gameStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, timeLimit, gameStarted]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find(card => card.uniqueId === firstId);
      const secondCard = cards.find(card => card.uniqueId === secondId);

      if (firstCard && secondCard && firstCard.id === secondCard.id) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstCard.id ? { ...card, isMatched: true } : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            flippedCards.includes(card.uniqueId) ? { ...card, isFlipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  // Check win condition
  useEffect(() => {
    if (matchedPairs === totalPairs && totalPairs > 0) {
      setTimeout(() => finishGame(), 500);
    }
  }, [matchedPairs, totalPairs]);

  const finishGame = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(0, totalPairs * 2 - moves + (timeLeft > 0 ? Math.floor(timeLeft / 10) : 0));
    
    onFinish({
      score: matchedPairs,
      maxScore: totalPairs,
      timeSpent,
      gameData: { moves, matchedPairs }
    });
  };

  const handleCardClick = (cardId: string) => {
    if (!gameStarted) setGameStarted(true);
    
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.uniqueId === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.uniqueId === cardId ? { ...c, isFlipped: true } : c
    ));
    
    setFlippedCards(prev => {
      const newFlipped = [...prev, cardId];
      if (newFlipped.length === 2) {
        setMoves(m => m + 1);
      }
      return newFlipped;
    });
  };

  const restartGame = () => {
    setMatchedPairs(0);
    setMoves(0);
    setFlippedCards([]);
    setTimeLeft(timeLimit || 90);
    setGameStarted(false);
    
    // Reset and shuffle cards
    const gameCards: MemoryCard[] = [];
    pairs.forEach(pair => {
      gameCards.push({
        ...pair,
        uniqueId: `${pair.id}-1`,
        isFlipped: false,
        isMatched: false
      });
      gameCards.push({
        ...pair,
        uniqueId: `${pair.id}-2`,
        isFlipped: false,
        isMatched: false
      });
    });
    
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  };

  if (pairs.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-charcoal/70">Nejsou dostupné žádné páry pro tuto hru.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Stats */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-charcoal/70">
              Páry: {matchedPairs} / {totalPairs}
            </div>
            
            <div className="text-sm text-charcoal/70">
              Tahy: {moves}
            </div>
            
            {timeLimit && (
              <div className="flex items-center gap-2 text-charcoal/70">
                <Clock size={16} />
                <span className={timeLeft <= 30 ? "text-red-600 font-bold" : ""}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          
          <Progress 
            value={(matchedPairs / totalPairs) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Game Board */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl text-charcoal">
            Najděte shodné páry
          </CardTitle>
          <Button
            onClick={restartGame}
            variant="outline"
            size="sm"
            className="mx-auto"
            data-testid="button-restart-memory"
          >
            <RotateCcw size={16} />
            Nová hra
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className={`grid gap-3 ${
            cards.length <= 8 ? 'grid-cols-4' : 
            cards.length <= 12 ? 'grid-cols-4 sm:grid-cols-6' :
            'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'
          }`}>
            {cards.map((card) => (
              <button
                key={card.uniqueId}
                onClick={() => handleCardClick(card.uniqueId)}
                disabled={card.isMatched || flippedCards.length >= 2}
                className={`
                  aspect-square rounded-lg border-2 transition-all duration-300 transform hover:scale-105
                  ${card.isFlipped || card.isMatched 
                    ? 'bg-white border-blue-300 shadow-lg' 
                    : 'bg-gradient-to-br from-romantic to-love border-romantic/30 hover:border-romantic/60'
                  }
                  ${card.isMatched ? 'opacity-75' : ''}
                `}
                data-testid={`memory-card-${card.uniqueId}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  {card.isFlipped || card.isMatched ? (
                    <>
                      <div className="text-2xl mb-1">{card.symbol}</div>
                      <div className="text-xs text-charcoal/70 text-center px-1">
                        {card.name}
                      </div>
                    </>
                  ) : (
                    <div className="text-white/80 text-xl">❓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}