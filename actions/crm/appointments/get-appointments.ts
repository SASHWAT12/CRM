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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};

  const isManager = ["root", "admin", "manager"].includes(session.user.role || "");
  if (!isManager) {
    whereClause.OR = [
      { doctorId: session.user.id },
      { staffId: session.user.id }
    ];
  }

  if (patientId) {
    whereClause.patientId = patientId;
  }

  if (doctorId && doctorId !== "ALL") {
    whereClause.doctorId = doctorId;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  // Scoped Queues based on CRM_POLICY
  if (queue === "TODAY") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    whereClause.scheduledAt = { gte: startOfToday, lte: endOfToday };
  } else if (queue === "STARTING_SOON") {
    const now = new Date();
    const nextLimit = new Date(now.getTime() + CRM_POLICY.THRESHOLDS.APPOINTMENT_STARTING_SOON_MS);
    whereClause.scheduledAt = { gte: now, lte: nextLimit };
    whereClause.status = { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] };
  } else if (queue === "AWAITING_PRACTITIONER") {
    // Audit check: doctorId is required, staffId is optional. Unassigned maps to staffId null.
    whereClause.staffId = null;
    whereClause.status = { notIn: ["COMPLETED", "CANCELLED"] };
  } else if (queue === "COMPLETED") {
    whereClause.status = "COMPLETED";
  } else if (queue === "NOSHOW_CANCELLED") {
    whereClause.status = { in: ["NO_SHOW", "CANCELLED"] };
  }

  if (search && search.trim() !== "") {
    const searchTrimmed = search.trim();
    whereClause.OR = [
      ...(whereClause.OR || []),
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
    ];
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
