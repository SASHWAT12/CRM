import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getAuditLogAdmin } from "@/actions/crm/audit-log/get-audit-log-admin";
import { AdminFilters } from "@/components/crm/audit-log/AdminFilters";
import { AdminAuditLogClient } from "@/components/crm/audit-log/AdminPageClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prismadb } from "@/lib/prisma";
import { cleanOldAuditLogs } from "@/lib/audit-log";
import moment from "moment";
import { Activity, CalendarDays, ShieldAlert, Clock } from "lucide-react";

const AuditLogPage = async (props: {
  searchParams?: Promise<{
    page?: string;
    entityType?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) => {
  const session = await getSession();
  if (!session?.user) redirect("/");

  // Trigger lightweight automatic 90-day retention cleanup on audit page load
  void cleanOldAuditLogs();

  const sp = await props.searchParams;
  const currentPage = Math.max(1, parseInt(sp?.page ?? "1", 10) || 1);
  const filters = {
    page: currentPage,
    entityType: sp?.entityType,
    action: sp?.action,
    dateFrom: sp?.dateFrom ? new Date(sp.dateFrom) : undefined,
    dateTo: sp?.dateTo ? new Date(sp.dateTo) : undefined,
  };

  const startOfToday = moment().startOf("day").toDate();
  const sevenDaysAgo = moment().subtract(7, "days").toDate();
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();

  const [result, eventsToday, events7Days, events30Days, criticalEvents] = await Promise.all([
    getAuditLogAdmin(filters),
    prismadb.crm_AuditLog.count({ where: { createdAt: { gte: startOfToday } } }),
    prismadb.crm_AuditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prismadb.crm_AuditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prismadb.crm_AuditLog.count({ where: { action: "deleted" } }),
  ]);

  if ("error" in result) return <div>Access denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete operational change log (Automatic 90-day retention policy active).
        </p>
      </div>

      {/* Audit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsToday}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Last 7 Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events7Days}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Last 30 Days</CardTitle>
            <Clock className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events30Days}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Critical Deletions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalEvents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table */}
      <AdminFilters
        entityType={sp?.entityType}
        action={sp?.action}
        dateFrom={sp?.dateFrom}
        dateTo={sp?.dateTo}
      />
      <AdminAuditLogClient
        entries={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        role={session?.user?.role ?? "user"}
      />
    </div>
  );
};

export default AuditLogPage;
