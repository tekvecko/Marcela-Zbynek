import { CheckCircle, XCircle, Star, Camera, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import GlassButton from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

interface PhotoAnalysisResultProps {
  isValid: boolean;
  confidence: number;
  explanation: string;
  suggestedImprovements?: string;
  questTitle?: string;
  onViewInGallery?: () => void;
  onTryAgain?: () => void;
  className?: string;
}

export default function PhotoAnalysisResult({
  isValid,
  confidence,
  explanation,
  suggestedImprovements,
  questTitle,
  onViewInGallery,
  onTryAgain,
  className
}: PhotoAnalysisResultProps) {
  // Ensure confidence is a valid number
  const safeConfidence = typeof confidence === 'number' && !isNaN(confidence) ? confidence : 0.5;
  const confidencePercentage = Math.round(safeConfidence * 100);

  return (
    <Card className={cn("bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg", className)}>
      <CardContent className="p-6">
        {/* Header with result */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isValid
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          )}>
            {isValid ? <CheckCircle size={24} /> : <XCircle size={24} />}
          </div>

          <div className="flex-1">
            <h3 className={cn(
              "font-display text-xl font-bold",
              isValid ? "text-green-700" : "text-red-700"
            )}>
              {isValid ? "✓ Úkol splněn!" : "✗ Úkol nesplněn"}
            </h3>
            {questTitle && (
              <p className="text-charcoal/60 text-sm">{questTitle}</p>
            )}
          </div>

          {/* Confidence Score */}
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              confidencePercentage >= 80 ? "text-green-600" :
              confidencePercentage >= 60 ? "text-orange-500" : "text-red-500"
            )}>
              {confidencePercentage}%
            </div>
            <div className="text-xs text-charcoal/50">Spolehlivost</div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-blue-500" size={16} />
              <span className="font-medium text-blue-700">AI Hodnocení</span>
            </div>
            <p className="text-charcoal/80 leading-relaxed">{explanation}</p>
          </div>

          {/* Suggestions for improvement */}
          {suggestedImprovements && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="text-orange-500" size={16} />
                <span className="font-medium text-orange-700">Tipy pro zlepšení</span>
              </div>
              <p className="text-charcoal/80 leading-relaxed">{suggestedImprovements}</p>
            </div>
          )}

          {/* Success reward */}
          {isValid && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-green-500" size={16} />
                <span className="font-medium text-green-700">Odměna získána!</span>
              </div>
              <p className="text-charcoal/80">
                Získali jste body za splnění tohoto úkolu. Vaše fotka byla přidána do galerie.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {isValid && onViewInGallery && (
            <GlassButton
              variant="primary"
              size="md"
              onClick={onViewInGallery}
              className="flex-1"
            >
              <Camera size={16} />
              Zobrazit v galerii
            </GlassButton>
          )}

          {!isValid && onTryAgain && (
            <GlassButton
              variant="outline"
              size="md"
              onClick={onTryAgain}
              className="flex-1"
            >
              <Camera size={16} />
              Zkusit znovu
            </GlassButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}