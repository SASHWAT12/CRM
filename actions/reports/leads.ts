import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint, KPIData } from "./types";
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

export async function getLeadKPIs(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<KPIData[]> {
  const [created, converted, lost] = await Promise.all([
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CONVERTED", deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CLOSED_LOST", deletedAt: null, ...scope.contact },
    }),
  ]);

  const qualified = Math.max(0, created - lost);

  return [
    {
      label: "Leads Created",
      value: created,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/leads/registry",
    },
    {
      label: "Qualified Leads",
      value: qualified,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/leads/registry",
    },
    {
      label: "Converted Leads",
      value: converted,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/patients/registry",
    },
    {
      label: "Lost / Closed Leads",
      value: lost,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/leads/registry",
    },
  ];
}

export async function getNewLeads(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<ChartDataPoint[]> {
  const leads = await prismadb.crm_Leads.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    select: { createdAt: true },
  });
  return groupByMonth(leads);
}

export async function getLeadSources(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<ChartDataPoint[]> {
  const leads = await prismadb.crm_Leads.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    select: { lead_source: { select: { name: true } } },
  });
  const grouped: Record<string, number> = {};
  for (const lead of leads) {
    const source = lead.lead_source?.name ?? "Direct / Walk-in";
    grouped[source] = (grouped[source] || 0) + 1;
  }
  return groupedToChartData(grouped);
}

export async function getLeadStatuses(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE
): Promise<ChartDataPoint[]> {
  const leads = await prismadb.crm_Leads.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    select: { lead_status: { select: { name: true } } },
  });
  const grouped: Record<string, number> = {};
  for (const lead of leads) {
    const status = lead.lead_status?.name ?? "New Inquiry";
    grouped[status] = (grouped[status] || 0) + 1;
  }
  return groupedToChartData(grouped);
}
