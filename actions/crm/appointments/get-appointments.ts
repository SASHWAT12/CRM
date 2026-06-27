"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

interface GetAppointmentsParams {
  status?: string;
  patientId?: string;
  search?: string;
}

export const getAppointments = async (params: GetAppointmentsParams = {}) => {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const { status, patientId, search } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {};

  if (patientId) {
    whereClause.patientId = patientId;
  }

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (search && search.trim() !== "") {
    const searchTrimmed = search.trim();
    whereClause.OR = [
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appointments = await (prismadb as any).crm_Appointments.findMany({
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
