import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint, KPIData } from "./types";
import { groupedToChartData } from "./types";

export async function getAppointmentKPIs(
  filters: ReportFilters
): Promise<KPIData[]> {
  const [booked, completed, cancelled, noShow, rescheduled] = await Promise.all([
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    }),
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo }, status: "COMPLETED" },
    }),
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo }, status: "CANCELLED" },
    }),
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo }, status: "NO_SHOW" },
    }),
    prismadb.crm_Appointments.count({
      where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo }, status: "RESCHEDULED" },
    }),
  ]);

  return [
    { label: "Appointments Booked", value: booked, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "Completed", value: completed, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "Cancelled", value: cancelled, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "No Show", value: noShow, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
    { label: "Rescheduled", value: rescheduled, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/appointments/registry" },
  ];
}

export async function getAppointmentsTrend(
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

export async function getAppointmentsByDoctor(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const appointments = await prismadb.crm_Appointments.findMany({
    where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    select: { doctor: { select: { name: true } } },
  });

  const grouped: Record<string, number> = {};
  for (const appt of appointments) {
    const docName = appt.doctor?.name || "Unassigned Doctor";
    grouped[docName] = (grouped[docName] || 0) + 1;
  }

  return groupedToChartData(grouped);
}

export async function getAppointmentsByStatus(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const counts = await prismadb.crm_Appointments.groupBy({
    by: ["status"],
    where: { scheduledAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    _count: { id: true },
  });

  return counts.map((item) => ({
    name: item.status,
    Number: item._count.id,
  }));
}
