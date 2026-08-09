import { cache } from "react";
import { prismadb } from "@/lib/prisma";

export const getAllCrmData = cache(async () => {
  const [
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    productCategories,
    users,
  ] = await Promise.all([
    prismadb.crm_Contact_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_ProductCategories.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    prismadb.users.findMany({
      where: { userStatus: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = {
    leads: [],
    contacts: [],
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    productCategories,
    users,
  };

  return data;
});
