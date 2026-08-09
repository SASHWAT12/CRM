import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../../components/ui/Container";
import PatientsView from "../../components/PatientsView";
import { getPatients } from "@/actions/crm/get-patients";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const PatientsRegistryPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const search = searchParams.search || undefined;
  const t = await getTranslations("CrmPage");
  const crmData = await getAllCrmData();
  // Fetch patient records for full historical search
  const contacts = await getPatients({ queue: "ALL", search });

  return (
    <Container
      title={`${t("patients.pageTitle")} Registry`}
      description="Full historical registry list with sorting, searching, and bulk options"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <PatientsView crmData={crmData} data={contacts} />
      </Suspense>
    </Container>
  );
};

export default PatientsRegistryPage;
