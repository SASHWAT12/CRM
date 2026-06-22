import React from "react";

import { getAccounts } from "@/actions/crm/get-accounts";
import { getContacts } from "@/actions/crm/get-contacts";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";

import AccountsView from "./AccountsView";
import ContactsView from "./ContactsView";
import LeadsView from "./LeadsView";

const MainPageView = async () => {
  const [crmData, accounts, contacts, leads] =
    await Promise.all([
      getAllCrmData(),
      getAccounts(),
      getContacts(),
      getLeads(),
    ]);

  return (
    <>
      <AccountsView crmData={crmData} data={accounts} />
      <ContactsView crmData={crmData} data={contacts} />
      <LeadsView crmData={crmData} data={leads} />
    </>
  );
};

export default MainPageView;