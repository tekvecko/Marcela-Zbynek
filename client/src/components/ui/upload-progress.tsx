import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Camera, Brain, Upload, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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

// Animated number counter
const AnimatedNumber = ({ value, color }: { value: number; color?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        if (prev < value) {
          return Math.min(value, prev + 2);
        } else if (prev > value) {
          return Math.max(value, prev - 2);
        }
        return value;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <motion.span 
      className={`text-xs font-bold ${color || "text-charcoal"}`}
      key={Math.floor(displayValue / 10)}
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {Math.round(displayValue)}%
    </motion.span>
  );
};

// Circular Progress Component with enhanced animations
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
    <motion.div 
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
        {/* Progress circle with enhanced animation */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          className={color}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedNumber value={progress} color={color} />
      </div>
      
      {/* Success celebration */}
      {progress === 100 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Sparkles className="text-yellow-400" size={20} />
        </motion.div>
      )}
    </motion.div>
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
    <motion.div 
      className={cn("space-y-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-charcoal/70">Celkový průběh</span>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {uploadSpeed && stage === 'uploading' && (
                <motion.span 
                  className="text-blue-600 font-medium text-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {uploadSpeed.toFixed(1)} MB/s
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatedNumber value={progress} color="font-medium text-charcoal" />
          </div>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
          className="origin-left"
        >
          <Progress 
            value={progress} 
            className="h-3 bg-gray-100"
          />
        </motion.div>
      </div>

      {/* Current Step */}
      <AnimatePresence>
        {currentStep && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-charcoal/60 mb-2">Aktuální krok:</p>
            <motion.p 
              className="font-medium text-charcoal"
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {currentStep}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Indicators with Enhanced Animations */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stageInfo, index) => {
          const Icon = stageInfo.icon;
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex || stage === 'complete';
          const isError = stage === 'error' && index === currentStageIndex;
          const stageProgress = getStageProgress(index);
          
          return (
            <motion.div 
              key={stageInfo.key} 
              className="flex flex-col items-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {/* Status Indicator with enhanced animation */}
              <motion.div 
                className="text-xl"
                animate={{ 
                  scale: isActive && !isError ? [1, 1.2, 1] : 1,
                  rotate: isCompleted ? [0, 360] : 0
                }}
                transition={{ 
                  scale: { duration: 2, repeat: Infinity },
                  rotate: { duration: 0.5 }
                }}
              >
                {isError ? '🔴' : (isCompleted ? '🟢' : (isActive ? '🟡' : '⚪'))}
              </motion.div>
              
              {/* Circular Progress or Icon */}
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
                  <motion.div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      isError 
                        ? "bg-red-500 text-white"
                        : isCompleted 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 text-gray-400"
                    )}
                    animate={{ 
                      scale: isCompleted && stage === 'complete' && index < currentStageIndex ? [1, 1.1, 1] : 1 
                    }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {isError ? (
                      <AlertCircle size={20} />
                    ) : isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle size={20} />
                      </motion.div>
                    ) : (
                      <Icon size={20} />
                    )}
                  </motion.div>
                )}
                
                {/* Animated pulse for active stage */}
                {isActive && !isError && (
                  <motion.div 
                    className={cn("absolute inset-0 rounded-full", stageInfo.bgColor)}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 0, 0.4]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </div>
              
              {/* Stage Label with animation */}
              <motion.span 
                className={cn(
                  "text-xs text-center max-w-20 leading-tight transition-colors duration-200",
                  isActive ? stageInfo.color : isCompleted ? "text-green-600" : "text-gray-400"
                )}
                animate={{ 
                  scale: isActive ? [1, 1.05, 1] : 1 
                }}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
              >
                {stageInfo.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Error Message with animation */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-50 border border-red-200 rounded-lg p-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <AlertCircle className="text-red-500" size={16} />
              </motion.div>
              <span className="text-red-700 text-sm font-medium">Chyba při uploadu</span>
            </div>
            <motion.p 
              className="text-red-600 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {error}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}