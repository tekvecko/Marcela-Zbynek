import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingContextType {
  isOnboardingOpen: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  closeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipToStep: (step: number) => void;
  resetOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const totalSteps = 7; // Total number of onboarding steps

  useEffect(() => {
    const completed = localStorage.getItem("wedding-onboarding-completed") === "true";
    setHasCompletedOnboarding(completed);
    
    // Auto-start onboarding for new users after a delay
    if (!completed) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem("wedding-onboarding-completed", "true");
    setHasCompletedOnboarding(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem("wedding-onboarding-completed");
    setHasCompletedOnboarding(false);
    setCurrentStep(0);
    setIsOnboardingOpen(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen,
        currentStep,
        totalSteps,
        startOnboarding,
        closeOnboarding,
        nextStep,
        prevStep,
        skipToStep,
        resetOnboarding,
        hasCompletedOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboardingContext must be used within an OnboardingProvider");
  }
  return context;
}