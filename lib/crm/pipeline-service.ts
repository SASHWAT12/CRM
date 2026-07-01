import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

// Transition matrix definition mapping allowed source states
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "CONSULTATION_BOOKED", "CLOSED_LOST"],
  CONTACTED: ["INTERESTED", "CONSULTATION_BOOKED", "CLOSED_LOST"],
  INTERESTED: ["CONSULTATION_BOOKED", "CLOSED_LOST"],
  CONSULTATION_BOOKED: ["VISITED", "CLOSED_LOST"],
  VISITED: ["TREATMENT_STARTED", "CLOSED_LOST"],
  TREATMENT_STARTED: ["CONVERTED", "CLOSED_LOST"],
  CONVERTED: [], // Terminal success
  CLOSED_LOST: ["NEW"], // Recovery scenario
};

export async function transitionPatientStage(params: {
  patientId: string;
  expectedCurrentStage?: string;
  nextStage: string;
  userId: string;
  lossReason?: string;
}) {
  return await prismadb.$transaction(async (tx) => {
    // 1. Fetch current patient state
    const patient = await tx.crm_Contacts.findUnique({
      where: { id: params.patientId },
      select: { id: true, pipelineStage: true },
    });

    if (!patient) throw new Error("Patient not found");

    const currentStage = patient.pipelineStage || "NEW";

    // 2. Validate current stage matches client expectations (optimistic check)
    if (params.expectedCurrentStage !== undefined && currentStage !== params.expectedCurrentStage) {
      throw new Error("Patient stage has been modified by another coordinator. Please reload.");
    }

    // 3. Validate transition rules
    const allowed = ALLOWED_TRANSITIONS[currentStage] || [];
    if (!allowed.includes(params.nextStage) && currentStage !== params.nextStage) {
      throw new Error(`Invalid stage transition from ${currentStage} to ${params.nextStage}`);
    }

    // 4. Validate loss reason if moving to CLOSED_LOST
    if (params.nextStage === "CLOSED_LOST" && (!params.lossReason || params.lossReason.trim() === "")) {
      throw new Error("A loss reason is required when closing an inquiry.");
    }

    // 5. Update patient stage details
    const updated = await tx.crm_Contacts.update({
      where: { id: params.patientId },
      data: {
        pipelineStage: params.nextStage,
        lossReason: params.nextStage === "CLOSED_LOST" ? params.lossReason : null,
        updatedBy: params.userId,
      },
    });

    // 6. Log change to audit history
    await writeAuditLog({
      entityType: "contact",
      entityId: params.patientId,
      action: "updated",
      changes: [
        { field: "pipelineStage", old: currentStage, new: params.nextStage },
        ...(params.nextStage === "CLOSED_LOST" ? [{ field: "lossReason", old: null, new: params.lossReason }] : []),
      ],
      userId: params.userId,
    });

    revalidatePath("/[locale]/(routes)/crm/patients", "page");
    revalidatePath(`/[locale]/(routes)/crm/patients/${params.patientId}`, "page");

    return updated;
  });
}
