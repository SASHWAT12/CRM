"use server";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  score: number;
  matchType: "keyword";
}

export interface UnifiedSearchResults {
  accounts: SearchResult[];
  contacts: SearchResult[];
  leads: SearchResult[];
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

  try {
    const [
      kwAccounts,
      kwContacts,
      kwLeads,
      kwTasks,
      kwUsers,
    ] = await Promise.all([
      prismadb.crm_Accounts.findMany({
        where: {
          deletedAt: null,
          AND: [
            scope.account,
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true },
      }),
      prismadb.crm_Contacts.findMany({
        where: {
          deletedAt: null,
          AND: [
            scope.contact,
            {
              OR: [
                { first_name: { contains: query, mode: "insensitive" } },
                { last_name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 10,
        select: { id: true, first_name: true, last_name: true, email: true },
      }),
      prismadb.crm_Leads.findMany({
        where: {
          deletedAt: null,
          AND: [
            scope.lead,
            {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, company: true, email: true },
      }),
      prismadb.tasks.findMany({
        where: {
          AND: [
            scope.task,
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        take: 10,
        select: { id: true, title: true, taskStatus: true },
      }),
      scope.allowUserDirectory
        ? prismadb.users.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 10,
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([] as { id: string; name: string | null; email: string | null }[]),
    ]);

    const accounts = kwAccounts.map((r) => ({
      id: r.id,
      title: r.name,
      subtitle: r.email ?? "",
      url: `/${locale}/crm/accounts/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const contacts = kwContacts.map((r) => ({
      id: r.id,
      title: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      subtitle: r.email ?? "",
      url: `/${locale}/crm/patients/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const leads = kwLeads.map((r) => ({
      id: r.id,
      title:
        r.firstName || r.lastName
          ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
          : (r.company ?? "Unknown Lead"),
      subtitle: r.email ?? r.company ?? "",
      url: `/${locale}/crm/leads/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const tasks = kwTasks.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.taskStatus ?? "",
      url: `/${locale}/tasks/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    const users = kwUsers.map((r) => ({
      id: r.id,
      title: r.name ?? r.email ?? "Unknown User",
      subtitle: r.email ?? "",
      url: `/${locale}/settings/users/${r.id}`,
      score: 1.0,
      matchType: "keyword" as const,
    }));

    return { accounts, contacts, leads, tasks, users };
  } catch (error) {
    console.error("[UNIFIED_SEARCH]", error);
    return { error: "Search failed" };
  }
}
