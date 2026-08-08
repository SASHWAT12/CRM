import Container from "../../components/ui/Container";
import { parseSearchParamsToFilters } from "@/actions/reports/types";
import {
  getFollowupKPIs,
  getFollowupStatusDistribution,
  getFollowupsByCounselor,
  getFollowupsByPriority,
} from "@/actions/reports/activity";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportsNavTabs } from "@/components/reports/ReportsNavTabs";
import { ReportChart } from "@/components/reports/ReportChart";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { Suspense } from "react";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function FollowupAnalyticsReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(
    Object.entries(resolvedParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  const filters = parseSearchParamsToFilters(params);

  const [kpis, statusDistribution, byCounselor, byPriority] = await Promise.all([
    getFollowupKPIs(filters),
    getFollowupStatusDistribution(filters),
    getFollowupsByCounselor(filters),
    getFollowupsByPriority(filters),
  ]);

  const dateParams = params.toString();

  return (
    <Container title="Followup Analytics" description="Track patient followup task execution, overdue backlog, and counselor workload">
      <div className="space-y-6 pt-4">
        <ReportsNavTabs />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <Suspense>
            <DateRangePicker />
          </Suspense>
          <Suspense>
            <ReportToolbar category="followups" currentFilters={dateParams} />
          </Suspense>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} kpi={kpi} dateParams={dateParams} displayCurrency="INR" />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={statusDistribution} titleKey="Followup Status Distribution" type="pie" />
          <ReportChart data={byCounselor} titleKey="Followup Workload by Counselor" type="bar" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={byPriority} titleKey="Followups by Priority" type="bar" />
        </div>
      </div>
    </Container>
  );
}
