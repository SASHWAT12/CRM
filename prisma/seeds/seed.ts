import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// CRM Config seed data
import crmIndustryTypeData from "../initial-data/crm_Industry_Type.json";
import contactTypesData from "../initial-data/crm_Contact_Types.json";
import leadSourcesData from "../initial-data/crm_Lead_Sources.json";
import leadStatusesData from "../initial-data/crm_Lead_Statuses.json";
import leadTypesData from "../initial-data/crm_Lead_Types.json";



const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function upsertByName(
  model: any,
  items: { name: string; [key: string]: any }[]
) {
  for (const item of items) {
    await model.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }
}

async function main() {
  console.log("-------- Seeding DB --------");

  // CRM Industry Types (no unique on name — use findFirst + create/update)
  for (const item of crmIndustryTypeData) {
    const existing = await prisma.crm_Industry_Type.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Industry_Type.update({
        where: { id: existing.id },
        data: { name: item.name, v: item.v },
      });
    } else {
      await prisma.crm_Industry_Type.create({
        data: { name: item.name, v: item.v },
      });
    }
  }
  console.log("Industry Types seeded");

  // CRM Contact Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Contact_Types, contactTypesData);
  console.log("Contact Types seeded");

  // CRM Lead Sources (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Sources, leadSourcesData);
  console.log("Lead Sources seeded");

  // CRM Lead Statuses (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Statuses, leadStatusesData);
  console.log("Lead Statuses seeded");

  // CRM Lead Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Types, leadTypesData);
  console.log("Lead Types seeded");

  // Test User for E2E Testing
  const testUserEmail = process.env.TEST_USER_EMAIL || "test@nextcrm.app";
  await prisma.users.upsert({
    where: { email: testUserEmail },
    update: {
      userStatus: "ACTIVE",
      role: "root",
    },
    create: {
      email: testUserEmail,
      name: "Test User",
      userStatus: "ACTIVE",
      role: "root",
    },
  });
  console.log(`Test user seeded: ${testUserEmail}`);



  console.log("-------- Seed DB completed --------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
