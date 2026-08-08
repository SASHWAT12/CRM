import { prismadb } from "@/lib/prisma";
import type { ReportFilters, KPIData, ChartDataPoint } from "./types";
import { groupedToChartData } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";
import moment from "moment";

const DEFAULT_SCOPE: ReportScope = getReportScope({ id: "", role: "manager" });

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function prevPeriod(filters: ReportFilters): { dateFrom: Date; dateTo: Date } {
  const duration = filters.dateTo.getTime() - filters.dateFrom.getTime();
  return {
    dateFrom: new Date(filters.dateFrom.getTime() - duration),
    dateTo: new Date(filters.dateFrom.getTime()),
  };
}

export async function getDashboardKPIs(
  filters: ReportFilters,
  displayCurrency: string = "INR",
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<KPIData[]> {
  const prev = prevPeriod(filters);
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    leadsCurr,
    leadsPrev,
    contactsCurr,
    contactsPrev,
    convertedContactsCurr,
    appointmentsToday,
    appointmentsPrev,
    pendingFollowups,
    overdueFollowups,
  ] = await Promise.all([
    // New Leads
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    }),
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: prev.dateFrom, lte: prev.dateTo }, deletedAt: null, ...scope.lead },
    }),
    // New Patients (Contacts)
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: prev.dateFrom, lte: prev.dateTo }, deletedAt: null, ...scope.contact },
    }),
    // Converted Patients
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, pipelineStage: "CONVERTED", deletedAt: null, ...scope.contact },
    }),
    // Appointments Today
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: startOfToday, lte: endOfToday }, status: { not: "CANCELLED" } },
    }),
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: prev.dateFrom, lte: prev.dateTo }, status: { not: "CANCELLED" } },
    }),
    // Pending Patient Followups
    prismadb.crm_Accounts_Tasks.count({
      where: { taskStatus: { not: "COMPLETE" } },
    }),
    // Overdue Patient Followups
    prismadb.crm_Accounts_Tasks.count({
      where: { taskStatus: { not: "COMPLETE" }, dueDateAt: { lt: startOfToday } },
    }),
  ]);

  const conversionRate = contactsCurr > 0 ? parseFloat(((convertedContactsCurr / contactsCurr) * 100).toFixed(1)) : 0;

  return [
    {
      label: "New Leads",
      value: leadsCurr,
      previousValue: leadsPrev,
      changePercent: calcChange(leadsCurr, leadsPrev),
      sparkline: [],
      href: "/crm/leads/registry",
    },
    {
      label: "New Patients",
      value: contactsCurr,
      previousValue: contactsPrev,
      changePercent: calcChange(contactsCurr, contactsPrev),
      sparkline: [],
      href: "/crm/patients/registry",
    },
    {
      label: "Conversion Rate (%)",
      value: conversionRate,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/patients/registry",
    },
    {
      label: "Appointments Today",
      value: appointmentsToday,
      previousValue: appointmentsPrev,
      changePercent: calcChange(appointmentsToday, appointmentsPrev),
      sparkline: [],
      href: "/crm/appointments/registry",
    },
    {
      label: "Pending Followups",
      value: pendingFollowups,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/followups/registry",
    },
    {
      label: "Overdue Followups",
      value: overdueFollowups,
      previousValue: 0,
      changePercent: 0,
      sparkline: [],
      href: "/crm/followups/registry",
    },
  ];
}

export async function getExecutiveAppointmentTrend(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const appointments = await prismadb.crm_Appointments.findMany({
    where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    select: { scheduledAt: true },
  });

  const grouped: Record<string, number> = {};
  for (const appt of appointments) {
    if (!appt.scheduledAt) continue;
    const d = new Date(appt.scheduledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return groupedToChartData(grouped, true);
}

export async function getExecutiveFollowupDistribution(): Promise<ChartDataPoint[]> {
  const counts = await prismadb.crm_Accounts_Tasks.groupBy({
    by: ["taskStatus"],
    _count: { id: true },
  });

  const map: Record<string, string> = {
    ACTIVE: "Pending",
    COMPLETE: "Completed",
    DEFERRED: "Deferred",
  };

  return counts.map((item) => ({
    name: map[item.taskStatus || "ACTIVE"] || item.taskStatus || "Pending",
    Number: item._count.id,
  }));
}
