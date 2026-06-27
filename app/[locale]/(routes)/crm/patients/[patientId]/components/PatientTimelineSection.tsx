import { getActivitiesByEntity } from "@/actions/crm/activities/get-activities-by-entity";
import { getAppointments } from "@/actions/crm/appointments/get-appointments";
import { ActivitiesView } from "@/components/crm/activities/ActivitiesView";

interface Props {
  contactId: string;
}

export async function PatientTimelineSection({ contactId }: Props) {
  const [activitiesResult, appointments] = await Promise.all([
    getActivitiesByEntity("contact", contactId),
    getAppointments({ patientId: contactId }),
  ]);

  // Transform appointments to match ActivityWithLinks structure
  const mappedAppointments = appointments.map((appt: any) => {
    // Map status safely to match ActivitiesView expectations
    let activityStatus: "scheduled" | "completed" | "cancelled" = "scheduled";
    if (appt.status === "COMPLETED") {
      activityStatus = "completed";
    } else if (appt.status === "CANCELLED" || appt.status === "NO_SHOW") {
      activityStatus = "cancelled";
    }

    const doctorName = appt.doctor?.name ?? "Doctor";
    const statusLabel = appt.status.charAt(0) + appt.status.slice(1).toLowerCase().replace("_", " ");
    
    return {
      id: appt.id,
      type: "meeting" as const,
      title: `Appointment ${statusLabel} with ${doctorName}`,
      description: appt.notes ?? null,
      date: new Date(appt.scheduledAt),
      duration: appt.duration,
      outcome: appt.status === "COMPLETED" ? "Consultation completed" : null,
      status: activityStatus,
      metadata: {
        appointmentId: appt.id,
        status: appt.status,
      },
      createdAt: new Date(appt.createdAt),
      createdBy: appt.createdBy,
      created_by_user: appt.doctor ? { id: appt.doctor.id, name: appt.doctor.name, avatar: appt.doctor.avatar } : null,
      links: [{ id: appt.id, entityType: "appointment", entityId: appt.id }],
    };
  });

  // Combine and sort by date descending
  const combinedData = [...activitiesResult.data, ...mappedAppointments];
  combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const initialData = {
    data: combinedData,
    nextCursor: activitiesResult.nextCursor,
  };

  return (
    <ActivitiesView entityType="contact" entityId={contactId} initialData={initialData} />
  );
}
