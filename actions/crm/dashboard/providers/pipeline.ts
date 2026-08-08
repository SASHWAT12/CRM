import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getPipelineData() {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();
  const sevenDaysAgo = moment().subtract(7, "days").startOf("day").toDate();

  const [
    newTodayCount,
    newTodayList,
    convertedTodayCount,
    convertedTodayList,
    lostTodayCount,
    lostTodayList,
    stageCounts,
    stageMovements,
  ] = await Promise.all([
    // New today count
    prismadb.crm_Contacts.count({
      where: {
        created_on: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
    }),
    // New today list
    prismadb.crm_Contacts.findMany({
      where: {
        created_on: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
      include: {
        assigned_to_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_on: "desc" },
    }),
    // Converted today count
    prismadb.crm_Contacts.count({
      where: {
        pipelineStage: "CONVERTED",
        updatedAt: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
    }),
    // Converted today list
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: "CONVERTED",
        updatedAt: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
      include: {
        assigned_to_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // Closed lost today count
    prismadb.crm_Contacts.count({
      where: {
        pipelineStage: "CLOSED_LOST",
        updatedAt: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
    }),
    // Closed lost today list
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: "CLOSED_LOST",
        updatedAt: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
      include: {
        assigned_to_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // Patient counts grouped by pipeline stage
    prismadb.crm_Contacts.groupBy({
      by: ["pipelineStage"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    // Stage movements from audit logs
    prismadb.crm_AuditLog.findMany({
      where: {
        entityType: "contact",
        action: "updated",
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        changes: true,
      },
    }),
  ]);

  // Format stage counts
  const stagesOrder = [
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "CONSULTATION_BOOKED",
    "VISITED",
    "TREATMENT_STARTED",
    "CONVERTED",
    "CLOSED_LOST",
  ];
  
  const stageMap = new Map(
    stageCounts.map((sc) => [sc.pipelineStage ?? "NEW", sc._count.id])
  );

  const formattedStageCounts = stagesOrder.map((stage) => ({
    stage,
    count: stageMap.get(stage) ?? 0,
  }));

  const totalPatients = stageCounts.reduce((acc, sc) => acc + sc._count.id, 0);
  const totalConverted = stageMap.get("CONVERTED") ?? 0;
  const totalLost = stageMap.get("CLOSED_LOST") ?? 0;

  const conversionRate =
    totalPatients > 0
      ? parseFloat(((totalConverted / totalPatients) * 100).toFixed(2))
      : 0;

  const lossRate =
    totalPatients > 0
      ? parseFloat(((totalLost / totalPatients) * 100).toFixed(2))
      : 0;

  // Process stage movements (transitions) in the last 7 days
  let recentTransitionsCount = 0;
  stageMovements.forEach((log) => {
    try {
      const changesArray = typeof log.changes === "string" ? JSON.parse(log.changes) : (log.changes as any);
      if (Array.isArray(changesArray) && changesArray.some((c: any) => c.field === "pipelineStage")) {
        recentTransitionsCount++;
      }
    } catch (e) {
      // Ignored
    }
  });

  return {
    newTodayCount,
    newTodayList,
    convertedTodayCount,
    convertedTodayList,
    lostTodayCount,
    lostTodayList,
    stageCounts: formattedStageCounts,
    totalPatients,
    conversionRate,
    lossRate,
    recentTransitionsCount,
  };
}
