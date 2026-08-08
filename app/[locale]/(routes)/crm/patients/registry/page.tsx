import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../../components/ui/Container";
import PatientsView from "../../components/PatientsView";
import { getPatients } from "@/actions/crm/get-patients";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PatientsRegistryPage = async () => {
  const t = await getTranslations("CrmPage");
  const crmData = await getAllCrmData();
  // Fetch all patient records for full historical search
  const contacts = await getPatients({ queue: "ALL" });

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
