import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export const getCrMTask = async (id: string) => {
  const session = await getSession();
  if (!session) return null;

  try {
    const task = await prismadb.crm_Accounts_Tasks.findUnique({
      where: { id },
      include: {
        assigned_user: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            assigned_user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return task;
  } catch (error) {
    console.error("[GET_CRM_TASK]", error);
    return null;
  }
};
