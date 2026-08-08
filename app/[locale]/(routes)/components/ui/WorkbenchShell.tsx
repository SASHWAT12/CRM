"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QueueSelector {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  description?: string;
  variant?: "default" | "warning" | "success" | "info" | "danger";
}

interface WorkbenchShellProps {
  moduleTitle: string;
  moduleIdentity: string;
  
  // Summary KPI / Queue Cards
  queues: QueueSelector[];
  activeQueue: string;
  onQueueSelect: (queueId: string) => void;

  // Actions (Create, Resume, Browse)
  createActions?: React.ReactNode;
  resumeActions?: React.ReactNode;
  browseActions?: React.ReactNode;

  // Search & Filters slot
  filters?: React.ReactNode;

  // Workspace area slot
  children: React.ReactNode;

  // Recent Activity slot
  recentActivity?: React.ReactNode;
}

export function WorkbenchShell({
  moduleTitle,
  moduleIdentity,
  queues,
  activeQueue,
  onQueueSelect,
  createActions,
  resumeActions,
  browseActions,
  filters,
  children,
  recentActivity,
}: WorkbenchShellProps) {
  return (
    <div className="space-y-6">
      {/* Module Title & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border rounded-lg p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">{moduleTitle}</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
            {moduleIdentity}
          </p>
        </div>

        {/* Unified CREATE -> RESUME -> BROWSE action bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {createActions && (
            <div className="flex items-center gap-1 border-r pr-2 border-border/60">
              {createActions}
            </div>
          )}
          {resumeActions && (
            <div className="flex items-center gap-1 px-1">
              {resumeActions}
            </div>
          )}
          {browseActions && (
            <div className="flex items-center gap-1 pl-2 border-l border-border/60">
              {browseActions}
            </div>
          )}
        </div>
      </div>

      {/* Primary Queue Selectors (Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {queues.map((q) => {
          const isActive = activeQueue === q.id;
          
          let cardColor = "hover:border-primary/30";
          let textColor = "text-primary";
          if (isActive) {
            cardColor = "bg-primary/5 ring-1 ring-primary/20 border-primary/20";
          }
          if (q.variant === "danger") {
            cardColor = isActive 
              ? "bg-rose-500/5 ring-1 ring-rose-500/20 border-rose-500/20" 
              : "hover:border-rose-500/30";
            textColor = "text-rose-600";
          } else if (q.variant === "warning") {
            cardColor = isActive 
              ? "bg-amber-500/5 ring-1 ring-amber-500/20 border-amber-500/20" 
              : "hover:border-amber-500/30";
            textColor = "text-amber-600";
          } else if (q.variant === "success") {
            cardColor = isActive 
              ? "bg-emerald-500/5 ring-1 ring-emerald-500/20 border-emerald-500/20" 
              : "hover:border-emerald-500/30";
            textColor = "text-emerald-600";
          }

          return (
            <Card
              key={q.id}
              onClick={() => onQueueSelect(q.id)}
              className={cn(
                "transition-all duration-300 hover:shadow-md cursor-pointer border shadow-sm",
                cardColor
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {q.label}
                </CardTitle>
                {q.icon && <span className="text-muted-foreground">{q.icon}</span>}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className={cn("text-xl font-bold", textColor)}>
                  {typeof q.count === "number" ? q.count : "—"}
                </div>
                {q.description && (
                  <p className="text-[9px] text-muted-foreground mt-0.5">{q.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Workspace with Sidebar Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Workspace Operations View */}
        <div className="lg:col-span-3 space-y-4">
          {filters && (
            <div className="p-4 border rounded-lg bg-muted/10 shadow-sm flex items-center justify-between gap-4">
              <div className="flex-1">{filters}</div>
            </div>
          )}
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        </div>

        {/* Lightweight Recent Activity feed panel */}
        {recentActivity && (
          <div className="lg:col-span-1">
            <Card className="border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b bg-muted/5">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {recentActivity}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
