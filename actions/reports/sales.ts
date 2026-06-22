import type { ReportFilters, ChartDataPoint } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";

export async function getOppsByMonth(
  filters: ReportFilters,
  scope: ReportScope,
): Promise<ChartDataPoint[]> {
  return [];
}
