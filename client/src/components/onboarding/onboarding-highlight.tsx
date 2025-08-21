import { cn } from "@/lib/utils";

interface OnboardingHighlightProps {
  step: string;
  className?: string;
  children: React.ReactNode;
}

export function OnboardingHighlight({ step, className, children }: OnboardingHighlightProps) {
  return (
    <div className={cn(className)} data-onboarding-step={step}>
      {children}
    </div>
  );
}