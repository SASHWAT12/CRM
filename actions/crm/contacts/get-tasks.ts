import { prismadb } from "@/lib/prisma";

export const getContactTasks = async (contactId: string) => {
  const data = await prismadb.crm_Accounts_Tasks.findMany({
    where: {
      contact: contactId,
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return data;
};
