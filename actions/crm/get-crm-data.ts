import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

export const getAllCrmData = cache(async () => {
  const [
    accounts,
    leads,
    contacts,
    industries,
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    productCategories,
  ] = await Promise.all([
    prismadb.crm_Accounts.findMany({ where: { deletedAt: null } }),
    prismadb.crm_Leads.findMany({ where: { deletedAt: null } }),
    prismadb.crm_Contacts.findMany({ where: { deletedAt: null } }),
    prismadb.crm_Industry_Type.findMany({}),
    prismadb.crm_Contact_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_ProductCategories.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const data = {
    accounts,
    leads,
    contacts,
    industries,
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    productCategories
  };

  return data;
});
