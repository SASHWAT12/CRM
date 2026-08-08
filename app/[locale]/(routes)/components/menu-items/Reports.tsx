import { FileBarChart } from "lucide-react";
import { NavItem } from "../nav-main";

interface GetReportsMenuItemProps {
  title: string;
}

export default function getReportsMenuItem({
  title,
}: GetReportsMenuItemProps): NavItem {
  return {
    title,
    icon: FileBarChart,
    items: [
      { title: "Executive Dashboard", url: "/reports", exact: true },
      { title: "Lead Analytics", url: "/reports/leads" },
      { title: "Patient Pipeline", url: "/reports/pipeline" },
      { title: "Appointment Analytics", url: "/reports/appointments" },
      { title: "Followup Analytics", url: "/reports/followups" },
    ],
  };
}
