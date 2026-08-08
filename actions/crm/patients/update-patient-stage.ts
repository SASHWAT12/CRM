"use server";

import { getSession } from "@/lib/auth-server";
import { transitionPatientStage } from "@/lib/crm/pipeline-service";

export async function updatePatientStage(data: {
  patientId: string;
  expectedCurrentStage: string;
  nextStage: string;
  lossReason?: string;
}) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await transitionPatientStage({
      patientId: data.patientId,
      expectedCurrentStage: data.expectedCurrentStage,
      nextStage: data.nextStage,
      userId: session.user.id,
      lossReason: data.lossReason,
    });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to update stage" };
  }
}
