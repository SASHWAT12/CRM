"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";

export const updatePatient = async (data: {
  id: string;
  assigned_to?: string;
  assigned_account?: string | null;
  birthday_day?: string | null;
  birthday_month?: string | null;
  birthday_year?: string | null;
  age?: number | null;
  description?: string | null;
  email?: string;
  personal_email?: string | null;
  first_name?: string | null;
  last_name?: string;
  office_phone?: string | null;
  mobile_phone?: string | null;
  website?: string | null;
  position?: string | null;
  status?: boolean;
  type?: string;
  social_twitter?: string | null;
  social_facebook?: string | null;
  social_linkedin?: string | null;
  social_skype?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_tiktok?: string | null;
  contact_type_id?: string;
  lead_source_id?: string | null;
  lossReason?: string | null;
  pipelineStage?: string | null;
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
    age,
    contact_type_id,
    type,
    lead_source_id,
    lossReason,
    pipelineStage,
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

  if (!id) return { error: "id is required" };

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
    const before = await prismadb.crm_Contacts.findFirst({ where: { id, deletedAt: null } });

    const updatePayload: Record<string, any> = {
      v: 0,
      updatedBy: userId,
    };

    if (assigned_to !== undefined) updatePayload.assigned_to = cleanAssignedTo;
    if (assigned_account !== undefined) updatePayload.account = cleanAssignedAccount;
    if (contact_type_id !== undefined || type !== undefined) updatePayload.contact_type_id = cleanContactTypeId;
    if (lead_source_id !== undefined) updatePayload.lead_source_id = cleanLeadSourceId;
    if (age !== undefined) updatePayload.age = age;
    if (first_name !== undefined) updatePayload.first_name = first_name;
    if (last_name !== undefined) updatePayload.last_name = last_name;
    if (description !== undefined) updatePayload.description = description;
    if (email !== undefined) updatePayload.email = email;
    if (personal_email !== undefined) updatePayload.personal_email = personal_email;
    if (office_phone !== undefined) updatePayload.office_phone = office_phone;
    if (mobile_phone !== undefined) updatePayload.mobile_phone = mobile_phone;
    if (website !== undefined) updatePayload.website = website;
    if (position !== undefined) updatePayload.position = position;
    if (status !== undefined) updatePayload.status = status;
    if (social_twitter !== undefined) updatePayload.social_twitter = social_twitter;
    if (social_facebook !== undefined) updatePayload.social_facebook = social_facebook;
    if (social_linkedin !== undefined) updatePayload.social_linkedin = social_linkedin;
    if (social_skype !== undefined) updatePayload.social_skype = social_skype;
    if (social_instagram !== undefined) updatePayload.social_instagram = social_instagram;
    if (social_youtube !== undefined) updatePayload.social_youtube = social_youtube;
    if (social_tiktok !== undefined) updatePayload.social_tiktok = social_tiktok;
    if (lossReason !== undefined) updatePayload.lossReason = lossReason;
    if (pipelineStage !== undefined) updatePayload.pipelineStage = pipelineStage;
    if (birthday_day && birthday_month && birthday_year) {
      updatePayload.birthday = birthday_day + "/" + birthday_month + "/" + birthday_year;
    }

    const contact = await prismadb.crm_Contacts.update({
      where: { id },
      data: updatePayload,
    });
    const changes = before ? diffObjects(before as Record<string, unknown>, contact as Record<string, unknown>) : null;
    await writeAuditLog({
      entityType: "contact",
      entityId: contact.id,
      action: "updated",
      changes,
      userId: session.user.id,
    });
    revalidatePath("/[locale]/(routes)/crm/patients", "page");
    return { data: contact };
  } catch (error) {
    console.log("[UPDATE_PATIENT]", error);
    return { error: "Failed to update patient" };
  }
};
