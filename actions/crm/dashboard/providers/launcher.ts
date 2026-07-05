import { prismadb } from "@/lib/prisma";

export async function getLauncherMetrics(userId: string, role: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const isManager = ["root", "admin", "manager"].includes(role);
  
  // User scope filters
  const taskFilter = isManager ? {} : { user: userId };
  const appointmentFilter = isManager ? {} : { OR: [{ doctorId: userId }, { staffId: userId }] };
  const leadFilter = isManager ? {} : { assigned_to: userId };
  const patientFilter = isManager ? {} : { assigned_to: userId };

  const [dueFollowups, todayAppointments, openLeads, activePatients] = await Promise.all([
    // Count of active follow-ups due today or overdue
    prismadb.crm_Accounts_Tasks.count({
      where: {
        taskStatus: "ACTIVE",
        dueDateAt: { lte: endOfToday },
        ...taskFilter,
      },
    }),
    // Count of consultations/appointments scheduled for today
    (prismadb as any).crm_Appointments.count({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        ...appointmentFilter,
      },
    }),
    // Count of active leads
    prismadb.crm_Leads.count({
      where: {
        deletedAt: null,
        ...leadFilter,
      },
    }),
    // Count of active tracked patients
    prismadb.crm_Contacts.count({
      where: {
        deletedAt: null,
        ...patientFilter,
      },
    }),
  ]);

  return {
    dueFollowups,
    todayAppointments,
    openLeads,
    activePatients,
  };
}
