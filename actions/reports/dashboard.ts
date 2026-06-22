import { prismadb } from "@/lib/prisma";
import type { ReportFilters, KPIData } from "./types";
import { Decimal } from "@prisma/client/runtime/client";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

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
  displayCurrency: string = "EUR",
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<KPIData[]> {
  const prev = prevPeriod(filters);

  const [
    leadsCurr,
    leadsPrev,
    contactsCurr,
    contactsPrev,
    usersCurr,
    usersPrev,
    tasksCurr,
    tasksPrev,
    tasksOpenCurr,
    tasksOpenPrev,
    accountsCurr,
    accountsPrev,
  ] = await Promise.all([
    // newLeads
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.lead },
    }),
    prismadb.crm_Leads.count({
      where: { createdAt: { gte: prev.dateFrom, lte: prev.dateTo }, deletedAt: null, ...scope.lead },
    }),
    // newContacts (crm_Contacts has created_on, no deletedAt)
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: filters.dateFrom, lte: filters.dateTo }, ...scope.contact },
    }),
    prismadb.crm_Contacts.count({
      where: { created_on: { gte: prev.dateFrom, lte: prev.dateTo }, ...scope.contact },
    }),
    // activeUsers (status = ACTIVE, not date-filtered) - global; manager/admin only typically read this KPI
    prismadb.users.count({
      where: { userStatus: "ACTIVE" },
    }),
    prismadb.users.count({
      where: { userStatus: "ACTIVE", created_on: { lte: prev.dateTo } },
    }),
    // tasks total
    prismadb.tasks.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, ...scope.task },
    }),
    prismadb.tasks.count({
      where: { createdAt: { gte: prev.dateFrom, lte: prev.dateTo }, ...scope.task },
    }),
    // open tasks (ACTIVE = not completed)
    prismadb.tasks.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, taskStatus: "ACTIVE", ...scope.task },
    }),
    prismadb.tasks.count({
      where: { createdAt: { gte: prev.dateFrom, lte: prev.dateTo }, taskStatus: "ACTIVE", ...scope.task },
    }),
    // newAccounts
    prismadb.crm_Accounts.count({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, deletedAt: null, ...scope.account },
    }),
    prismadb.crm_Accounts.count({
      where: { createdAt: { gte: prev.dateFrom, lte: prev.dateTo }, deletedAt: null, ...scope.account },
    }),
  ]);

  // suppress unused vars
  void tasksCurr;
  void tasksPrev;

  return [
    {
      label: "newLeads",
      value: leadsCurr,
      previousValue: leadsPrev,
      changePercent: calcChange(leadsCurr, leadsPrev),
      sparkline: [],
      href: "/reports/leads",
    },
    {
      label: "newContacts",
      value: contactsCurr,
      previousValue: contactsPrev,
      changePercent: calcChange(contactsCurr, contactsPrev),
      sparkline: [],
      href: "/reports/leads",
    },
    {
      label: "activeUsers",
      value: usersCurr,
      previousValue: usersPrev,
      changePercent: calcChange(usersCurr, usersPrev),
      sparkline: [],
      href: "/reports/users",
    },
    {
      label: "openTasks",
      value: tasksOpenCurr,
      previousValue: tasksOpenPrev,
      changePercent: calcChange(tasksOpenCurr, tasksOpenPrev),
      sparkline: [],
      href: "/reports/activity",
    },
    {
      label: "newAccounts",
      value: accountsCurr,
      previousValue: accountsPrev,
      changePercent: calcChange(accountsCurr, accountsPrev),
      sparkline: [],
      href: "/reports/accounts",
    },
  ];
}
