import Container from "../components/ui/Container";
import { getDashboardKPIs, getExecutiveAppointmentTrend, getExecutiveFollowupDistribution } from "@/actions/reports/dashboard";
import { getNewLeads } from "@/actions/reports/leads";
import { parseSearchParamsToFilters } from "@/actions/reports/types";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportsNavTabs } from "@/components/reports/ReportsNavTabs";
import { ReportChart } from "@/components/reports/ReportChart";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ExecutiveDashboardPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(
    Object.entries(resolvedParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  const filters = parseSearchParamsToFilters(params);
  const displayCurrency = "INR";

  const [kpis, leadTrend, appointmentTrend, followupDistribution] = await Promise.all([
    getDashboardKPIs(filters, displayCurrency),
    getNewLeads(filters),
    getExecutiveAppointmentTrend(filters),
    getExecutiveFollowupDistribution(),
  ]);

  const dateParams = params.toString();

  return (
    <Container title="Executive Dashboard" description="High-level operational overview of leads, patients, appointments, and followups">
      <div className="space-y-6 pt-4">
        <ReportsNavTabs />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <Suspense>
            <DateRangePicker />
          </Suspense>
        </div>

        {/* Top KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} kpi={kpi} dateParams={dateParams} displayCurrency={displayCurrency} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={leadTrend} titleKey="Lead Trend" type="area" />
          <ReportChart data={appointmentTrend} titleKey="Appointment Trend" type="bar" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={followupDistribution} titleKey="Followup Status" type="pie" />
        </div>
      </div>
    </Container>
  );
}
