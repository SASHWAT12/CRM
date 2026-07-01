"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import resendHelper from "@/lib/resend";
import NewTaskFromCRMEmail from "@/emails/NewTaskFromCRM";

import { writeAuditLog } from "@/lib/audit-log";

export const createTask = async (data: {
  title: string;
  user: string;
  priority: string;
  content: string;
  account?: string;
  contact?: string;
  dueDateAt?: Date;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, user, priority, content, account, contact, dueDateAt } = data;

  if (!title || !user || !priority || !content) {
    return { error: "Missing one of the task data" };
  }


  try {
    const task = await prismadb.crm_Accounts_Tasks.create({
      data: {
        v: 0,
        priority,
        title,
        content,
        account: (account && account.trim() !== "") ? account : null,
        contact: (contact && contact.trim() !== "") ? contact : null,
        dueDateAt,
        createdBy: user,
        updatedBy: user,
        user,
        taskStatus: "ACTIVE",
      },
    });

    // Notification to user who is not a task creator
    if (user !== session.user.id) {
      try {
        const resend = await resendHelper();
        const notifyRecipient = await prismadb.users.findUnique({
          where: { id: user },
        });

        if (notifyRecipient?.email) {
          await resend.emails.send({
            from:
              (process.env.NEXT_PUBLIC_APP_NAME || "MmrhCRM") +
              " <" +
              (process.env.EMAIL_FROM || "info@softbase.cz") +
              ">",
            to: notifyRecipient.email,
            subject:
              session.user.userLanguage === "en"
                ? `New task - ${title}.`
                : `Nový úkol - ${title}.`,
            text: "",
            react: NewTaskFromCRMEmail({
              taskFromUser: session.user.name!,
              username: notifyRecipient.name!,
              userLanguage: notifyRecipient.userLanguage!,
              taskData: task,
            }),
          });
        }
      } catch (error) {
        console.log("Resend notification failed (ignored in development):", error);
      }
    }

    if (contact) {
      await writeAuditLog({
        entityType: "contact",
        entityId: contact,
        action: "created",
        changes: [
          { field: "followup_title", old: null, new: title },
          { field: "followup_priority", old: null, new: priority },
          { field: "followup_dueDateAt", old: null, new: dueDateAt ? dueDateAt.toISOString() : null }
        ],
        userId: session.user.id,
      });
    }

    revalidatePath("/[locale]/(routes)/crm/accounts", "page");
    revalidatePath("/[locale]/(routes)/crm/patients", "page");
    return { data: task };
  } catch (error) {
    console.log("[CREATE_TASK]", error);
    return { error: "Failed to create task" };
  }
};
