import React from "react";
import Container from "../../components/ui/Container";
import { getFollowups } from "@/actions/crm/followups/get-followups";
import FollowupsDashboardCard from "./_components/FollowupsDashboardCard";

const CrmDashboardPage = async () => {
  const { tasks } = await getFollowups({ status: "ALL", take: 1000 });

  return (
    <Container
      title="Hospital CRM Dashboard"
      description="Patient overview, followups status, and clinical pipeline analytics"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <FollowupsDashboardCard tasks={tasks} />
      </div>
    </Container>
  );
};

export default CrmDashboardPage;