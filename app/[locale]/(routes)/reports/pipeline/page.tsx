import Container from "../../components/ui/Container";
import { parseSearchParamsToFilters } from "@/actions/reports/types";
import { getPipelineKPIs, getPipelineStageDistribution, getPatientsByCounselor } from "@/actions/reports/pipeline";
import { KPICard } from "@/components/reports/KPICard";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportsNavTabs } from "@/components/reports/ReportsNavTabs";
import { ReportChart } from "@/components/reports/ReportChart";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { Suspense } from "react";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function PatientPipelineReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(
    Object.entries(resolvedParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  const filters = parseSearchParamsToFilters(params);

  const [kpis, stageDistribution, patientsByCounselor] = await Promise.all([
    getPipelineKPIs(filters),
    getPipelineStageDistribution(filters),
    getPatientsByCounselor(filters),
  ]);

  const dateParams = params.toString();

  return (
    <Container title="Patient Pipeline Analytics" description="Track post-conversion patient progression, stage movements, and counselor assignments">
      <div className="space-y-6 pt-4">
        <ReportsNavTabs />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <Suspense>
            <DateRangePicker />
          </Suspense>
          <Suspense>
            <ReportToolbar category="pipeline" currentFilters={dateParams} />
          </Suspense>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} kpi={kpi} dateParams={dateParams} displayCurrency="INR" />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChart data={stageDistribution} titleKey="Pipeline Stage Distribution" type="bar" />
          <ReportChart data={patientsByCounselor} titleKey="Patients Assigned by Counselor" type="pie" />
        </div>
      </div>
    </Container>
  );
}
