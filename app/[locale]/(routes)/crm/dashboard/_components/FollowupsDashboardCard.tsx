"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NewPatientFollowupForm from "../../patients/[patientId]/components/NewPatientFollowupForm";
import { CalendarDays, CheckSquare, AlertCircle, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FollowupsDashboardCardProps {
  tasks: any[];
}

export default function FollowupsDashboardCard({ tasks }: FollowupsDashboardCardProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const pendingCount = tasks.filter((t: any) => t.taskStatus !== "COMPLETE").length;
  const overdueCount = tasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    return new Date(t.dueDateAt) < todayStart;
  }).length;
  const dueTodayCount = tasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    const d = new Date(t.dueDateAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const router = useRouter();

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-md border-primary/10 cursor-pointer"
      onClick={() => router.push("/crm/followups")}
    >
      <CardHeader className="pb-2" onClick={(e) => {
        // Prevent click when user interacts with anything else in header if needed, 
        // but sheet trigger is handled below.
      }}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">Followups Summary</CardTitle>
            <CardDescription>Track patient followup activities</CardDescription>
          </div>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" className="gap-1 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Add Followup</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create new Followup</SheetTitle>
                <SheetDescription>
                  Create a new followup for any patient with assigned user, due date, and priority
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <NewPatientFollowupForm
                  onFinish={() => setCreateOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg border text-center">
            <CheckSquare className="h-5 w-5 text-emerald-500 mb-1" />
            <span className="text-2xl font-extrabold text-emerald-600">{pendingCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pending</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg border text-center">
            <AlertCircle className={`h-5 w-5 mb-1 ${overdueCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
            <span className={`text-2xl font-extrabold ${overdueCount > 0 ? "text-destructive" : ""}`}>{overdueCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Overdue</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg border text-center">
            <CalendarDays className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-2xl font-extrabold text-blue-600">{dueTodayCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Due Today</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Link
            href="/crm/followups"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View All Followups</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
