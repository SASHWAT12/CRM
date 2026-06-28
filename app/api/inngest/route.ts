import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { emailSyncAll } from "@/inngest/functions/emails/sync-all";
import { emailSyncAccount } from "@/inngest/functions/emails/sync-account";
import { emailLinkCrm } from "@/inngest/functions/emails/link-crm";
import { reportSendScheduled } from "@/inngest/functions/reports/send-scheduled";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    emailSyncAll,
    emailSyncAccount,
    emailLinkCrm,
    reportSendScheduled,
  ],
});
