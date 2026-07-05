"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiWidgetProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  colorClass?: string;
  iconColorClass?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export function KpiWidget({
  title,
  value,
  icon: Icon,
  description,
  colorClass,
  iconColorClass,
  onClick,
  isLoading,
}: KpiWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-12 bg-muted rounded mb-2" />
          <div className="h-3 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all duration-300 border-primary/5 shadow-sm",
        onClick && "hover:shadow-md hover:border-primary/20 cursor-pointer active:scale-[0.98]",
        colorClass
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconColorClass || "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
