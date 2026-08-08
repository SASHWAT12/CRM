import "dotenv/config";
import { prismadb } from "../lib/prisma";

async function finalizeUsers() {
  console.log("Finalizing user roles in database...");

  // Set sashwat73@gmail.com to root
  const rootResult = await prismadb.users.updateMany({
    where: { email: "sashwat73@gmail.com" },
    data: { role: "root" },
  });
  console.log("Updated root user (sashwat73@gmail.com):", rootResult.count);

  // Set test@nextcrm.app to admin
  const adminResult = await prismadb.users.updateMany({
    where: { email: "test@nextcrm.app" },
    data: { role: "admin" },
  });
  console.log("Updated local admin user (test@nextcrm.app):", adminResult.count);
}

finalizeUsers()
  .catch((e) => {
    console.error("Error finalizing users:", e);
  })
  .finally(async () => {
    await prismadb.$disconnect();
  });
