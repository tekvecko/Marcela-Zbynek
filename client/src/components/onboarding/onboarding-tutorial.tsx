import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Check, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import GlassButton from "@/components/ui/glass-button";
import { useOnboardingContext } from "./onboarding-context";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  element?: string; // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right" | "center";
  image?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Vítejte na naší svatební stránce!",
    description: "Pomůžeme vám projít všemi funkcemi, které pro vás máme připravené.",
    position: "center"
  },
  {
    id: "navigation",
    title: "Navigace",
    description: "Zde najdete všechny sekce našeho webu - Photo Quest, Galerii, Detaily svatby a další.",
    element: "nav",
    position: "bottom"
  },
  {
    id: "photo-quest",
    title: "Photo Quest",
    description: "Plňte fotografické úkoly a pomozte nám zachytit naši svatbu z různých úhlů. Za splněné úkoly získáte body!",
    element: "[href='/photo-quest']",
    position: "bottom"
  },
  {
    id: "mini-games",
    title: "Mini-hry",
    description: "Bavte se mezi fotografováním! Zahrajte si svatební kvízy, pexeso a další zábavné hry. Soutěžte s ostatními hosty!",
    element: "[href='/mini-games']",
    position: "bottom"
  },
  {
    id: "gallery",
    title: "Galerie",
    description: "Prohlížejte si fotografie od ostatních hostů a lajkujte ty nejkrásnější.",
    element: "[href='/gallery']",
    position: "bottom"
  },
  {
    id: "countdown",
    title: "Odpočítávání",
    description: "Sledujte, kolik času zbývá do našeho velkého dne!",
    element: ".countdown-timer",
    position: "top"
  },
  {
    id: "mobile-menu",
    title: "Mobilní menu",
    description: "Na mobilních zařízeních použijte toto tlačítko pro otevření navigačního menu.",
    element: "button[class*='md:hidden']",
    position: "left"
  },
  {
    id: "complete",
    title: "Hotovo!",
    description: "Nyní jste připraveni prozkoumávat naši svatební stránku. Bavte se!",
    position: "center"
  }
];

