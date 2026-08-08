import { Inngest } from "inngest";

const client = new Inngest({
  id: process.env.INNGEST_ID as string,
  name: process.env.INNGEST_APP_NAME as string,
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

const originalSend = client.send.bind(client);

client.send = (async (events: any, options?: any) => {
  if (!process.env.INNGEST_EVENT_KEY) {
    console.warn("Inngest: INNGEST_EVENT_KEY is missing. Skipping event publish:", JSON.stringify(events));
    return { ids: [] };
  }
  try {
    return await originalSend(events, options);
  } catch (error: any) {
    console.warn("Inngest: Failed to send event:", error?.message || error);
    return { ids: [] };
  }
}) as any;

export const inngest = client;
