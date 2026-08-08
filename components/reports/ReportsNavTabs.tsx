"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, GitMerge, CalendarDays, ClipboardList } from "lucide-react";

export function ReportsNavTabs() {
  const pathname = usePathname();

  const navItems = [
    { href: "/reports", label: "Executive Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/reports/leads", label: "Lead Analytics", icon: TrendingUp },
    { href: "/reports/pipeline", label: "Patient Pipeline", icon: GitMerge },
    { href: "/reports/appointments", label: "Appointment Analytics", icon: CalendarDays },
    { href: "/reports/followups", label: "Followup Analytics", icon: ClipboardList },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3 mb-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href || pathname === `${item.href}/`
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
