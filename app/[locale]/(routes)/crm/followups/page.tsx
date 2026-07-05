import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getFollowups } from "@/actions/crm/followups/get-followups";
import { FollowupsWorkbenchClient } from "./components/FollowupsWorkbenchClient";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { requireAuthenticated } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    queue?: string;
    search?: string;
    userId?: string;
    priority?: string;
    skip?: string;
    take?: string;
  }>;
}

const FollowupsPage = async (props: PageProps) => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || "DUE_TODAY";
  const search = searchParams.search || undefined;
  const userId = searchParams.userId || undefined;
  const priority = searchParams.priority || undefined;
  const skip = searchParams.skip ? Number(searchParams.skip) : 0;
  const take = searchParams.take ? Number(searchParams.take) : 50;

  const userAuthz = await requireAuthenticated();
  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");

  // Scoped User query filters for counts
  const userScopeFilter = isManager ? {} : { user: session.user.id };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Fetch counts, staff lists, and tasks in parallel on the server
  const [
    followupsResult,
    staffList,
    pendingCount,
    overdueCount,
    dueTodayCount,
    completedTodayCount,
    totalCount,
    recentCompleted,
    recentRescheduled
  ] = await Promise.all([
    getFollowups({ queue, status: "ALL", skip, take, userId, priority }),
    prismadb.users.findMany({
      where: {
        role: { in: ["admin", "manager", "counsellor", "receptionist"] },
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
    // Count active pending tasks
    prismadb.crm_Accounts_Tasks.count({
      where: {
        ...userScopeFilter,
        taskStatus: "ACTIVE",
      },
    }),
    // Count overdue tasks
    prismadb.crm_Accounts_Tasks.count({
      where: {
        ...userScopeFilter,
        taskStatus: "ACTIVE",
        dueDateAt: { lt: todayStart },
      },
    }),
    // Count due today tasks
    prismadb.crm_Accounts_Tasks.count({
      where: {
        ...userScopeFilter,
        taskStatus: "ACTIVE",
        dueDateAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Count completed today tasks
    prismadb.crm_Accounts_Tasks.count({
      where: {
        ...userScopeFilter,
        taskStatus: "COMPLETE",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Count total tasks
    prismadb.crm_Accounts_Tasks.count({
      where: {
        ...userScopeFilter,
      },
    }),
    // Recent completed tasks today for activity panel
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        ...userScopeFilter,
        taskStatus: "COMPLETE",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        crm_contact: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
    // Recent active tasks that were updated today (rescheduled) for activity panel
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        ...userScopeFilter,
        taskStatus: "ACTIVE",
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const counts = {
    pending: pendingCount,
    overdue: overdueCount,
    dueToday: dueTodayCount,
    completedToday: completedTodayCount,
    total: totalCount,
  };

  return (
    <Container
      title="Callback Inbox"
      description="Track and manage followup tasks, due dates, and practitioner assignments"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <FollowupsWorkbenchClient
          data={followupsResult.tasks as any}
          users={staffList}
          counts={counts}
          recentCompleted={recentCompleted}
          recentRescheduled={recentRescheduled}
        />
      </Suspense>
    </Container>
  );
};

export default FollowupsPage;
