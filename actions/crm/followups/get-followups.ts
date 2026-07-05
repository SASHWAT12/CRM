"use server";
import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { taskStatus } from "@prisma/client";

export const getFollowups = async (params: {
  status?: string;
  contactId?: string;
  skip?: number;
  take?: number;
  queue?: string;
  userId?: string;
  priority?: string;
} = {}) => {
  const session = await getSession();
  if (!session) return { tasks: [], total: 0 };

  const { status, contactId, skip = 0, take = 50, queue, userId, priority } = params;

  const where: any = {};

  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");
  if (!isManager) {
    where.user = session.user.id;
  } else if (userId && userId !== "ALL") {
    where.user = userId;
  }

  if (contactId) {
    where.contact = contactId;
  }

  if (status && status !== "ALL") {
    where.taskStatus = status as taskStatus;
  }

  if (priority && priority !== "ALL") {
    where.priority = priority;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Scoped Queues
  if (queue === "OVERDUE") {
    where.taskStatus = "ACTIVE";
    where.dueDateAt = { lt: todayStart };
  } else if (queue === "DUE_TODAY") {
    where.taskStatus = "ACTIVE";
    where.dueDateAt = { gte: todayStart, lte: todayEnd };
  } else if (queue === "UPCOMING") {
    where.taskStatus = "ACTIVE";
    where.dueDateAt = { gt: todayEnd };
  } else if (queue === "COMPLETED") {
    where.taskStatus = "COMPLETE";
  } else if (queue === "STALLED") {
    where.taskStatus = "ACTIVE";
    where.OR = [
      { contact: null },
      { content: "" }
    ];
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
