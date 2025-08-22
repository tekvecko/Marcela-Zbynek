import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  loading?: boolean;
  rippleColor?: string;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", children, loading = false, rippleColor, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-full backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
    
    const variants = {
      primary: "bg-white/20 hover:bg-white/30 text-charcoal hover:text-charcoal/80 shadow-[0_8px_32px_rgba(31,38,135,0.37)]",
      secondary: "bg-white/15 hover:bg-white/25 text-charcoal/80 hover:text-charcoal shadow-[0_4px_16px_rgba(31,38,135,0.25)]",
      outline: "bg-white/10 hover:bg-white/20 text-charcoal/70 hover:text-charcoal border-charcoal/20 hover:border-charcoal/30",
      ghost: "bg-white/5 hover:bg-white/15 text-charcoal/60 hover:text-charcoal/80 shadow-[0_2px_8px_rgba(31,38,135,0.15)]",
      accent: "bg-sage/20 hover:bg-sage/30 text-charcoal hover:text-charcoal/80 shadow-[0_8px_32px_rgba(135,160,121,0.37)]"
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm min-h-[36px]",
      md: "px-6 py-3 text-base min-h-[44px]",
      lg: "px-8 py-4 text-lg min-h-[52px]"
    };

    // Handle ripple effect
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.disabled || loading) return;

      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newRipple = {
          id: Date.now(),
          x,
          y
        };
        
        setRipples(prev => [...prev, newRipple]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
        }, 600);
      }

      if (props.onClick) {
        props.onClick(e);
      }
    };

    const getRippleColor = () => {
      if (rippleColor) return rippleColor;
      
      switch (variant) {
        case "primary": return "rgba(255, 255, 255, 0.6)";
        case "secondary": return "rgba(255, 255, 255, 0.4)";
        case "outline": return "rgba(45, 45, 45, 0.2)";
        case "ghost": return "rgba(255, 255, 255, 0.3)";
        case "accent": return "rgba(135, 160, 121, 0.4)";
        default: return "rgba(255, 255, 255, 0.6)";
      }
    };

    return (
      <motion.button
        ref={(node) => {
          if (buttonRef) {
            (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
            }
          }
        }}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        onClick={handleClick}
        disabled={loading || props.disabled}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 12px 40px rgba(31, 38, 135, 0.45)"
        }}
        whileTap={{ scale: 0.98 }}
        whileFocus={{ 
          boxShadow: "0 0 0 3px rgba(31, 38, 135, 0.2)"
        }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        {...(props as any)}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                backgroundColor: getRippleColor(),
              }}
              initial={{ 
                width: 0, 
                height: 0, 
                x: 0, 
                y: 0,
                opacity: 1
              }}
              animate={{ 
                width: 200, 
                height: 200, 
                x: -100, 
                y: -100,
                opacity: 0
              }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut" 
              }}
              exit={{ opacity: 0 }}
            />
          ))}
        </AnimatePresence>
        
        {/* Content wrapper with loading state */}
        <motion.span 
          className="relative z-10 flex items-center gap-2"
          animate={{ 
            opacity: loading ? 0.7 : 1,
            scale: loading ? 0.95 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  rotate: 360
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  scale: { duration: 0.2 },
                  rotate: { 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }
                }}
              >
                <Loader2 size={16} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.span
            animate={{ 
              opacity: loading ? 0 : 1,
              x: loading ? 10 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </motion.span>
        
        {/* Enhanced glass shine effect */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Floating glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${getRippleColor()}, transparent 70%)`
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ 
            opacity: 0.3, 
            scale: 1.1,
            transition: { duration: 0.3 }
          }}
          whileTap={{ 
            opacity: 0.5, 
            scale: 0.9,
            transition: { duration: 0.1 }
          }}
        />
        
        {/* Success pulse effect */}
        {!loading && !props.disabled && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            initial={{ scale: 1, opacity: 0 }}
            whileTap={{
              scale: [1, 1.3, 1.5],
              opacity: [0, 0.5, 0]
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export default GlassButton;