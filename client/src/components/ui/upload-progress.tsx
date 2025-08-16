import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Camera, Brain, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  stage: 'uploading' | 'analyzing' | 'verifying' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
  uploadSpeed?: number; // MB/s
  className?: string;
}

const stages = [
  { key: 'uploading', icon: Upload, label: 'Nahrávání fotky', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  { key: 'analyzing', icon: Brain, label: 'AI analýza obsahu', color: 'text-purple-500', bgColor: 'bg-purple-500' },
  { key: 'verifying', icon: Camera, label: 'Ověření úkolu', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  { key: 'complete', icon: CheckCircle, label: 'Hotovo', color: 'text-green-500', bgColor: 'bg-green-500' },
];

// Circular Progress Component
const CircularProgress = ({ 
  progress, 
  size = 40, 
  strokeWidth = 3, 
  color = "text-blue-500",
  bgColor = "bg-blue-500"
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string;
  bgColor?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${color}`}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default function UploadProgress({ 
  stage, 
  progress, 
  currentStep, 
  error, 
  uploadSpeed,
  className 
}: UploadProgressProps) {
  const currentStageIndex = stages.findIndex(s => s.key === stage);
  
  // Calculate individual stage progress
  const getStageProgress = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 100;
    if (stageIndex > currentStageIndex) return 0;
    
    // For current stage, map overall progress to stage-specific progress
    const stageRanges = [
      { start: 0, end: 30 },    // uploading
      { start: 30, end: 60 },   // analyzing
      { start: 60, end: 90 },   // verifying
      { start: 90, end: 100 }   // complete
    ];
    
    const range = stageRanges[stageIndex];
    if (!range) return 0;
    
    return Math.min(100, Math.max(0, ((progress - range.start) / (range.end - range.start)) * 100));
  };
  
  return (
    <div className={cn("space-y-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20", className)}>
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-charcoal/70">Celkový průběh</span>
          <div className="flex items-center gap-3">
            {uploadSpeed && stage === 'uploading' && (
              <span className="text-blue-600 font-medium text-sm">
                {uploadSpeed.toFixed(1)} MB/s
              </span>
            )}
            <span className="text-charcoal font-medium">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress 
          value={progress} 
          className="h-3 bg-gray-100"
        />
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="text-center">
          <p className="text-sm text-charcoal/60 mb-2">Aktuální krok:</p>
          <p className="font-medium text-charcoal">{currentStep}</p>
        </div>
      )}

      {/* Stage Indicators with Circular Progress */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stageInfo, index) => {
          const Icon = stageInfo.icon;
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex || stage === 'complete';
          const isError = stage === 'error' && index === currentStageIndex;
          const stageProgress = getStageProgress(index);
          
          // Status indicator
          const statusColor = isError ? '🔴' : (isCompleted ? '🟢' : (isActive ? '🟡' : '⚪'));
          
          return (
            <div key={stageInfo.key} className="flex flex-col items-center space-y-3">
              {/* Status Indicator */}
              <div className="text-xl">
                {statusColor}
              </div>
              
              {/* Circular Progress */}
              <div className="relative">
                {isActive && !isError ? (
                  <CircularProgress 
                    progress={stageProgress}
                    size={50}
                    strokeWidth={4}
                    color={stageInfo.color}
                    bgColor={stageInfo.bgColor}
                  />
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    isError 
                      ? "bg-red-500 text-white"
                      : isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-200 text-gray-400"
                  )}>
                    {isError ? (
                      <AlertCircle size={20} />
                    ) : isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                )}
                
                {/* Animated pulse for active stage */}
                {isActive && !isError && (
                  <div className={cn(
                    "absolute inset-0 rounded-full animate-ping opacity-20",
                    stageInfo.bgColor
                  )} />
                )}
              </div>
              
              {/* Stage Label */}
              <span className={cn(
                "text-xs text-center max-w-20 leading-tight",
                isActive ? stageInfo.color : isCompleted ? "text-green-600" : "text-gray-400"
              )}>
                {stageInfo.label}
              </span>
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