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
    <Link href={kpi.href ? (dateParams ? `${kpi.href}?${dateParams}` : kpi.href) : "#"}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <span>{kpi.label}</span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </CardTitle>
          {kpi.changePercent !== 0 && (
            <div className={`flex items-center text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : isZero ? <Minus className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{Math.abs(kpi.changePercent)}%</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(kpi.value, kpi.label)}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
