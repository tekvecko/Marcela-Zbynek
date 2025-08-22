import { CheckCircle, XCircle, Star, Camera, Award, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import GlassButton from "@/components/ui/glass-button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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

// Animated confidence counter
const AnimatedConfidence = ({ 
  targetValue, 
  isValid 
}: { 
  targetValue: number; 
  isValid: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const increment = targetValue / 30;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [targetValue]);

  const getColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="text-center relative">
      <motion.div 
        className="flex items-center justify-center gap-1"
        animate={{ 
          scale: isValid ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          duration: 0.5, 
          repeat: isValid ? 3 : 0, 
          delay: 1 
        }}
      >
        <motion.div 
          className={cn("text-2xl font-bold", getColor(displayValue))}
          key={Math.floor(displayValue / 10)}
          animate={{ 
            scale: [1.2, 1],
            rotateY: [0, 360]
          }}
          transition={{ duration: 0.3 }}
        >
          {displayValue}%
        </motion.div>
        
        {/* Celebration sparkles for high confidence */}
        {isValid && targetValue >= 80 && displayValue === targetValue && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Sparkles className="text-yellow-400" size={16} />
          </motion.div>
        )}
        
        <motion.div 
          className="group relative"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-4 h-4 rounded-full bg-charcoal/20 flex items-center justify-center cursor-help">
            <span className="text-[10px] text-charcoal/60 font-bold">i</span>
          </div>
          <motion.div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-charcoal text-white text-xs rounded-md px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none z-50"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <div className="font-medium mb-1">Spolehlivost AI hodnocení:</div>
              <div className="text-green-300">80-100%: Vysoká spolehlivost</div>
              <div className="text-orange-300">60-79%: Střední spolehlivost</div>
              <div className="text-red-300">0-59%: Nízká spolehlivost</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-charcoal rotate-45"></div>
          </motion.div>
        </motion.div>
      </motion.div>
      <div className="text-xs text-charcoal/50">Spolehlivost</div>
    </div>
  );
};

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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          {/* Header with result */}
          <motion.div 
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative",
                isValid
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              )}
              animate={{ 
                scale: isValid ? [1, 1.1, 1] : [1, 0.95, 1],
                rotate: isValid ? [0, 5, -5, 0] : [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 0.8, 
                delay: 0.5,
                repeat: 2
              }}
            >
              {isValid ? <CheckCircle size={24} /> : <XCircle size={24} />}
              
              {/* Success celebration ring */}
              {isValid && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ 
                    scale: [1, 1.5, 2],
                    opacity: [1, 0.5, 0]
                  }}
                  transition={{ duration: 1.5, delay: 1 }}
                />
              )}
            </motion.div>

            <div className="flex-1">
              <motion.h3 
                className={cn(
                  "font-display text-xl font-bold",
                  isValid ? "text-green-700" : "text-red-700"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                {isValid ? "✓ Úkol splněn!" : "✗ Úkol nesplněn"}
              </motion.h3>
              {questTitle && (
                <motion.p 
                  className="text-charcoal/60 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  {questTitle}
                </motion.p>
              )}
            </div>

            {/* Animated Confidence Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <AnimatedConfidence 
                targetValue={confidencePercentage}
                isValid={isValid}
              />
            </motion.div>
          </motion.div>

          {/* AI Analysis with staggered animations */}
          <div className="space-y-4">
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <motion.div 
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.4 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, delay: 1.5 }}
                >
                  <Star className="text-blue-500" size={16} />
                </motion.div>
                <span className="font-medium text-blue-700">AI Hodnocení</span>
              </motion.div>
              <motion.p 
                className="text-charcoal/80 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.6 }}
              >
                {explanation}
              </motion.p>
            </motion.div>

            {/* Suggestions for improvement */}
            <AnimatePresence>
              {suggestedImprovements && (
                <motion.div 
                  className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, delay: 1.8 }}
                >
                  <motion.div 
                    className="flex items-center gap-2 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 2.0 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, -10, 10, 0]
                      }}
                      transition={{ duration: 1, delay: 2.1, repeat: 1 }}
                    >
                      <Camera className="text-orange-500" size={16} />
                    </motion.div>
                    <span className="font-medium text-orange-700">Tipy pro zlepšení</span>
                  </motion.div>
                  <motion.p 
                    className="text-charcoal/80 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 }}
                  >
                    {suggestedImprovements}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success reward with celebration */}
            <AnimatePresence>
              {isValid && (
                <motion.div 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100 relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.8 }}
                >
                  {/* Celebration confetti */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        initial={{ 
                          x: "50%", 
                          y: "50%",
                          opacity: 0
                        }}
                        animate={{
                          x: `${20 + Math.random() * 60}%`,
                          y: `${20 + Math.random() * 60}%`,
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 2.5 + i * 0.1,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-2 mb-2 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 2.0 }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, -20, 20, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 1, delay: 2.5, repeat: 2 }}
                    >
                      <Award className="text-green-500" size={16} />
                    </motion.div>
                    <span className="font-medium text-green-700">Odměna získána!</span>
                  </motion.div>
                  <motion.p 
                    className="text-charcoal/80 relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 }}
                  >
                    Získali jste body za splnění tohoto úkolu. Vaše fotka byla přidána do galerie.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons with enhanced animations */}
          <motion.div 
            className="flex gap-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.4 }}
          >
            {isValid && onViewInGallery && (
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={onViewInGallery}
                  className="w-full"
                >
                  <Camera size={16} />
                  Zobrazit v galerii
                </GlassButton>
              </motion.div>
            )}

            {!isValid && onTryAgain && (
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <GlassButton
                  variant="outline"
                  size="md"
                  onClick={onTryAgain}
                  className="w-full"
                >
                  <Camera size={16} />
                  Zkusit znovu
                </GlassButton>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}