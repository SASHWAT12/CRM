import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getAppointments } from "@/actions/crm/appointments/get-appointments";
import { AppointmentFilters } from "./components/AppointmentFilters";
import { AppointmentList } from "./components/AppointmentList";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, CheckSquare } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    patientId?: string;
    search?: string;
  }>;
}

const AppointmentsPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "ALL";
  const patientId = searchParams.patientId || undefined;
  const search = searchParams.search || undefined;

  // 1. Fetch filtered appointments for the table
  const appointments = await getAppointments({ status, patientId, search });

  // 2. Fetch all appointments to calculate metrics
  const allAppointments = await getAppointments({ status: "ALL", patientId });

  const now = new Date();

  // Metrics:
  // - Pending/Scheduled (SCHEDULED, CONFIRMED, RESCHEDULED)
  const scheduledCount = allAppointments.filter((a: any) =>
    a.status === "SCHEDULED" || a.status === "CONFIRMED" || a.status === "RESCHEDULED"
  ).length;

  // - Completed
  const completedCount = allAppointments.filter((a: any) => a.status === "COMPLETED").length;

  // - Due Today (not completed/cancelled and scheduled for today)
  const dueTodayCount = allAppointments.filter((a: any) => {
    if (a.status === "COMPLETED" || a.status === "CANCELLED") return false;
    const d = new Date(a.scheduledAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  return (
    <Container
      title="Appointments Workspace"
      description="Book, track, and manage patient consultations and doctor assignments"
    >
      <div className="space-y-6">
        {/* Metrics Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scheduled Appointments
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
              <p className="text-[10px] text-muted-foreground">Upcoming consultations</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Consultations Due Today
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{dueTodayCount}</div>
              <p className="text-[10px] text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed Appointments
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <p className="text-[10px] text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Controls & Filters */}
        <Suspense fallback={<div>Loading filters...</div>}>
          <AppointmentFilters />
        </Suspense>

        {/* Appointments List */}
        <Suspense fallback={<CrmTableSkeleton />}>
          <AppointmentList data={appointments as any} />
        </Suspense>
      </div>
    </Container>
  );
};

export default AppointmentsPage;
