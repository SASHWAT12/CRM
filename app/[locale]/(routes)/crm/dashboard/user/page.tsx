export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Container from "../../../components/ui/Container";
import { getDashboardData } from "@/actions/crm/dashboard/orchestrator";
import { UserDashboardClient } from "../_components/UserDashboardClient";

const UserDashboardPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const dashboardData = await getDashboardData(session.user.id, session.user.role);

  return (
    <Container
      title={`${session.user.name} — My Dashboard`}
      description="Your personal CRM overview"
    >
      <div className="p-6">
        <UserDashboardClient data={dashboardData} />
      </div>
    </Container>
  );
};

export default UserDashboardPage;
