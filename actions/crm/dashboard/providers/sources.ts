import { prismadb } from "@/lib/prisma";

export async function getSourcesData() {
  const [sourcesList, patientCounts, appointmentCounts] = await Promise.all([
    // Active Lead Sources
    prismadb.crm_Lead_Sources.findMany({
      select: { id: true, name: true },
    }),
    // Patient counts and stages grouped by lead_source_id
    prismadb.crm_Contacts.findMany({
      where: { deletedAt: null },
      select: {
        lead_source_id: true,
        pipelineStage: true,
      },
    }),
    // Appointments with patient's lead_source_id
    prismadb.crm_Appointments.findMany({
      select: {
        patient: {
          select: {
            lead_source_id: true,
          },
        },
      },
    }),
  ]);

  // Aggregate stats by source
  const sourceStats = sourcesList.map((source) => {
    const patients = patientCounts.filter((c) => c.lead_source_id === source.id);
    const total = patients.length;
    const converted = patients.filter((c) => c.pipelineStage === "CONVERTED").length;
    const lost = patients.filter((c) => c.pipelineStage === "CLOSED_LOST").length;

    const conversionRate = total > 0 ? parseFloat(((converted / total) * 100).toFixed(2)) : 0;
    const lossRate = total > 0 ? parseFloat(((lost / total) * 100).toFixed(2)) : 0;

    const appointments = appointmentCounts.filter(
      (a) => a.patient?.lead_source_id === source.id
    ).length;

    return {
      id: source.id,
      name: source.name,
      totalPatients: total,
      convertedPatients: converted,
      lostPatients: lost,
      conversionRate,
      lossRate,
      appointmentsBooked: appointments,
    };
  });

  // Also calculate stats for "Unknown/Unassigned Source"
  const unassignedPatients = patientCounts.filter((c) => !c.lead_source_id);
  const unassignedTotal = unassignedPatients.length;
  const unassignedConverted = unassignedPatients.filter(
    (c) => c.pipelineStage === "CONVERTED"
  ).length;
  const unassignedLost = unassignedPatients.filter(
    (c) => c.pipelineStage === "CLOSED_LOST"
  ).length;

  const unassignedConversionRate =
    unassignedTotal > 0 ? parseFloat(((unassignedConverted / unassignedTotal) * 100).toFixed(2)) : 0;
  const unassignedLossRate =
    unassignedTotal > 0 ? parseFloat(((unassignedLost / unassignedTotal) * 100).toFixed(2)) : 0;

  const unassignedAppointments = appointmentCounts.filter(
    (a) => !a.patient?.lead_source_id
  ).length;

  if (unassignedTotal > 0 || unassignedAppointments > 0) {
    sourceStats.push({
      id: "unknown",
      name: "Unknown / Direct",
      totalPatients: unassignedTotal,
      convertedPatients: unassignedConverted,
      lostPatients: unassignedLost,
      conversionRate: unassignedConversionRate,
      lossRate: unassignedLossRate,
      appointmentsBooked: unassignedAppointments,
    });
  }

  return sourceStats;
}
