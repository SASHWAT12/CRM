import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getOperationalDashboardData(userId: string, role: string) {
  const normalizedRole = (role || "user").toLowerCase();
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();

  const isManagement = ["admin", "root", "manager"].includes(normalizedRole);
  const isCounselor = ["counsellor", "counselor"].includes(normalizedRole);
  const isReceptionist = normalizedRole === "receptionist";
  const isDoctor = normalizedRole === "doctor";

  const capabilities = {
    canViewTeamWorkload: isManagement,
    canViewPipelineAnalytics: isManagement || isCounselor,
    canViewSourcesPerformance: isManagement || isCounselor,
    canViewAlertsAndExceptions: isManagement || isCounselor || isReceptionist,
    canManageAppointments: true,
    canManageFollowups: !isDoctor,
  };

  const apptWhereToday: any = {
    scheduledAt: { gte: startOfToday, lte: endOfToday },
    status: { not: "CANCELLED" },
  };
  if (isDoctor) apptWhereToday.doctorId = userId;

  const [
    todayApptsCount,
    todayApptsList,
    dueTodayFollowupsCount,
    dueTodayFollowupsList,
    overdueFollowupsCount,
    overdueFollowupsList,
    newLeadsTodayCount,
    pipelineStagesCounts,
    leadSourcesRaw,
    counselorWorkloadRaw,
    unassignedLeadsCount,
    unassignedLeadsList,
    stalePatientsList,
    missingReasonList,
  ] = await Promise.all([
    // 1. Today's appointments count
    prismadb.crm_Appointments.count({ where: apptWhereToday }),

    // 2. Today's appointments list
    prismadb.crm_Appointments.findMany({
      where: apptWhereToday,
      include: {
        patient: { select: { id: true, first_name: true, last_name: true, mobile_phone: true } },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),

    // 3. Today's followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { gte: startOfToday, lte: endOfToday },
        ...(isManagement ? {} : { user: userId }),
      },
    }),

    // 4. Today's followups list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { gte: startOfToday, lte: endOfToday },
        ...(isManagement ? {} : { user: userId }),
      },
      include: {
        crm_contact: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { dueDateAt: "asc" },
      take: 10,
    }),

    // 5. Overdue followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
        ...(isManagement ? {} : { user: userId }),
      },
    }),

    // 6. Overdue followups list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
        ...(isManagement ? {} : { user: userId }),
      },
      include: {
        crm_contact: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { dueDateAt: "asc" },
      take: 10,
    }),

    // 7. New leads registered today
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: startOfToday, lte: endOfToday }, deletedAt: null },
    }),

    // 8. Pipeline stage distribution
    prismadb.crm_Contacts.groupBy({
      by: ["pipelineStage"],
      where: { deletedAt: null },
      _count: { id: true },
    }),

    // 9. Lead sources performance
    prismadb.crm_Leads.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      select: { lead_source: { select: { name: true } } },
    }),

    // 10. Counselor workload (pending tasks per staff user)
    prismadb.crm_Accounts_Tasks.groupBy({
      by: ["user"],
      where: { taskStatus: { not: "COMPLETE" } },
      _count: { id: true },
    }),

    // 11. Unassigned hot leads count
    prismadb.crm_Leads.count({
      where: { assigned_to: null, deletedAt: null },
    }),

    // 12. Unassigned hot leads list
    prismadb.crm_Leads.findMany({
      where: { assigned_to: null, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // 13. Stale patients (Active patients in progress with no upcoming task)
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
        tasks: { none: { taskStatus: { not: "COMPLETE" } } },
      },
      select: { id: true, first_name: true, last_name: true, pipelineStage: true },
      take: 10,
    }),

    // 14. Closed lost patients missing cancellation reason
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: "CLOSED_LOST",
        description: null,
        deletedAt: null,
      },
      select: { id: true, first_name: true, last_name: true, created_on: true },
      take: 10,
    }),
  ]);

  // Aggregate lead sources counts
  const sourceCounts: Record<string, number> = {};
  for (const item of leadSourcesRaw) {
    const sName = item.lead_source?.name || "Direct / Walk-in";
    sourceCounts[sName] = (sourceCounts[sName] || 0) + 1;
  }
  const sourcesPayload = Object.entries(sourceCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Aggregate counselor workload
  const staffUserIds = Array.from(new Set(counselorWorkloadRaw.map((item) => item.user).filter(Boolean)));
  const staffUsers = await prismadb.users.findMany({
    where: { id: { in: staffUserIds as string[] } },
    select: { id: true, name: true },
  });
  const staffMap = new Map(staffUsers.map((u) => [u.id, u.name || "Counselor"]));

  const workloadMap: Record<string, { counselorId: string; counselorName: string; pending: number; overdue: number }> = {};
  for (const item of counselorWorkloadRaw) {
    if (!item.user) continue;
    if (!workloadMap[item.user]) {
      workloadMap[item.user] = {
        counselorId: item.user,
        counselorName: staffMap.get(item.user) || "Counselor",
        pending: 0,
        overdue: 0,
      };
    }
    workloadMap[item.user].pending += item._count.id;
  }
  const counselorsWorkload = Object.values(workloadMap);

  return {
    capabilities,
    appointments: {
      todayCount: todayApptsCount,
      todayList: todayApptsList,
      unassignedList: [], // Appointments require assigned doctors per architecture
    },
    followups: {
      dueTodayCount: dueTodayFollowupsCount,
      dueTodayList: dueTodayFollowupsList,
      overdueCount: overdueFollowupsCount,
      overdueList: overdueFollowupsList,
    },
    pipeline: {
      newTodayCount: newLeadsTodayCount,
      stagesDistribution: pipelineStagesCounts.map((item) => ({
        stage: item.pipelineStage || "NEW",
        count: item._count.id,
      })),
    },
    sources: sourcesPayload,
    workload: {
      counselorsWorkload,
    },
    alerts: {
      unassignedCount: unassignedLeadsCount,
      unassignedList: unassignedLeadsList.map((lead) => ({
        id: lead.id,
        first_name: lead.firstName,
        last_name: lead.lastName,
        createdAt: lead.createdAt,
      })),
      staleCount: stalePatientsList.length,
      staleList: stalePatientsList,
      missingReasonCount: missingReasonList.length,
      missingReasonList: missingReasonList,
    },
  };
}
