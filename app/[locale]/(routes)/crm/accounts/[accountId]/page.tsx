import Container from "@/app/[locale]/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import { getAccount } from "@/actions/crm/get-account";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getPatientsByAccountId } from "@/actions/crm/get-patients-by-accountId";
import { getLeadsByAccountId } from "@/actions/crm/get-leads-by-accountId";
import { getAccountProducts } from "@/actions/crm/account-products/get-account-products";
import { getProductsFull } from "@/actions/crm/products/get-products";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { getAccountsTasks } from "@/actions/crm/account/get-tasks";
import { getTranslations } from "next-intl/server";

import LeadsView from "../../components/LeadsView";
import PatientsView from "../../components/PatientsView";

import {
  crm_Accounts,
  crm_Accounts_Tasks,
  crm_Contacts,
  crm_Leads,
} from "@prisma/client";

import AccountsTasksView from "./components/TasksView";
import AccountProductsView from "./components/AccountProductsView";
import { ActivitiesSection } from "./components/ActivitiesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";

interface AccountDetailPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

const AccountDetailPage = async (props: AccountDetailPageProps) => {
  const params = await props.params;
  const { accountId } = params;
  const account: crm_Accounts | null = await getAccount(accountId);

  const contacts: crm_Contacts[] = await getPatientsByAccountId(accountId);
  const leads: crm_Leads[] = await getLeadsByAccountId(accountId);
  const tasks: crm_Accounts_Tasks[] = await getAccountsTasks(accountId);
  const t = await getTranslations("InvoicesPage");

  const crmData = await getAllCrmData();
  const accountProducts = serializeDecimalsList(
    await getAccountProducts(accountId)
  );
  const allProducts = await getProductsFull();
  const activeProducts = allProducts
    .filter((p) => p.status === "ACTIVE")
    .map((p) => ({ id: p.id, name: p.name }));

  if (!account) return <div>Account not found</div>;

  return (
    <Container
      title={`Account: ${account?.name}`}
      description={"Everything you need to know about sales potential"}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={account} />
            <ActivitiesSection accountId={account.id} />
            <AccountsTasksView data={tasks} account={account} />
            <PatientsView data={contacts} crmData={crmData} accountId={accountId} />
            <LeadsView data={leads} crmData={crmData} />
            <AccountProductsView
              data={accountProducts}
              accountId={accountId}
              crmData={crmData}
              activeProducts={activeProducts}
            />
          </div>
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab accountId={accountId} />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default AccountDetailPage;
