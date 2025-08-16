import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Camera, Brain, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  stage: 'uploading' | 'analyzing' | 'verifying' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
  className?: string;
}

const stages = [
  { key: 'uploading', icon: Upload, label: 'Nahrávání fotky', color: 'text-blue-500' },
  { key: 'analyzing', icon: Brain, label: 'AI analýza obsahu', color: 'text-purple-500' },
  { key: 'verifying', icon: Camera, label: 'Ověření úkolu', color: 'text-orange-500' },
  { key: 'complete', icon: CheckCircle, label: 'Hotovo', color: 'text-green-500' },
];

export default function UploadProgress({ 
  stage, 
  progress, 
  currentStep, 
  error, 
  className 
}: UploadProgressProps) {
  const currentStageIndex = stages.findIndex(s => s.key === stage);
  
  return (
    <div className={cn("space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-charcoal/70">Průběh uploadu</span>
          <span className="text-charcoal font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="text-center">
          <p className="text-sm text-charcoal/60 mb-2">Aktuální krok:</p>
          <p className="font-medium text-charcoal">{currentStep}</p>
        </div>
      )}

      {/* Stage Indicators */}
      <div className="flex items-center justify-between">
        {stages.map((stageInfo, index) => {
          const Icon = stageInfo.icon;
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex || stage === 'complete';
          const isError = stage === 'error' && index === currentStageIndex;
          
          return (
            <div key={stageInfo.key} className="flex flex-col items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isError 
                  ? "bg-red-500 text-white"
                  : isCompleted 
                  ? "bg-green-500 text-white" 
                  : isActive 
                  ? `bg-white border-2 border-current ${stageInfo.color}` 
                  : "bg-gray-200 text-gray-400"
              )}>
                {isError ? (
                  <AlertCircle size={16} />
                ) : (
                  <Icon size={16} className={isActive && !isError ? stageInfo.color : ''} />
                )}
              </div>
              <span className={cn(
                "text-xs mt-2 text-center max-w-16",
                isActive ? stageInfo.color : isCompleted ? "text-green-600" : "text-gray-400"
              )}>
                {stageInfo.label}
              </span>
              
              {/* Animated pulse for active stage */}
              {isActive && stage !== 'error' && (
                <div className={cn(
                  "absolute w-8 h-8 rounded-full animate-ping opacity-30",
                  stageInfo.color.replace('text-', 'bg-')
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={16} />
            <span className="text-red-700 text-sm font-medium">Chyba při uploadu</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}