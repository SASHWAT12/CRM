"use client";

import React, { useState } from "react";
import { KpiWidget } from "./KpiWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Clock,
  Check,
  UserCheck,
  Users,
  Settings,
  ShieldAlert,
  FileText,
  UserPlus,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import { updateFollowup } from "@/actions/crm/followups/update-followup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserDashboardClientProps {
  data: {
    role: string;
    payload: any;
  };
}

export function UserDashboardClient({ data }: UserDashboardClientProps) {
  const role = data.role || "user";
  const payload = data.payload || {};

  if (role === "doctor") {
    return <DoctorDashboardView data={payload} />;
  }

  if (role === "receptionist") {
    return <ReceptionistDashboardView data={payload} />;
  }

  if (role === "admin" || role === "root" || role === "manager") {
    return <AdminDashboardView data={payload} />;
  }

  // Default: Counselor / General Staff View
  return <CounselorDashboardView data={payload} />;
}

/* ==========================================================================
   DOCTOR DASHBOARD VIEW
   ========================================================================== */
function DoctorDashboardView({ data }: { data: any }) {
  const kpis = data.kpis || { todayAppointments: 0, waitingPatients: 0, completedToday: 0 };
  const schedule = data.schedule || [];
  const nextAppt = data.nextAppointment;

  return (
    <div className="space-y-6">
      {/* Doctor Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm">Clinical Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/crm/appointments">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Today's Schedule</span>
            </Link>
          </Button>
          <Button size="sm" variant="default" asChild className="text-xs gap-1.5">
            <Link href="/crm/patients/registry">
              <Users className="h-3.5 w-3.5" />
              <span>Patient Registry</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiWidget
          title="Today's Consultations"
          value={kpis.todayAppointments}
          icon={CalendarDays}
          iconColorClass="text-emerald-500"
        />
        <KpiWidget
          title="Waiting / Active Patients"
          value={kpis.waitingPatients}
          icon={Clock}
          iconColorClass="text-amber-500"
        />
        <KpiWidget
          title="Completed Today"
          value={kpis.completedToday}
          icon={CheckSquare}
          iconColorClass="text-blue-500"
        />
      </div>

      {/* Next Appointment Alert Banner */}
      {nextAppt && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Clock className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>Next Scheduled Consultation</span>
              </div>
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-700">
                {moment(nextAppt.scheduledAt).format("hh:mm A")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div>
              <span className="font-bold text-base block">
                {nextAppt.patient ? `${nextAppt.patient.first_name || ""} ${nextAppt.patient.last_name || ""}` : "Unspecified Patient"}
              </span>
              <span className="text-xs text-muted-foreground">
                Phone: {nextAppt.patient?.mobile_phone || "—"} | Scheduled At: {moment(nextAppt.scheduledAt).format("MMM DD, hh:mm A")}
              </span>
            </div>
            {nextAppt.patient && (
              <Button size="sm" variant="default" asChild className="gap-1 text-xs">
                <Link href={`/crm/patients/${nextAppt.patient.id}`}>
                  <span>View Patient File</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Clinical Schedule */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Today's Clinical Schedule</CardTitle>
          <CardDescription>Scheduled consultations assigned to you today</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {schedule.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">No consultations scheduled for today.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Patient Name</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Status</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Time</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((appt: any) => (
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
                      <Badge variant={appt.status === "COMPLETED" ? "default" : "secondary"} className="text-[9px] uppercase">
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-medium text-xs">
                      {moment(appt.scheduledAt).format("hh:mm A")}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      {appt.patient && (
                        <Button size="sm" variant="ghost" asChild className="h-6 text-[10px] px-2">
                          <Link href={`/crm/patients/${appt.patient.id}`}>Open File</Link>
                        </Button>
                      )}
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

/* ==========================================================================
   RECEPTIONIST DASHBOARD VIEW
   ========================================================================== */
function ReceptionistDashboardView({ data }: { data: any }) {
  const kpis = data.kpis || { todayAppointments: 0, tomorrowAppointments: 0, pendingCheckIns: 0, missedReschedules: 0 };
  const schedule = data.schedule || [];

  return (
    <div className="space-y-6">
      {/* Front-Desk Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm">Front-Desk Operations</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" asChild className="text-xs gap-1.5">
            <Link href="/crm/appointments">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/crm/appointments/registry">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Full Schedule</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/crm/patients/registry">
              <Users className="h-3.5 w-3.5" />
              <span>Patients Registry</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiWidget
          title="Today's Appointments"
          value={kpis.todayAppointments}
          icon={CalendarDays}
          iconColorClass="text-emerald-500"
        />
        <KpiWidget
          title="Tomorrow's Schedule"
          value={kpis.tomorrowAppointments}
          icon={CalendarDays}
          iconColorClass="text-blue-500"
        />
        <KpiWidget
          title="Pending Check-Ins"
          value={kpis.pendingCheckIns}
          icon={Clock}
          iconColorClass="text-amber-500"
        />
        <KpiWidget
          title="Missed / Reschedule Needed"
          value={kpis.missedReschedules}
          icon={ShieldAlert}
          iconColorClass={kpis.missedReschedules > 0 ? "text-rose-500" : "text-muted-foreground"}
        />
      </div>

      {/* Front-Desk Schedule */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Front-Desk Schedule (Today & Tomorrow)</CardTitle>
          <CardDescription>Scheduled consultations requiring arrival management</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {schedule.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">No upcoming appointments recorded.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Patient Name</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase">Assigned Doctor</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Status</TableHead>
                  <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Scheduled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((appt: any) => (
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
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {appt.doctor?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge variant={appt.status === "COMPLETED" ? "default" : "secondary"} className="text-[9px] uppercase">
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
  );
}

/* ==========================================================================
   COUNSELOR DASHBOARD VIEW
   ========================================================================== */
function CounselorDashboardView({ data }: { data: any }) {
  const router = useRouter();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const kpis = data.kpis || { overdueFollowups: 0, dueTodayFollowups: 0, assignedPatients: 0, conversions: 0 };
  const lists = data.lists || { overdue: [], followups: [], patients: [] };

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
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Counselor Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm">Counselor Followup Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" asChild className="text-xs gap-1.5">
            <Link href="/crm/followups">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Followups Queue</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/crm/patients">
              <Users className="h-3.5 w-3.5" />
              <span>Assigned Patients</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiWidget
          title="Overdue Followups"
          value={kpis.overdueFollowups}
          icon={Clock}
          iconColorClass={kpis.overdueFollowups > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground"}
          colorClass={kpis.overdueFollowups > 0 ? "bg-rose-500/5 border-rose-500/10" : ""}
        />
        <KpiWidget
          title="Due Today"
          value={kpis.dueTodayFollowups}
          icon={ClipboardList}
          iconColorClass="text-blue-500"
        />
        <KpiWidget
          title="My Assigned Patients"
          value={kpis.assignedPatients}
          icon={Users}
          iconColorClass="text-violet-500"
        />
        <KpiWidget
          title="My Conversions"
          value={kpis.conversions}
          icon={CheckSquare}
          iconColorClass="text-emerald-500"
        />
      </div>

      {/* Overdue Alert Banner */}
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
              {lists.overdue.map((task: any) => (
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

      {/* Followups & Patients Dual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Followups */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">My Pending Followups</CardTitle>
            <CardDescription>Active followup tasks requiring action</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.followups.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No active followups.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Task Title</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Priority</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.followups.map((task: any) => (
                    <TableRow key={task.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs max-w-[180px] truncate">
                        <Link href={`/crm/followups/viewfollowup/${task.id}`} className="hover:underline text-primary">
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-[9px] uppercase scale-90 py-0">
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

        {/* Assigned Patients */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">My Assigned Patients</CardTitle>
            <CardDescription>Active prospects assigned to your queue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.patients.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No patients assigned.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Patient Name</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.patients.map((patient: any) => (
                    <TableRow key={patient.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs">
                        <Link href={`/crm/patients/${patient.id}`} className="hover:underline text-primary">
                          {patient.first_name || ""} {patient.last_name || ""}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[9px] scale-90">
                          {patient.pipelineStage}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ==========================================================================
   ADMIN DASHBOARD VIEW
   ========================================================================== */
function AdminDashboardView({ data }: { data: any }) {
  const kpis = data.kpis || { activeUsers: 0, totalOverdueItems: 0, todayAppointments: 0, activePatients: 0 };
  const lists = data.lists || { overdueBacklog: [], users: [] };

  return (
    <div className="space-y-6">
      {/* Admin Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-sm">System Administration & Operational Oversight</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" asChild className="text-xs gap-1.5">
            <Link href="/admin/users">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Manage & Invite Users</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/admin/crm-settings">
              <Settings className="h-3.5 w-3.5" />
              <span>CRM Settings</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/reports">
              <FileText className="h-3.5 w-3.5" />
              <span>System Reports</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiWidget
          title="Active System Staff"
          value={kpis.activeUsers}
          icon={Users}
          iconColorClass="text-blue-500"
        />
        <KpiWidget
          title="Hospital Today Appts"
          value={kpis.todayAppointments}
          icon={CalendarDays}
          iconColorClass="text-emerald-500"
        />
        <KpiWidget
          title="Active Patients"
          value={kpis.activePatients}
          icon={CheckSquare}
          iconColorClass="text-violet-500"
        />
        <KpiWidget
          title="Total Overdue Items"
          value={kpis.totalOverdueItems}
          icon={Clock}
          iconColorClass={kpis.totalOverdueItems > 0 ? "text-rose-500" : "text-muted-foreground"}
        />
      </div>

      {/* Admin Dual Oversight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hospital Overdue Backlog */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Hospital Overdue Backlog</CardTitle>
            <CardDescription>Overdue followup tasks across all operational queues</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.overdueBacklog.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No overdue tasks system-wide.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Task Title</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Patient</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.overdueBacklog.map((task: any) => (
                    <TableRow key={task.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs max-w-[180px] truncate">
                        {task.title}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        {task.crm_contact ? `${task.crm_contact.first_name || ""} ${task.crm_contact.last_name || ""}` : "Unspecified"}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-medium text-xs text-rose-600">
                        {moment(task.dueDateAt).format("MMM DD, YYYY")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Active Staff Directory */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Active Staff Directory</CardTitle>
            <CardDescription>Active user accounts registered in the CRM</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lists.users.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center">No active users found.</p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Staff Name</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Role</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.users.map((u: any) => (
                    <TableRow key={u.id} className="hover:bg-muted/5">
                      <TableCell className="py-2.5 font-semibold text-xs">
                        {u.name}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Badge variant="default" className="text-[9px] uppercase bg-emerald-600">
                          {u.userStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
