import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { Resend } from "resend";
import { generateCSV } from "@/actions/reports/export-csv";
import * as dashboardActions from "@/actions/reports/dashboard";
import * as leadsActions from "@/actions/reports/leads";
import * as pipelineActions from "@/actions/reports/pipeline";
import * as appointmentActions from "@/actions/reports/appointments";
import * as activityActions from "@/actions/reports/activity";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getReportData(category: string, filters: any, scope: any) {
  switch (category) {
    case "executive":
      return { data: await dashboardActions.getExecutiveAppointmentTrend(filters), headers: ["Month", "Appointments Scheduled"] as [string, string] };
    case "leads":
      return { data: await leadsActions.getNewLeads(filters, scope), headers: ["Month", "Leads Created"] as [string, string] };
    case "pipeline":
      return { data: await pipelineActions.getPipelineStageDistribution(filters, scope), headers: ["Stage", "Patient Count"] as [string, string] };
    case "appointments":
      return { data: await appointmentActions.getAppointmentsByDoctor(filters), headers: ["Doctor", "Appointments Booked"] as [string, string] };
    case "followups":
      return { data: await activityActions.getFollowupStatusDistribution(filters), headers: ["Status", "Followups Count"] as [string, string] };
    default:
      return { data: [], headers: ["Name", "Value"] as [string, string] };
  }
}

function isScheduleDue(cron: string, lastSentAt: Date | null): boolean {
  if (!lastSentAt) return true;
  const elapsed = Date.now() - lastSentAt.getTime();
  if (cron.startsWith("0 9 * * *")) return elapsed >= 24 * 60 * 60 * 1000;
  if (cron.match(/^0 9 \* \* [0-6]$/)) return elapsed >= 7 * 24 * 60 * 60 * 1000;
  if (cron.match(/^0 9 [0-9]+ \* \*$/)) return elapsed >= 28 * 24 * 60 * 60 * 1000;
  return elapsed >= 15 * 60 * 1000;
}

export const reportSendScheduled = inngest.createFunction(
  {
    id: "report-send-scheduled",
    name: "Reports: Send Scheduled",
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }: { step: any }) => {
    const schedules = await step.run("find-due-schedules", async () => {
      return prismadb.crm_Report_Schedule.findMany({
        where: { isActive: true },
        include: { reportConfig: true },
      });
    });

    for (const sched of schedules) {
      if (!isScheduleDue(sched.cronExpression, sched.lastSentAt)) continue;

      await step.run(`process-schedule-${sched.id}`, async () => {
        const config = sched.reportConfig;
        if (!config) return;

        const filters = {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          dateTo: new Date(),
        };

        const { data, headers } = await getReportData(config.category, filters, {});
        const csvContent = generateCSV(data, headers);

        if (process.env.RESEND_API_KEY && sched.recipients.length > 0) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "reports@hospitalcrm.com",
            to: sched.recipients,
            subject: `Scheduled Report: ${config.name}`,
            text: `Attached is your scheduled report: ${config.name}`,
            attachments: [
              {
                filename: `${config.name.toLowerCase().replace(/\s+/g, "-")}.csv`,
                content: Buffer.from(csvContent).toString("base64"),
              },
            ],
          });
        }

        await prismadb.crm_Report_Schedule.update({
          where: { id: sched.id },
          data: { lastSentAt: new Date() },
        });
      });
    }
  }
);
