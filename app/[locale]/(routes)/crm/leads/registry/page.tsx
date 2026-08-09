import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../../components/ui/Container";
import LeadsView from "../../components/LeadsView";
import { getLeads } from "@/actions/crm/get-leads";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const LeadsRegistryPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const search = searchParams.search || undefined;
  const t = await getTranslations("CrmPage");
  const crmData = await getAllCrmData();
  // Fetch leads records for full historical search
  const leads = await getLeads({ queue: "ALL", search });

  return (
    <Container
      title={`${t("leads.pageTitle")} Registry`}
      description="Full historical leads list with filtering, searching, and source options"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView crmData={crmData} data={leads} />
      </Suspense>
    </Container>
  );
};

export default LeadsRegistryPage;
