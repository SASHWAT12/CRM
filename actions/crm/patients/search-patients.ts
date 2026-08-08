"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { contactReadScopeWhere } from "@/lib/authz";

const PAGE_SIZE_MAX = 100;

export async function searchPatients({
  search = "",
  patientId = "",
  skip = 0,
  take = 50,
}: {
  search?: string;
  patientId?: string;
  skip?: number;
  take?: number;
} = {}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const safeTake = Math.min(PAGE_SIZE_MAX, Math.max(1, take));
  const safeSkip = Math.max(0, skip);

  // Apply contact read permissions safely by combining OR conditions using AND if needed
  const scopeWhere = contactReadScopeWhere(session.user as any);
  const where: any = {
    ...scopeWhere,
    deletedAt: null,
  };

  if (patientId) {
    where.id = patientId;
  } else if (search) {
    const searchConditions = [
      { first_name: { contains: search, mode: "insensitive" as const } },
      { last_name: { contains: search, mode: "insensitive" as const } },
    ];
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions },
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const [contacts, total] = await prismadb.$transaction([
    prismadb.crm_Contacts.findMany({
      where,
      select: { id: true, first_name: true, last_name: true },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      skip: safeSkip,
      take: safeTake,
    }),
    prismadb.crm_Contacts.count({ where }),
  ]);

  const users = contacts.map(c => ({
    id: c.id,
    name: `${c.first_name || ""} ${c.last_name}`.trim(),
  }));

  return { users, total, hasMore: safeSkip + safeTake < total };
}
