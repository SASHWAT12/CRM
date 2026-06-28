import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../components/ui/Container";
import PatientsView from "../components/PatientsView";
import { getPatients } from "@/actions/crm/get-patients";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getTranslations } from "next-intl/server";

const PatientsPage = async () => {
  const t = await getTranslations("CrmPage");
  const crmData = await getAllCrmData();
  const contacts = await getPatients();
  return (
    <Container
      title={t("patients.pageTitle")}
      description={t("patients.pageDescription")}
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <PatientsView crmData={crmData} data={contacts} />
      </Suspense>
    </Container>
  );
};

export default PatientsPage;
