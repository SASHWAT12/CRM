"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourceStat {
  id: string;
  name: string;
  totalPatients: number;
  convertedPatients: number;
  lostPatients: number;
  conversionRate: number;
  lossRate: number;
  appointmentsBooked: number;
}

interface SourcePerformanceWidgetProps {
  sourceStats: SourceStat[];
  isLoading?: boolean;
}

export function SourcePerformanceWidget({
  sourceStats = [],
  isLoading,
}: SourcePerformanceWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse border-primary/10">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Source Acquisition Performance</CardTitle>
        <CardDescription>Patient acquisition conversion rate by marketing channel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sourceStats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No source metrics available.
          </p>
        ) : (
          <div className="space-y-4">
            {sourceStats.map((source) => (
              <div key={source.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{source.name}</span>
                    <Badge variant="secondary" className="text-[10px] scale-90 origin-left">
                      {source.totalPatients} Patients
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-muted-foreground">
                    <span>{source.appointmentsBooked} Appts</span>
                    <span className="text-emerald-600 font-bold">
                      {source.conversionRate}% Conv
                    </span>
                  </div>
                </div>
                {/* Visual success bar */}
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden flex">
                  {/* Converted share */}
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${source.conversionRate}%` }}
                  />
                  {/* Lost share */}
                  <div 
                    className="bg-rose-400 h-full transition-all duration-500"
                    style={{ width: `${source.lossRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
