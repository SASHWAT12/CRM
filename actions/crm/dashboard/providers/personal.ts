import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getPersonalWork(userId: string) {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    openTasksCount,
    todayAppointmentsCount,
    assignedPatientsCount,
    overdueTasksCount,
    followupsList,
    appointmentsList,
    patientsList,
    overdueList,
  ] = await Promise.all([
    // Open followups count
    prismadb.crm_Accounts_Tasks.count({
      where: { user: userId, taskStatus: { not: "COMPLETE" } },
    }),
    // Today's appointments count
    prismadb.crm_Appointments.count({
      where: {
        OR: [{ doctorId: userId }, { staffId: userId }],
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Active assigned patients count
    prismadb.crm_Contacts.count({
      where: {
        assigned_to: userId,
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
    }),
    // Overdue tasks count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        user: userId,
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
    }),
    // Followups list
    prismadb.crm_Accounts_Tasks.findMany({
      where: { user: userId, taskStatus: { not: "COMPLETE" } },
      orderBy: { dueDateAt: "asc" },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    }),
    // Appointments list (today and future)
    prismadb.crm_Appointments.findMany({
      where: {
        OR: [{ doctorId: userId }, { staffId: userId }],
        scheduledAt: { gte: startOfToday },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true },
        },
        doctor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    // Assigned active patients list
    prismadb.crm_Contacts.findMany({
      where: {
        assigned_to: userId,
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
      orderBy: { created_on: "desc" },
    }),
    // Overdue tasks list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        user: userId,
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
      orderBy: { dueDateAt: "asc" },
    }),
  ]);

  return {
    kpis: {
      openFollowups: openTasksCount,
      todayAppointments: todayAppointmentsCount,
      assignedPatients: assignedPatientsCount,
      overdueItems: overdueTasksCount,
    },
    lists: {
      followups: followupsList,
      appointments: appointmentsList,
      patients: patientsList,
      overdue: overdueList,
    },
  };
}
