import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
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

  useEffect(() => {
    if (!isOnboardingOpen) return;

    const step = onboardingSteps[currentStep];
    if (step.element) {
      const element = document.querySelector(step.element);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setHighlightedElement(null);
      // For center-positioned steps without elements, scroll to top to ensure tutorial is visible
      if (step.position === "center") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep, isOnboardingOpen]);

  // Ensure page scrolls to show tutorial when it first opens
  useEffect(() => {
    if (isOnboardingOpen) {
      // Scroll to top with a slight delay to ensure smooth transition
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [isOnboardingOpen]);

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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={skipTutorial} />
      
      {/* Highlighted element border */}
      {highlightedElement && (
        <div
          className="fixed pointer-events-none z-[101] border-4 border-romantic rounded-lg shadow-lg"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tutorial Card */}
      <div className="fixed inset-0 z-[102] flex items-center justify-center p-4">
        <Card className="bg-white/95 backdrop-blur-md border-romantic/20 shadow-xl max-w-md w-full mx-4 sm:max-w-lg">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-romantic rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentStep + 1}
                </div>
                <span className="text-sm text-charcoal/60">
                  {currentStep + 1} z {totalSteps}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-charcoal/60 hover:text-charcoal"
                data-testid="button-skip-tutorial"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="mb-6 h-2" />

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="font-display text-lg sm:text-xl font-bold text-charcoal mb-3">
                {currentStepData.title}
              </h3>
              <p className="text-sm sm:text-base text-charcoal/70 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-1 text-xs sm:text-sm"
                data-testid="button-prev-step"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Zpět</span>
              </Button>

              {currentStep === totalSteps - 1 ? (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={completeTutorial}
                  className="flex items-center space-x-1 text-xs sm:text-sm"
                  data-testid="button-complete-tutorial"
                >
                  <Check size={14} />
                  <span>Dokončit</span>
                </GlassButton>
              ) : (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={nextStep}
                  className="flex items-center space-x-1 text-xs sm:text-sm"
                  data-testid="button-next-step"
                >
                  <span>Další</span>
                  <ChevronRight size={14} />
                </GlassButton>
              )}
            </div>

            {/* Skip option */}
            <div className="text-center mt-4">
              <button
                onClick={skipTutorial}
                className="text-sm text-charcoal/50 hover:text-charcoal/70 transition-colors"
                data-testid="button-skip-tutorial-text"
              >
                Přeskočit tutoriál
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}