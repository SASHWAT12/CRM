import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { embedAccount } from "@/inngest/functions/embed-account";
import { embedContact } from "@/inngest/functions/embed-contact";
import { embedLead } from "@/inngest/functions/embed-lead";
import { embedBackfill } from "@/inngest/functions/embed-backfill";
import { emailSyncAll } from "@/inngest/functions/emails/sync-all";
import { emailSyncAccount } from "@/inngest/functions/emails/sync-account";
import { embedEmail } from "@/inngest/functions/emails/embed-email";
import { emailLinkCrm } from "@/inngest/functions/emails/link-crm";
// import { campaignScheduleSend } from "@/inngest/functions/campaigns/schedule-send";
// import { campaignSendStep } from "@/inngest/functions/campaigns/send-step";
// import { campaignProcessFollowUp } from "@/inngest/functions/campaigns/process-follow-up";
// import { campaignSendNow } from "@/inngest/functions/campaigns/send-now";
import { reportSendScheduled } from "@/inngest/functions/reports/send-scheduled";
import { enrichDocument } from "@/inngest/functions/documents/enrich-document";
import { generateDocumentThumbnail } from "@/inngest/functions/documents/generate-thumbnail";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    embedAccount,
    embedContact,
    embedLead,
    embedBackfill,
    emailSyncAll,
    emailSyncAccount,
    embedEmail,
    emailLinkCrm,
    // campaignScheduleSend,
    // campaignSendStep,
    // campaignProcessFollowUp,
    // campaignSendNow,
    reportSendScheduled,
    enrichDocument,
    generateDocumentThumbnail,
  ],
});
