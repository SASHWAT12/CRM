"use client";

import { useState } from "react";
import { KpiWidget } from "./KpiWidget";
import { PipelineWidget } from "./PipelineWidget";
import { SourcePerformanceWidget } from "./SourcePerformanceWidget";
import { WorkloadWidget } from "./WorkloadWidget";
import { QueueWidget } from "./QueueWidget";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  AlertCircle, 
  UserPlus, 
  Clock, 
  ClipboardList
} from "lucide-react";
import moment from "moment";

interface CrmDashboardClientProps {
  data: any;
  staffList: any[];
  doctorList: any[];
  currentUserId: string;
}

export function CrmDashboardClient({
  data,
  staffList,
  doctorList,
  currentUserId,
}: CrmDashboardClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"overdue" | "unassigned" | "no-doctor" | "stale" | "lost-no-reason" | "today-appts" | "today-followups" | null>(null);

  const capabilities = data.capabilities || {
    canViewTeamWorkload: false,
    canViewPipelineAnalytics: false,
    canViewSourcesPerformance: false,
    canViewAlertsAndExceptions: false,
    canManageAppointments: false,
    canManageFollowups: false,
  };

  const appointments = data.appointments || {};
  const followups = data.followups || {};
  const pipeline = data.pipeline || {};
  const sources = data.sources || [];
  const workload = data.workload || {};
  const alerts = data.alerts || {};

  const openSheet = (type: typeof sheetType) => {
    setSheetType(type);
    setSheetOpen(true);
  };

  const getSheetTitle = () => {
    switch (sheetType) {
      case "overdue":
        return "Overdue Followups Queue";
      case "unassigned":
        return "Unassigned Hot Leads Queue";
      case "no-doctor":
        return "Appointments Awaiting Practitioner";
      case "stale":
        return "Stale Patients (No Next Action scheduled)";
      case "lost-no-reason":
        return "Closed Lost Patients (Reason Required)";
      case "today-appts":
        return "Today's Consultations List";
      case "today-followups":
        return "Today's Scheduled Followups";
      default:
        return "Action Queue";
    }
  };

  const getSheetDescription = () => {
    switch (sheetType) {
      case "overdue":
        return "Actionable tasks that have passed their due date. Mark completed or reschedule in-place.";
      case "unassigned":
        return "Active inquiries with no assigned counselor. Assign a counselor to begin tracking.";
      case "no-doctor":
        return "Consultations scheduled but not assigned to a doctor. Select a doctor to assign.";
      case "stale":
        return "Active patients in progress with no future followup callbacks scheduled. Schedule a task callback.";
      case "lost-no-reason":
        return "Patients marked as closed/lost with no cancellation reason recorded. Supply a reason.";
      case "today-appts":
        return "List of consultations and appointments scheduled for today.";
      case "today-followups":
        return "Follow-up tasks due today. Complete or reschedule directly.";
      default:
        return "View details and take actions in-place.";
    }
  };

  const getSheetItems = () => {
    switch (sheetType) {
      case "overdue":
        return followups.overdueList || [];
      case "unassigned":
        return alerts.unassignedList || [];
      case "no-doctor":
        return appointments.unassignedList || [];
      case "stale":
        return alerts.staleList || [];
      case "lost-no-reason":
        return alerts.missingReasonList || [];
      case "today-appts":
        return appointments.todayList || [];
      case "today-followups":
        return followups.dueTodayList || [];
      default:
        return [];
    }
  };

  const getQueueType = () => {
    if (sheetType === "today-appts") return "no-doctor";
    if (sheetType === "today-followups") return "overdue";
    return sheetType as any;
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {capabilities.canManageAppointments && (
          <KpiWidget
            title="Today's Appointments"
            value={appointments.todayCount || 0}
            icon={CalendarDays}
            description="Consultations scheduled today"
            onClick={() => openSheet("today-appts")}
            iconColorClass="text-emerald-500"
          />
        )}
        {capabilities.canManageFollowups && (
          <KpiWidget
            title="Today's Followups"
            value={followups.dueTodayCount || 0}
            icon={ClipboardList}
            description="Tasks due today"
            onClick={() => openSheet("today-followups")}
            iconColorClass="text-blue-500"
          />
        )}
        {capabilities.canManageFollowups && (
          <KpiWidget
            title="Overdue Followups"
            value={followups.overdueCount || 0}
            icon={Clock}
            description="Pending past due followups"
            onClick={() => openSheet("overdue")}
            iconColorClass={followups.overdueCount > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground"}
            colorClass={followups.overdueCount > 0 ? "bg-rose-500/5 border-rose-500/10" : ""}
          />
        )}
        <KpiWidget
          title="New Leads Today"
          value={pipeline.newTodayCount || 0}
          icon={UserPlus}
          description="Inquiries registered today"
          iconColorClass="text-violet-500"
        />
      </div>

      {/* 2. Urgent / Alerts Section */}
      {capabilities.canViewAlertsAndExceptions && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="hover:border-primary/20 cursor-pointer transition bg-amber-500/5 border-amber-500/10 shadow-sm"
            onClick={() => openSheet("unassigned")}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Unassigned Hot Leads</CardTitle>
                <div className="text-xl font-bold mt-1 text-amber-600">{alerts.unassignedCount || 0}</div>
              </div>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </CardHeader>
          </Card>

          <Card 
            className="hover:border-primary/20 cursor-pointer transition bg-rose-500/5 border-rose-500/10 shadow-sm"
            onClick={() => openSheet("stale")}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Stale Patients (No Task)</CardTitle>
                <div className="text-xl font-bold mt-1 text-rose-600">{alerts.staleCount || 0}</div>
              </div>
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </CardHeader>
          </Card>

          <Card 
            className="hover:border-primary/20 cursor-pointer transition bg-orange-500/5 border-orange-500/10 shadow-sm"
            onClick={() => openSheet("lost-no-reason")}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Lost Without Reason</CardTitle>
                <div className="text-xl font-bold mt-1 text-orange-600">{alerts.missingReasonCount || 0}</div>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </CardHeader>
          </Card>
        </div>
      )}

      {/* 3. Main Data Analytics Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Today's Work list summary */}
        <div className="space-y-6">
          <Card className="border-primary/5 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Today's Active Schedule</CardTitle>
              <CardDescription>Select lists to inspect schedule queues</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid grid-cols-2 h-9 w-full max-w-[280px]">
                  <TabsTrigger value="appointments" className="text-xs py-1">Appointments ({appointments.todayCount || 0})</TabsTrigger>
                  <TabsTrigger value="followups" className="text-xs py-1">Followups ({followups.dueTodayCount || 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="appointments" className="mt-4">
                  {appointments.todayList?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No appointments scheduled for today.</p>
                  ) : (
                    <div className="space-y-3">
                      {appointments.todayList?.slice(0, 5).map((appt: any) => (
                        <div key={appt.id} className="flex justify-between items-center p-3 rounded-lg border text-xs">
                          <div>
                            <span className="font-semibold text-primary block">
                              {appt.patient ? `${appt.patient.first_name || ""} ${appt.patient.last_name || ""}` : "No Patient"}
                            </span>
                            <span className="text-muted-foreground text-[11px] mt-0.5 block">
                              Time: {moment(appt.scheduledAt).format("hh:mm A")} | Doctor: {appt.doctor?.name || "Unassigned"}
                            </span>
                          </div>
                          <Badge variant={appt.status === "COMPLETED" ? "default" : "outline"} className="text-[10px]">
                            {appt.status}
                          </Badge>
                        </div>
                      ))}
                      {appointments.todayList?.length > 5 && (
                        <button className="text-xs font-semibold text-primary hover:underline block text-right w-full mt-2" onClick={() => openSheet("today-appts")}>
                          View all today's appointments &rarr;
                        </button>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="followups" className="mt-4">
                  {followups.dueTodayList?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No follow-ups due today.</p>
                  ) : (
                    <div className="space-y-3">
                      {followups.dueTodayList?.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex justify-between items-center p-3 rounded-lg border text-xs">
                          <div>
                            <span className="font-semibold block">{task.title}</span>
                            <span className="text-muted-foreground text-[11px] mt-0.5 block">
                              Patient: {task.crm_contact ? `${task.crm_contact.first_name || ""} ${task.crm_contact.last_name || ""}` : "None"} | Assigned: {task.assigned_user?.name || "Unassigned"}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                      {followups.dueTodayList?.length > 5 && (
                        <button className="text-xs font-semibold text-primary hover:underline block text-right w-full mt-2" onClick={() => openSheet("today-followups")}>
                          View all today's followups &rarr;
                        </button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Pipeline Funnel Widget */}
        {capabilities.canViewPipelineAnalytics && (
          <PipelineWidget
            stageCounts={pipeline.stageCounts}
            totalPatients={pipeline.totalPatients}
            conversionRate={pipeline.conversionRate}
            lossRate={pipeline.lossRate}
            recentTransitions={pipeline.recentTransitionsCount}
          />
        )}
      </div>

      {/* 4. Bottom Row: Sources and Workloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities.canViewSourcesPerformance && (
          <SourcePerformanceWidget sourceStats={sources} />
        )}
        {capabilities.canViewTeamWorkload && (
          <WorkloadWidget
            counselorWorkload={workload.counselorWorkload}
            doctorWorkload={workload.doctorWorkload}
          />
        )}
      </div>

      {/* 5. In-place sliding drill-down Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{getSheetTitle()}</SheetTitle>
            <SheetDescription>{getSheetDescription()}</SheetDescription>
          </SheetHeader>
          <QueueWidget
            type={getQueueType()}
            items={getSheetItems()}
            staffList={staffList}
            doctorList={doctorList}
            currentUserId={currentUserId}
            onActionComplete={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
