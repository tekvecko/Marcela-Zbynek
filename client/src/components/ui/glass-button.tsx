import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-full backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";
    
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

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        {/* Glass shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export default GlassButton;