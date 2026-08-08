import Container from "../../components/ui/Container";
import { parseSearchParamsToFilters } from "@/actions/reports/types";
import { getLeadKPIs, getNewLeads, getLeadSources, getLeadStatuses } from "@/actions/reports/leads";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportsNavTabs } from "@/components/reports/ReportsNavTabs";
import { ReportChart } from "@/components/reports/ReportChart";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { Suspense } from "react";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function LeadsReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(
    Object.entries(resolvedParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  const filters = parseSearchParamsToFilters(params);

  const [kpis, newLeads, leadSources, leadStatuses] = await Promise.all([
    getLeadKPIs(filters),
    getNewLeads(filters),
    getLeadSources(filters),
    getLeadStatuses(filters),
  ]);

  const dateParams = params.toString();

  return (
    <Container title="Lead Analytics" description="Track lead acquisition volume, sources, and initial qualification metrics">
      <div className="space-y-6 pt-4">
        <ReportsNavTabs />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <Suspense>
            <DateRangePicker />
          </Suspense>
          <Suspense>
            <ReportToolbar category="leads" currentFilters={dateParams} />
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
          <ReportChart data={newLeads} titleKey="Lead Intake Trend" type="area" />
          <ReportChart data={leadSources} titleKey="Lead Acquisition Sources" type="bar" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={leadStatuses} titleKey="Lead Status Breakdown" type="pie" />
        </div>
      </div>
    </Container>
  );
}
