import { NextRequest, NextResponse } from "next/server";
import {
  requireAuthenticated,
  unauthorizedResponse,
  AuthenticationError,
  getReportScope,
  type ReportScope,
} from "@/lib/authz";
import {
  parseSearchParamsToFilters,
  REPORT_CATEGORIES,
  type ReportCategory,
} from "@/actions/reports/types";
import { generateCSV } from "@/actions/reports/export-csv";
import * as dashboardActions from "@/actions/reports/dashboard";
import * as leadsActions from "@/actions/reports/leads";
import * as pipelineActions from "@/actions/reports/pipeline";
import * as appointmentActions from "@/actions/reports/appointments";
import * as activityActions from "@/actions/reports/activity";

async function getReportData(
  category: string,
  filters: ReturnType<typeof parseSearchParamsToFilters>,
  scope: ReportScope,
) {
  switch (category) {
    case "executive":
      return {
        data: await dashboardActions.getExecutiveAppointmentTrend(filters),
        headers: ["Month", "Appointments Scheduled"],
      };
    case "leads":
      return {
        data: await leadsActions.getNewLeads(filters, scope),
        headers: ["Month", "Leads Created"],
      };
    case "pipeline":
      return {
        data: await pipelineActions.getPipelineStageDistribution(filters, scope),
        headers: ["Stage", "Patient Count"],
      };
    case "appointments":
      return {
        data: await appointmentActions.getAppointmentsByDoctor(filters),
        headers: ["Doctor", "Appointments Booked"],
      };
    case "followups":
      return {
        data: await activityActions.getFollowupStatusDistribution(filters),
        headers: ["Status", "Followups Count"],
      };
    default:
      return { data: [], headers: ["Name", "Value"] };
  }
}

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return unauthorizedResponse();
    throw e;
  }

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? "executive";
  const format = searchParams.get("format") ?? "csv";

  if (!REPORT_CATEGORIES.includes(category as ReportCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const filters = parseSearchParamsToFilters(searchParams);
  const scope = getReportScope(user);

  if (format === "csv") {
    const { data, headers } = await getReportData(category, filters, scope);
    const csv = generateCSV(data, headers);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${category}-report.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const { generatePDF } = await import("@/actions/reports/export-pdf");
    const { data, headers } = await getReportData(category, filters, scope);
    const dateRange = `${searchParams.get("from") ?? "all"} to ${searchParams.get("to") ?? "now"}`;
    const buffer = await generatePDF(
      `${category.charAt(0).toUpperCase() + category.slice(1)} Report`,
      dateRange,
      data,
      headers as [string, string],
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${category}-report.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
