"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

export const createPatient = async (data: {
  assigned_to?: string;
  assigned_account?: string;
  birthday_day?: string;
  birthday_month?: string;
  birthday_year?: string;
  age?: number | null;
  description?: string;
  email?: string;
  personal_email?: string;
  first_name?: string;
  last_name: string;
  office_phone?: string;
  mobile_phone?: string;
  website?: string;
  position?: string;
  status?: boolean;
  type?: string;
  social_twitter?: string;
  social_facebook?: string;
  social_linkedin?: string;
  social_skype?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_tiktok?: string;
  contact_type_id?: string;
  lead_source_id?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;
  const {
    assigned_to,
    assigned_account,
    birthday_day,
    birthday_month,
    birthday_year,
    age,
    contact_type_id,
    type,
    lead_source_id,
    first_name,
    last_name,
    description,
    email,
    personal_email,
    office_phone,
    mobile_phone,
    website,
    position,
    status,
    social_twitter,
    social_facebook,
    social_linkedin,
    social_skype,
    social_instagram,
    social_youtube,
    social_tiktok,
  } = data;

  const sanitizeUuid = (val: string | null | undefined): string | null => {
    if (!val || val.trim() === "" || val === "undefined" || val === "null") return null;
    return val;
  };

  const effectiveContactTypeId = contact_type_id || type;
  const cleanAssignedTo = sanitizeUuid(assigned_to);
  const cleanAssignedAccount = sanitizeUuid(assigned_account);
  const cleanContactTypeId = sanitizeUuid(effectiveContactTypeId);
  const cleanLeadSourceId = sanitizeUuid(lead_source_id);

  try {
    const contact = await prismadb.crm_Contacts.create({
      data: {
        v: 0,
        createdBy: userId,
        updatedBy: userId,
        first_name: first_name || null,
        last_name,
        age: age !== undefined ? age : null,
        description: description || null,
        email: email || null,
        personal_email: personal_email || null,
        office_phone: office_phone || null,
        mobile_phone: mobile_phone || null,
        website: website || null,
        position: position || null,
        status: status !== undefined ? status : true,
        social_twitter: social_twitter || null,
        social_facebook: social_facebook || null,
        social_linkedin: social_linkedin || null,
        social_skype: social_skype || null,
        social_instagram: social_instagram || null,
        social_youtube: social_youtube || null,
        social_tiktok: social_tiktok || null,
        account: cleanAssignedAccount,
        assigned_to: cleanAssignedTo,
        contact_type_id: cleanContactTypeId,
        lead_source_id: cleanLeadSourceId,
        birthday:
          birthday_day && birthday_month && birthday_year
            ? birthday_day + "/" + birthday_month + "/" + birthday_year
            : null,
      },
    });

    await writeAuditLog({
      entityType: "contact",
      entityId: contact.id,
      action: "created",
      changes: null,
      userId: session.user.id,
    });
    revalidatePath("/[locale]/crm/patients", "page");
    return { data: contact };
  } catch (error) {
    console.log("[CREATE_PATIENT]", error);
    return { error: "Failed to create patient" };
  }
};
