import React from "react";
import Container from "../../components/ui/Container";

const CrmDashboardPage = async () => {
  return (
    <Container
      title="Hospital CRM Dashboard"
      description="Dashboard under migration"
    >
      <div className="p-6">
        Dashboard will be rebuilt for Leads, Follow-ups, Appointments and Conversions.
      </div>
    </Container>
  );
};

export default CrmDashboardPage;