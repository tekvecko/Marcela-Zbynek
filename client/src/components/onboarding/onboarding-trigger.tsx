import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOnboardingContext } from "./onboarding-context";

export default function OnboardingTrigger() {
  const { startOnboarding } = useOnboardingContext();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={startOnboarding}
            className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border-romantic/20 text-romantic hover:bg-romantic hover:text-white shadow-lg rounded-full w-12 h-12 p-0"
            data-testid="button-help-tutorial"
          >
            <HelpCircle size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-charcoal text-white">
          <p>Spustit tutoriál</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}