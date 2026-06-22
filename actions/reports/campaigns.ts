import type { ReportFilters } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";

export async function getCampaignPerformance(
  filters: ReportFilters,
  scope: ReportScope,
): Promise<{ sent: number; opened: number; clicked: number }> {
  return { sent: 0, opened: 0, clicked: 0 };
}