export default function OnboardingTutorial() {
  const { 
    isOnboardingOpen, 
    currentStep, 
    totalSteps,
    closeOnboarding, 
    nextStep, 
    prevStep 
  } = useOnboardingContext();
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [cardPosition, setCardPosition] = useState<{x: number, y: number, position: string}>({x: 0, y: 0, position: 'center'});
  const tutorialCardRef = useRef<HTMLDivElement>(null);

  // Calculate optimal position for tutorial card based on highlighted element
  const calculateCardPosition = (element: Element, stepPosition: string) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 400; // approximate card width
    const cardHeight = 300; // approximate card height
    const margin = 20;

    let x = viewportWidth / 2 - cardWidth / 2; // default to center
    let y = viewportHeight / 2 - cardHeight / 2;
    let position = stepPosition;

    // Try to position based on element location and step preference
    switch (stepPosition) {
      case 'bottom':
        if (rect.bottom + cardHeight + margin < viewportHeight) {
          y = rect.bottom + margin;
          position = 'bottom';
        } else if (rect.top - cardHeight - margin > 0) {
          y = rect.top - cardHeight - margin;
          position = 'top';
        }
        break;
      case 'top':
        if (rect.top - cardHeight - margin > 0) {
          y = rect.top - cardHeight - margin;
          position = 'top';
        } else if (rect.bottom + cardHeight + margin < viewportHeight) {
          y = rect.bottom + margin;
          position = 'bottom';
        }
        break;
      case 'left':
        if (rect.left - cardWidth - margin > 0) {
          x = rect.left - cardWidth - margin;
          y = Math.max(margin, Math.min(rect.top, viewportHeight - cardHeight - margin));
          position = 'left';
        } else if (rect.right + cardWidth + margin < viewportWidth) {
          x = rect.right + margin;
          y = Math.max(margin, Math.min(rect.top, viewportHeight - cardHeight - margin));
          position = 'right';
        }
        break;
      case 'right':
        if (rect.right + cardWidth + margin < viewportWidth) {
          x = rect.right + margin;
          y = Math.max(margin, Math.min(rect.top, viewportHeight - cardHeight - margin));
          position = 'right';
        } else if (rect.left - cardWidth - margin > 0) {
          x = rect.left - cardWidth - margin;
          y = Math.max(margin, Math.min(rect.top, viewportHeight - cardHeight - margin));
          position = 'left';
        }
        break;
    }

    // Ensure card stays within viewport bounds
    x = Math.max(margin, Math.min(x, viewportWidth - cardWidth - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - cardHeight - margin));

    return { x, y, position };
  };

  // Get arrow icon based on card position relative to highlighted element
  const getArrowIcon = (position: string) => {
    switch (position) {
      case 'top': return ArrowDown;
      case 'bottom': return ArrowUp;
      case 'left': return ArrowRight;
      case 'right': return ArrowLeft;
      default: return null;
    }
  };

  useEffect(() => {
    if (!isOnboardingOpen) return;

    const step = onboardingSteps[currentStep];
    if (step.element) {
      const element = document.querySelector(step.element);
      if (element) {
        setHighlightedElement(element);
        
        // Calculate optimal card position
        const position = calculateCardPosition(element, step.position || 'bottom');
        setCardPosition(position);
        
        // Smooth scroll to element with better positioning
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: "smooth", 
            block: "center",
            inline: "center"
          });
        }, 100);
      }
    } else {
      setHighlightedElement(null);
      setCardPosition({x: 0, y: 0, position: 'center'});
      // For center-positioned steps without elements, scroll to top to ensure tutorial is visible
      if (step.position === "center") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep, isOnboardingOpen]);

  // Update card position when window resizes
  useEffect(() => {
    if (!isOnboardingOpen || !highlightedElement) return;
    
    const handleResize = () => {
      const step = onboardingSteps[currentStep];
      const position = calculateCardPosition(highlightedElement, step.position || 'bottom');
      setCardPosition(position);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOnboardingOpen, highlightedElement, currentStep]);

  // Ensure page scrolls to show tutorial when it first opens and focus on tutorial card
  useEffect(() => {
    if (isOnboardingOpen) {
      // Scroll to top with a slight delay to ensure smooth transition
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Focus on tutorial card for better accessibility
        if (tutorialCardRef.current) {
          tutorialCardRef.current.focus();
        }
      }, 100);
    }
  }, [isOnboardingOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOnboardingOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          skipTutorial();
          break;
        case "ArrowRight":
        case "Enter":
        case " ":
          if (currentStep === totalSteps - 1) {
            completeTutorial();
          } else {
            nextStep();
          }
          event.preventDefault();
          break;
        case "ArrowLeft":
          if (currentStep > 0) {
            prevStep();
            event.preventDefault();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOnboardingOpen, currentStep, totalSteps]);

  useEffect(() => {
    if (!isOnboardingOpen) {
      setHighlightedElement(null);
    }
  }, [isOnboardingOpen]);

  if (!isOnboardingOpen) return null;

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const skipTutorial = () => {
    closeOnboarding();
  };

  const completeTutorial = () => {
    closeOnboarding();
  };

  const ArrowIcon = highlightedElement ? getArrowIcon(cardPosition.position) : null;

  return (
    <>
      {/* Spotlight Overlay with SVG clipping */}
      <div className="fixed inset-0 z-[100]" onClick={skipTutorial}>
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightedElement && (
                <ellipse
                  cx={highlightedElement.getBoundingClientRect().left + highlightedElement.getBoundingClientRect().width / 2}
                  cy={highlightedElement.getBoundingClientRect().top + highlightedElement.getBoundingClientRect().height / 2}
                  rx={highlightedElement.getBoundingClientRect().width / 2 + 40}
                  ry={highlightedElement.getBoundingClientRect().height / 2 + 40}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.75)" 
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>
      
      {/* Enhanced highlighted element with pulsing animation */}
      {highlightedElement && (
        <>
          {/* Pulsing glow effect */}
          <div
            className="fixed pointer-events-none z-[101] animate-pulse"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 12,
              left: highlightedElement.getBoundingClientRect().left - 12,
              width: highlightedElement.getBoundingClientRect().width + 24,
              height: highlightedElement.getBoundingClientRect().height + 24,
              borderRadius: '12px',
              background: 'linear-gradient(45deg, rgba(var(--romantic-rgb), 0.3), rgba(var(--romantic-rgb), 0.1))',
              filter: 'blur(8px)',
            }}
          />
          
          {/* Main border with animation */}
          <div
            className="fixed pointer-events-none z-[102] border-4 border-romantic rounded-lg shadow-2xl transition-all duration-300"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 4,
              left: highlightedElement.getBoundingClientRect().left - 4,
              width: highlightedElement.getBoundingClientRect().width + 8,
              height: highlightedElement.getBoundingClientRect().height + 8,
              boxShadow: '0 0 0 2px rgba(var(--romantic-rgb), 0.2), 0 0 20px rgba(var(--romantic-rgb), 0.3)',
            }}
          />
          
          {/* Corner indicators */}
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
            }}
          >
            <div className="w-4 h-4 border-l-4 border-t-4 border-romantic rounded-tl-lg animate-pulse" />
          </div>
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              right: window.innerWidth - highlightedElement.getBoundingClientRect().right - 8,
            }}
          >
            <div className="w-4 h-4 border-r-4 border-t-4 border-romantic rounded-tr-lg animate-pulse" />
          </div>
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              bottom: window.innerHeight - highlightedElement.getBoundingClientRect().bottom - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
            }}
          >
            <div className="w-4 h-4 border-l-4 border-b-4 border-romantic rounded-bl-lg animate-pulse" />
          </div>
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              bottom: window.innerHeight - highlightedElement.getBoundingClientRect().bottom - 8,
              right: window.innerWidth - highlightedElement.getBoundingClientRect().right - 8,
            }}
          >
            <div className="w-4 h-4 border-r-4 border-b-4 border-romantic rounded-br-lg animate-pulse" />
          </div>
        </>
      )}

      {/* Visual arrow connecting tutorial card to highlighted element */}
      {highlightedElement && ArrowIcon && cardPosition.position !== 'center' && (
        <div
          className="fixed pointer-events-none z-[104] text-romantic animate-bounce"
          style={{
            top: cardPosition.position === 'top' ? cardPosition.y + 280 : 
                 cardPosition.position === 'bottom' ? cardPosition.y - 30 :
                 cardPosition.y + 140,
            left: cardPosition.position === 'left' ? cardPosition.x + 380 :
                  cardPosition.position === 'right' ? cardPosition.x - 30 :
                  cardPosition.x + 190,
          }}
        >
          <ArrowIcon size={24} className="drop-shadow-lg" />
        </div>
      )}

      {/* Tutorial Card - Dynamically positioned */}
      <div 
        className="fixed z-[105] transition-all duration-500 ease-out"
        style={{
          left: cardPosition.position === 'center' ? '50%' : `${cardPosition.x}px`,
          top: cardPosition.position === 'center' ? '50%' : `${cardPosition.y}px`,
          transform: cardPosition.position === 'center' ? 'translate(-50%, -50%)' : 'none',
        }}
      >
        <Card 
          ref={tutorialCardRef}
          tabIndex={-1}
          className="bg-white/95 backdrop-blur-md border-romantic/20 shadow-2xl w-[400px] outline-none transform transition-all duration-300 hover:scale-[1.02]"
          style={{
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(var(--romantic-rgb), 0.1)',
          }}
        >
          <CardContent className="p-6">
            {/* Header with enhanced styling */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-romantic to-romantic/80 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
                  {currentStep + 1}
                </div>
                <div>
                  <span className="text-sm text-charcoal/60 block">
                    Krok {currentStep + 1} z {totalSteps}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-romantic h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-charcoal/60 hover:text-charcoal hover:bg-romantic/10 transition-all"
                data-testid="button-skip-tutorial"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Content with enhanced typography */}
            <div className="text-center mb-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-3 leading-tight">
                {currentStepData.title}
              </h3>
              <p className="text-base text-charcoal/70 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Enhanced Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 text-sm border-romantic/20 hover:border-romantic/40 hover:bg-romantic/5 transition-all disabled:opacity-50"
                data-testid="button-prev-step"
              >
                <ChevronLeft size={16} />
                <span>Zpět</span>
              </Button>

              {currentStep === totalSteps - 1 ? (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={completeTutorial}
                  className="flex items-center space-x-2 text-sm bg-gradient-to-r from-romantic to-romantic/80 hover:from-romantic/90 hover:to-romantic/70 shadow-lg hover:shadow-xl transition-all"
                  data-testid="button-complete-tutorial"
                >
                  <Check size={16} />
                  <span>Dokončit</span>
                </GlassButton>
              ) : (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={nextStep}
                  className="flex items-center space-x-2 text-sm bg-gradient-to-r from-romantic to-romantic/80 hover:from-romantic/90 hover:to-romantic/70 shadow-lg hover:shadow-xl transition-all"
                  data-testid="button-next-step"
                >
                  <span>Další</span>
                  <ChevronRight size={16} />
                </GlassButton>
              )}
            </div>

            {/* Enhanced Skip option */}
            <div className="text-center mt-4">
              <button
                onClick={skipTutorial}
                className="text-sm text-charcoal/50 hover:text-charcoal/70 hover:underline transition-all"
                data-testid="button-skip-tutorial-text"
              >
                Přeskočit tutoriál
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 right-4 z-[106] bg-black/20 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
        <div>← → navigace | ESC zavřít</div>
      </div>
    </>
  );
}