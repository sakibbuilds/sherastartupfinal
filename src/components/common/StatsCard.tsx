import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  suffix = "",
  prefix = "",
  change,
  icon: Icon,
  iconColor = "text-mint",
  className,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl bg-card border border-border/50",
        "transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                change >= 0 ? "text-mint" : "text-coral"
              )}
            >
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl bg-secondary/50",
            iconColor
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
