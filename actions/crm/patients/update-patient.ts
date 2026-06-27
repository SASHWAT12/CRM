"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";

export const updatePatient = async (data: {
  id: string;
  assigned_to?: string;
  assigned_account?: string | null;
  birthday_day?: string | null;
  birthday_month?: string | null;
  birthday_year?: string | null;
  description?: string | null;
  email?: string;
  personal_email?: string | null;
  first_name?: string | null;
  last_name?: string;
  office_phone?: string | null;
  mobile_phone?: string | null;
  website?: string | null;
  status?: boolean;
  social_twitter?: string | null;
  social_facebook?: string | null;
  social_linkedin?: string | null;
  social_skype?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_tiktok?: string | null;
  contact_type_id?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;
  const {
    id,
    assigned_to,
    assigned_account,
    birthday_day,
    birthday_month,
    birthday_year,
    contact_type_id,
    ...rest
  } = data;

  if (!id) return { error: "id is required" };

  const sanitizeUuid = (val: string | null | undefined): string | null => {
    if (!val || val.trim() === "" || val === "undefined" || val === "null") return null;
    return val;
  };

  const cleanAssignedTo = sanitizeUuid(assigned_to);
  const cleanAssignedAccount = sanitizeUuid(assigned_account);
  const cleanContactTypeId = sanitizeUuid(contact_type_id);

  try {
    const before = await prismadb.crm_Contacts.findFirst({ where: { id, deletedAt: null } });
    const contact = await prismadb.crm_Contacts.update({
      where: { id },
      data: {
        v: 0,
        updatedBy: userId,
        accountsIDs: cleanAssignedAccount,
        assigned_to: cleanAssignedTo,
        contact_type_id: cleanContactTypeId,
        birthday:
          birthday_day && birthday_month && birthday_year
            ? birthday_day + "/" + birthday_month + "/" + birthday_year
            : null,
        ...rest,
      } as any,
    });
    const changes = before ? diffObjects(before as Record<string, unknown>, contact as Record<string, unknown>) : null;
    await writeAuditLog({
      entityType: "contact",
      entityId: contact.id,
      action: "updated",
      changes,
      userId: session.user.id,
    });
    void inngest.send({ name: "crm/contact.saved", data: { record_id: contact.id } });
    revalidatePath("/[locale]/(routes)/crm/patients", "page");
    return { data: contact };
  } catch (error) {
    console.log("[UPDATE_PATIENT]", error);
    return { error: "Failed to update patient" };
  }
};
