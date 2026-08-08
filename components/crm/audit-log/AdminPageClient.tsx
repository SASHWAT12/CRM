"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { AuditAdminTable } from "./AdminTable";
import { restorePatient } from "@/actions/crm/patients/restore-patient";
import { restoreLead } from "@/actions/crm/leads/restore-lead";
// Opportunities and Contracts are no longer supported

// Pass the same props as AuditAdminTable (minus onRestore which we provide internally)
type Props = Omit<React.ComponentProps<typeof AuditAdminTable>, "onRestore">;

export function AdminAuditLogClient(props: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleRestore = (entityType: string, entityId: string) => {
    startTransition(async () => {
      let result: { error?: string; success?: boolean };
      switch (entityType) {
        case "contact":
          result = await restorePatient(entityId);
          break;
        case "lead":
          result = await restoreLead(entityId);
          break;
        case "opportunity":
        case "contract":
          result = { error: "Entity type is no longer supported" };
          break;
        default:
          result = { error: "Unknown entity type" };
      }
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Record restored successfully");
        router.refresh();
      }
    });
  };

  return <AuditAdminTable {...props} onRestore={handleRestore} />;
}
