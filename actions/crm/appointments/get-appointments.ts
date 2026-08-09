"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { CRM_POLICY } from "@/lib/policies/crm-policy";
import { Prisma } from "@prisma/client";

interface GetAppointmentsParams {
  status?: string;
  patientId?: string;
  search?: string;
  queue?: string;
  doctorId?: string;
}

export const getAppointments = async (params: GetAppointmentsParams = {}) => {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const { status, patientId, search, queue, doctorId } = params;

  const whereClause: any = {
    AND: []
  };

  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");
  if (!isManager) {
    whereClause.AND.push({
      OR: [
        { doctorId: session.user.id },
        { staffId: session.user.id }
      ]
    });
  }

  if (patientId) {
    whereClause.AND.push({ patientId });
  }

  if (doctorId && doctorId !== "ALL") {
    whereClause.AND.push({ doctorId });
  }

  if (status && status !== "ALL") {
    whereClause.AND.push({ status });
  }

  const queueFilter: any = {};
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  if (queue === "TODAY" || queue === "SCHEDULED_TODAY") {
    queueFilter.scheduledAt = { gte: startOfToday, lte: endOfToday };
  } else if (queue === "TOMORROW") {
    queueFilter.scheduledAt = { gte: startOfTomorrow, lte: endOfTomorrow };
  } else if (queue === "NOSHOW_CANCELLED" || queue === "MISSED") {
    queueFilter.status = { in: ["CANCELLED", "NO_SHOW"] };
    queueFilter.updatedAt = { gte: startOfToday, lte: endOfToday };
  } else if (queue === "COMPLETED" || queue === "COMPLETED_RECENT") {
    queueFilter.status = "COMPLETED";
    queueFilter.updatedAt = { gte: startOfToday, lte: endOfToday };
  }
  whereClause.AND.push(queueFilter);

  if (search && search.trim() !== "") {
    const s = search.trim();
    const parts = s.split(/\s+/).filter(Boolean);

    let patientNameWhere: Prisma.crm_ContactsWhereInput;
    if (parts.length > 1) {
      const firstNamePart = parts[0];
      const lastNamePart = parts.slice(1).join(" ");
      patientNameWhere = {
        OR: [
          { first_name: { contains: s, mode: "insensitive" } },
          { last_name: { contains: s, mode: "insensitive" } },
          {
            AND: [
              { first_name: { contains: firstNamePart, mode: "insensitive" } },
              { last_name: { contains: lastNamePart, mode: "insensitive" } },
            ],
          },
        ],
      };
    } else {
      patientNameWhere = {
        OR: [
          { first_name: { contains: s, mode: "insensitive" } },
          { last_name: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    whereClause.AND.push({
      OR: [
        {
          notes: {
            contains: s,
            mode: "insensitive",
          },
        },
        {
          patient: patientNameWhere,
        },
        {
          doctor: {
            name: {
              contains: s,
              mode: "insensitive",
            },
          },
        },
        {
          staff: {
            name: {
              contains: s,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  try {
    const appointments = await prismadb.crm_Appointments.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return appointments;
  } catch (error) {
    console.error("[GET_APPOINTMENTS_ERROR]", error);
    return [];
  }
};
