import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Zap, RotateCcw } from "lucide-react";

interface ReactionSpeedGameProps {
  gameData: {
    targetSymbol: string;
    distractors: string[];
    targetCount: number;
  };
  timeLimit: number | null;
  onFinish: (result: { score: number; maxScore: number; timeSpent: number; gameData?: any }) => void;
}

interface GameSymbol {
  id: string;
  symbol: string;
  isTarget: boolean;
  x: number;
  y: number;
  delay: number;
}

export function ReactionSpeedGame({ gameData, timeLimit, onFinish }: ReactionSpeedGameProps) {
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [currentSymbol, setCurrentSymbol] = useState<GameSymbol | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [symbolHistory, setSymbolHistory] = useState<{ symbol: string; isTarget: boolean; clicked: boolean; timestamp: number }[]>([]);

  const { targetSymbol, distractors, targetCount } = gameData;
  const maxScore = targetCount || 15;

  const generateRandomSymbol = useCallback((): GameSymbol => {
    const isTarget = Math.random() < 0.4; // 40% chance of target
    const symbol = isTarget ? targetSymbol : distractors[Math.floor(Math.random() * distractors.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      isTarget,
      x: Math.random() * 80 + 10, // 10-90% of width
      y: Math.random() * 60 + 20, // 20-80% of height
      delay: Math.random() * 1000 + 500 // 0.5-1.5s delay
    };
  }, [targetSymbol, distractors]);

  const spawnSymbol = useCallback(() => {
    if (gameFinished) return;
    
    const symbol = generateRandomSymbol();
    setCurrentSymbol(symbol);
    
    // Auto-remove symbol after 2 seconds if not clicked
    setTimeout(() => {
      setCurrentSymbol(prev => {
        if (prev && prev.id === symbol.id) {
          if (symbol.isTarget) {
            setMissed(m => m + 1);
            setSymbolHistory(h => [...h, { 
              symbol: symbol.symbol, 
              isTarget: symbol.isTarget, 
              clicked: false, 
              timestamp: Date.now() 
            }]);
          }
          return null;
        }
        return prev;
      });
    }, 2000);

    // Schedule next symbol
    setTimeout(() => {
      if (!gameFinished) {
        spawnSymbol();
      }
    }, symbol.delay + 1000);
  }, [generateRandomSymbol, gameFinished]);

  // Timer
  useEffect(() => {
    if (timeLimit && timeLeft > 0 && gameStarted && !gameFinished) {
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
  }, [timeLeft, timeLimit, gameStarted, gameFinished]);

  // Check win condition
  useEffect(() => {
    if (score >= maxScore) {
      finishGame();
    }
  }, [score, maxScore]);

  const startGame = () => {
    setGameStarted(true);
    spawnSymbol();
  };

  const finishGame = () => {
    setGameFinished(true);
    setCurrentSymbol(null);
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = symbolHistory.length > 0 ? (score / (score + missed)) * 100 : 0;
    
    onFinish({
      score,
      maxScore,
      timeSpent,
      gameData: { missed, accuracy, symbolHistory }
    });
  };

  const handleSymbolClick = (symbol: GameSymbol) => {
    if (!symbol) return;
    
    setSymbolHistory(h => [...h, { 
      symbol: symbol.symbol, 
      isTarget: symbol.isTarget, 
      clicked: true, 
      timestamp: Date.now() 
    }]);

    if (symbol.isTarget) {
      setScore(s => s + 1);
    } else {
      setMissed(m => m + 1);
    }

    setCurrentSymbol(null);
  };

  const restartGame = () => {
    setScore(0);
    setMissed(0);
    setCurrentSymbol(null);
    setTimeLeft(timeLimit || 30);
    setGameStarted(false);
    setGameFinished(false);
    setSymbolHistory([]);
  };

  const accuracy = (score + missed) > 0 ? (score / (score + missed)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Game Stats */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-charcoal/70">
              Skóre: {score} / {maxScore}
            </div>
            
            <div className="text-sm text-charcoal/70">
              Přesnost: {accuracy.toFixed(1)}%
            </div>
            
            {timeLimit && (
              <div className="flex items-center gap-2 text-charcoal/70">
                <Clock size={16} />
                <span className={timeLeft <= 10 ? "text-red-600 font-bold" : ""}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
          
          <Progress 
            value={(score / maxScore) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Game Instructions */}
      {!gameStarted && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl text-charcoal">
              Rychlé reakce
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <div className="space-y-4">
              <p className="text-charcoal/70">
                Klikejte co nejrychleji na: <span className="text-2xl">{targetSymbol}</span>
              </p>
              <p className="text-charcoal/70 text-sm">
                Ignorujte tyto symboly: {distractors.map(d => d).join(' ')}
              </p>
              <p className="text-charcoal/70 text-sm">
                Cíl: Klikněte na {maxScore} správných symbolů co nejrychleji!
              </p>
            </div>

            <Button
              onClick={startGame}
              size="lg"
              className="bg-romantic hover:bg-romantic/90 text-white px-8"
              data-testid="button-start-reaction"
            >
              <Zap size={20} />
              Začít hru
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Game Area */}
      {gameStarted && !gameFinished && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-0">
            <div 
              className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg"
              style={{ height: '400px', minHeight: '400px' }}
            >
              <div className="absolute inset-4 flex items-center justify-center text-charcoal/30 text-lg font-medium">
                Čekejte na symboly...
              </div>
              
              {currentSymbol && (
                <button
                  onClick={() => handleSymbolClick(currentSymbol)}
                  className="absolute text-4xl hover:scale-110 transition-transform duration-100 animate-pulse"
                  style={{
                    left: `${currentSymbol.x}%`,
                    top: `${currentSymbol.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  data-testid={`reaction-symbol-${currentSymbol.isTarget ? 'target' : 'distractor'}`}
                >
                  {currentSymbol.symbol}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Controls */}
      {gameStarted && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-green-600">
                <Target size={20} />
                <span>Správně: {score}</span>
              </div>
              
              <div className="flex items-center gap-2 text-red-600">
                <Zap size={20} />
                <span>Chybně: {missed}</span>
              </div>

              <Button
                onClick={restartGame}
                variant="outline"
                size="sm"
                data-testid="button-restart-reaction"
              >
                <RotateCcw size={16} />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Target Reminder */}
      {gameStarted && !gameFinished && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <span className="text-charcoal/70 text-sm">Klikejte na: </span>
              <span className="text-3xl ml-2">{targetSymbol}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}