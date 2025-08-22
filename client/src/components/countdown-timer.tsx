import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWeddingCountdown } from "@/lib/wedding-utils";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Animated Digit Component with flip effect
const AnimatedDigit = ({ 
  value, 
  label, 
  color,
  isUrgent = false 
}: { 
  value: number; 
  label: string; 
  color: string;
  isUrgent?: boolean;
}) => {
  const prevValueRef = useRef(value);
  const [isFlipping, setIsFlipping] = useState(false);
  
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsFlipping(true);
      const timeout = setTimeout(() => setIsFlipping(false), 150);
      prevValueRef.current = value;
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.random() * 0.3 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden"
        animate={{ 
          scale: isUrgent ? [1, 1.02, 1] : 1,
          boxShadow: isUrgent 
            ? ["0 4px 6px rgba(0,0,0,0.1)", "0 8px 25px rgba(220,38,127,0.3)", "0 4px 6px rgba(0,0,0,0.1)"]
            : "0 4px 6px rgba(0,0,0,0.1)"
        }}
        transition={{ 
          duration: isUrgent ? 1.5 : 0.3, 
          repeat: isUrgent ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Urgent glow effect */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{
              background: [
                "linear-gradient(45deg, transparent, transparent)",
                "linear-gradient(45deg, rgba(220,38,127,0.1), rgba(220,38,127,0.2))",
                "linear-gradient(45deg, transparent, transparent)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              className={`text-4xl md:text-5xl font-bold ${color}`}
              initial={isFlipping ? { rotateY: -90, opacity: 0 } : false}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {value.toString().padStart(2, '0')}
            </motion.div>
          </AnimatePresence>
          
          <motion.div 
            className="text-charcoal/70 font-medium mt-2"
            animate={{ 
              color: isUrgent ? ["rgb(45,45,45)", "rgb(220,38,127)", "rgb(45,45,45)"] : "rgb(45,45,45)"
            }}
            transition={{ duration: 2, repeat: isUrgent ? Infinity : 0 }}
          >
            {label}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Animated Calendar Button
const AnimatedCalendarButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.button 
      onClick={onClick}
      className="inline-flex items-center bg-gold text-white px-6 py-3 rounded-full font-medium shadow-lg relative overflow-hidden"
      whileHover={{ 
        scale: 1.05,
        backgroundColor: "rgba(218, 165, 32, 0.9)",
        boxShadow: "0 8px 25px rgba(218, 165, 32, 0.4)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Ripple effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.div
        className="relative flex items-center"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Calendar className="mr-2" size={20} />
        </motion.div>
        Přidat do kalendáře
      </motion.div>
    </motion.button>
  );
};

export default function CountdownTimer() {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = getWeddingCountdown();
      setCountdown(newCountdown);
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const openGoogleCalendar = () => {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Svatba+Marcela+a+Zbyn%C4%9Bk&dates=20251011T120000Z/20251011T160000Z&details=Svatba+ve+Star%C3%A1+Po%C5%A1ta,+Kovalovice+109&location=Kovalovice+109,+%C4%8Cesk%C3%A1+republika";
    window.open(url, '_blank');
  };

  // Determine urgency for special effects
  const isVeryUrgent = countdown.days <= 7;
  const isUrgent = countdown.days <= 30;

  return (
    <section id="countdown" className="py-20 bg-white countdown-timer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="font-display text-4xl md:text-5xl font-bold text-charcoal mb-4"
            animate={{
              color: isVeryUrgent 
                ? ["rgb(45,45,45)", "rgb(220,38,127)", "rgb(45,45,45)"]
                : "rgb(45,45,45)"
            }}
            transition={{ duration: 2, repeat: isVeryUrgent ? Infinity : 0 }}
          >
            Odpočet do svatby{" "}
            <motion.span 
              className="heart-decoration inline-block"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              ❤️
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-lg text-charcoal/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Každý den nás přibližuje k našemu velkému dni
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-r from-blush to-cream rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Floating hearts animation for very urgent countdown */}
          {isVeryUrgent && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-red-300/40 text-2xl"
                  initial={{ 
                    x: Math.random() * 100 + "%", 
                    y: "100%",
                    opacity: 0
                  }}
                  animate={{
                    y: "-10%",
                    opacity: [0, 1, 0],
                    x: `${Math.random() * 100}%`
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeOut"
                  }}
                >
                  💖
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            <AnimatedDigit 
              value={countdown.days} 
              label="Dní" 
              color="text-romantic"
              isUrgent={isVeryUrgent}
            />
            <AnimatedDigit 
              value={countdown.hours} 
              label="Hodin" 
              color="text-gold"
              isUrgent={isVeryUrgent && countdown.days <= 1}
            />
            <AnimatedDigit 
              value={countdown.minutes} 
              label="Minut" 
              color="text-love"
              isUrgent={isVeryUrgent && countdown.days === 0 && countdown.hours <= 1}
            />
            <AnimatedDigit 
              value={countdown.seconds} 
              label="Sekund" 
              color="text-romantic"
              isUrgent={isVeryUrgent && countdown.days === 0 && countdown.hours === 0 && countdown.minutes <= 10}
            />
          </div>
          
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <AnimatedCalendarButton onClick={openGoogleCalendar} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}