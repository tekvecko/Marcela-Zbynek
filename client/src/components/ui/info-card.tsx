
import { Card, CardContent } from "@/components/ui/card";
import { Info, Lightbulb, Star, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  content: string;
  type?: "info" | "tip" | "warning" | "success";
  className?: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    textColor: "text-blue-900"
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200", 
    iconColor: "text-yellow-500",
    textColor: "text-yellow-900"
  },
  warning: {
    icon: Camera,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500", 
    textColor: "text-orange-900"
  },
  success: {
    icon: Star,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-500",
    textColor: "text-green-900"
  }
};

export default function InfoCard({ title, content, type = "info", className }: InfoCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      config.bgColor,
      config.borderColor,
      "border-2",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn(config.iconColor, "mt-0.5 flex-shrink-0")} size={20} />
          <div>
            <h4 className={cn("font-medium mb-1", config.textColor)}>{title}</h4>
            <p className={cn("text-sm", config.textColor)}>{content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
