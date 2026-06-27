"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

export const deletePatient = async (patientId: string) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!patientId) return { error: "patientId is required" };

  try {
    await prismadb.crm_Contacts.update({
      where: { id: patientId },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    await writeAuditLog({
      entityType: "contact",
      entityId: patientId,
      action: "deleted",
      changes: null,
      userId: session.user.id,
    });
    revalidatePath("/[locale]/(routes)/crm/patients", "page");
    return { success: true };
  } catch (error) {
    console.log("[DELETE_PATIENT]", error);
    return { error: "Failed to delete patient" };
  }
};
