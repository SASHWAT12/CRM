"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { createActivity } from "@/actions/crm/activities/create-activity";
import { createTask } from "@/actions/crm/accounts/create-task";
import { transitionPatientStage } from "@/lib/crm/pipeline-service";

export const logCall = async (data: {
  patientId: string;
  notes: string;
  outcome: string;
  callbackScheduled: boolean;
  callbackDate?: Date;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;

  try {
    // 1. Create manual call activity
    const activityResult = await createActivity({
      type: "call",
      title: `Call logged: ${data.outcome}`,
      description: data.notes,
      date: new Date(),
      outcome: data.outcome,
      status: "completed",
      links: [{ entityType: "contact", entityId: data.patientId }],
    });

    if (activityResult.error) {
      return { error: activityResult.error };
    }

    // 2. Schedule callback followup task if checked
    if (data.callbackScheduled && data.callbackDate) {
      const taskResult = await createTask({
        title: `Callback: ${data.outcome}`,
        content: `Scheduled callback followup regarding: ${data.notes}`,
        dueDateAt: data.callbackDate,
        priority: "medium",
        user: userId,
        contact: data.patientId,
      });
      if (taskResult.error) {
        console.error("Failed to automatically schedule callback task:", taskResult.error);
      }
    }

    // 3. Auto-advance stage from NEW to CONTACTED
    const patient = await prismadb.crm_Contacts.findUnique({
      where: { id: data.patientId },
      select: { pipelineStage: true },
    });

    const currentStage = patient?.pipelineStage || "NEW";
    if (currentStage === "NEW") {
      await transitionPatientStage({
        patientId: data.patientId,
        nextStage: "CONTACTED",
        userId,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[LOG_CALL_ERROR]", error);
    return { error: error?.message || "Failed to log call" };
  }
};
