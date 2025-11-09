import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "destructive";
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  const variantStyles = {
    default: "border-primary/20 hover:border-primary/40",
    success: "border-success/20 hover:border-success/40",
    destructive: "border-destructive/20 hover:border-destructive/40",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
  };

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-2">{trend}</p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-lg bg-secondary/50",
            iconStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
