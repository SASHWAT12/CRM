import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../components/ui/Container";
import { getLeads } from "@/actions/crm/get-leads";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { LeadsWorkbenchClient } from "./components/LeadsWorkbenchClient";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { requireAuthenticated, leadReadScopeWhere } from "@/lib/authz";
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

const LeadsPage = async (props: PageProps) => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || "HOT";
  const search = searchParams.search || undefined;
  const assignedTo = searchParams.assignedTo || undefined;

  const userAuthz = await requireAuthenticated();
  const readScope = leadReadScopeWhere(userAuthz);

  // Fetch counts, staff users, crm metadata, and leads in parallel
  const [
    leads,
    crmData,
    staffList,
    hotCount,
    newTodayCount,
    needsFollowupCount,
    atRiskCount,
    recentAssigned,
    recentContacted,
    recentConverted
  ] = await Promise.all([
    getLeads({ queue, search, assignedTo }),
    getAllCrmData(),
    prismadb.users.findMany({
      where: {
        role: { in: ["admin", "manager", "counsellor", "receptionist"] },
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
    // Count hot leads
    prismadb.crm_Leads.count({
      where: {
        ...readScope,
        deletedAt: null,
        lead_status: {
          name: { in: CRM_POLICY.STAGES.HOT_LEAD_STATUSES },
        },
      },
    }),
    // Count new inquiries (24 hours)
    prismadb.crm_Leads.count({
      where: {
        ...readScope,
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - CRM_POLICY.THRESHOLDS.NEW_LEAD_MS),
        },
      },
    }),
    // Count needing attention (overdue tasks or no tasks)
    prismadb.crm_Leads.count({
      where: {
        ...readScope,
        deletedAt: null,
        lead_status: {
          name: { notIn: ["Converted", "Lost"] },
        },
        OR: [
          {
            documents: {
              none: {},
            },
          },
          {
            updatedAt: {
              lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.UNTOUCHED_LEAD_MS),
            },
          },
        ],
      },
    }),
    // Count stagnant leads (At Risk)
    prismadb.crm_Leads.count({
      where: {
        ...readScope,
        deletedAt: null,
        lead_status: {
          name: { notIn: ["Converted", "Lost"] },
        },
        createdAt: {
          lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.AT_RISK_LEAD_MS),
        },
      },
    }),
    // Recent assigned leads for activity panel
    prismadb.crm_Leads.findMany({
      where: {
        ...readScope,
        deletedAt: null,
      },
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    // Recent contacted leads for activity panel
    prismadb.crm_Leads.findMany({
      where: {
        ...readScope,
        deletedAt: null,
        lead_status: {
          name: "Contacted",
        },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    // Recent converted leads for activity panel
    prismadb.crm_Leads.findMany({
      where: {
        ...readScope,
        deletedAt: null,
        lead_status: {
          name: "Converted",
        },
      },
      take: 3,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  const counts = {
    hot: hotCount,
    newToday: newTodayCount,
    untouched: needsFollowupCount,
    needsFollowup: needsFollowupCount,
    atRisk: atRiskCount,
  };

  return (
    <Container
      title="Leads Workspace"
      description="Track prospective inquiry channels, response latencies, and conversion funnels"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsWorkbenchClient
          data={leads}
          crmData={crmData}
          users={staffList}
          counts={counts}
          recentAssigned={recentAssigned}
          recentContacted={recentContacted}
          recentConverted={recentConverted}
        />
      </Suspense>
    </Container>
  );
};

export default LeadsPage;
