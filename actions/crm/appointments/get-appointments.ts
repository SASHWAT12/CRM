"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { CRM_POLICY } from "@/lib/policies/crm-policy";

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

  // Scoped Queues based on CRM_POLICY
  const queueFilter: any = {};
  if (queue === "TODAY") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    queueFilter.scheduledAt = { gte: startOfToday, lte: endOfToday };
  } else if (queue === "TOMORROW") {
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);
    queueFilter.scheduledAt = { gte: startOfTomorrow, lte: endOfTomorrow };
  } else if (queue === "COMPLETED") {
    queueFilter.status = "COMPLETED";
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    queueFilter.updatedAt = { gte: startOfToday, lte: endOfToday };
  } else if (queue === "NOSHOW_CANCELLED") {
    queueFilter.status = { in: ["NO_SHOW", "CANCELLED"] };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    queueFilter.updatedAt = { gte: startOfToday, lte: endOfToday };
  }
  whereClause.AND.push(queueFilter);

  if (search && search.trim() !== "") {
    const searchTrimmed = search.trim();
    whereClause.AND.push({
      OR: [
        {
          notes: {
            contains: searchTrimmed,
            mode: "insensitive",
          },
        },
        {
          patient: {
            OR: [
              {
                first_name: {
                  contains: searchTrimmed,
                  mode: "insensitive",
                },
              },
              {
                last_name: {
                  contains: searchTrimmed,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        {
          doctor: {
            name: {
              contains: searchTrimmed,
              mode: "insensitive",
            },
          },
        },
        {
          staff: {
            name: {
              contains: searchTrimmed,
              mode: "insensitive",
            },
          },
        },
      ]
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
