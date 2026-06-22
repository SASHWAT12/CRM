import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";

const BATCH_SIZE = 512;

export const embedBackfill = inngest.createFunction(
  { id: "embed-backfill", name: "Embed Backfill All CRM Records", triggers: [{ event: "crm/backfill.requested" }] },
  async () => {
    const [accounts, contacts, leads] = await Promise.all([
      prismadb.crm_Accounts.findMany({ select: { id: true } }),
      prismadb.crm_Contacts.findMany({ select: { id: true } }),
      prismadb.crm_Leads.findMany({ select: { id: true } }),
    ]);

    const events = [
      ...accounts.map((r: any) => ({ name: "crm/account.saved" as const, data: { record_id: r.id } })),
      ...contacts.map((r: any) => ({ name: "crm/contact.saved" as const, data: { record_id: r.id } })),
      ...leads.map((r: any) => ({ name: "crm/lead.saved" as const, data: { record_id: r.id } })),
    ];

    // Chunk into batches of 512 (Inngest's per-send limit)
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      await inngest.send(events.slice(i, i + BATCH_SIZE));
    }

    return {
      dispatched: events.length,
      accounts: accounts.length,
      contacts: contacts.length,
      leads: leads.length,
    };
  }
);
