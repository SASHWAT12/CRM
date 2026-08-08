"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageCount {
  stage: string;
  count: number;
}

interface PipelineWidgetProps {
  stageCounts: StageCount[];
  totalPatients: number;
  conversionRate: number;
  lossRate: number;
  recentTransitions: number;
  isLoading?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "New Inquiry",
  CONTACTED: "Contacted / Lead",
  INTERESTED: "Interested Patient",
  CONSULTATION_BOOKED: "Consultation Booked",
  VISITED: "Visited Clinic",
  TREATMENT_STARTED: "Treatment Started",
  CONVERTED: "Converted Patient",
  CLOSED_LOST: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-indigo-500",
  INTERESTED: "bg-purple-500",
  CONSULTATION_BOOKED: "bg-pink-500",
  VISITED: "bg-amber-500",
  TREATMENT_STARTED: "bg-orange-500",
  CONVERTED: "bg-emerald-500",
  CLOSED_LOST: "bg-rose-500",
};

export function PipelineWidget({
  stageCounts = [],
  totalPatients = 0,
  conversionRate = 0,
  lossRate = 0,
  recentTransitions = 0,
  isLoading,
}: PipelineWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse border-primary/10">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-bold">Patient Pipeline Health</CardTitle>
            <CardDescription>Funnel conversion & stage metrics</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/5 border text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>{recentTransitions} Transitions (7d)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Core Rates Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Patients</span>
            <div className="text-xl font-extrabold mt-0.5">{totalPatients}</div>
          </div>
          <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/10 text-center">
            <div className="flex items-center justify-center gap-0.5 text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold">Conversion</span>
            </div>
            <div className="text-xl font-extrabold mt-0.5 text-emerald-600">{conversionRate}%</div>
          </div>
          <div className="p-3 rounded-lg border bg-rose-500/5 border-rose-500/10 text-center">
            <div className="flex items-center justify-center gap-0.5 text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold">Loss Rate</span>
            </div>
            <div className="text-xl font-extrabold mt-0.5 text-rose-600">{lossRate}%</div>
          </div>
        </div>

        {/* Funnel list */}
        <div className="space-y-3 pt-1">
          {stageCounts.map(({ stage, count }) => {
            const percentage = totalPatients > 0 ? (count / totalPatients) * 100 : 0;
            const barColor = STAGE_COLORS[stage] || "bg-primary";
            const label = STAGE_LABELS[stage] || stage;

            return (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">{count} patients</span>
                    <span className="font-bold text-muted-foreground/80">{Math.round(percentage)}%</span>
                  </div>
                </div>
                {/* Custom Tailwind Progress Bar */}
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", barColor)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
