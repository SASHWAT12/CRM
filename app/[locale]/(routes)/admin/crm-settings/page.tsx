import { getConfigValues } from "./_actions/crm-settings";
import { HospitalSettingsClient } from "./_components/HospitalSettingsClient";

export default async function CrmSettingsPage() {
  const [
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
  ] = await Promise.all([
    getConfigValues("contactType"),
    getConfigValues("leadSource"),
    getConfigValues("leadStatus"),
    getConfigValues("leadType"),
  ]);

  const tabs = [
    { key: "contactType" as const, label: "Contact Types", values: contactTypes },
    { key: "leadSource" as const, label: "Lead Sources", values: leadSources },
    { key: "leadStatus" as const, label: "Lead Statuses", values: leadStatuses },
    { key: "leadType" as const, label: "Lead Types", values: leadTypes },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hospital Administration Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage hospital identity, operational defaults, and field lookup options.
        </p>
      </div>
      <HospitalSettingsClient tabs={tabs} />
    </div>
  );
}
