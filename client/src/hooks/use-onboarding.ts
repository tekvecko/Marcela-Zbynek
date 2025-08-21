import { useState, useEffect } from "react";

export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem("wedding-onboarding-completed");
    
    if (!hasCompletedOnboarding) {
      // Show onboarding after a short delay to let the page load
      const timer = setTimeout(() => {
        setShouldShowOnboarding(true);
        setIsOnboardingOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("wedding-onboarding-completed");
    setShouldShowOnboarding(true);
    setIsOnboardingOpen(true);
  };

  return {
    shouldShowOnboarding,
    isOnboardingOpen,
    startOnboarding,
    closeOnboarding,
    resetOnboarding
  };
}