import { prismadb } from "@/lib/prisma";

export const getAccountsByPatientId = async (patientId: string) => {
  const data = await prismadb.crm_Accounts.findMany({
    where: {
      deletedAt: null,
      contacts: {
        some: {
          id: patientId,
        },
      },
    },
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
