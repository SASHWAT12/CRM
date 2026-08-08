import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getWorkloadData() {
  const startOfToday = moment().startOf("day").toDate();

  const [counselorsList, doctorsList, activePatients, activeAppointments, overdueFollowups] = await Promise.all([
    // Active staff/counsellors list
    prismadb.users.findMany({
      where: {
        role: { in: ["counsellor", "manager", "admin", "receptionist"] },
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true, role: true },
    }),
    // Active doctors list
    prismadb.users.findMany({
      where: {
        role: "doctor",
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
    // Count of active patients (Contacts) grouped by assignee
    prismadb.crm_Contacts.findMany({
      where: {
        pipelineStage: { notIn: ["CONVERTED", "CLOSED_LOST"] },
        deletedAt: null,
      },
      select: {
        assigned_to: true,
        pipelineStage: true,
      },
    }),
    // Appointments scheduled in the future grouped by doctorId
    prismadb.crm_Appointments.findMany({
      where: {
        scheduledAt: { gte: startOfToday },
        status: { not: "CANCELLED" },
      },
      select: {
        doctorId: true,
      },
    }),
    // Overdue tasks grouped by assigned user
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        taskStatus: { not: "COMPLETE" },
        dueDateAt: { lt: startOfToday },
      },
      select: {
        user: true,
      },
    }),
  ]);

  // Aggregate counselor workload
  const counselorWorkload = counselorsList.map((c) => {
    const patients = activePatients.filter((p) => p.assigned_to === c.id);
    const overdueTasks = overdueFollowups.filter((f) => f.user === c.id).length;

    return {
      id: c.id,
      name: c.name,
      role: c.role,
      activePatientsCount: patients.length,
      overdueFollowupsCount: overdueTasks,
    };
  });

  // Aggregate doctor workload
  const doctorWorkload = doctorsList.map((d) => {
    const appointments = activeAppointments.filter((a) => a.doctorId === d.id);
    return {
      id: d.id,
      name: d.name,
      appointmentsCount: appointments.length,
    };
  });

  return {
    counselorWorkload,
    doctorWorkload,
  };
}
