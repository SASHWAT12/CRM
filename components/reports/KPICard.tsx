"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, ExternalLink } from "lucide-react";
import type { KPIData } from "@/actions/reports/types";

function formatValue(value: number, label: string): string {
  if (label.includes("(%)") || label.toLowerCase().includes("rate")) {
    return `${value}%`;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export function KPICard({ kpi, dateParams }: { kpi: KPIData; dateParams: string; displayCurrency?: string }) {
  const isPositive = kpi.changePercent > 0;
  const isZero = kpi.changePercent === 0;

  return (
    <Link href={kpi.href ? (dateParams ? `${kpi.href}?${dateParams}` : kpi.href) : "#"} className="block h-full">
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-border h-full flex flex-col justify-between">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-start gap-1 min-w-0 flex-1">
            <span className="min-w-0 flex-1 break-words whitespace-normal leading-tight" title={kpi.label}>{kpi.label}</span>
          </CardTitle>
          <ExternalLink className="h-3 w-3 opacity-50 shrink-0 mt-0.5" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline justify-between gap-2 mt-auto">
            <div className="text-2xl font-bold">{formatValue(kpi.value, kpi.label)}</div>
            {kpi.changePercent !== 0 && (
              <div className={`flex items-center text-xs font-bold shrink-0 whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {isPositive ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> : isZero ? <Minus className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
                <span>{Math.abs(kpi.changePercent)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
