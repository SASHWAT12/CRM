"use server";
import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { taskStatus } from "@prisma/client";

export const getFollowups = async (params: {
  status?: string;
  contactId?: string;
  skip?: number;
  take?: number;
} = {}) => {
  const session = await getSession();
  if (!session) return { tasks: [], total: 0 };

  const { status, contactId, skip = 0, take = 50 } = params;

  const where: any = {};

  if (contactId) {
    where.contact = contactId;
  }

  if (status && status !== "ALL") {
    where.taskStatus = status as taskStatus;
  }

  const [tasks, total] = await prismadb.$transaction([
    prismadb.crm_Accounts_Tasks.findMany({
      where,
      include: {
        assigned_user: {
          select: {
            id: true,
            name: true,
          },
        },
        crm_contact: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        dueDateAt: "asc",
      },
      skip,
      take,
    }),
    prismadb.crm_Accounts_Tasks.count({ where }),
  ]);

  return { tasks, total };
};
