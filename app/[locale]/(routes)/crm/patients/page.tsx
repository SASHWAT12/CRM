import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../components/ui/Container";
import { getPatients } from "@/actions/crm/get-patients";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { PatientsWorkbenchClient } from "./components/PatientsWorkbenchClient";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { requireAuthenticated, contactReadScopeWhere } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { CRM_POLICY } from "@/lib/policies/crm-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    queue?: string;
    search?: string;
    assignedTo?: string;
  }>;
}

const PatientsPage = async (props: PageProps) => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || "ATTENTION";
  const search = searchParams.search || undefined;
  const assignedTo = searchParams.assignedTo || undefined;

  const userAuthz = await requireAuthenticated();
  const readScope = contactReadScopeWhere(userAuthz);

  const activeStages = CRM_POLICY.STAGES.ACTIVE_PATIENT_PIPELINE;

  // Fetch counts, staff users, crm metadata, and patients in parallel
  const [
    contacts,
    crmData,
    staffList,
    activeCount,
    needsFollowupCount,
    waitingResponseCount,
    missedConsultCount,
    recentConversions,
    recentFollowups,
    recentAppointments
  ] = await Promise.all([
    getPatients({ queue, search, assignedTo }),
    getAllCrmData(),
    prismadb.users.findMany({
      where: {
        role: { in: ["admin", "manager", "counsellor", "receptionist"] },
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
    // Count recently converted patients
    prismadb.crm_Contacts.count({
      where: {
        ...readScope,
        deletedAt: null,
        pipelineStage: CRM_POLICY.STAGES.CONVERTED_STAGE,
        updatedAt: {
          gte: new Date(Date.now() - CRM_POLICY.THRESHOLDS.RECENT_CONVERSION_MS),
        },
      },
    }),
    // Count needing attention (overdue followup or no active followup)
    prismadb.crm_Contacts.count({
      where: {
        ...readScope,
        deletedAt: null,
        pipelineStage: { in: activeStages },
        OR: [
          {
            tasks: {
              some: {
                taskStatus: "ACTIVE",
                dueDateAt: { lt: new Date() },
              },
            },
          },
          {
            tasks: {
              none: {
                taskStatus: "ACTIVE",
              },
            },
          },
        ],
      },
    }),
    // Count waiting response (no active task and updated longer than policy threshold)
    prismadb.crm_Contacts.count({
      where: {
        ...readScope,
        deletedAt: null,
        pipelineStage: { in: activeStages },
        tasks: {
          none: {
            taskStatus: "ACTIVE",
          },
        },
        updatedAt: {
          lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.STALE_PATIENT_MS),
        },
      },
    }),
    // Count missed consultations (active pipeline with no-show/cancelled appointments)
    prismadb.crm_Contacts.count({
      where: {
        ...readScope,
        deletedAt: null,
        pipelineStage: { in: activeStages },
        appointments: {
          some: {
            status: { in: ["NO_SHOW", "CANCELLED"] },
          },
        },
      },
    }),
    // Recent conversions for activity panel
    prismadb.crm_Contacts.findMany({
      where: {
        ...readScope,
        deletedAt: null,
        pipelineStage: CRM_POLICY.STAGES.CONVERTED_STAGE,
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        updatedAt: true,
      },
    }),
    // Recent followups logged for activity panel
    prismadb.crm_Accounts_Tasks.findMany({
      where: {
        crm_contact: {
          ...readScope,
          deletedAt: null,
        },
        taskStatus: "COMPLETE",
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        crm_contact: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
    // Recent appointments for activity panel
    prismadb.crm_Appointments.findMany({
      where: {
        patient: {
          ...readScope,
          deletedAt: null,
        },
      },
      take: 3,
      orderBy: {
        scheduledAt: "desc",
      },
      select: {
        id: true,
        scheduledAt: true,
        patient: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
  ]);

  const counts = {
    recentlyConverted: activeCount,
    needsFollowup: needsFollowupCount,
    waitingResponse: waitingResponseCount,
    missedConsult: missedConsultCount,
  };

  return (
    <Container
      title="Patient Operations"
      description="Track active inquiries, clinical stage transitions, and treatment conversions"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <PatientsWorkbenchClient
          data={contacts}
          crmData={crmData}
          users={staffList}
          counts={counts}
          recentConversions={recentConversions}
          recentFollowups={recentFollowups}
          recentAppointments={recentAppointments}
        />
      </Suspense>
    </Container>
  );
};

export default PatientsPage;
