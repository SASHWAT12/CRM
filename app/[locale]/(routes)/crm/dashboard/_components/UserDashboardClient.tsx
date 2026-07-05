"use client";

import { KpiWidget } from "./KpiWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckSquare, ClipboardList, Clock, Check } from "lucide-react";
import Link from "next/link";
import moment from "moment";
import { useState } from "react";
import { updateFollowup } from "@/actions/crm/followups/update-followup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserDashboardClientProps {
  data: any;
}

export function UserDashboardClient({ data }: UserDashboardClientProps) {
  const router = useRouter();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const kpis = data.personal?.kpis || {
    openFollowups: 0,
    todayAppointments: 0,
    assignedPatients: 0,
    overdueItems: 0,
  };

  const lists = data.personal?.lists || {
    followups: [],
    appointments: [],
    patients: [],
    overdue: [],
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      const res = await updateFollowup({ id: taskId, taskStatus: "COMPLETE" });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Followup marked as complete");
        router.refresh();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiWidget
          title="My Open Followups"
          value={kpis.openFollowups}
          icon={ClipboardList}
          iconColorClass="text-blue-500"
        />
        <KpiWidget
          title="My Appointments Today"
          value={kpis.todayAppointments}
          icon={CalendarDays}
          iconColorClass="text-emerald-500"
        />
        <KpiWidget
          title="My Assigned Patients"
          value={kpis.assignedPatients}
          icon={CheckSquare}
          iconColorClass="text-violet-500"
        />
        <KpiWidget
          title="My Overdue Items"
          value={kpis.overdueItems}
          icon={Clock}
          iconColorClass={kpis.overdueItems > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground"}
          colorClass={kpis.overdueItems > 0 ? "bg-rose-500/5 border-rose-500/10" : ""}
        />
      </div>

      {/* 2. Overdue Followups Alerts */}
      {lists.overdue.length > 0 && (
        <Card className="border-rose-500/20 bg-rose-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <Clock className="h-4 w-4 text-rose-500 animate-bounce" />
              <span>Action Required: You have {lists.overdue.length} overdue followups</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {lists.overdue.slice(0, 3).map((task: any) => (
                <div key={task.id} className="flex justify-between items-center p-2 rounded bg-background border text-xs">
                  <div>
                    <span className="font-semibold block">{task.title}</span>
                    <span className="text-muted-foreground text-[10px]">
                      Patient: {task.crm_contact ? `${task.crm_contact.first_name || ""} ${task.crm_contact.last_name || ""}` : "None"} | Due: {moment(task.dueDateAt).format("MMM DD, YYYY")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1 px-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                    disabled={completingId === task.id}
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    <Check className="h-3 w-3" />
                    <span>Complete</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Operational lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Followups */}
        <Card className="border-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">My Followup Tasks</CardTitle>
            <CardDescription>Your pending patient follow-up duties</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.followups.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No active followups.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Task</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Priority</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.followups.slice(0, 8).map((task: any) => (
                    <TableRow key={task.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs max-w-[180px] truncate">
                        <Link href={`/crm/followups/viewfollowup/${task.id}`} className="hover:underline text-primary">
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-[9px] uppercase tracking-wider scale-90 py-0">
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-medium text-xs">
                        {moment(task.dueDateAt).format("MMM DD, YYYY")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* My Appointments */}
        <Card className="border-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">My Consultations & Appts</CardTitle>
            <CardDescription>Your scheduled clinical consultations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.appointments.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No consultations scheduled.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Patient</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Status</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Scheduled At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.appointments.slice(0, 8).map((appt: any) => (
                    <TableRow key={appt.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs">
                        {appt.patient ? (
                          <Link href={`/crm/patients/${appt.patient.id}`} className="hover:underline text-primary">
                            {appt.patient.first_name || ""} {appt.patient.last_name || ""}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <Badge variant={appt.status === "COMPLETED" ? "default" : "secondary"} className="text-[9px] uppercase tracking-wider scale-90 py-0">
                          {appt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-medium text-xs">
                        {moment(appt.scheduledAt).format("MMM DD, hh:mm A")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Active Patients assigned to me */}
      <Card className="border-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">My Active Patients</CardTitle>
          <CardDescription>Prospective patients currently assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {lists.patients.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">No patients currently assigned to you.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Name</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Stage</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Email</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.patients.slice(0, 10).map((patient: any) => (
                  <TableRow key={patient.id} className="hover:bg-muted/5">
                    <TableCell className="py-2 text-xs font-semibold">
                      <Link href={`/crm/patients/${patient.id}`} className="hover:underline text-primary">
                        {patient.first_name || ""} {patient.last_name || ""}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {patient.pipelineStage}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {patient.email || "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {patient.mobile_phone || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
