export const dynamic = "force-dynamic";
export const revalidate = 0;

import React from "react";
import Container from "../../components/ui/Container";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/actions/crm/dashboard/orchestrator";
import { CrmDashboardClient } from "./_components/CrmDashboardClient";
import { prismadb } from "@/lib/prisma";

const CrmDashboardPage = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const [dashboardData, staffList, doctorList] = await Promise.all([
    getDashboardData(session.user.id, session.user.role),
    prismadb.users.findMany({
      where: {
        role: { in: ["admin", "manager", "counsellor", "receptionist"] },
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true, role: true },
    }),
    prismadb.users.findMany({
      where: {
        role: "doctor",
        userStatus: "ACTIVE",
      },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <Container
      title="Hospital CRM Dashboard"
      description="Patient overview, followups status, and clinical pipeline analytics"
    >
      <div className="p-6">
        <CrmDashboardClient 
          data={dashboardData} 
          staffList={staffList} 
          doctorList={doctorList} 
          currentUserId={session.user.id}
        />
      </div>
    </Container>
  );
};

export default CrmDashboardPage;