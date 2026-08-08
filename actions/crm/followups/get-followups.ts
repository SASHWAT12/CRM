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
  search?: string;
} = {}) => {
  const session = await getSession();
  if (!session) return { tasks: [], total: 0 };

  const { status, contactId, skip = 0, take = 50, queue, userId, priority, search } = params;

  const where: any = {
    AND: []
  };

  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");
  if (!isManager) {
    where.AND.push({ user: session.user.id });
  } else if (userId && userId !== "ALL") {
    where.AND.push({ user: userId });
  }

  if (contactId) {
    where.AND.push({ contact: contactId });
  }

  if (status && status !== "ALL") {
    where.AND.push({ taskStatus: status as taskStatus });
  }

  if (priority && priority !== "ALL") {
    where.AND.push({ priority });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Scoped Queues
  const queueFilter: any = {};
  if (queue === "OVERDUE") {
    queueFilter.taskStatus = "ACTIVE";
    queueFilter.dueDateAt = { lt: todayStart };
  } else if (queue === "DUE_TODAY") {
    queueFilter.taskStatus = "ACTIVE";
    queueFilter.dueDateAt = { gte: todayStart, lte: todayEnd };
  } else if (queue === "UPCOMING") {
    queueFilter.taskStatus = "ACTIVE";
    queueFilter.dueDateAt = { gt: todayEnd };
  } else if (queue === "COMPLETED") {
    queueFilter.taskStatus = "COMPLETE";
  } else if (queue === "STALLED") {
    queueFilter.taskStatus = "ACTIVE";
    queueFilter.OR = [
      { contact: null },
      { content: "" }
    ];
  }
  where.AND.push(queueFilter);

  if (search && search.trim() !== "") {
    const s = search.trim();
    where.AND.push({
      OR: [
        { title: { contains: s, mode: "insensitive" } },
        { content: { contains: s, mode: "insensitive" } },
        {
          crm_contact: {
            OR: [
              { first_name: { contains: s, mode: "insensitive" } },
              { last_name: { contains: s, mode: "insensitive" } }
            ]
          }
        },
        {
          assigned_user: {
            name: { contains: s, mode: "insensitive" }
          }
        }
      ]
    });
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
