
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export default function HelpTooltip({ content, className, side = "top" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full p-1 text-charcoal/50 hover:text-charcoal/70 transition-colors",
            className
          )}
        >
          <HelpCircle size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
