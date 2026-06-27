import * as dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { prismadb } from "../lib/prisma";

async function main() {
  console.log("Connecting to DB...");
  try {
    const contactCount = await prismadb.crm_Contacts.count();
    console.log("Total contacts in DB:", contactCount);
  } catch (error: any) {
    console.error("Error in main:", error.message || error);
  } finally {
    await prismadb.$disconnect();
  }
}

main();
