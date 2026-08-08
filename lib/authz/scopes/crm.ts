import { prismadb } from "@/lib/prisma";
import { AuthzUser } from "../session";
import { AuthorizationError } from "../errors";

type ContactWhere = NonNullable<
  Parameters<typeof prismadb.crm_Contacts.updateMany>[0]
>["where"];
type TargetWhere = any;

function contactScopedWhere(user: AuthzUser, contactId: string): ContactWhere {
  if (user.role === "admin" || user.role === "manager") {
    return { id: contactId };
  }
  // user role: own contact (assigned or creator).
  return {
    id: contactId,
    OR: [
      { assigned_to: user.id },
      { createdBy: user.id },
    ],
  };
}

export async function tryScopedUpdateContact(
  user: AuthzUser,
  contactId: string,
  data: Record<string, string>,
): Promise<boolean> {
  const result = await prismadb.crm_Contacts.updateMany({
    where: contactScopedWhere(user, contactId),
    data: { ...data, updatedBy: user.id },
  });
  return result.count > 0;
}

// Phase B1 write scope helper (kept for assertCanWriteContact).
// Read path now uses contactReadScopeWhere (D2) which adds linked-account scope.
async function findContactInScope(user: AuthzUser, contactId: string) {
  if (user.role === "admin" || user.role === "manager") {
    return prismadb.crm_Contacts.findFirst({
      where: { id: contactId },
      select: { id: true },
    });
  }
  return prismadb.crm_Contacts.findFirst({
    where: {
      id: contactId,
      OR: [
        { assigned_to: user.id },
        { createdBy: user.id },
      ],
    },
    select: { id: true },
  });
}

export async function assertCanReadContact(
  user: AuthzUser,
  contactId: string,
): Promise<void> {
  const row = await prismadb.crm_Contacts.findFirst({
    where: { id: contactId, ...contactReadScopeWhere(user) },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteContact(
  user: AuthzUser,
  contactId: string,
): Promise<void> {
  const row = await findContactInScope(user, contactId);
  if (!row) throw new AuthorizationError();
}

export async function filterAuthorizedContactIds(
  user: AuthzUser,
  contactIds: string[],
): Promise<string[]> {
  if (contactIds.length === 0) return [];
  const rows = await prismadb.crm_Contacts.findMany({
    where: { id: { in: contactIds }, ...contactReadScopeWhere(user) },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function filterAuthorizedLeadIds(
  user: AuthzUser,
  leadIds: string[],
): Promise<string[]> {
  if (leadIds.length === 0) return [];
  const rows = await prismadb.crm_Leads.findMany({
    where: { id: { in: leadIds }, ...leadReadScopeWhere(user) },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

// ---------------------------------------------------------------------------
// D2: Entity read-scope helpers (Lead / Contact / Opportunity / Contract)
// ---------------------------------------------------------------------------

export function leadReadScopeWhere(user: AuthzUser) {
  if (user.role === "admin" || user.role === "manager") {
    return { deletedAt: null };
  }
  return {
    deletedAt: null,
    OR: [
      { assigned_to: user.id },
      { createdBy: user.id },
    ],
  };
}

export function contactReadScopeWhere(user: AuthzUser) {
  if (user.role === "admin" || user.role === "manager") {
    return { deletedAt: null };
  }
  return {
    deletedAt: null,
    OR: [
      { assigned_to: user.id },
      { createdBy: user.id },
    ],
  };
}

export async function assertCanReadLead(
  user: AuthzUser,
  leadId: string,
): Promise<void> {
  const row = await prismadb.crm_Leads.findFirst({
    where: { id: leadId, ...leadReadScopeWhere(user) },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

// ---------------------------------------------------------------------------
// D3.T3: Activity / audit dispatch helper.
// Resolves an entityType string to the matching assertCanRead* helper.
// Used by activity-feed (T4) and audit-log-by-entity (T5).
// Unknown entity types: managers/admins pass; users are denied.
// ---------------------------------------------------------------------------
export async function assertCanReadActivityForEntity(
  user: AuthzUser,
  entityType: string,
  entityId: string,
): Promise<void> {
  switch (entityType.toLowerCase()) {
    case "lead":
      return assertCanReadLead(user, entityId);
    case "contact":
      return assertCanReadContact(user, entityId);
    default:
      if (user.role === "user") throw new AuthorizationError();
      return;
  }
}

// ---------------------------------------------------------------------------
// Hospital Internal Tasks scope helpers.
// Tasks: Owner (`user`) or Creator (`createdBy`) can read/write tasks.
// ---------------------------------------------------------------------------

export async function assertCanReadTask(
  user: AuthzUser,
  taskId: string,
): Promise<void> {
  const task = await prismadb.tasks.findUnique({
    where: { id: taskId },
    select: { id: true, user: true, createdBy: true },
  });
  if (!task) throw new AuthorizationError();
  if (user.role === "admin" || user.role === "manager") return;
  if (task.user !== user.id && task.createdBy !== user.id) {
    throw new AuthorizationError();
  }
}

export async function assertCanWriteTask(
  user: AuthzUser,
  taskId: string,
): Promise<void> {
  return assertCanReadTask(user, taskId);
}
