"use client";

import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartDataPoint } from "@/actions/reports/types";
import { useTranslations } from "next-intl";

type ReportChartProps = {
  data: ChartDataPoint[];
  titleKey: string;
  type?: "bar" | "area" | "pie";
  categories?: string[];
  layout?: "vertical" | "horizontal";
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function buildChartConfig(categories: string[]): ChartConfig {
  const config: ChartConfig = {};
  categories.forEach((cat, i) => {
    config[cat] = {
      label: cat,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
  return config;
}

export function ReportChart({
  data,
  titleKey,
  type = "bar",
  categories = ["Number"],
  layout = "vertical",
}: ReportChartProps) {
  const t = useTranslations("ReportsPage.charts");
  const chartConfig = buildChartConfig(categories);

  const title = t.has(titleKey as any) ? t(titleKey as any) : titleKey;

  if (!data || data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
            {t("noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          {type === "bar" ? (
            <BarChart
              data={data}
              layout={layout === "horizontal" ? "vertical" : "horizontal"}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              {categories.map((cat, i) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={4}
                />
              ))}
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              {categories.map((cat, i) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey="Number"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
                <LabelList dataKey="name" position="outside" offset={15} />
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
