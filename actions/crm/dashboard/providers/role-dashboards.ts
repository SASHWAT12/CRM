import { prismadb } from "@/lib/prisma";
import moment from "moment";

/**
 * Doctor Dashboard Data Provider
 * Fetches clinical consultation metrics & schedule for the assigned doctor.
 */
export async function getDoctorDashboardData(userId: string) {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();
  const now = new Date();

  const [
    todayAppointmentsCount,
    waitingPatientsCount,
    completedTodayCount,
    todaySchedule,
    nextAppointment,
  ] = await Promise.all([
    // Today's total scheduled appointments for doctor
    prismadb.crm_Appointments.count({
      where: {
        doctorId: userId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Waiting / pending consultations today
    prismadb.crm_Appointments.count({
      where: {
        doctorId: userId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    // Completed consultations today
    prismadb.crm_Appointments.count({
      where: {
        doctorId: userId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: "COMPLETED",
      },
    }),
    // Today's clinical schedule list
    prismadb.crm_Appointments.findMany({
      where: {
        doctorId: userId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true, mobile_phone: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    // Next upcoming appointment today
    prismadb.crm_Appointments.findFirst({
      where: {
        doctorId: userId,
        scheduledAt: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true, mobile_phone: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  return {
    kpis: {
      todayAppointments: todayAppointmentsCount,
      waitingPatients: waitingPatientsCount,
      completedToday: completedTodayCount,
    },
    nextAppointment,
    schedule: todaySchedule,
  };
}

/**
 * Receptionist Dashboard Data Provider
 * Fetches front-desk scheduling, check-in, and rescheduling queues.
 */
export async function getReceptionistDashboardData() {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();
  const startOfTomorrow = moment().add(1, "day").startOf("day").toDate();
  const endOfTomorrow = moment().add(1, "day").endOf("day").toDate();

  const [
    todayCount,
    tomorrowCount,
    pendingCheckInCount,
    missedCount,
    frontDeskSchedule,
  ] = await Promise.all([
    // Today's total appointments across hospital
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Tomorrow's total appointments
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gte: startOfTomorrow, lte: endOfTomorrow },
        status: { not: "CANCELLED" },
      },
    }),
    // Pending check-ins today
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    // Missed / Reschedule needed
    prismadb.crm_Appointments.count({
      where: {
        status: { in: ["NO_SHOW", "RESCHEDULED", "CANCELLED"] },
      },
    }),
    // Front desk schedule (today & tomorrow)
    prismadb.crm_Appointments.findMany({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfTomorrow },
      },
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true, mobile_phone: true },
        },
        doctor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 12,
    }),
  ]);

  return {
    kpis: {
      todayAppointments: todayCount,
      tomorrowAppointments: tomorrowCount,
      pendingCheckIns: pendingCheckInCount,
      missedReschedules: missedCount,
    },
    schedule: frontDeskSchedule,
  };
}

/**
 * Counselor Dashboard Data Provider
 * Fetches followup tasks, overdue alerts, and assigned prospective patients.
 */
export async function getCounselorDashboardData(userId: string) {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    overdueCount,
    dueTodayCount,
    assignedPatientsCount,
    convertedCount,
    overdueList,
    followupsList,
    assignedPatientsList,
  ] = await Promise.all([
    // Overdue followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        user: userId,
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
    }),
    // Due today followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        user: userId,
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Assigned active patients count
    prismadb.crm_Contacts.count({
      where: {
        assigned_to: userId,
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
    }),
    // Converted patients count
    prismadb.crm_Contacts.count({
      where: {
        assigned_to: userId,
        pipelineStage: "CONVERTED",
        deletedAt: null,
      },
    }),
    // Overdue tasks alert list (top 3)
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
      take: 3,
    }),
    // Active followup tasks list (top 8)
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        user: userId,
        taskStatus: { not: "COMPLETE" },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
      orderBy: { dueDateAt: "asc" },
      take: 8,
    }),
    // Assigned active patients list (top 8)
    prismadb.crm_Contacts.findMany({
      where: {
        assigned_to: userId,
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
      orderBy: { created_on: "desc" },
      take: 8,
    }),
  ]);

  return {
    kpis: {
      overdueFollowups: overdueCount,
      dueTodayFollowups: dueTodayCount,
      assignedPatients: assignedPatientsCount,
      conversions: convertedCount,
    },
    lists: {
      overdue: overdueList,
      followups: followupsList,
      patients: assignedPatientsList,
    },
  };
}

/**
 * Admin / Management Dashboard Data Provider
 * Fetches operational oversight metrics across the hospital system.
 */
export async function getAdminDashboardData() {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    activeUsersCount,
    totalOverdueCount,
    hospitalTodayAppointmentsCount,
    totalActivePatientsCount,
    overdueBacklogList,
    recentUsersList,
  ] = await Promise.all([
    // Active staff users count
    prismadb.users.count({
      where: {
        userStatus: "ACTIVE",
        role: { not: "root" },
        email: { not: "sashwat73@gmail.com" },
      },
    }),
    // System-wide overdue tasks count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
    }),
    // Hospital-wide appointments today
    prismadb.crm_Appointments.count({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    // Total active prospective patients in system
    prismadb.crm_Contacts.count({
      where: {
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
    }),
    // Overdue followup tasks backlog across staff (top 8)
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
      orderBy: { dueDateAt: "asc" },
      take: 8,
    }),
    // Active users / staff list
    prismadb.users.findMany({
      where: {
        userStatus: "ACTIVE",
        role: { not: "root" },
        email: { not: "sashwat73@gmail.com" },
      },
      select: { id: true, name: true, email: true, role: true, userStatus: true },
      take: 8,
    }),
  ]);

  return {
    kpis: {
      activeUsers: activeUsersCount,
      totalOverdueItems: totalOverdueCount,
      todayAppointments: hospitalTodayAppointmentsCount,
      activePatients: totalActivePatientsCount,
    },
    lists: {
      overdueBacklog: overdueBacklogList,
      users: recentUsersList,
    },
  };
}
