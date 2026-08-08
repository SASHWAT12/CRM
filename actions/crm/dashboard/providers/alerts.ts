import { prismadb } from "@/lib/prisma";

export async function getAlertsData() {
  const [unassignedList, staleList, missingReasonList] = await Promise.all([
    // Unassigned active patients (hot leads)
    prismadb.crm_Contacts.findMany({
      where: {
        assigned_to: null,
        pipelineStage: { in: ["NEW", "CONTACTED", "INTERESTED"] },
        deletedAt: null,
      },
      include: {
        lead_source: { select: { name: true } },
      },
      orderBy: { created_on: "desc" },
    }),
    // Stale patients (in progress but with no active tasks)
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: { in: ["NEW", "CONTACTED", "INTERESTED", "CONSULTATION_BOOKED", "VISITED", "TREATMENT_STARTED"] },
        deletedAt: null,
        tasks: {
          none: {
            taskStatus: { not: "COMPLETE" },
          },
        },
      },
      include: {
        assigned_to_user: { select: { id: true, name: true } },
      },
      orderBy: { created_on: "desc" },
    }),
    // Closed lost patients with missing reason
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: "CLOSED_LOST",
        OR: [
          { lossReason: null },
          { lossReason: "" },
        ],
        deletedAt: null,
      },
      include: {
        assigned_to_user: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    unassignedCount: unassignedList.length,
    unassignedList,
    staleCount: staleList.length,
    staleList,
    missingReasonCount: missingReasonList.length,
    missingReasonList,
  };
}
