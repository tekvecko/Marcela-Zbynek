import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";

interface Statement {
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

interface CoupleFactsGameProps {
  gameData: {
    statements: Statement[];
  };
  timeLimit: number | null;
  onFinish: (result: { score: number; maxScore: number; timeSpent: number; gameData?: any }) => void;
}

export function CoupleFactsGame({ gameData, timeLimit, onFinish }: CoupleFactsGameProps) {
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 75);
  const [startTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<(boolean | null)[]>([]);

  const statements = gameData.statements || [];
  const currentStatement = statements[currentStatementIndex];
  const isLastStatement = currentStatementIndex === statements.length - 1;

  useEffect(() => {
    if (timeLimit && timeLeft > 0) {
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
  }, [timeLeft, timeLimit]);

  const finishGame = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onFinish({
      score,
      maxScore: statements.length,
      timeSpent,
      gameData: { userAnswers }
    });
  };

  const handleAnswerSelect = (answer: boolean) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentStatementIndex] = answer;
    setUserAnswers(newUserAnswers);

    if (answer === currentStatement.isTrue) {
      setScore(prev => prev + 1);
    }

    setShowExplanation(true);
  };

  const handleNextStatement = () => {
    if (isLastStatement) {
      finishGame();
    } else {
      setCurrentStatementIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const getAnswerStyle = (answer: boolean) => {
    if (selectedAnswer === null) {
      return answer 
        ? "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400 text-green-700"
        : "bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-400 text-red-700";
    }

    if (answer === currentStatement.isTrue) {
      return "bg-green-100 border-green-400 text-green-800";
    }

    if (answer === selectedAnswer && answer !== currentStatement.isTrue) {
      return "bg-red-100 border-red-400 text-red-800";
    }

    return "bg-gray-100 border-gray-200 text-gray-600";
  };

  if (statements.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-charcoal/70">Nejsou dostupná žádná tvrzení pro tuto hru.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-charcoal/70">
              Tvrzení {currentStatementIndex + 1} z {statements.length}
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
            value={(currentStatementIndex / statements.length) * 100} 
            className="h-2"
          />
          
          <div className="mt-2 text-center text-sm text-charcoal/70">
            Skóre: {score} / {statements.length}
          </div>
        </CardContent>
      </Card>

      {/* Statement */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-xl text-charcoal text-center">
            Pravda nebo lež?
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-lg text-charcoal font-medium leading-relaxed">
              "{currentStatement.statement}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswerSelect(true)}
              disabled={selectedAnswer !== null}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${getAnswerStyle(true)}`}
              data-testid="answer-true"
            >
              <div className="flex flex-col items-center gap-3">
                <ThumbsUp size={32} />
                <span className="font-bold text-lg">PRAVDA</span>
                {selectedAnswer !== null && currentStatement.isTrue && (
                  <CheckCircle size={24} className="text-green-600" />
                )}
                {selectedAnswer === true && !currentStatement.isTrue && (
                  <XCircle size={24} className="text-red-600" />
                )}
              </div>
            </button>

            <button
              onClick={() => handleAnswerSelect(false)}
              disabled={selectedAnswer !== null}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${getAnswerStyle(false)}`}
              data-testid="answer-false"
            >
              <div className="flex flex-col items-center gap-3">
                <ThumbsDown size={32} />
                <span className="font-bold text-lg">LEŽ</span>
                {selectedAnswer !== null && !currentStatement.isTrue && (
                  <CheckCircle size={24} className="text-green-600" />
                )}
                {selectedAnswer === false && currentStatement.isTrue && (
                  <XCircle size={24} className="text-red-600" />
                )}
              </div>
            </button>
          </div>

          {showExplanation && currentStatement.explanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Vysvětlení:</strong> {currentStatement.explanation}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className="text-center">
              <Button
                onClick={handleNextStatement}
                size="lg"
                className="bg-romantic hover:bg-romantic/90 text-white px-8"
                data-testid={isLastStatement ? "button-finish-facts" : "button-next-statement"}
              >
                {isLastStatement ? "Dokončit hru" : "Další tvrzení"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Results */}
      {selectedAnswer !== null && (
        <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              {selectedAnswer === currentStatement.isTrue ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">Správně!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle size={20} />
                  <span className="font-medium">Nesprávně!</span>
                </div>
              )}
              
              <div className="text-charcoal/70 text-sm">
                Správná odpověď: {currentStatement.isTrue ? "PRAVDA" : "LEŽ"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}