import { prismadb } from "@/lib/prisma";

export const getPatientFollowups = async (patientId: string) => {
  const data = await prismadb.crm_Accounts_Tasks.findMany({
    where: {
      contact: patientId,
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
