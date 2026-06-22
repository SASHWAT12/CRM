import { PrismaClient } from "@prisma/client";

export async function seedCurrencies(prisma: PrismaClient) {
  console.log("Seeding system settings...");

  await prisma.crm_SystemSettings.upsert({
    where: { key: "ecb_auto_update" },
    update: {},
    create: { key: "ecb_auto_update", value: "false" },
  });

  await prisma.crm_SystemSettings.upsert({
    where: { key: "default_currency" },
    update: {},
    create: { key: "default_currency", value: "EUR" },
  });

  console.log("System settings seeded.");
}
