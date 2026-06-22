import { inngest } from "@/inngest/client";

export const embedEmail = inngest.createFunction(
  {
    id: "email-embed-email",
    name: "Email: Embed Email",
    concurrency: { limit: 10 },
    triggers: [{ event: "email/embed-email" }],
  },
  async () => {
    return { skipped: "embedding disabled" };
  }
);
