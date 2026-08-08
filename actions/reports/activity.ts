import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint, KPIData } from "./types";
import { groupedToChartData } from "./types";
import moment from "moment";

export async function getFollowupKPIs(
  filters: ReportFilters
): Promise<KPIData[]> {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [pending, completed, overdue, dueToday] = await Promise.all([
    prismadb.crm_Accounts_Tasks.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, taskStatus: { not: "COMPLETE" } },
    }),
    prismadb.crm_Accounts_Tasks.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, taskStatus: "COMPLETE" },
    }),
    prismadb.crm_Accounts_Tasks.count({
      where: { taskStatus: { not: "COMPLETE" }, dueDateAt: { lt: startOfToday } },
    }),
    prismadb.crm_Accounts_Tasks.count({
      where: { taskStatus: { not: "COMPLETE" }, dueDateAt: { gte: startOfToday, lte: endOfToday } },
    }),
  ]);

  return [
    { label: "Pending Followups", value: pending, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/followups/registry" },
    { label: "Completed Followups", value: completed, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/followups/registry" },
    { label: "Overdue Followups", value: overdue, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/followups/registry" },
    { label: "Due Today", value: dueToday, previousValue: 0, changePercent: 0, sparkline: [], href: "/crm/followups/registry" },
  ];
}

export async function getFollowupStatusDistribution(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const counts = await prismadb.crm_Accounts_Tasks.groupBy({
    by: ["taskStatus"],
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } },
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

export async function getFollowupsByCounselor(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const tasks = await prismadb.crm_Accounts_Tasks.findMany({
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    select: { assigned_user: { select: { name: true } } },
  });

  const grouped: Record<string, number> = {};
  for (const t of tasks) {
    const name = t.assigned_user?.name || "Unassigned Counselor";
    grouped[name] = (grouped[name] || 0) + 1;
  }

  return groupedToChartData(grouped);
}

export async function getFollowupsByPriority(
  filters: ReportFilters
): Promise<ChartDataPoint[]> {
  const counts = await prismadb.crm_Accounts_Tasks.groupBy({
    by: ["priority"],
    where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } },
    _count: { id: true },
  });

  return counts.map((item) => ({
    name: item.priority ? item.priority.toUpperCase() : "NORMAL",
    Number: item._count.id,
  }));
}
