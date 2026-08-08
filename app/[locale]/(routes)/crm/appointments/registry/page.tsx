import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getAppointments } from "@/actions/crm/appointments/get-appointments";
import { AppointmentFilters } from "../components/AppointmentFilters";
import { AppointmentList } from "../components/AppointmentList";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    patientId?: string;
    search?: string;
  }>;
}

const AppointmentsRegistryPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "ALL";
  const patientId = searchParams.patientId || undefined;
  const search = searchParams.search || undefined;

  // Fetch full appointments with filter parameters
  const appointments = await getAppointments({ status, patientId, search });

  return (
    <Container
      title="Appointments Schedule Registry"
      description="Full scheduling archive. Search, filter, and review consultations"
    >
      <div className="space-y-6">
        <Suspense fallback={<div>Loading filters...</div>}>
          <AppointmentFilters />
        </Suspense>
        <Suspense fallback={<CrmTableSkeleton />}>
          <AppointmentList data={appointments as any} />
        </Suspense>
      </div>
    </Container>
  );
};

export default AppointmentsRegistryPage;
