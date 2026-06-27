"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().uuid(),
  v: z.number().int().nonnegative(),
  doctorId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional().nullable(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().positive().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"]).optional(),
  notes: z.string().optional().nullable(),
});

export const updateAppointment = async (rawData: z.infer<typeof updateSchema>) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const validation = updateSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: "Invalid update data: " + validation.error.message };
  }

  const { id, v, doctorId, staffId, scheduledAt, duration, status, notes } = validation.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prismadb as any).crm_Appointments.findUnique({
      where: { id },
    });

    if (!existing) {
      return { error: "Appointment not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prismadb as any).crm_Appointments.update({
      where: {
        id,
        v, // validate current version
      },
      data: {
        ...(doctorId !== undefined && { doctorId }),
        ...(staffId !== undefined && { staffId }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        updatedBy: session.user.id,
        v: { increment: 1 },
      },
    });

    // Write audit log
    const changes = [];
    if (doctorId !== undefined && doctorId !== existing.doctorId) {
      changes.push({ field: "appointment_doctorId", old: existing.doctorId, new: doctorId });
    }
    if (staffId !== undefined && staffId !== existing.staffId) {
      changes.push({ field: "appointment_staffId", old: existing.staffId, new: staffId });
    }
    if (scheduledAt !== undefined && new Date(scheduledAt).getTime() !== new Date(existing.scheduledAt).getTime()) {
      changes.push({ field: "appointment_scheduledAt", old: existing.scheduledAt, new: scheduledAt.toISOString() });
    }
    if (duration !== undefined && duration !== existing.duration) {
      changes.push({ field: "appointment_duration", old: existing.duration, new: duration });
    }
    if (status !== undefined && status !== existing.status) {
      changes.push({ field: "appointment_status", old: existing.status, new: status });
    }
    if (notes !== undefined && notes !== existing.notes) {
      changes.push({ field: "appointment_notes", old: existing.notes, new: notes });
    }

    if (changes.length > 0) {
      await writeAuditLog({
        entityType: "contact",
        entityId: existing.patientId,
        action: "updated",
        changes,
        userId: session.user.id,
      });
    }

    revalidatePath("/[locale]/(routes)/crm/appointments", "page");
    revalidatePath(`/[locale]/(routes)/crm/contacts/${existing.patientId}`, "page");

    return { data: updated };
  } catch (error: any) {
    if (error.code === "P2025") {
      return {
        error: "The appointment was modified by another user. Please reload and try again.",
      };
    }
    console.error("[UPDATE_APPOINTMENT_ERROR]", error);
    return { error: "Failed to update appointment" };
  }
};
