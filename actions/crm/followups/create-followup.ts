"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

export const createFollowup = async (data: {
  title: string;
  content?: string;
  priority: string;
  user?: string | null;
  contact?: string | null;
  dueDateAt?: Date | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, content, priority, user, contact, dueDateAt } = data;

  try {
    const task = await prismadb.crm_Accounts_Tasks.create({
      data: {
        v: 1,
        title,
        content: content || "",
        priority,
        user: user || null,
        contact: contact || null,
        dueDateAt: dueDateAt || new Date(),
        taskStatus: "ACTIVE",
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    if (contact) {
      await writeAuditLog({
        entityType: "contact",
        entityId: contact,
        action: "updated", // followup additions count as contact updates
        changes: [
          { field: "followup_added", old: null, new: title },
          { field: "followup_priority", old: null, new: priority },
        ],
        userId: session.user.id,
      });
    }

    revalidatePath("/[locale]/(routes)/crm", "page");
    return { success: true, data: task };
  } catch (error) {
    console.log("[CREATE_FOLLOWUP]", error);
    return { error: "Failed to create followup task" };
  }
};
