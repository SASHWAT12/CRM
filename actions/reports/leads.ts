import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint } from "./types";
import { groupedToChartData } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

const DEFAULT_SCOPE: ReportScope = getReportScope({ id: "", role: "manager" });

function groupByMonth(items: { createdAt?: Date | null }[]): ChartDataPoint[] {
  const grouped: Record<string, number> = {};
  for (const item of items) {
    if (!item.createdAt) continue;
    const d = new Date(item.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return groupedToChartData(grouped, true);
}

export async function getNewLeads(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const leads = await prismadb.crm_Leads.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    select: { createdAt: true },
  });
  return groupByMonth(leads);
}

export async function getLeadSources(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const leads = await prismadb.crm_Leads.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    select: { lead_source: { select: { name: true } } },
  });
  const grouped: Record<string, number> = {};
  for (const lead of leads) {
    const source = lead.lead_source?.name ?? "Unknown";
    grouped[source] = (grouped[source] || 0) + 1;
  }
  return groupedToChartData(grouped);
}

export async function getNewContacts(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const contacts = await prismadb.crm_Contacts.findMany({
    where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, ...scope.contact },
    select: { created_on: true },
  });
  return groupByMonth(contacts.map((c: { created_on: Date | null }) => ({ createdAt: c.created_on })));
}

export async function getContactsByAccount(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const contacts = await prismadb.crm_Contacts.findMany({
    where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, ...scope.contact },
    select: { assigned_accounts: { select: { name: true } } },
  });
  const grouped: Record<string, number> = {};
  for (const c of contacts) {
    const name = c.assigned_accounts?.name ?? "Unassigned";
    grouped[name] = (grouped[name] || 0) + 1;
  }
  return groupedToChartData(grouped);
}

export async function getConversionRate(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<{ rate: number; converted: number; leads: number }> {
  const contacts = await prismadb.crm_Contacts.findMany({
    where: {
      created_on: { gte: filters.dateFrom, lte: filters.dateTo },
      deletedAt: null,
      ...scope.contact,
    },
    select: {
      pipelineStage: true,
    },
  });

  const leads = contacts.length;
  const converted = contacts.filter((c) => c.pipelineStage === "CONVERTED").length;
  const rate = leads > 0 ? parseFloat(((converted / leads) * 100).toFixed(2)) : 0;

  return { rate, converted, leads };
}

export async function getPipelineStages(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const contacts = await prismadb.crm_Contacts.groupBy({
    by: ['pipelineStage'],
    where: {
      created_on: { gte: filters.dateFrom, lte: filters.dateTo },
      deletedAt: null,
      ...scope.contact,
    },
    _count: {
      id: true,
    },
  });

  const stagesOrder = ["NEW", "CONTACTED", "INTERESTED", "CONSULTATION_BOOKED", "VISITED", "TREATMENT_STARTED", "CONVERTED", "CLOSED_LOST"];
  const stagesLabels: Record<string, string> = {
    NEW: "New Inquiry",
    CONTACTED: "Contacted",
    INTERESTED: "Interested",
    CONSULTATION_BOOKED: "Consultation Booked",
    VISITED: "Visited",
    TREATMENT_STARTED: "Treatment Started",
    CONVERTED: "Converted",
    CLOSED_LOST: "Closed Lost",
  };

  const counts = new Map(contacts.map(c => [c.pipelineStage ?? "NEW", c._count.id]));

  return stagesOrder.map(stage => ({
    name: stagesLabels[stage],
    Number: counts.get(stage) ?? 0,
  }));
}

