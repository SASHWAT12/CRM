import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint, KPIData } from "./types";
import { groupedToChartData } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

const DEFAULT_SCOPE: ReportScope = getReportScope({ id: "", role: "manager" });

export async function getPipelineKPIs(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<KPIData[]> {
  const [created, scheduled, completed, converted, dropped] = await Promise.all([
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CONSULTATION_BOOKED", deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "VISITED", deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CONVERTED", deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CLOSED_LOST", deletedAt: null, ...scope.contact },
    }),
  ]);

  return [
    { label: "Patients Created", value: created, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/patients/registry" },
    { label: "Consultations Scheduled", value: scheduled, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "Consultations Completed", value: completed, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "Converted Patients", value: converted, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/patients/registry" },
    { label: "Dropped / Lost", value: dropped, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/patients/registry" },
  ];
}

export async function getPipelineStageDistribution(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<ChartDataPoint[]> {
  const counts = await prismadb.crm_Contacts.groupBy({
    by: ["pipelineStage"],
    where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.contact },
    _count: { id: true },
  });

  const stageLabels: Record<string, string> = {
    NEW: "New Patient",
    CONTACTED: "Contacted",
    INTERESTED: "Interested",
    CONSULTATION_BOOKED: "Appt Scheduled",
    VISITED: "Visited / Consulted",
    TREATMENT_STARTED: "Treatment Started",
    CONVERTED: "Converted",
    CLOSED_LOST: "Closed / Lost",
  };

  return counts.map((item) => ({
    name: stageLabels[item.pipelineStage || "NEW"] || item.pipelineStage || "New Patient",
    Number: item._count.id,
  }));
}

export async function getPatientsByCounselor(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<ChartDataPoint[]> {
  const contacts = await prismadb.crm_Contacts.findMany({
    where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.contact },
    select: { assigned_to_user: { select: { name: true } } },
  });

  const grouped: Record<string, number> = {};
  for (const c of contacts) {
    const name = c.assigned_to_user?.name || "Unassigned";
    grouped[name] = (grouped[name] || 0) + 1;
  }

  return groupedToChartData(grouped);
}
