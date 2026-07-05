import * as appointmentsProvider from "./providers/appointments";
import * as followupsProvider from "./providers/followups";
import * as pipelineProvider from "./providers/pipeline";
import * as sourcesProvider from "./providers/sources";
import * as workloadProvider from "./providers/workload";
import * as alertsProvider from "./providers/alerts";
import * as personalProvider from "./providers/personal";

export type UserCapabilities = {
  canViewTeamWorkload: boolean;
  canViewPipelineAnalytics: boolean;
  canViewSourcesPerformance: boolean;
  canViewAlertsAndExceptions: boolean;
  canManageAppointments: boolean;
  canManageFollowups: boolean;
};

export type UserContext = {
  id: string;
  role: string;
  capabilities: UserCapabilities;
};

export function resolveCapabilities(role: string): UserCapabilities {
  const isManager = ["root", "admin", "manager"].includes(role);
  const isCounsellor = role === "counsellor";
  const isReceptionist = role === "receptionist";
  const isDoctor = role === "doctor";

  return {
    canViewTeamWorkload: isManager,
    canViewPipelineAnalytics: isManager || isCounsellor || isReceptionist,
    canViewSourcesPerformance: isManager,
    canViewAlertsAndExceptions: isManager || isCounsellor || isReceptionist,
    canManageAppointments: isManager || isCounsellor || isReceptionist || isDoctor,
    canManageFollowups: isManager || isCounsellor || isReceptionist || isDoctor,
  };
}

export async function getDashboardData(userId: string, role: string) {
  const capabilities = resolveCapabilities(role);
  const data: Record<string, any> = {
    capabilities,
  };

  // 1. Surfaced personal actionable context
  data.personal = await personalProvider.getPersonalWork(userId);

  // 2. Fetch domain data based on permissions/capabilities
  const queries: Promise<any>[] = [];
  const keys: string[] = [];

  if (capabilities.canManageAppointments) {
    queries.push(appointmentsProvider.getAppointmentsData());
    keys.push("appointments");
  }
  if (capabilities.canManageFollowups) {
    queries.push(followupsProvider.getFollowupsData());
    keys.push("followups");
  }
  if (capabilities.canViewPipelineAnalytics) {
    queries.push(pipelineProvider.getPipelineData());
    keys.push("pipeline");
  }
  if (capabilities.canViewSourcesPerformance) {
    queries.push(sourcesProvider.getSourcesData());
    keys.push("sources");
  }
  if (capabilities.canViewTeamWorkload) {
    queries.push(workloadProvider.getWorkloadData());
    keys.push("workload");
  }
  if (capabilities.canViewAlertsAndExceptions) {
    queries.push(alertsProvider.getAlertsData());
    keys.push("alerts");
  }

  const results = await Promise.all(queries);
  results.forEach((res, i) => {
    data[keys[i]] = res;
  });

  return data;
}
