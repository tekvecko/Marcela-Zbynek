import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, RotateCcw } from "lucide-react";

interface WordPair {
  word: string;
  meaning: string;
}

interface WordMatchGameProps {
  gameData: {
    pairs: WordPair[];
  };
  timeLimit: number | null;
  onFinish: (result: { score: number; maxScore: number; timeSpent: number; gameData?: any }) => void;
}

export function WordMatchGame({ gameData, timeLimit, onFinish }: WordMatchGameProps) {
  const [words, setWords] = useState<string[]>([]);
  const [meanings, setMeanings] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matches, setMatches] = useState<WordPair[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 60);
  const [startTime] = useState(Date.now());
  const [gameStarted, setGameStarted] = useState(false);

  const pairs = gameData.pairs || [];
  const totalPairs = pairs.length;

  // Initialize game
  useEffect(() => {
    if (pairs.length === 0) return;
    
    const shuffledWords = [...pairs.map(p => p.word)].sort(() => Math.random() - 0.5);
    const shuffledMeanings = [...pairs.map(p => p.meaning)].sort(() => Math.random() - 0.5);
    
    setWords(shuffledWords);
    setMeanings(shuffledMeanings);
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

  // Check for match when both word and meaning are selected
  useEffect(() => {
    if (selectedWord && selectedMeaning) {
      if (!gameStarted) setGameStarted(true);
      
      setAttempts(prev => prev + 1);
      
      const pair = pairs.find(p => p.word === selectedWord && p.meaning === selectedMeaning);
      
      if (pair) {
        // Correct match
        setMatches(prev => [...prev, pair]);
        setWords(prev => prev.filter(w => w !== selectedWord));
        setMeanings(prev => prev.filter(m => m !== selectedMeaning));
      }
      
      // Reset selections after a brief delay
      setTimeout(() => {
        setSelectedWord(null);
        setSelectedMeaning(null);
      }, 1000);
    }
  }, [selectedWord, selectedMeaning, pairs, gameStarted]);

  // Check win condition
  useEffect(() => {
    if (matches.length === totalPairs && totalPairs > 0) {
      setTimeout(() => finishGame(), 500);
    }
  }, [matches.length, totalPairs]);

  const finishGame = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    onFinish({
      score: matches.length,
      maxScore: totalPairs,
      timeSpent,
      gameData: { attempts, accuracy: attempts > 0 ? (matches.length / attempts) * 100 : 0 }
    });
  };

  const restartGame = () => {
    setMatches([]);
    setAttempts(0);
    setSelectedWord(null);
    setSelectedMeaning(null);
    setTimeLeft(timeLimit || 60);
    setGameStarted(false);
    
    const shuffledWords = [...pairs.map(p => p.word)].sort(() => Math.random() - 0.5);
    const shuffledMeanings = [...pairs.map(p => p.meaning)].sort(() => Math.random() - 0.5);
    
    setWords(shuffledWords);
    setMeanings(shuffledMeanings);
  };

  const getWordStyle = (word: string) => {
    if (matches.some(m => m.word === word)) {
      return "bg-green-100 border-green-300 text-green-800";
    }
    if (selectedWord === word) {
      return "bg-blue-100 border-blue-400 text-blue-800";
    }
    return "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300";
  };

  const getMeaningStyle = (meaning: string) => {
    if (matches.some(m => m.meaning === meaning)) {
      return "bg-green-100 border-green-300 text-green-800";
    }
    if (selectedMeaning === meaning) {
      return "bg-blue-100 border-blue-400 text-blue-800";
    }
    return "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300";
  };

  if (pairs.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-charcoal/70">Nejsou dostupné žádné páry slov pro tuto hru.</p>
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
              Páry: {matches.length} / {totalPairs}
            </div>
            
            <div className="text-sm text-charcoal/70">
              Pokusy: {attempts}
            </div>
            
            {timeLimit && (
              <div className="flex items-center gap-2 text-charcoal/70">
                <Clock size={16} />
                <span className={timeLeft <= 15 ? "text-red-600 font-bold" : ""}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
          
          <Progress 
            value={(matches.length / totalPairs) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Game Board */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl text-charcoal">
            Spojte slova s jejich významy
          </CardTitle>
          <p className="text-charcoal/70 text-sm">
            Klikněte na slovo a pak na jeho správný význam
          </p>
          <Button
            onClick={restartGame}
            variant="outline"
            size="sm"
            className="mx-auto"
            data-testid="button-restart-word-match"
          >
            <RotateCcw size={16} />
            Nová hra
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Words Column */}
            <div className="space-y-3">
              <h3 className="font-semibold text-charcoal text-center mb-4">Slova</h3>
              {words.map((word) => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(word)}
                  disabled={matches.some(m => m.word === word)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${getWordStyle(word)}`}
                  data-testid={`word-${word}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{word}</span>
                    {matches.some(m => m.word === word) && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Meanings Column */}
            <div className="space-y-3">
              <h3 className="font-semibold text-charcoal text-center mb-4">Významy</h3>
              {meanings.map((meaning) => (
                <button
                  key={meaning}
                  onClick={() => setSelectedMeaning(meaning)}
                  disabled={matches.some(m => m.meaning === meaning)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${getMeaningStyle(meaning)}`}
                  data-testid={`meaning-${meaning}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{meaning}</span>
                    {matches.some(m => m.meaning === meaning) && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection Display */}
          {(selectedWord || selectedMeaning) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center text-sm text-blue-800">
                {selectedWord && !selectedMeaning && (
                  <span>Vybráno slovo: <strong>{selectedWord}</strong> - nyní vyberte význam</span>
                )}
                {!selectedWord && selectedMeaning && (
                  <span>Vybrán význam: <strong>{selectedMeaning}</strong> - nyní vyberte slovo</span>
                )}
                {selectedWord && selectedMeaning && (
                  <span>Kontroluji páru: <strong>{selectedWord}</strong> ↔ <strong>{selectedMeaning}</strong></span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched Pairs Display */}
      {matches.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-lg text-charcoal">
              Správně spárováno ({matches.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-2">
              {matches.map((match, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <span className="font-medium text-green-800">{match.word}</span>
                  <span className="text-green-600">↔</span>
                  <span className="text-green-700 text-sm">{match.meaning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}