"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit-log";

export const updateFollowup = async (data: {
  id: string;
  title?: string;
  content?: string;
  priority?: string;
  dueDateAt?: Date | null;
  taskStatus?: string;
  user?: string | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { id, title, content, priority, dueDateAt, taskStatus, user } = data;
  if (!id) return { error: "followupId is required" };

  try {
    const existingTask = await prismadb.crm_Accounts_Tasks.findUnique({
      where: { id },
      select: { contact: true, title: true, taskStatus: true, priority: true, dueDateAt: true },
    });

    const task = await prismadb.crm_Accounts_Tasks.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDateAt: dueDateAt !== undefined ? dueDateAt : undefined,
        taskStatus: taskStatus !== undefined ? (taskStatus as any) : undefined,
        user: user !== undefined ? (user || null) : undefined,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    if (existingTask?.contact) {
      if (taskStatus === "COMPLETE" && existingTask.taskStatus !== "COMPLETE") {
        await writeAuditLog({
          entityType: "contact",
          entityId: existingTask.contact,
          action: "updated",
          changes: [
            { field: "followup_status", old: existingTask.taskStatus, new: "COMPLETE" },
            { field: "followup_title", old: existingTask.title, new: existingTask.title }
          ],
          userId: session.user.id,
        });
      } else {
        const changes: any[] = [];
        if (title !== undefined && title !== existingTask.title) {
          changes.push({ field: "followup_title", old: existingTask.title, new: title });
        }
        if (priority !== undefined && priority !== existingTask.priority) {
          changes.push({ field: "followup_priority", old: existingTask.priority, new: priority });
        }
        if (dueDateAt !== undefined && dueDateAt !== existingTask.dueDateAt) {
          changes.push({
            field: "followup_dueDateAt",
            old: existingTask.dueDateAt ? new Date(existingTask.dueDateAt).toISOString() : null,
            new: dueDateAt ? new Date(dueDateAt).toISOString() : null
          });
        }
        if (taskStatus !== undefined && taskStatus !== existingTask.taskStatus) {
          changes.push({ field: "followup_status", old: existingTask.taskStatus, new: taskStatus });
        }

        if (changes.length > 0) {
          await writeAuditLog({
            entityType: "contact",
            entityId: existingTask.contact,
            action: "updated",
            changes,
            userId: session.user.id,
          });
        }
      }
    }

    revalidatePath("/[locale]/(routes)/crm", "page");
    return { success: true, data: task };
  } catch (error) {
    console.log("[UPDATE_TASK]", error);
    return { error: "Failed to update task" };
  }
};
