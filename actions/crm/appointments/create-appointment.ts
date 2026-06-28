"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  staffId: z.string().uuid().optional().nullable(),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

export const createAppointment = async (rawData: z.infer<typeof createSchema>) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const validation = createSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: "Invalid appointment data: " + validation.error.message };
  }

  const { patientId, doctorId, staffId, scheduledAt, duration, notes } = validation.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appointment = await (prismadb as any).crm_Appointments.create({
      data: {
        patientId,
        doctorId,
        staffId: staffId || null,
        scheduledAt,
        duration,
        status: "SCHEDULED",
        notes: notes || null,
        createdBy: session.user.id,
        v: 0,
      },
      include: {
        patient: { select: { first_name: true, last_name: true } },
        doctor: { select: { name: true } },
      }
    });

    // Write audit log
    await writeAuditLog({
      entityType: "contact",
      entityId: patientId,
      action: "created",
      changes: [
        { field: "appointment_scheduledAt", old: null, new: scheduledAt.toISOString() },
        { field: "appointment_duration", old: null, new: duration },
        { field: "appointment_status", old: null, new: "SCHEDULED" },
      ],
      userId: session.user.id,
    });

    revalidatePath("/[locale]/(routes)/crm/appointments", "page");
    revalidatePath(`/[locale]/(routes)/crm/patients/${patientId}`, "page");

    return { data: appointment };
  } catch (error) {
    console.error("[CREATE_APPOINTMENT_ERROR]", error);
    return { error: "Failed to create appointment" };
  }
};
