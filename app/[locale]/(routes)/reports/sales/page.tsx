import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { ReportPageLayout } from "@/components/reports/ReportPageLayout";
import { parseSearchParamsToFilters } from "@/actions/reports/types";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SalesReportPage({ searchParams }: Props) {
  const t = await getTranslations("ReportsPage");

  // TODO: Sales report metrics no longer available after removing Opportunities module
  // Hospital CRM should define new sales/pipeline KPIs if needed
  return (
    <ReportPageLayout
      title={t("sales.title")}
      description={t("sales.description")}
      category="sales"
      currentFilters=""
    >
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Sales report metrics are not available in Hospital CRM.</p>
          <p className="text-sm text-muted-foreground mt-2">Please contact your administrator to configure reporting.</p>
        </CardContent>
      </Card>
    </ReportPageLayout>
  );
}
