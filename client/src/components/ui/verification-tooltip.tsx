import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface VerificationTooltipProps {
  isVerified: boolean;
  verificationScore: number;
  aiAnalysis?: string;
  suggestedImprovements?: string;
  challengeTitle?: string;
  showDetailed?: boolean;
  size?: "sm" | "md" | "lg";
  technicalQuality?: any;
  detectedObjects?: string[];
  weddingElements?: string[];
  atmosphere?: string;
  emotions?: string[];
  category?: string;
  tags?: string[];
}

export default function VerificationTooltip({
  isVerified,
  verificationScore,
  aiAnalysis,
  suggestedImprovements,
  challengeTitle,
  showDetailed = true,
  size = "md",
  technicalQuality,
  detectedObjects,
  weddingElements,
  atmosphere,
  emotions,
  category,
  tags
}: VerificationTooltipProps) {
  const [showDialog, setShowDialog] = useState(false);

  const getStatusColor = () => {
    if (isVerified) return "text-green-600";
    if (verificationScore > 0.7) return "text-yellow-600";
    if (verificationScore > 0.3) return "text-orange-600";
    return "text-red-600";
  };

  const getStatusIcon = () => {
    const iconSize = size === "sm" ? 14 : size === "md" ? 16 : 20;
    const className = `${getStatusColor()}`;

    if (isVerified) return <CheckCircle size={iconSize} className={className} />;
    if (verificationScore > 0.7) return <AlertCircle size={iconSize} className={className} />;
    return <XCircle size={iconSize} className={className} />;
  };

  const getStatusText = () => {
    if (isVerified) return "Ověřeno AI";
    if (verificationScore > 0.7) return "Možná relevantní";
    if (verificationScore > 0.3) return "Částečně relevantní";
    return "Neodpovídá zadání";
  };

  const getConfidenceColor = () => {
    if (verificationScore >= 0.8) return "bg-green-500";
    if (verificationScore >= 0.6) return "bg-yellow-500";
    if (verificationScore >= 0.3) return "bg-orange-500";
    return "bg-red-500";
  };

  const confidencePercentage = Math.round(verificationScore * 100);

  const BasicTooltip = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {getStatusIcon()}
            {size !== "sm" && (
              <span className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" />
              <span className="font-medium">AI Analýza</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Shoda s výzvou:</span>
                <span className="font-medium">{confidencePercentage}%</span>
              </div>
              <Progress value={confidencePercentage} className="h-1" />
            </div>

            {aiAnalysis && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {aiAnalysis.length > 120 ? `${aiAnalysis.substring(0, 120)}...` : aiAnalysis}
              </p>
            )}

            {showDetailed && ((aiAnalysis && aiAnalysis.length > 120) || suggestedImprovements || technicalQuality || detectedObjects || weddingElements || atmosphere || emotions || category || tags) && (
              <Button
                variant="ghost" 
                size="sm"
                className="text-xs p-1 h-auto text-blue-600 hover:text-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDialog(true);
                }}
              >
                Zobrazit detaily
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const DetailedDialog = () => (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} />
            AI Analýza fotografie
          </DialogTitle>
          <DialogDescription>
            Detailní analýza fotografie provedená umělou inteligencí včetně hodnocení kvality a relevance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {challengeTitle && (
            <div className="p-3 bg-blush/20 rounded-lg">
              <h4 className="font-medium text-sm text-charcoal mb-1">Výzva:</h4>
              <p className="text-sm text-charcoal/80">{challengeTitle}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium text-sm">{getStatusText()}</span>
              </div>
              <Badge 
                variant={isVerified ? "default" : "secondary"}
                className={`text-xs ${getStatusColor()}`}
              >
                {confidencePercentage}% shoda
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-charcoal/60">
                <span>Relevance k výzvě</span>
                <span>{confidencePercentage}%</span>
              </div>
              <Progress 
                value={confidencePercentage} 
                className={`h-2 ${getConfidenceColor()}`}
              />
            </div>
          </div>

          {aiAnalysis && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Hodnocení AI
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {aiAnalysis}
                </p>
              </div>
            </div>
          )}

          {suggestedImprovements && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <AlertCircle size={14} />
                Návrhy na zlepšení
              </h4>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 leading-relaxed">
                  {suggestedImprovements}
                </p>
              </div>
            </div>
          )}

          {technicalQuality && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Technická kvalita
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {JSON.stringify(technicalQuality)}
                </p>
              </div>
            </div>
          )}

          {detectedObjects && detectedObjects.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Detekované objekty
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <ul className="text-sm text-charcoal/80 list-disc list-inside leading-relaxed">
                  {detectedObjects.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {weddingElements && weddingElements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Svatební prvky
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <ul className="text-sm text-charcoal/80 list-disc list-inside leading-relaxed">
                  {weddingElements.map((element, index) => (
                    <li key={index}>{element}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {atmosphere && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Atmosféra
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {atmosphere}
                </p>
              </div>
            </div>
          )}

          {emotions && emotions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Emoce
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <ul className="text-sm text-charcoal/80 list-disc list-inside leading-relaxed">
                  {emotions.map((emotion, index) => (
                    <li key={index}>{emotion}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {category && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Kategorie
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {category}
                </p>
              </div>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-charcoal flex items-center gap-1">
                <Info size={14} />
                Tagy
              </h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <ul className="text-sm text-charcoal/80 list-disc list-inside leading-relaxed">
                  {tags.map((tag, index) => (
                    <li key={index}>{tag}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="text-xs text-charcoal/50 text-center pt-2 border-t">
            Analýza provedena pomocí Gemini AI
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <BasicTooltip />
      {showDetailed && <DetailedDialog />}
    </>
  );
}