import { prismadb } from "@/lib/prisma";
import moment from "moment";

export async function getFollowupsData() {
  const startOfToday = moment().startOf("day").toDate();
  const endOfToday = moment().endOf("day").toDate();

  const [
    dueTodayCount,
    dueTodayList,
    completedTodayCount,
    completedTodayList,
    overdueCount,
    overdueList,
  ] = await Promise.all([
    // Today's followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        dueDateAt: { gte: startOfToday, lte: endOfToday },
        taskStatus: { not: "COMPLETE" },
      },
    }),
    // Today's followups list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        dueDateAt: { gte: startOfToday, lte: endOfToday },
        taskStatus: { not: "COMPLETE" },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
        assigned_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDateAt: "asc" },
    }),
    // Completed today count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        taskStatus: "COMPLETE",
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Completed today list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        taskStatus: "COMPLETE",
        updatedAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
        assigned_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    // Overdue followups count
    prismadb.crm_Accounts_Tasks.count({
      where: {
        dueDateAt: { lt: startOfToday },
        taskStatus: { not: "COMPLETE" },
      },
    }),
    // Overdue followups list
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        dueDateAt: { lt: startOfToday },
        taskStatus: { not: "COMPLETE" },
      },
      include: {
        crm_contact: {
          select: { id: true, first_name: true, last_name: true },
        },
        assigned_user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDateAt: "asc" },
    }),
  ]);

  return {
    dueTodayCount,
    dueTodayList,
    completedTodayCount,
    completedTodayList,
    overdueCount,
    overdueList,
  };
}
