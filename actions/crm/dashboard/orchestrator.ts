import {
  getDoctorDashboardData,
  getReceptionistDashboardData,
  getCounselorDashboardData,
  getAdminDashboardData,
} from "./providers/role-dashboards";
import { getOperationalDashboardData as fetchOperationalDashboardData } from "./providers/operational-dashboard";

/**
 * Dedicated Orchestrator Action for Operational CRM Dashboard (/crm/dashboard)
 * Returns the operational payload directly ({ capabilities, appointments, followups, pipeline, sources, workload, alerts }).
 */
export async function getOperationalDashboardData(userId: string, role: string) {
  return fetchOperationalDashboardData(userId, role);
}

/**
 * Dedicated Orchestrator Action for My Dashboard (/crm/dashboard/user)
 * Returns { role, payload } envelope for personalized view switching.
 */
export async function getDashboardData(userId: string, role: string) {
  const normalizedRole = (role || "user").toLowerCase();

  let roleData: any = {};

  if (normalizedRole === "doctor") {
    roleData = await getDoctorDashboardData(userId);
  } else if (normalizedRole === "receptionist") {
    roleData = await getReceptionistDashboardData();
  } else if (normalizedRole === "counsellor" || normalizedRole === "counselor") {
    roleData = await getCounselorDashboardData(userId);
  } else if (normalizedRole === "admin" || normalizedRole === "manager" || normalizedRole === "root") {
    roleData = await getAdminDashboardData();
  } else {
    roleData = await getCounselorDashboardData(userId);
  }

  return {
    role: normalizedRole,
    payload: roleData,
  };
}
