import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  explanation?: string;
}

interface TriviaGameProps {
  gameData: {
    questions: Question[];
  };
  timeLimit: number | null;
  onFinish: (result: { score: number; maxScore: number; timeSpent: number; gameData?: any }) => void;
}

export function TriviaGame({ gameData, timeLimit, onFinish }: TriviaGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit || 120);
  const [startTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  const questions = gameData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

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
      maxScore: questions.length,
      timeSpent,
      gameData: { userAnswers }
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newUserAnswers);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      finishGame();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const getAnswerStyle = (answerIndex: number) => {
    if (selectedAnswer === null) {
      return "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300";
    }

    if (answerIndex === currentQuestion.correctAnswer) {
      return "bg-green-100 border-green-300 text-green-800";
    }

    if (answerIndex === selectedAnswer && answerIndex !== currentQuestion.correctAnswer) {
      return "bg-red-100 border-red-300 text-red-800";
    }

    return "bg-gray-100 border-gray-200 text-gray-600";
  };

  if (questions.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-charcoal/70">Nejsou dostupné žádné otázky pro tento kvíz.</p>
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
              Otázka {currentQuestionIndex + 1} z {questions.length}
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
            value={(currentQuestionIndex / questions.length) * 100} 
            className="h-2"
          />
          
          <div className="mt-2 text-center text-sm text-charcoal/70">
            Skóre: {score} / {questions.length}
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-xl text-charcoal text-center">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {currentQuestion.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${getAnswerStyle(index)}`}
                data-testid={`answer-${index}`}
              >
                <div className="flex items-center justify-between">
                  <span>{answer}</span>
                  {selectedAnswer !== null && (
                    <div>
                      {index === currentQuestion.correctAnswer && (
                        <CheckCircle size={20} className="text-green-600" />
                      )}
                      {index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                        <XCircle size={20} className="text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {showExplanation && currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Vysvětlení:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleNextQuestion}
                size="lg"
                className="bg-romantic hover:bg-romantic/90 text-white px-8"
                data-testid={isLastQuestion ? "button-finish-trivia" : "button-next-question"}
              >
                {isLastQuestion ? "Dokončit kvíz" : "Další otázka"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}