import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getAppointmentsData() {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    todayCount,
    todayList,
    futureCount,
    futureList,
    unassignedList,
  ] = await Promise.all([
    // Today's appointments count
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Today's appointments list
    prismadb.crm_Appointments.findMany({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true },
        },
        doctor: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    // Future appointments count
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gt: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Future appointments list
    prismadb.crm_Appointments.findMany({
      where: {
        scheduledAt: { gt: endOfToday },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true },
        },
        doctor: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    // Unassigned appointments (where doctor role is not 'doctor')
    prismadb.crm_Appointments.findMany({
      where: {
        doctor: {
          role: { not: "doctor" },
        },
        scheduledAt: { gte: startOfToday },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true },
        },
        doctor: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const unassignedCount = unassignedList.length;

  return {
    todayCount,
    todayList,
    futureCount,
    futureList,
    unassignedCount,
    unassignedList,
  };
}
