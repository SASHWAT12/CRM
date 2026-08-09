"use server";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { getReportScope } from "@/lib/authz/scopes/report-scope";
import { Prisma } from "@prisma/client";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  score: number;
  matchType: "keyword";
}

export interface UnifiedSearchResults {
  contacts: SearchResult[];
  leads: SearchResult[];
  appointments: SearchResult[];
  tasks: SearchResult[];
  users: SearchResult[];
}

export async function unifiedSearch(
  query: string,
  locale: string = "en"
): Promise<UnifiedSearchResults | { error: string }> {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }
  if (!query || query.trim().length < 2)
    return { error: "Query must be at least 2 characters" };

  const scope = getReportScope(user);
  const isManager = ["root", "admin", "manager"].includes(user.role || "");

  const s = query.trim().replace(/\s+/g, " ");
  const parts = s.split(" ").filter(Boolean);
  const firstNamePart = parts[0];
  const lastNamePart = parts.slice(1).join(" ");

  try {
    // 1. Patients Query (crm_Contacts)
    const patientWhere: Prisma.crm_ContactsWhereInput = {
      deletedAt: null,
      AND: [
        scope.contact,
        parts.length > 1
          ? {
              OR: [
                { first_name: { contains: s, mode: "insensitive" } },
                { last_name: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { mobile_phone: { contains: s, mode: "insensitive" } },
                {
                  AND: [
                    { first_name: { contains: firstNamePart, mode: "insensitive" } },
                    { last_name: { contains: lastNamePart, mode: "insensitive" } },
                  ],
                },
              ],
            }
          : {
              OR: [
                { first_name: { contains: s, mode: "insensitive" } },
                { last_name: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { mobile_phone: { contains: s, mode: "insensitive" } },
              ],
            },
      ],
    };

    // 2. Leads Query (crm_Leads)
    const leadWhere: Prisma.crm_LeadsWhereInput = {
      deletedAt: null,
      AND: [
        scope.lead,
        parts.length > 1
          ? {
              OR: [
                { firstName: { contains: s, mode: "insensitive" } },
                { lastName: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { phone: { contains: s, mode: "insensitive" } },
                {
                  AND: [
                    { firstName: { contains: firstNamePart, mode: "insensitive" } },
                    { lastName: { contains: lastNamePart, mode: "insensitive" } },
                  ],
                },
              ],
            }
          : {
              OR: [
                { firstName: { contains: s, mode: "insensitive" } },
                { lastName: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { phone: { contains: s, mode: "insensitive" } },
              ],
            },
      ],
    };

    // 3. Appointments Query (crm_Appointments)
    const appointmentScope: Prisma.crm_AppointmentsWhereInput = isManager
      ? {}
      : { OR: [{ doctorId: user.id }, { staffId: user.id }] };

    const appointmentWhere: Prisma.crm_AppointmentsWhereInput = {
      AND: [
        appointmentScope,
        parts.length > 1
          ? {
              OR: [
                { notes: { contains: s, mode: "insensitive" } },
                { doctor: { name: { contains: s, mode: "insensitive" } } },
                { staff: { name: { contains: s, mode: "insensitive" } } },
                {
                  patient: {
                    AND: [
                      { first_name: { contains: firstNamePart, mode: "insensitive" } },
                      { last_name: { contains: lastNamePart, mode: "insensitive" } },
                    ],
                  },
                },
              ],
            }
          : {
              OR: [
                { notes: { contains: s, mode: "insensitive" } },
                { doctor: { name: { contains: s, mode: "insensitive" } } },
                { staff: { name: { contains: s, mode: "insensitive" } } },
                { patient: { first_name: { contains: s, mode: "insensitive" } } },
                { patient: { last_name: { contains: s, mode: "insensitive" } } },
              ],
            },
      ],
    };

    // 4. Followups Query (crm_Accounts_Tasks)
    const followupScope: Prisma.crm_Accounts_TasksWhereInput = isManager
      ? {}
      : { user: user.id };

    const followupWhere: Prisma.crm_Accounts_TasksWhereInput = {
      AND: [
        followupScope,
        parts.length > 1
          ? {
              OR: [
                { title: { contains: s, mode: "insensitive" } },
                { content: { contains: s, mode: "insensitive" } },
                {
                  crm_contact: {
                    AND: [
                      { first_name: { contains: firstNamePart, mode: "insensitive" } },
                      { last_name: { contains: lastNamePart, mode: "insensitive" } },
                    ],
                  },
                },
              ],
            }
          : {
              OR: [
                { title: { contains: s, mode: "insensitive" } },
                { content: { contains: s, mode: "insensitive" } },
                { crm_contact: { first_name: { contains: s, mode: "insensitive" } } },
                { crm_contact: { last_name: { contains: s, mode: "insensitive" } } },
              ],
            },
      ],
    };

    // Execute queries in parallel
    const [
      kwContacts,
      kwLeads,
      kwAppointments,
      kwTasks,
      kwUsers,
    ] = await Promise.all([
      prismadb.crm_Contacts.findMany({
        where: patientWhere,
        take: 10,
        select: { id: true, first_name: true, last_name: true, email: true, mobile_phone: true },
      }),
      prismadb.crm_Leads.findMany({
        where: leadWhere,
        take: 10,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      }),
      prismadb.crm_Appointments.findMany({
        where: appointmentWhere,
        take: 10,
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          notes: true,
          patient: { select: { id: true, first_name: true, last_name: true } },
          doctor: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
        },
      }),
      prismadb.crm_Accounts_Tasks.findMany({
        where: followupWhere,
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          taskStatus: true,
          crm_contact: { select: { id: true, first_name: true, last_name: true } },
        },
      }),
      scope.allowUserDirectory
        ? prismadb.users.findMany({
            where: {
              role: { not: "root" },
              email: { not: "sashwat73@gmail.com" },
              OR: [
                { name: { contains: s, mode: "insensitive" } },
                { email: { contains: s, mode: "insensitive" } },
                { username: { contains: s, mode: "insensitive" } },
              ],
            },
            take: 10,
            select: { id: true, name: true, email: true, role: true },
          })
        : Promise.resolve([] as { id: string; name: string | null; email: string | null; role: string }[]),
    ]);

    const contacts = kwContacts.map((r) => ({
      id: r.id,
      title: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      subtitle: r.mobile_phone ? `${r.email ?? ""} | Phone: ${r.mobile_phone}`.trim() : (r.email ?? ""),
      url: `/${locale}/crm/patients/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const leads = kwLeads.map((r) => ({
      id: r.id,
      title: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unknown Lead",
      subtitle: r.phone ? `${r.email ?? ""} | Phone: ${r.phone}`.trim() : (r.email ?? ""),
      url: `/${locale}/crm/leads/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const appointments = kwAppointments.map((r) => {
      const patientName = r.patient ? `${r.patient.first_name ?? ""} ${r.patient.last_name ?? ""}`.trim() : "Unknown Patient";
      return {
        id: r.id,
        title: `Consultation - ${patientName}`,
        subtitle: `Doctor: ${r.doctor?.name ?? "Unassigned"} | Status: ${r.status}`,
        url: `/${locale}/crm/appointments`,
        score: 1.0,
        matchType: "keyword" as const,
      };
    });

    const tasks = kwTasks.map((r) => {
      const patientName = r.crm_contact ? `${r.crm_contact.first_name ?? ""} ${r.crm_contact.last_name ?? ""}`.trim() : "";
      return {
        id: r.id,
        title: r.title,
        subtitle: patientName ? `Patient: ${patientName} | Status: ${r.taskStatus ?? "ACTIVE"}` : `Status: ${r.taskStatus ?? "ACTIVE"}`,
        url: `/${locale}/crm/followups/viewfollowup/${r.id}`,
        score: 1.0,
        matchType: "keyword" as const,
      };
    });

    const users = kwUsers.map((r) => ({
      id: r.id,
      title: r.name ?? r.email ?? "Unknown User",
      subtitle: `Role: ${r.role} | ${r.email ?? ""}`,
      url: `/${locale}/admin/users`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    return { contacts, leads, appointments, tasks, users };
  } catch (error) {
    console.error("[UNIFIED_SEARCH]", error);
    return { error: "Search failed" };
  }
}
