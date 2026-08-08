import { redirect } from "next/navigation";

export default function LegacyActivityReportPage() {
  redirect("/reports/followups");
}
