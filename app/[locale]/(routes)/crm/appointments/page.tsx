import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getAppointments } from "@/actions/crm/appointments/get-appointments";
import { AppointmentsWorkbenchClient } from "./components/AppointmentsWorkbenchClient";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { requireAuthenticated } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { CRM_POLICY } from "@/lib/policies/crm-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    queue?: string;
    search?: string;
    doctorId?: string;
  }>;
}

const AppointmentsPage = async (props: PageProps) => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || "TODAY";
  const search = searchParams.search || undefined;
  const doctorId = searchParams.doctorId || undefined;

  const userAuthz = await requireAuthenticated();
  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");

  // Scoped User query filters for counts
  const userScopeFilter = isManager ? {} : { OR: [{ doctorId: session.user.id }, { staffId: session.user.id }] };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startOfTomorrow = new Date();
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date();
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // Fetch counts, doctors list, and appointments dataset in parallel
  const [
    appointments,
    doctorsList,
    todayCount,
    tomorrowCount,
    completedTodayCount,
    cancelledTodayCount,
    recentCompleted,
    recentCancelled
  ] = await Promise.all([
    getAppointments({ queue, search, doctorId }),
    prismadb.users.findMany({
      where: {
        role: "doctor",
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
    // Count today's schedule
    prismadb.crm_Appointments.count({
      where: {
        ...userScopeFilter,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Count tomorrow's schedule
    prismadb.crm_Appointments.count({
      where: {
        ...userScopeFilter,
        scheduledAt: { gte: startOfTomorrow, lte: endOfTomorrow },
      },
    }),
    // Count completed today
    prismadb.crm_Appointments.count({
      where: {
        ...userScopeFilter,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Count cancelled today
    prismadb.crm_Appointments.count({
      where: {
        ...userScopeFilter,
        status: { in: ["CANCELLED", "NO_SHOW"] },
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Recent completed today for activity panel
    prismadb.crm_Appointments.findMany({
      where: {
        ...userScopeFilter,
        status: "COMPLETED",
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        doctor: {
          select: {
            name: true,
          },
        },
      },
    }),
    // Recent cancelled today for activity panel
    prismadb.crm_Appointments.findMany({
      where: {
        ...userScopeFilter,
        status: { in: ["CANCELLED", "NO_SHOW"] },
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
  ]);

  const counts = {
    today: todayCount,
    tomorrow: tomorrowCount,
    completed: completedTodayCount,
    cancelled: cancelledTodayCount,
  };

  return (
    <Container
      title="Daily Schedule Board"
      description="Book, track, and manage patient consultations and doctor assignments"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <AppointmentsWorkbenchClient
          data={appointments}
          doctors={doctorsList}
          counts={counts}
          recentCompleted={recentCompleted}
          recentCancelled={recentCancelled}
        />
      </Suspense>
    </Container>
  );
};

export default AppointmentsPage;
